# VOISSS Flutter Butler

A Flutter app powered by Serverpod for the Serverpod Hackathon 2026.

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
- 🤖 **AI Butler** - Chat with Venice AI (Llama 3.3 70B)
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
Flutter App
    │
    ▼ HTTPS
Serverpod Backend (Dart)
    │
    ├── PostgreSQL (Database)
    ├── Venice AI (LLM)
    └── Nginx (Reverse Proxy)
```

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

## 📝 License

MIT
