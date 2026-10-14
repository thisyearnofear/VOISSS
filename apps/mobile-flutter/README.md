# VOISSS Flutter Butler

> A Flutter-based AI voice assistant powered by Serverpod, part of the VOISSS ecosystem.

## Overview

VOISSS Flutter Butler is an AI-powered voice assistant application that provides conversational interactions through a Serverpod backend. Unlike the main VOISSS recording studio apps, this component focuses on AI assistance and operates within the broader VOISSS ecosystem.

**Part of**: [VOISSS Ecosystem](https://github.com/thisyearnofear/VOISSS)  
**Live Backend**: https://butler.voisss.famile.xyz/  
**Architecture**: Serverpod (Dart) + Featherless/Venice AI (provider chain)

---

## 🚀 Quick Start

```bash
# Install dependencies
flutter pub get

# Run on macOS
flutter run -d macos

# Run on iOS
flutter run -d ios

# Run on Android
flutter run -d android
```

## 📱 Features

- 🎤 **Voice Recording** - High-quality audio recording
- 🤖 **AI Butler** - Token-streamed chat via `butler.chatStream`; Featherless (`Qwen3-Next-80B-A3B-Instruct`) primary, Venice direct fallback, ACP Compute last-resort
- 🔒 **HTTPS** - Secure connection to Serverpod backend
- ⚡ **Real-time** - WebSocket support for live updates

## 🔗 Backend Connection

The app connects to:
```
https://butler.voisss.famile.xyz/
```

Powered by Serverpod running on Hetzner Cloud.

## 🏗️ Architecture

```
┌─────────────────┐
│  Flutter App    │
│  (This Project) │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────┐
│ Serverpod Backend   │
│ butler.voisss.famile│
└────────┬────────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
PostgreSQL  Venice AI   Nginx
```

### Why No Blockchain?

Unlike the main VOISSS apps (Web and React Native), the Flutter Butler uses a **Serverpod-centric architecture** rather than blockchain:

| Component | Web/Mobile RN | Flutter Butler |
|-----------|---------------|----------------|
| State | Blockchain (Base/Scroll) | PostgreSQL |
| Real-time | Polling/Events | WebSocket |
| AI | ElevenLabs/Gemini | Featherless + Venice AI |
| Backend | Client-side heavy | Serverpod (Dart) |

This architectural choice prioritizes:
- **Real-time conversational AI** via WebSocket
- **Simpler deployment** for hackathon/demo scenarios
- **Server-side AI processing** with a Featherless → Venice → ACP provider chain

---

## 🌐 VOISSS Ecosystem

This app is part of the larger VOISSS platform:

| Component | Tech Stack | Blockchain | Purpose |
|-----------|-----------|------------|---------|
| **Web App** | Next.js + Base SDK | Base Sepolia | Recording studio, gasless saves |
| **Mobile App** | React Native + Expo | Scroll Sepolia | Mobile recording, VRF, privacy |
| **Flutter Butler** | Flutter + Serverpod | None | AI voice assistant |

**Full Documentation**: [VOISSS Main README](../README.md)  
**Blockchain Inventory**: [BLOCKCHAIN_INVENTORY.md](../BLOCKCHAIN_INVENTORY.md)

---

## 🔧 Development

### Prerequisites
- Flutter SDK 3.x+
- Dart SDK
- macOS/iOS Simulator (for Apple platforms) or Android Emulator

### Running Locally
```bash
cd apps/mobile-flutter
flutter pub get
flutter run -d <device_id>
```

### Connecting to Backend
The app automatically connects to `https://butler.voisss.famile.xyz/`. To use a local backend:
1. Update the server URL in the generated client
2. Ensure your local Serverpod instance is running

---

## 🚀 Deployment

**Live web app:** https://voisss-silence.pages.dev (Cloudflare Pages)

```bash
flutter build web --release
wrangler pages deploy build/web --project-name voisss-silence
```

### Build for Production
```bash
# macOS
flutter build macos

# iOS
flutter build ios

# Android
flutter build apk
flutter build appbundle
```

---

## 📦 Dependencies

- `serverpod_client` - Generated API client
- `voisss_butler_client` - Local generated client
- `provider` - State management
- `record` - Audio recording
- `audioplayers` - Audio playback

## 🎨 UI/UX

- Dark theme with purple accent (#7C5DFA)
- Smooth animations and transitions
- Splash screen with hackathon branding
- Onboarding flow for new users

---

## 📝 License

MIT - See [LICENSE](../LICENSE) for details.

---

## 🤝 Contributing

This is part of the VOISSS monorepo. See the [main contributing guide](../README.md#contributing) for workflow details.

---

## 🔗 Related Links

- [VOISSS Main Project](https://github.com/thisyearnofear/VOISSS)
- [Web App Documentation](../web/README.md)
- [Mobile App Documentation](../mobile/README.md)
- [Serverpod Documentation](https://docs.serverpod.dev/)
- [Live Butler Backend](https://butler.voisss.famile.xyz/)

