# VOISSS 🎤

[![Starknet](https://img.shields.io/badge/Starknet-Sepolia-blue)](https://sepolia.starkscan.co/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.32.0-blue)](https://flutter.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

> **🏆 Built for the Starknet Re{ignite} Hackathon**

**VOISSS** is a decentralized AI-powered voice recording platform that transforms how we capture, organize, and share audio content. Built as a comprehensive three-app ecosystem showcasing different Starknet integration approaches.

## 🚀 Live Platform

**🌐 Web App**: https://voisss.netlify.app/

## 🏗️ Architecture

Three apps, one ecosystem:

- 🌐 **Web dApp** (Next.js + starknet.js) - AI voice transformation & community features
- 📱 **React Native Mobile** (Expo + starknet.js) - Cross-platform mobile recording
- 📱 **Flutter Mobile** (starknet.dart) - Native mobile performance

## ✨ Key Features

### 🎤 AI Voice Transformation
- **Professional AI Voices**: ElevenLabs integration with curated voice library
- **Freemium Model**: 1 free transformation per session, unlimited with wallet
- **Real-time Preview**: Listen before saving

### 🌍 Multi-Language Dubbing
- **29+ Languages**: Auto-detect source, translate to target language
- **Native Accents**: Preserve authentic pronunciation and intonation
- **Freemium Access**: 1 free dubbing per session, unlimited with wallet

### 🔗 Starknet Integration
- **Decentralized Storage**: IPFS + Starknet smart contracts
- **SocialFi Missions**: Complete tasks for STRK rewards
- **Creator Economy**: Monetize recordings through blockchain

### 📱 Cross-Platform
- **Web**: Full-featured desktop experience
- **Mobile**: Native recording apps for iOS/Android
- **Sync**: Cross-platform data synchronization

## 🛠 Tech Stack

```
voisss/
├── apps/
│   ├── web/                   # Next.js + Starknet.js
│   ├── mobile/                # React Native + Expo
│   └── mobile-flutter/        # Flutter + starknet.dart
├── packages/
│   ├── shared/                # Common types & utilities
│   ├── contracts/             # Cairo smart contracts
│   └── ui/                    # Shared components
└── docs/                      # Documentation
```

### Core Technologies
- **Frontend**: Next.js 15, React Native, Flutter
- **Blockchain**: Starknet, Cairo smart contracts
- **AI**: ElevenLabs voice transformation
- **Storage**: IPFS for decentralized content
- **Build**: Turbo monorepo with pnpm workspaces

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Flutter SDK (for mobile-flutter)
- Expo CLI (for mobile)

### Installation

```bash
# Clone repository
git clone https://github.com/thisyearnofear/VOISSS.git
cd VOISSS

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Add your ElevenLabs API key and other required variables

# Start development
pnpm dev
```

### Individual App Development

```bash
# Web app
cd apps/web && pnpm dev

# React Native mobile
cd apps/mobile && pnpm start

# Flutter mobile
cd apps/mobile-flutter && flutter run
```

## 🔧 Environment Setup

### Required Environment Variables

```bash
# apps/web/.env.local
ELEVENLABS_API_KEY=your_elevenlabs_key
NEXT_PUBLIC_STARKNET_CHAIN_ID=SN_SEPOLIA
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
```

### Smart Contract Deployment

```bash
cd packages/contracts
scarb build
starkli declare target/dev/voisss_VoiceStorage.contract_class.json
starkli deploy [class_hash] [constructor_args]
```

## 📱 Mobile Development

### React Native (Expo)
```bash
cd apps/mobile
pnpm start
# Scan QR code with Expo Go app
```

### Flutter
```bash
cd apps/mobile-flutter
flutter pub get
flutter run
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test specific package
pnpm test --filter=@voisss/shared

# Test smart contracts
cd packages/contracts && scarb test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Use conventional commits

## 📚 Documentation

- **[Development Guide](./docs/DEVELOPMENT.md)** - Technical implementation details
- **[Roadmap](./docs/ROADMAP.md)** - Project vision and development phases
- **[API Documentation](./docs/api/)** - Smart contract and API references

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: https://voisss.netlify.app/
- **Starknet Contracts**: [Sepolia Starkscan](https://sepolia.starkscan.co/)
- **Hackathon Group**: https://t.me/+jG3_jEJF8YFmOTY1

---

**Built with ❤️ for the Starknet ecosystem**