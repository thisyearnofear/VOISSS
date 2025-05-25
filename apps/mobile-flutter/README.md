# VOISSS Flutter - Native Starknet Mobile App

A native Flutter mobile app for voice recording with Starknet blockchain integration using the official `starknet.dart` and `starknet_flutter` packages.

## 🎯 Overview

This is the **third app** in the VOISSS ecosystem, designed to showcase native mobile performance with official Starknet mobile SDK integration. It complements:

- **Web App** (Next.js + starknet.js) - Desktop/browser users
- **Mobile React Native** (Expo + starknet.js) - Cross-platform mobile
- **Mobile Flutter** (starknet.dart + starknet_flutter) - **This app** - Native mobile performance

## ✅ **CURRENT STATUS: WORKING**

- ✅ **Flutter SDK**: Installed and configured (v3.32.0)
- ✅ **Dependencies**: All packages resolved and working
- ✅ **Development**: Running successfully in Chrome
- ✅ **Starknet Integration**: Basic starknet.dart setup complete
- ✅ **Build System**: Compiling and launching correctly
- ✅ **Provider Pattern**: State management implemented
- ✅ **UI Components**: Home screen and recording interface ready

## ✨ Features

### 🎤 Voice Recording

- **Native audio recording** with high-quality encoding
- **Real-time duration tracking** during recording
- **Audio playback** with native controls
- **File management** with local storage

### ⛓️ Starknet Integration

- **Official starknet.dart SDK** integration
- **Native wallet connection** support
- **On-chain metadata storage** for recordings
- **Balance checking** and transaction handling
- **Testnet support** (Starknet Sepolia)

### 📱 Native Mobile Features

- **iOS-optimized** UI and performance
- **Native permissions** handling
- **Background audio** support
- **File system** integration

## 🏗️ Architecture

```
lib/
├── main.dart                 # App entry point with StarknetFlutter.init()
├── models/
│   └── recording.dart        # Recording data model
├── providers/
│   ├── starknet_provider.dart    # Starknet connection & transactions
│   └── recordings_provider.dart  # Audio recording management
├── screens/
│   └── home_screen.dart      # Main app screen
└── widgets/
    ├── wallet_selector.dart  # Wallet connection UI
    ├── account_address.dart  # Connected wallet display
    ├── recording_button.dart # Record/stop button
    └── recordings_list.dart  # Recordings list with playback
```

## 🚀 Getting Started

### Prerequisites

1. **Flutter SDK** (3.10.0 or higher)
2. **iOS development setup** (Xcode, iOS Simulator)
3. **Dart SDK** (3.0.0 or higher)

### Installation

1. **Install Flutter** (if not already installed):

   ```bash
   # Using Homebrew (recommended)
   brew install --cask flutter

   # Or download from https://flutter.dev/docs/get-started/install
   ```

2. **Verify Flutter installation**:

   ```bash
   flutter doctor
   ```

3. **Install dependencies**:

   ```bash
   cd apps/mobile-flutter
   flutter pub get
   ```

4. **Run the app**:

   ```bash
   # Chrome (Currently working) ✅
   flutter run -d chrome

   # iOS Simulator (requires Xcode setup)
   flutter run -d ios

   # Physical iOS device
   flutter run -d [device-id]

   # Or use the monorepo command from project root
   pnpm dev:flutter
   ```

### iOS Setup

1. **Open iOS project**:

   ```bash
   open ios/Runner.xcworkspace
   ```

2. **Configure signing** in Xcode
3. **Set deployment target** to iOS 12.0+
4. **Add permissions** to `ios/Runner/Info.plist`:
   ```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>This app needs microphone access to record audio</string>
   ```

## 📦 Dependencies

### Core Starknet

- `starknet: ^0.6.0` - Official Dart SDK for Starknet
- `starknet_flutter: ^0.1.0` - Flutter-specific Starknet utilities

### Audio & Recording

