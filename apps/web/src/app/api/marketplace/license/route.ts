import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/marketplace/license
 * 
 * Purchase a voice license (MVP: manual approval flow)
 * 
 * Request body:
 * {
 *   voiceId: string,
 *   licenseeAddress: string,
 *   licenseType: 'exclusive' | 'non-exclusive'
 * }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { voiceId, licenseeAddress, licenseType } = body;
    
    // Validation
    if (!voiceId || !licenseeAddress || !licenseType) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: voiceId, licenseeAddress, licenseType"
      }, { status: 400 });
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(licenseeAddress)) {
      return NextResponse.json({
        success: false,
        error: "Invalid Ethereum address"
      }, { status: 400 });
    }
    
    if (!['exclusive', 'non-exclusive'].includes(licenseType)) {
      return NextResponse.json({
        success: false,
        error: "Invalid license type. Must be 'exclusive' or 'non-exclusive'"
      }, { status: 400 });
    }
    
    // TODO: MVP - Manual approval flow
    // 1. Check if voice exists and is available
    // 2. Check if exclusive license already exists
    // 3. Create pending license request
    // 4. Send notification to admin for approval
    // 5. Return pending status
    
    // For now, return manual approval required
    const licenseRequestId = `lic_req_${Date.now()}_${voiceId.slice(0, 8)}`;
    
    return NextResponse.json({
      success: true,
      data: {
        licenseRequestId,
        status: "pending_approval",
        message: "License request submitted. You will be contacted via email for payment and approval.",
        estimatedApprovalTime: "24-48 hours",
        nextSteps: [
          "Admin will review your request",
          "You'll receive payment instructions via email",
          "After payment confirmation, license will be activated",
          "API key will be provided for synthesis access"
        ]
      }
    });
    
  } catch (error) {
    console.error("License purchase error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process license request"
    }, { status: 500 });
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
    const licenseeAddress = searchParams.get('licenseeAddress');
    
    if (!licenseeAddress || !/^0x[a-fA-F0-9]{40}$/.test(licenseeAddress)) {
      return NextResponse.json({
        success: false,
        error: "Valid licensee address required"
      }, { status: 400 });
    }
    
    // TODO: Fetch from database/blockchain
    // For MVP, return empty array
    const mockLicenses: any[] = [];
    
    return NextResponse.json({
      success: true,
      data: {
        licenses: mockLicenses,
        total: mockLicenses.length
      }
    });
    
  } catch (error) {
    console.error("Get licenses error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch licenses"
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
