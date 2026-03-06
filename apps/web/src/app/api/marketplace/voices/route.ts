import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/marketplace/voices
 * 
 * Browse available voice listings
 * Query params: language (en-US, en-GB, es-ES, fr-FR), tone (professional, warm, energetic, calm, authoritative, friendly, sophisticated, conversational), minPrice, maxPrice, licenseType
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse filters
    const language = searchParams.get('language');
    const tone = searchParams.get('tone');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const licenseType = searchParams.get('licenseType') as 'exclusive' | 'non-exclusive' | null;
    
    // TODO: Fetch from database/blockchain
    // For MVP, return mock data structure
    const mockListings = [
      {
        id: "voice_001",
        name: "Sarah - Professional",
        contributorAddress: "0x7a3B1c9D2e4F5a6B8c0D1E2F3A4B5C6D7E8F4f2E",
        price: "49000000",
        licenseType: "non-exclusive",
        voiceProfile: { tone: "professional", pitch: "medium", language: "en-US", accent: "neutral", tags: ["corporate", "narration", "clear"] },
        metadata: { duration: 30, sampleRate: 44100, ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", createdAt: Date.now() - 86400000 * 14 },
        stats: { views: 2847, purchases: 34, usageCount: 12500 },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
      },
      {
        id: "voice_002",
        name: "James - Southern Storyteller",
        contributorAddress: "0x3cD1e5F7a8B2c4D6e0F1A2B3C4D5E6F7A8B8a9B",
        price: "79000000",
        licenseType: "non-exclusive",
        voiceProfile: { tone: "warm", pitch: "low", language: "en-US", accent: "southern", tags: ["storytelling", "podcast", "soothing"] },
        metadata: { duration: 45, sampleRate: 48000, ipfsHash: "QmZ4tDuvesekSs4qM765MrHFz7P1YTs4pjm7Lz6PEMpyrb", createdAt: Date.now() - 86400000 * 7 },
        stats: { views: 1923, purchases: 21, usageCount: 8400 },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/QmZ4tDuvesekSs4qM765MrHFz7P1YTs4pjm7Lz6PEMpyrb"
      },
      {
        id: "voice_003",
        name: "Chloe - Upbeat Marketing",
        contributorAddress: "0xB2e51cF3d4A5b6C7d8E9f0A1B2C3D4E5F6A71cF3",
        price: "149000000",
        licenseType: "exclusive",
        voiceProfile: { tone: "energetic", pitch: "high", language: "en-US", accent: "california", tags: ["marketing", "upbeat", "youthful"] },
        metadata: { duration: 25, sampleRate: 44100, ipfsHash: "QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB", createdAt: Date.now() - 86400000 * 3 },
        stats: { views: 3412, purchases: 8, usageCount: 3200 },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB"
      },
      {
        id: "voice_004",
        name: "Arthur - British RP",
        contributorAddress: "0x9fA86dE2a3B4c5D6e7F8a9B0C1D2E3F4A5B66dE2",
        price: "59000000",
        licenseType: "non-exclusive",
        voiceProfile: { tone: "calm", pitch: "medium", language: "en-GB", accent: "british rp", tags: ["meditation", "education", "trustworthy"] },
        metadata: { duration: 60, sampleRate: 48000, ipfsHash: "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn", createdAt: Date.now() - 86400000 * 21 },
        stats: { views: 4156, purchases: 47, usageCount: 19800 },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn"
      },
      {
        id: "voice_005",
        name: "Marcus - Documentary",
        contributorAddress: "0x1bC45aD7e6F7a8B9c0D1e2F3A4B5C6D7E8F95aD7",
        price: "99000000",
        licenseType: "non-exclusive",
        voiceProfile: { tone: "authoritative", pitch: "low", language: "en-US", accent: "midwest", tags: ["news", "documentary", "commanding"] },
        metadata: { duration: 35, sampleRate: 44100, ipfsHash: "QmdfTbBqBPQ7VNxZEYFj1VP4vLSmQXhekCZSbcfXMk9F7c", createdAt: Date.now() - 86400000 * 5 },
        stats: { views: 2234, purchases: 19, usageCount: 7600 },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/QmdfTbBqBPQ7VNxZEYFj1VP4vLSmQXhekCZSbcfXMk9F7c"
      },
      {
        id: "voice_006",
        name: "Elena - Castilian Friendly",
        contributorAddress: "0xE7f23bA1d4C5e6F7a8B9c0D1E2F3A4B5C6D73bA1",
        price: "69000000",
        licenseType: "non-exclusive",
        voiceProfile: { tone: "friendly", pitch: "medium", language: "es-ES", accent: "castilian", tags: ["customer-service", "approachable", "multilingual"] },
        metadata: { duration: 40, sampleRate: 44100, ipfsHash: "QmRf22bZar3WKmojipms22PkXH1MZGmvsqzQtuSvQE3uhm", createdAt: Date.now() - 86400000 * 10 },
        stats: { views: 1567, purchases: 12, usageCount: 4800 },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/QmRf22bZar3WKmojipms22PkXH1MZGmvsqzQtuSvQE3uhm"
      },
      {
        id: "voice_007",
        name: "Dominique - Parisian Luxury",
        contributorAddress: "0x4Da97eC5a8B2c3D4e5F6a7B8C9D0E1F2A3B47eC5",
        price: "199000000",
        licenseType: "exclusive",
        voiceProfile: { tone: "sophisticated", pitch: "medium", language: "fr-FR", accent: "parisian", tags: ["luxury", "elegant", "premium"] },
        metadata: { duration: 30, sampleRate: 48000, ipfsHash: "QmYHNYAaYK5hm3ZhZFx5W9H6xydKDGimjdgJMrMSdnctEm", createdAt: Date.now() - 86400000 * 2 },
        stats: { views: 892, purchases: 3, usageCount: 1200 },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/QmYHNYAaYK5hm3ZhZFx5W9H6xydKDGimjdgJMrMSdnctEm"
      },
      {
        id: "voice_008",
        name: "Avery - Conversational",
        contributorAddress: "0x6Ac39fB8d1E2f3A4b5C6d7E8f9A0B1C2D3E49fB8",
        price: "39000000",
        licenseType: "non-exclusive",
        voiceProfile: { tone: "conversational", pitch: "high", language: "en-US", accent: "pacific northwest", tags: ["chatbot", "casual", "relatable"] },
        metadata: { duration: 20, sampleRate: 44100, ipfsHash: "QmS4ustL54uo8FzR9455qaxZwuMimt6QY6FhQ7FPHVTVSv", createdAt: Date.now() - 86400000 },
        stats: { views: 5621, purchases: 63, usageCount: 28400 },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/QmS4ustL54uo8FzR9455qaxZwuMimt6QY6FhQ7FPHVTVSv"
      },
      {
        id: "voice_009",
        name: "Sebastian - Tech News",
        contributorAddress: "0x2D1eE3aF4b5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E",
        price: "89000000",
        licenseType: "non-exclusive",
        voiceProfile: { tone: "professional", pitch: "medium", language: "en-US", accent: "san francisco", tags: ["tech", "informative", "modern"] },
        metadata: { duration: 35, sampleRate: 48000, ipfsHash: "Qm...sebastian", createdAt: Date.now() - 86400000 * 4 },
        stats: { views: 1245, purchases: 15, usageCount: 5200 },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/Qm...sebastian"
      },
      {
        id: "voice_010",
        name: "Lila - Soothing Meditation",
        contributorAddress: "0x5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D",
        price: "69000000",
        licenseType: "non-exclusive",
        voiceProfile: { tone: "calm", pitch: "high", language: "en-AU", accent: "australian", tags: ["wellness", "meditation", "gentle"] },
        metadata: { duration: 50, sampleRate: 44100, ipfsHash: "Qm...lila", createdAt: Date.now() - 86400000 * 9 },
        stats: { views: 3210, purchases: 42, usageCount: 15600 },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/Qm...lila"
      }
    ];
    
    // Apply filters
    let filtered = mockListings;
    
    if (language) {
      filtered = filtered.filter(v => v.voiceProfile.language === language);
    }
    
    if (tone) {
      filtered = filtered.filter(v => v.voiceProfile.tone === tone);
    }
    
    if (licenseType) {
      filtered = filtered.filter(v => v.licenseType === licenseType);
    }
    
    if (minPrice) {
      const min = parseInt(minPrice);
      filtered = filtered.filter(v => parseInt(v.price) >= min);
    }
    
    if (maxPrice) {
      const max = parseInt(maxPrice);
      filtered = filtered.filter(v => parseInt(v.price) <= max);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        voices: filtered,
        total: filtered.length,
        filters: {
          language,
          tone,
          minPrice,
          maxPrice,
          licenseType
        }
      }
    });
    
  } catch (error) {
    console.error("Marketplace browse error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch voice listings"
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
