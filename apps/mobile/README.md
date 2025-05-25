# VOISSS Mobile App

React Native mobile application for VOISSS voice recording platform, built with Expo 53 and Starknet.dart integration.

## Features

- High-quality voice recording with real-time visualization
- Starknet.dart integration for blockchain functionality
- Cross-platform support (iOS & Android)
- Offline-first architecture with sync capabilities
- Shared UI components from @voisss/ui package

## Development

```bash
# Start development server
npm run dev

# Run on specific platform
npm run ios
npm run android
npm run web

# Build for production
npm run build
```

## Architecture

- **Expo Router**: File-based routing system
- **Starknet.dart**: Mobile blockchain integration
- **Expo AV**: Audio recording and playback
- **Shared Packages**: Common types and UI components

## Starknet Integration

The mobile app uses Starknet.dart to:
- Connect to Starknet wallets
- Store recording metadata on-chain
- Verify ownership and authenticity
- Enable decentralized features
