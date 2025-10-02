# VOISSS Flutter - Prototype Stage 🚧

A Flutter prototype for voice recording with Starknet blockchain integration. This is an early-stage prototype exploring Flutter development for the VOISSS ecosystem.

## 🎯 Overview

This is the **Flutter prototype** in the VOISSS ecosystem, currently in early development. It serves as a proof-of-concept for Flutter-based mobile development. The VOISSS ecosystem includes:

- **Web App** (Next.js + starknet.js) - **PRODUCTION READY** ✅
- **Mobile React Native** (Expo + starknet.js) - **FUNCTIONAL, NEEDS COMPLETION** 🔄
- **Mobile Flutter** (Flutter + starknet.dart) - **THIS PROTOTYPE** - **NOT LAUNCH READY** ⚠️

## ⚠️ **CURRENT STATUS: PROTOTYPE STAGE**

- ✅ **Flutter SDK**: Installed and configured (v3.32.0)
- ✅ **Dependencies**: Basic packages resolved
- ⚠️ **iOS Development**: Basic simulator functionality only
- ⚠️ **Starknet Integration**: Experimental implementation, not production-ready
- ❌ **Build System**: No production builds configured
- ⚠️ **Provider Pattern**: Basic implementation, needs refinement
- ❌ **UI Components**: Incomplete, prototype-level interface
- ❌ **App Store Ready**: NOT ready for deployment

**⚠️ IMPORTANT**: This app is a prototype and requires significant development before any launch consideration.

## ✨ Features

### 🎤 Voice Recording

- **Native audio recording** with high-quality encoding
- **Real-time duration tracking** during recording
- **Audio playback** with native controls
- **File management** with local storage

### ⛓️ Starknet Integration ⚠️ **EXPERIMENTAL**

- **Experimental starknet.dart SDK** integration
- **Basic wallet connection** prototype
- **Prototype metadata storage** for recordings
- **Basic balance checking** (testing only)
- **Testnet support** (Starknet Sepolia) - prototype level

**Prototype Contracts on Starknet Sepolia** (for testing only):

- **UserRegistry**: `0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63`
- **VoiceStorage**: `0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2`
- **AccessControl**: `0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5`

### 📱 Flutter Prototype Features

- **Basic Flutter** UI implementation
- **Experimental iOS** functionality
- **Prototype permissions** handling
- **Basic audio** support (testing only)
- **Development-only** file system integration

**⚠️ NOT App Store ready** - requires significant development

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
2. **iOS development setup** (Xcode, iOS Simulator) - **For prototype testing only**
3. **Dart SDK** (3.0.0 or higher)

**Note**: No Apple Developer Account needed for prototype development

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

4. **Run the prototype**:

   ```bash
   # iOS Simulator (Prototype testing) ⚠️
   flutter run -d ios

   # Physical iOS device (for prototype testing only)
   flutter run -d [device-id]

   # Chrome (for development only)
   flutter run -d chrome

   # Or use the monorepo command from project root
   pnpm dev:flutter
   ```

### iOS Prototype Setup

1. **Open iOS project**:

   ```bash
   open ios/Runner.xcworkspace
   ```

2. **Basic development signing** (no App Store account needed)
3. **Set deployment target** to iOS 12.0+
4. **Add permissions** to `ios/Runner/Info.plist`:
   ```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>This prototype needs microphone access to test audio recording</string>
   ```

**⚠️ Note**: This is prototype-level configuration only, not production-ready

## 📦 Dependencies

### Core Starknet (Experimental)

- `starknet: ^0.6.0` - Dart SDK for Starknet (prototype integration)
- `starknet_flutter: ^0.1.0` - Flutter utilities (experimental)

### Audio & Recording (Basic)

- `record: ^5.0.4` - Basic audio recording
- `audioplayers: ^5.2.1` - Basic audio playback
- `permission_handler: ^11.0.1` - Basic permissions

### State Management (Prototype)

- `provider: ^6.0.5` - Basic state management
- `shared_preferences: ^2.2.2` - Local storage

### UI & Utils (Basic)

- `cupertino_icons: ^1.0.2` - Basic icons
- `intl: ^0.18.1` - Internationalization
- `uuid: ^4.1.0` - ID generation

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
# Run prototype tests
flutter test

# Run basic integration tests (if available)
flutter test integration_test/

# Run with coverage (prototype level)
flutter test --coverage
```

## 📱 Platform Support

- ⚠️ **iOS 12.0+** (Prototype testing only)
- ⚠️ **iOS Simulator** (Basic development and testing)
- ⚠️ **Web (Chrome)** (Development only)
- ❌ **Android** (Not implemented)

## 🚧 Development Status

### What Works (Prototype Level)
- Basic Flutter app structure
- Simple UI components
- Basic audio recording functionality
- Experimental Starknet connection

### What Needs Development
- Production-ready UI/UX design
- Complete Starknet integration
- Error handling and validation
- Performance optimization
- Security implementation
- Testing coverage
- iOS production builds
- App Store compliance

### Estimated Development Time
- **6+ months** of focused development needed for production readiness
- Requires dedicated Flutter developer
- Needs complete architecture review

## 🔄 Comparison with Other Apps

| Feature                | Flutter (This)        | React Native    | Web                |
| ---------------------- | --------------------- | --------------- | ------------------ |
| **Performance**        | Prototype level       | Near-native     | Production ready   |
| **Starknet SDK**       | starknet.dart (exp.)  | starknet.js     | starknet.js        |
| **Audio Quality**      | Basic (prototype)     | High            | Medium             |
| **File Access**        | Basic Flutter         | Limited         | Browser sandbox    |
| **Wallet Integration** | Experimental          | WebView-based   | Browser extensions |
| **Platform**           | iOS (prototype only)  | iOS/Android/Web | All browsers       |
| **Launch Status**      | **Prototype Stage**   | Development     | **Production**     |

## 🎯 Hackathon Features

### Prototype Features (Flutter)

- **Basic Flutter** development exploration
- **Experimental Starknet** integration attempt
- **Simple audio recording** prototype
- **Basic UI components** for testing
- **Development environment** setup

**⚠️ Note**: These are prototype-level implementations, not production features

### Shared Concepts (Across Apps)

- **Starknet blockchain** integration (various maturity levels)
- **Voice recording** and playback concepts
- **Metadata storage** exploration
- **Modern UI/UX** design principles

## 🔮 Future Development Roadmap

### Phase 1: Foundation (2-3 months)
- Complete Flutter architecture design
- Implement proper state management
- Build production-ready UI components
- Add comprehensive error handling

### Phase 2: Integration (2-3 months)
- Complete Starknet integration
- Implement IPFS file storage
- Add wallet connection features
- Build testing framework

### Phase 3: Production (1-2 months)
- iOS production builds
- App Store compliance
- Performance optimization
- Security audit

**Total Estimated Time**: 6+ months for production readiness

## 🤝 Contributing

This prototype follows Flutter and Dart development practices:

- **Provider pattern** for basic state management
- **Simple architecture** for prototype development
- **Experimental platform integration** for learning
- **Basic Starknet SDK** exploration

**⚠️ Note**: This is prototype-level code, not production-ready

## 📄 License

MIT License - See main project LICENSE file.

---

**Flutter Prototype in Development** 🚧  
**Exploring Flutter development with experimental Starknet integration**  
**Requires 6+ months development for production readiness**