- `record: ^5.0.4` - Native audio recording
- `audioplayers: ^5.2.1` - Audio playback
- `permission_handler: ^11.0.1` - Native permissions

### State Management

- `provider: ^6.0.5` - State management
- `shared_preferences: ^2.2.2` - Local storage

### UI & Utils

- `cupertino_icons: ^1.0.2` - iOS-style icons
- `intl: ^0.18.1` - Internationalization
- `uuid: ^4.1.0` - Unique ID generation

## 🔗 Starknet Integration

### Wallet Connection

```dart
// Connect to Starknet wallet
final starknet = context.read<StarknetProvider>();
await starknet.connectWallet();
```

### Store Recording Metadata

```dart
// Store recording metadata on-chain
await starknet.storeRecordingMetadata(
  title: 'My Recording',
  duration: 120, // seconds
  tags: ['voice', 'memo'],
  ipfsHash: 'QmExample...',
);
```

### Check Balance

```dart
// Get ETH balance
final balance = await starknet.getBalance();
```

## 🎨 Design System

### Colors

- **Primary**: `#7C5DFA` (Purple)
- **Background**: `#0A0A0A` (Dark)
- **Surface**: `#1A1A1A` (Dark Gray)
- **Success**: `#22C55E` (Green)
- **Error**: `#EF4444` (Red)

### Typography

- **Material Design 3** typography scale
- **Monospace** for addresses and hashes
- **Weight variations** for hierarchy

## 🧪 Testing

```bash
# Run unit tests
flutter test

# Run integration tests
flutter test integration_test/

# Run with coverage
flutter test --coverage
```

## 📱 Platform Support

- ✅ **Web (Chrome)** (Currently working for development)
- ✅ **iOS 12.0+** (Ready, requires Xcode setup)
- 🔄 **Android** (Ready, requires Android Studio setup)
- ✅ **Development** (Hot reload and debugging working)

## 🚀 Deployment

### iOS App Store

```bash
# Build for release
flutter build ios --release

# Archive in Xcode
# Upload to App Store Connect
```

### TestFlight (Beta)

```bash
# Build and upload
flutter build ios --release
# Use Xcode to upload to TestFlight
```

## 🔄 Comparison with Other Apps

| Feature                | Flutter (This)        | React Native    | Web                |
| ---------------------- | --------------------- | --------------- | ------------------ |
| **Performance**        | Native                | Near-native     | Browser-dependent  |
| **Starknet SDK**       | starknet.dart         | starknet.js     | starknet.js        |
| **Audio Quality**      | Highest               | High            | Medium             |
| **File Access**        | Full native           | Limited         | Browser sandbox    |
| **Wallet Integration** | Native mobile wallets | WebView-based   | Browser extensions |
| **Platform**           | iOS/Android           | iOS/Android/Web | All browsers       |

## 🎯 Hackathon Features

### Unique to Flutter App

- **Native audio processing** with highest quality
- **Official Starknet mobile SDK** integration
- **Native wallet connections** (ArgentX mobile, Braavos mobile)
- **Background recording** capabilities
- **Native file system** access

### Shared Features

- **Starknet blockchain** integration
- **Voice recording** and playback
- **Metadata storage** on-chain
- **Modern UI/UX** design

## 🔮 Future Enhancements

- **Real wallet integration** (ArgentX mobile, Braavos mobile)
- **IPFS integration** for audio file storage
- **Smart contract deployment** for custom recording contracts
- **NFT minting** for voice recordings
- **Social features** and sharing
- **Android support** expansion

## 🤝 Contributing

This app follows Flutter and Dart best practices:

- **Provider pattern** for state management
- **Clean architecture** with separation of concerns
- **Native platform integration** where beneficial
- **Official Starknet SDK** usage

## 📄 License

MIT License - See main project LICENSE file.

---

**Built for Starknet Reignite Hackathon** 🚀
**Showcasing native mobile development with official Starknet Dart SDK**
