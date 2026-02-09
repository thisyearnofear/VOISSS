# VOISSS Additional Resources & References

## Demo Video Script - VOISSS Flutter Butler

### Duration: 3 minutes
**Target:** Serverpod Hackathon Judges
**Goal:** Showcase Flutter + Serverpod integration

#### Scene 1: Introduction (0:00 - 0:20)
"Meet VOISSS Flutter Butler - your AI-powered voice assistant built entirely with Dart. From the beautiful Flutter frontend to the powerful Serverpod backend, this is full-stack Dart development at its finest."

#### Scene 2: The Problem (0:20 - 0:35)
"We all record voice memos, but they quickly become unmanageable. Finding that one important note? Nearly impossible. That's where the Butler comes in."

#### Scene 3: Voice Recording (0:35 - 0:55)
"Record high-quality voice memos with one tap. The sleek interface makes capturing ideas effortless."

#### Scene 4: Meet the Butler (0:55 - 1:25)
"But the magic happens with our AI Butler. Powered by Venice AI's Llama 3.3 70B model and connected through our Serverpod backend, you can chat naturally with your recordings."

#### Scene 5: More AI Features (1:25 - 1:50)
"Ask it to summarize, find specific recordings, or extract action items. The Butler understands context and responds intelligently."

#### Scene 6: The Backend (1:50 - 2:20)
"Under the hood, we're running Serverpod on Hetzner Cloud. Dart-native backend, PostgreSQL database, Docker containers, and Nginx reverse proxy with SSL. Production-ready infrastructure."

#### Scene 7: Architecture Overview (2:20 - 2:40)
"Flutter on the frontend, Serverpod on the backend, Venice AI for intelligence. All connected with type-safe generated code. This is the future of full-stack Dart development."

#### Scene 8: Closing (2:40 - 3:00)
"VOISSS Flutter Butler - built for the Serverpod Hackathon 2026. Experience the power of Flutter plus Serverpod today."

## Hackathon Submission - Serverpod Hackathon 2026

### Project Overview
**VOISSS Flutter Butler** is an AI-powered voice recording assistant built with Flutter and Serverpod. It demonstrates the full potential of the Flutter + Serverpod stack by combining a beautiful mobile interface with a Dart-native backend.

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    FLUTTER APP (iOS/Android)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Recording  │  │  AI Butler   │  │  Serverpod Client│  │
│  │    Screen    │  │    Chat      │  │   (Generated)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              HETZNER SERVER (Ubuntu + Docker)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SERVERPOD SERVER (Dart)                  │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │  │
│  │  │  Butler     │ │  Database   │ │   Venice AI     │ │  │
│  │  │  Endpoint   │ │ (PostgreSQL)│ │   Integration   │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘ │  │
│  │  ┌─────────────┐ ┌─────────────┐                      │  │
│  │  │  Greeting   │ │  Generated  │                      │  │
│  │  │  Endpoint   │ │  Protocol   │                      │  │
│  │  └─────────────┘ └─────────────┘                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Flutter 3.27.0** - UI framework
- **Dart 3.6.0** - Programming language
- **Serverpod 2.9.2** - Dart backend framework
- **PostgreSQL 16** - Database
- **Venice AI API** - LLM integration (Llama 3.3 70B)
- **Docker + Docker Compose** - Deployment
- **Hetzner Cloud** - VPS hosting

### Live Demo
**API Endpoint:** `https://butler.voisss.famile.xyz/`

## Integration Examples

### OpenClaw Integration Example
```typescript
// OpenClaw Agent using VOISSS for voice commentary
class OpenClawVoiceAgent {
  private voisss: VoisssAgentClient;
  private voiceId: string;

  constructor(agentAddress: string, voiceId: string) {
    this.voisss = new VoisssAgentClient(
      'https://voisss.netlify.app', // or your VOISSS instance
      agentAddress
    );
    this.voiceId = voiceId;
  }

  /**
   * Generate voice commentary for market analysis
   */
  async commentOnMarket(analysis: string): Promise<string> {
    // Check credits first
    const hasCredits = await this.voisss.hasCredits(analysis.length);
    if (!hasCredits) {
      throw new Error('Insufficient credits for voice generation');
    }

    // Generate voice
    const result = await this.voisss.generateVoice({
      text: analysis,
      voiceId: this.voiceId,
      options: {
        model: 'eleven_multilingual_v2',
        stability: 0.7,
        similarity_boost: 0.8,
        autoSave: true, // Save to VOISSS platform
      },
    });

    console.log(`Voice generated: ${result.characterCount} characters, cost: ${result.cost} ETH`);
    console.log(`Remaining credits: ${result.creditBalance} ETH`);

    return result.audioUrl;
  }
}
```

## Main Documentation Reference

### Getting Started Prerequisites
- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **Git**
- **Flutter SDK** (for mobile-flutter platform)
- **Dart SDK** (for Serverpod backend)

### Monorepo Structure
```
voisss/
├── apps/
│   ├── web/                   # Next.js 14 + Base Account SDK
│   ├── mobile/                # React Native + Expo
│   └── mobile-flutter/        # Flutter + Serverpod
├── packages/
│   ├── shared/                # Common utilities
│   ├── contracts/             # Solidity smart contracts
│   └── ui/                    # Shared components
└── docs/                      # Documentation
```

## Self-Managing Audio Storage

### How It Works
- **Primary Success Path (99%+ of requests)**: User Request → ElevenLabs → IPFS Upload (Success) → Return IPFS URL
- **Fallback Path (< 1% of requests)**: User Request → ElevenLabs → IPFS Fails → Store Temporarily → Return Temp URL

### Self-Managing Mechanisms
1. **Robust Primary Upload**: 3 retry attempts with exponential backoff
2. **Opportunistic Retries**: 10% chance to retry other pending uploads during normal operations
3. **Built-in Cleanup**: Auto-cleanup timer runs every 5 minutes

### Configuration
```bash
# 10% chance to trigger retry during normal operations
OPPORTUNISTIC_RETRY_CHANCE=0.1
```

## Scroll Sepolia Deployment - LIVE ✅

### Contract Addresses
- **ScrollVRF**: `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208`
- **ScrollPrivacy**: `0x0abD2343311985Fd1e0159CE39792483b908C03a`

### Integration Guide
Set environment variables for both web and mobile platforms:
```env
# Web
NEXT_PUBLIC_SCROLL_VRF_ADDRESS=0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208
NEXT_PUBLIC_SCROLL_PRIVACY_ADDRESS=0x0abD2343311985Fd1e0159CE39792483b908C03a
NEXT_PUBLIC_SCROLL_CHAIN_ID=534353
NEXT_PUBLIC_SCROLL_RPC=https://sepolia-rpc.scroll.io/

# Mobile
EXPO_PUBLIC_SCROLL_VRF_ADDRESS=0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208
EXPO_PUBLIC_SCROLL_PRIVACY_ADDRESS=0x0abD2343311985Fd1e0159CE39792483b908C03a
EXPO_PUBLIC_SCROLL_CHAIN_ID=534353
EXPO_PUBLIC_SCROLL_RPC=https://sepolia-rpc.scroll.io/
```

## Platform Status

| Platform | Status | Key Features |
|----------|--------|--------------|
| **Web** | ✅ Production Ready | Gasless txs, AI transformation, mission system |
| **Mobile** | ⚠️ Functional, needs completion | Native recording, VRF, privacy |
| **Flutter** | ✅ Live (AI Butler) | Serverpod backend, Venice AI |