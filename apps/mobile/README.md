# VOISSS Mobile App 📱

> React Native mobile application for VOISSS voice recording platform, built with Expo 53 and Base chain integration

The mobile app provides a native, high-performance interface for recording, organizing, and sharing voice content on Base. Designed for iOS and Android with offline-first architecture.

## ✅ **CURRENT STATUS: WORKING**

- ✅ **Development Server**: Running with Expo tunnel
- ✅ **QR Code Access**: Available for testing on physical devices
- ✅ **Metro Bundler**: Building and hot reloading successfully
- ✅ **Cross-platform**: iOS, Android, and Web builds working
- ✅ **Shared Components**: Using @voisss/ui and @voisss/shared packages
- ✅ **Expo Router**: File-based navigation implemented
- ✅ **Development Workflow**: Optimized for monorepo structure

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
   # From project root (RECOMMENDED for monorepo)
   pnpm dev:mobile
   ```

   > **⚠️ Important**: Always run from the project root to ensure proper workspace dependency resolution in this monorepo setup.

3. **Test on device/simulator**:
   - **Physical Device**: Scan QR code with Expo Go app
   - **iOS Simulator**: Press `i` in terminal
   - **Android Emulator**: Press `a` in terminal
   - **Web Browser**: Press `w` in terminal

## 🛠 Tech Stack

- **Framework**: React Native with Expo 53
- **Blockchain**: Base chain for mobile blockchain integration
- **Navigation**: Expo Router for file-based routing
- **Audio**: Expo AV for recording and playback
- **Styling**: NativeWind (Tailwind for React Native)
- **State Management**: Zustand for global state
- **IPFS**: Pinata for decentralized audio storage
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
│   └── _layout.tsx      # Root layout
├── hooks/               # Mobile-specific hooks (useBase)
├── components/          # Mobile-specific React components
├── constants/           # App constants and theme
├── store/              # Zustand state management
├── types/              # Mobile-specific TypeScript types
├── utils/              # Mobile utility functions
├── assets/             # Images, fonts, and other assets
├── app.json            # Expo configuration
└── package.json        # Mobile app dependencies
```

## 🔗 Base Integration

### Mobile Wallet Support

The app integrates with Base wallets through Wagmi and Base Account SDK:

```typescript
// Example: Connect to Base wallet
import { useBase } from "../hooks/useBase";

const { connect, isConnected, account } = useBase();

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
# Start development server (from project root)
pnpm dev:mobile

# Run on specific platforms (press keys in terminal)
# i - iOS Simulator
# a - Android Emulator
# w - Web browser

# Build for production (from project root)
pnpm build

# Or build mobile only
turbo run build --filter=mobile
```

## 🔧 Available Scripts

**From project root (recommended):**

- `pnpm dev:mobile` - Start mobile development server
- `pnpm build` - Build all apps including mobile
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean all build artifacts

**From apps/mobile directory (if needed):**

- `pnpm start` - Start Expo development server
- `pnpm build` - Build mobile app only
- `pnpm clean` - Clean mobile build artifacts

## 📤 IPFS Configuration

To enable audio upload functionality, you need to configure IPFS credentials:

1. Sign up for a free account at [Pinata](https://www.pinata.cloud/)
2. Create API keys in your Pinata dashboard
3. Add the following environment variables to your project:

```bash
# Create a .env file in the apps/mobile directory
EXPO_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
EXPO_PUBLIC_PINATA_API_SECRET=your_pinata_api_secret_here
```

4. Restart your development server

The mobile app will automatically use these credentials to upload recordings to IPFS via Pinata's API.

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
   # From project root
   pnpm clean
   pnpm install
   pnpm dev:mobile
   ```

2. **Starknet connection issues**:

   - Ensure you're on Starknet testnet
   - Check wallet app is installed and updated

3. **Audio recording not working**:
   - Check microphone permissions
   - Ensure device has microphone access

For more help, see the [main troubleshooting guide](../../README.md#troubleshooting).
