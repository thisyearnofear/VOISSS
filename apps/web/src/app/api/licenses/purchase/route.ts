import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getMarketplaceListings } from '@/lib/marketplace-indexer';
import { formatUnits } from 'viem';

interface LicenseRequest {
  voiceId: string;
  licenseType: 'non-exclusive' | 'exclusive';
}

export async function POST(request: NextRequest) {
  try {
    const body: LicenseRequest = await request.json();
    const { voiceId, licenseType } = body;

    if (!voiceId || !licenseType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    let buyer;
    try {
      buyer = requireAuth(request);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Sign in with your wallet before purchasing a licence.' },
        { status: 401 },
      );
    }

    const voices = await getMarketplaceListings();
    const voice = voices.find(
      (candidate) => candidate.id === voiceId || candidate.contractVoiceId === voiceId.replace(/^voice_/, ''),
    );
    if (!voice || voice.status !== 'approved') {
      return NextResponse.json({ success: false, error: 'This voice is no longer available.' }, { status: 404 });
    }
    if (voice.licenseType !== licenseType) {
      return NextResponse.json({ success: false, error: 'The selected licence type is no longer available.' }, { status: 409 });
    }

    // Contract listing prices are USDC values with six decimal places. Never
    // accept a checkout amount from the browser.
    const priceUsd = Number(formatUnits(BigInt(voice.price), 6));
    const priceInCents = Math.round(priceUsd * 100);
    if (!Number.isSafeInteger(priceInCents) || priceInCents < 50) {
      return NextResponse.json({ success: false, error: 'This listing has an invalid price.' }, { status: 400 });
    }

    // ── Step 1: Create Stripe checkout session ─────────────────────────────
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      // In production this must be configured
      return NextResponse.json(
        { success: false, error: 'Payment system not configured' },
        { status: 503 },
      );
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': String(priceInCents),
        'line_items[0][price_data][product_data][name]': `Voice License: ${voice.metadata.title || voiceId}`,
        'line_items[0][price_data][product_data][description]': `${licenseType} voice license`,
        'metadata[voiceId]': voice.id,
        'metadata[licenseType]': licenseType,
        'metadata[agentAddress]': buyer.address,
        'payment_intent_data[metadata][voiceId]': voice.id,
        'payment_intent_data[metadata][licenseType]': licenseType,
        'payment_intent_data[metadata][agentAddress]': buyer.address,
        'success_url': `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/studio?license=success&voiceId=${encodeURIComponent(voice.id)}&session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/marketplace?license=cancelled`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error?.message || 'Stripe error' },
        { status: response.status },
      );
    }

    // ── Step 2: Redirect to Stripe Checkout ──────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        url: data.url,
        sessionId: data.id,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
