# VOISSS Web App 🌐

> Next.js-based decentralized AI voice protocol on Base

VOISSS is a cutting-edge platform for transforming, securing, and insights-driven vocal management. It leverages **Google Gemini 3.0** for intelligence and **ElevenLabs** for vocal synthesis, all anchored on the **Base** blockchain for decentralized provenance.

## ✅ **CURRENT STATUS: PRODUCTION READY**

- ✅ **Gemini 3.0 Integration**: Frontier intelligence for insights and agentic commands.
- ✅ **ElevenLabs Synthesis**: High-fidelity voice morphing and multi-lang dubbing.
- ✅ **Base Blockchain**: Secure, on-chain indexing of vocal artifacts.
- ✅ **Gasless Experience**: Zero-friction saves via smart account infrastructure.
- ✅ **Responsive Design**: Premium UI built with Next.js 14 and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (installed from root)

### Development Setup

1. **From the project root**, install all dependencies:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cd apps/web
   cp env.example .env.local
   ```
   Edit `.env.local` with your `GEMINI_API_KEY` and `ELEVENLABS_API_KEY`.

3. **Start development server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:4445](http://localhost:4445) in your browser.

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI Brain**: Google Gemini 3.0 Flash
- **Voice Engine**: ElevenLabs (Mulitlingual v2)
- **Blockchain**: Base (L2)
- **Styling**: Tailwind CSS
- **State**: React Context + Zustand
- **Web3 Tools**: Viem + Wagmi + Base Account SDK

## ✨ Key Features

### 🎙️ Intelligent Voice Assistant
Talk to VOISSS using your voice. Powered by **Gemini 3.0 Flash**, our assistant understands context and can even control the app through agentic commands like "[ACTION:studio]".

### 🎭 AI Voice Transformation
Morph your recordings into professional AI personas. Preservation of emotion and intonation, perfect for content creators.

### 🌍 Multi-Language Dubbing
Translate your voice into 29+ languages instantly, maintaining your unique vocal signature while speaking a new tongue.

### ⛓️ Decentralized Provenance
Every recording is more than just a file—it's an on-chain asset stored on IPFS and indexed on Base, ensuring you own your identity.

## 🧪 Testing & Building

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Run type check
npx tsc --noEmit
```

## 📚 Documentation

- [Main Project README](../../README.md) - Hackathon submission and overview
- [Architecture](../../docs/ARCHITECTURE.md) - Deep dive into the tech stack
- [Roadmap](../../docs/ROADMAP.md) - Future vision for VOISSS
