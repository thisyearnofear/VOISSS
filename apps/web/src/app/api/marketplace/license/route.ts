import { NextRequest, NextResponse } from "next/server";
import {
  getX402Client,
  parsePaymentHeader,
  type X402PaymentPayload,
} from "@voisss/shared";
import { z } from "zod";

const LicenseRequestSchema = z.object({
  voiceId: z.string().min(1, "Voice ID is required"),
  licenseeAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  licenseType: z.enum(["exclusive", "non-exclusive"], { errorMap: () => ({ message: "licenseType must be 'exclusive' or 'non-exclusive'" }) }),
});

/**
 * POST /api/marketplace/license
 *
 * Purchase a voice license via x402 Protocol.
 * If no payment is provided, returns 402 Payment Required.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validated = LicenseRequestSchema.parse(body);
    const { voiceId, licenseeAddress, licenseType } = validated;

    const paymentHeader = req.headers.get("x-402-payment");
    const payment = parsePaymentHeader(paymentHeader) as X402PaymentPayload | null;

    const baseFee = 49000000n;
    const licenseFee =
      licenseType === "exclusive" ? baseFee * 10n : baseFee;

    if (!payment) {
      const x402Client = getX402Client();
      const requirements = x402Client.createRequirements(
        `${req.nextUrl.origin}/api/marketplace/license`,
        licenseFee,
        process.env.X402_PAY_TO_ADDRESS || licenseeAddress,
        `Voice license for ${voiceId} (${licenseType})`
      );

      const response = new NextResponse(
        JSON.stringify({
          success: false,
          error: "Payment required",
          requirements,
        }),
        { status: 402 }
      );

      response.headers.set("Content-Type", "application/json");
      response.headers.set("x-payment-required", JSON.stringify(requirements));
      return response;
    }

    const licenseId = `lic_${Date.now()}_${String(voiceId).slice(-4)}`;

    return NextResponse.json({
      success: true,
      data: {
        licenseId,
        status: "active",
        voiceId,
        licenseType,
        paymentFrom: payment.from,
        paymentTo: payment.to,
        paymentValue: payment.value,
        message: "Voice license successfully activated via x402 payment.",
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: `Validation error: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      }, { status: 400 });
    }
    console.error("License purchase error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process license request",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/license?licenseeAddress=0x...
 *
 * Get licenses for an address
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const licenseeAddress = searchParams.get("licenseeAddress");

    if (!licenseeAddress || !/^0x[a-fA-F0-9]{40}$/.test(licenseeAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid licensee address required",
        },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database query once license storage is implemented
    return NextResponse.json({
      success: true,
      data: {
        licenses: [],
        total: 0,
      },
    });
  } catch (error) {
    console.error("Get licenses error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch licenses",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
