// Comfy Candles — Stripe checkout function
// Prices are computed HERE (server-side) so cart totals can't be tampered with.

const PRODUCTS = {
  'cereal-milk': 'Cereal Milk',
  'scoop-there-it-is': 'Scoop There It Is',
  'vacation-mode': 'Vacation Mode',
  'straight-out-of-the-oven': 'Straight Out of the Oven',
  'whole-latte-love': 'Whole Latte Love',
  'october-glow': 'October Glow',
};

// All amounts in cents
const SIZES = {
  '5oz':  { label: '5 oz',  ship: 2300, pickup: 1500, b3: 6000,  b6: 11000 },
  '10oz': { label: '10 oz', ship: 4000, pickup: 3200, b3: 10500, b6: 19000 },
};

function priceCart(cart, fulfill) {
  let n = 0;
  const counts = { '5oz': 0, '10oz': 0 };
  for (const [key, qty] of Object.entries(cart)) {
    const [slug, size] = key.split('|');
    if (!PRODUCTS[slug] || !SIZES[size] || !Number.isInteger(qty) || qty < 1 || qty > 50) {
      throw new Error('Invalid cart');
    }
    counts[size] += qty;
    n += qty;
  }
  if (n === 0) throw new Error('Empty cart');

  let total = 0;
  for (const size of Object.keys(SIZES)) {
    const sz = SIZES[size];
    let count = counts[size];
    if (!count) continue;
    if (fulfill === 'pickup') { total += count * sz.pickup; continue; }
    const sixes = Math.floor(count / 6); count -= sixes * 6;
    const threes = Math.floor(count / 3); count -= threes * 3;
    total += sixes * sz.b6 + threes * sz.b3 + count * sz.ship;
  }
  return total;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
  }

  const { cart = {}, fulfill = 'ship' } = body;
  if (!['ship', 'pickup'].includes(fulfill)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad fulfillment option' }) };
  }

  let totalCents;
  try {
    totalCents = priceCart(cart, fulfill);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }

  const summary = Object.entries(cart)
    .map(([key, qty]) => {
      const [slug, size] = key.split('|');
      return qty + 'x ' + PRODUCTS[slug] + ' (' + SIZES[size].label + ')';
    })
    .join(', ');

  const stripe = require('stripe')(stripeKey);
  const origin = event.headers.origin || ('https://' + event.headers.host);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: totalCents,
          product_data: {
            name: fulfill === 'pickup'
              ? 'Comfy Candles order (local pickup — Valparaiso, IN)'
              : 'Comfy Candles order (free U.S. shipping)',
            description: summary,
          },
        },
        quantity: 1,
      }],
      metadata: { cart: JSON.stringify(cart), fulfill },
      payment_intent_data: {
        description: (fulfill === 'pickup' ? 'PICKUP: ' : 'SHIP: ') + summary,
        metadata: { cart: JSON.stringify(cart), fulfill },
      },
      ...(fulfill === 'ship'
        ? { shipping_address_collection: { allowed_countries: ['US'] } }
        : {}),
      success_url: origin + '/?order=success',
      cancel_url: origin + '/?order=cancelled',
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe error' }) };
  }
};

