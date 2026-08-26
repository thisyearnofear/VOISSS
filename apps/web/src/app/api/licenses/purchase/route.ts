import { NextRequest, NextResponse } from 'next/server';

interface LicenseRequest {
  voiceId: string;
  licenseType: 'non-exclusive' | 'exclusive';
  price: number; // cents
}

export async function POST(request: NextRequest) {
  try {
    const body: LicenseRequest = await request.json();
    const { voiceId, licenseType, price } = body;

    if (!voiceId || !licenseType || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
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
        'line_items[0][price_data][unit_amount]': String(price),
        'line_items[0][price_data][product_data][name]': `Voice License: ${voiceId}`,
        'line_items[0][price_data][product_data][description]': `${licenseType} voice license`,
        'success_url': `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/studio?license=success&voiceId=${encodeURIComponent(voiceId)}`,
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