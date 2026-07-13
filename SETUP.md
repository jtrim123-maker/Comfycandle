# Comfy Candles — Launch Checklist

Your site has a real shopping cart with automatic bundle pricing:

5 oz (approx. 30-hour burn time):
- 1 candle: $23 shipped / $18 local pickup
- Any 3 shipped: $60 · Any 6 shipped: $110 (applied automatically)

10 oz:
- 1 candle: $40 shipped / $32 local pickup
- Any 3 shipped: $105 · Any 6 shipped: $190 (applied automatically)

Bundles apply per size (three 5 oz = $60; three 10 oz = $105).
Local pickup is always per-candle pricing (no bundles needed — it's cheaper).

## 1. Get a Stripe account (free)
1. Sign up at stripe.com and activate your account (business + bank info).
2. In the Stripe Dashboard, go to Developers → API keys.
3. Copy your **Secret key** (starts with `sk_live_...`; use `sk_test_...` first to test).

## 2. Deploy to Netlify (free)
1. Sign up at netlify.com.
2. Easiest path: put this whole folder in a GitHub repo and click
   "Add new site → Import from Git" in Netlify. (Netlify needs to run
   `npm install` for the Stripe function, which the Git method does
   automatically. Plain drag-and-drop will NOT install the function's
   dependency.)
3. Netlify will detect netlify.toml automatically. Deploy.

## 3. Connect Stripe to Netlify
1. In Netlify: Site configuration → Environment variables → Add variable.
2. Name: `STRIPE_SECRET_KEY`  Value: your Stripe secret key.
3. Redeploy the site (Deploys → Trigger deploy).

## 4. Test it
1. With a `sk_test_...` key set, add candles to the cart and hit Checkout.
2. Use Stripe's test card: 4242 4242 4242 4242, any future date, any CVC.
3. Confirm the total matches (e.g., 3 × 5 oz shipped = $60, 3 × 10 oz = $105).
4. Swap the env variable to your `sk_live_...` key and redeploy to go live.

## 5. Orders
- Every order appears in your Stripe Dashboard → Payments.
- The scent breakdown (e.g., "2x Cereal Milk, 1x October Glow") is in the
  payment description and metadata.
- Shipped orders collect a U.S. shipping address automatically.
- Pickup orders don't ask for an address — arrange pickup with the customer
  via their receipt email.

## Custom domain (optional)
Netlify → Domain management lets you connect comfycandles.com (buy the
domain from any registrar, ~$12/yr).
