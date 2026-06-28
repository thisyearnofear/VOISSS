# Stripe Setup Guide for VOISSS

**Goal:** Configure Stripe live keys so the fiat-to-credits purchase flow works in production.

---

## Step 1: Create a Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Sign up with your email (you already have an account?)
3. Complete onboarding (business details, etc.)

## Step 2: Get Your API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. You'll see two keys:
   - **Publishable key** (`pk_live_...`) — this can be public (but we use it server-side)
   - **Secret key** (`sk_live_...`) — **keep this secret, never expose to frontend**
3. Copy the **Secret key**

## Step 3: Set Up the Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://voisss.netlify.app/api/payments/stripe/webhook`
4. **Events to listen for:** Select `checkout.session.completed`
5. Click **"Add endpoint"**
6. On the endpoint detail page, reveal the **Signing secret** (`whsec_...`)
7. Copy the **Signing secret**

## Step 4: Configure Environment Variables

In `apps/web/.env.local`, add:

```bash
# Stripe — Fiat credit purchases (card payments → USDC credits)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Also add these to Netlify environment variables (if deploying via Netlify):

1. Go to https://app.netlify.com/sites/voisss/settings/env
2. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`

## Step 5: Test the Flow

1. Run the dev server: `pnpm dev:web`
2. Go to http://localhost:4445/demo
3. Use all 3 free generations
4. Click "Buy Credits" or "Start for $5"
5. Enter a wallet address (e.g., your own Base wallet `0x...`)
6. Click "Pay $5 with Card"
7. You should be redirected to Stripe Checkout
8. Use Stripe test card: `4242 4242 4242 4242` with any future expiry and any CVC
9. After payment, you'll be redirected back to VOISSS

## Troubleshooting

| Issue | Likely Fix |
|---|---|
| "Stripe not configured" (503) | `STRIPE_SECRET_KEY` missing in .env.local |
| "Missing signature" (400) | Webhook secret not set or wrong |
| "Invalid signature" (400) | Webhook URL mismatch — verify endpoint URL in Stripe dashboard |
| Checkout shows error | Check Stripe dashboard → Payments for error details |
| Redirect URL uses localhost | Update `NEXT_PUBLIC_APP_URL` in .env.local |

## Production Checklist

- [ ] Stripe account activated (not in review/restricted mode)
- [ ] Secret key starts with `sk_live_` (not `sk_test_`)
- [ ] Webhook endpoint is active and shows "Enabled"
- [ ] Webhook signing secret starts with `whsec_`
- [ ] Netlify env vars set (if deploying there)
- [ ] Set `NEXT_PUBLIC_APP_URL` to `https://voisss.netlify.app`
