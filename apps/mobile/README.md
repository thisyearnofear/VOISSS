# VOISSS Mobile App 📱

> React Native mobile application for VOISSS voice recording platform, built with Expo 53 and Starknet.dart integration

The mobile app provides a native, high-performance interface for recording, organizing, and sharing voice content on Starknet. Designed for iOS and Android with offline-first architecture.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (installed from root)
- **For iOS development**: Xcode 15+ and iOS Simulator
- **For Android development**: Android Studio and Android SDK
- **For testing**: Expo Go app on your device

### Development Setup

1. **From the project root**, install all dependencies:

   ```bash
   pnpm install
   ```

2. **Start the development server**:

   ```bash
   # From project root
   pnpm dev:mobile

   # Or from apps/mobile directory
   pnpm start
   ```

3. **Test on device/simulator**:
   - **Physical Device**: Scan QR code with Expo Go app
   - **iOS Simulator**: Press `i` in terminal
   - **Android Emulator**: Press `a` in terminal
   - **Web Browser**: Press `w` in terminal

## 🛠 Tech Stack

- **Framework**: React Native with Expo 53
- **Blockchain**: Starknet.dart for mobile blockchain integration
- **Navigation**: Expo Router for file-based routing
- **Audio**: Expo AV for recording and playback
- **Styling**: NativeWind (Tailwind for React Native)
- **State Management**: Zustand for global state
- **Shared Dependencies**: `@voisss/shared`, `@voisss/ui`

## ✨ Key Features

### Recording & Audio

- High-quality voice recording with real-time waveform visualization
- Adjustable recording quality and format settings
- Background recording support
- Audio playback with speed controls

### Organization & Search

- Tag-based categorization system
- Smart search across recordings and metadata
- Custom filtering and sorting options
- Offline-first with automatic sync

### Starknet Integration

- **Wallet Connection**: Connect with mobile Starknet wallets
- **On-chain Storage**: Store recording metadata on Starknet
- **Ownership Verification**: Cryptographic proof of creation
- **Cross-platform Sync**: Sync with web app via blockchain

## 📁 Project Structure

```
apps/mobile/
├── app/                  # Expo Router pages
│   ├── tabs/            # Tab navigation screens
│   ├── hooks/           # Mobile-specific hooks (useStarknet)
│   └── _layout.tsx      # Root layout
├── components/          # Mobile-specific React components
├── constants/           # App constants and theme
├── store/              # Zustand state management
├── types/              # Mobile-specific TypeScript types
├── utils/              # Mobile utility functions
├── assets/             # Images, fonts, and other assets
├── app.json            # Expo configuration
└── package.json        # Mobile app dependencies
```

## 🔗 Starknet Integration

### Mobile Wallet Support

The app integrates with Starknet mobile wallets through Starknet.dart:

```typescript
// Example: Connect to Starknet wallet
import { useStarknet } from "@/hooks/useStarknet";

const { connect, isConnected, account } = useStarknet();

// Connect to wallet
await connect();

// Store recording metadata on-chain
const metadata = {
  title: "My Recording",
  duration: 120,
  tags: ["meeting", "important"],
};
await storeRecordingMetadata(metadata);
```

### Key Blockchain Features

- **Decentralized Storage**: Recording metadata stored on Starknet
- **Ownership Proof**: Immutable proof of creation and ownership
- **Creator Economy**: Monetization through smart contracts
- **Cross-device Sync**: Sync recordings across devices via blockchain

## 🧪 Testing & Building

```bash
# Start development server
pnpm start

# Run on specific platforms
pnpm run ios          # iOS Simulator
pnpm run android      # Android Emulator
pnpm run web          # Web browser

# Build for production
pnpm run build

# Create production builds
expo build:ios        # iOS App Store
expo build:android    # Google Play Store
```

## 🔧 Available Scripts

- `pnpm start` - Start Expo development server
- `pnpm dev` - Alias for start with tunnel
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm clean` - Clean build artifacts

## 📱 Platform-Specific Notes

### iOS Development

- Requires Xcode 15+ for latest iOS features
- Audio recording requires microphone permissions
- Background audio requires specific entitlements

### Android Development

- Minimum SDK version: 21 (Android 5.0)
- Audio recording requires RECORD_AUDIO permission
- Background recording requires foreground service

## 📚 Related Documentation

- [Main Project README](../../README.md) - Project overview and setup
- [Web App README](../web/README.md) - Web app documentation
- [Starknet.dart Documentation](https://starknetdart.dev/) - Mobile blockchain integration
- [Expo Documentation](https://docs.expo.dev/) - React Native framework

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler fails to start**:

   ```bash
   pnpm clean
   pnpm install
   ```

2. **Starknet connection issues**:

   - Ensure you're on Starknet testnet
   - Check wallet app is installed and updated

3. **Audio recording not working**:
   - Check microphone permissions
   - Ensure device has microphone access

For more help, see the [main troubleshooting guide](../../README.md#troubleshooting).
