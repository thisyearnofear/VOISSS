import { NextRequest, NextResponse } from "next/server";
import { getPaymentRouter } from "@voisss/shared";

const paymentRouter = getPaymentRouter({
  preference: 'credits_first',
  x402PayTo: process.env.X402_PAY_TO_ADDRESS || '',
});

/**
 * POST /api/agents/vocalize/quote
 * 
 * Get payment quote for specific quantity
 * Returns actual cost, not scaled from sample
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { agentAddress, service, quantity } = body;

    if (!agentAddress || !/^0x[a-fA-F0-9]{40}$/.test(agentAddress)) {
      return NextResponse.json({
        success: false,
        error: "Valid agent address required"
      }, { status: 400 });
    }

    if (!service || !quantity || quantity <= 0) {
      return NextResponse.json({
        success: false,
        error: "Service and quantity required"
      }, { status: 400 });
    }

    // Get quote for actual quantity
    const quote = await paymentRouter.getQuote(agentAddress, service, quantity);

    return NextResponse.json({
      success: true,
      data: {
        service: quote.service,
        quantity: quote.quantity,
        baseCost: quote.baseCost.toString(),
        estimatedCost: quote.estimatedCost.toString(),
        unitCost: quote.unitCost?.toString(),
        discountPercent: quote.discountPercent,
        availableMethods: quote.availableMethods,
        recommendedMethod: quote.recommendedMethod,
        creditsAvailable: quote.creditsAvailable?.toString(),
        currentTier: quote.currentTier,
        tierCoversService: quote.tierCoversService,
      }
    });

  } catch (error: unknown) {
    console.error("Get quote error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to get quote"
    }, { status: 500 });
  }
}
