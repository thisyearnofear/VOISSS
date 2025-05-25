# VOISSS

**Built exclusively for the Starknet Reignite Hackathon**

VOISSS is a next-generation voice recording platform designed to transform how we capture, organize, and share audio content. This comprehensive solution includes both a **Decentralised App** and **Mobile App** working together to offer users a complete voice recording ecosystem on Starknet.

![VOISSS App](https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2070&auto=format&fit=crop)

## 🏆 Starknet Hackathon: Re{ignite}

**Hackathon TG Group**: https://t.me/+jG3_jEJF8YFmOTY1
**Workshop Calendar**: https://tinyurl.com/4zk6ru24

VOISSS is being developed exclusively for the Starknet Re{ignite} hackathon, competing in both tracks:

### 🥇 Build Mobile Apps with Starknet.dart ($10,000 USD)

- **1st Prize**: $5,000 in STRK
- **2nd Prize**: $3,000 in STRK
- **3rd Prize**: $2,000 in STRK

### 🥇 Best use of Starknet ($10,000 USD)

- **1st Prize**: $3,000 in STRK
- **2nd Prize**: 2 x $2,000 in STRK
- **3rd Prize**: 3 x $1,000 in STRK

**Total Prize Pool**: Over $33,000 STRK + up to $25,000 additional funding + Startup House opportunity in Cannes

## 🎯 The Problem

Current voice recording solutions suffer from several limitations:

- **Poor Organization**: Most apps offer basic chronological lists without meaningful categorization
- **Limited Sharing Options**: Sharing is often an afterthought, not a core feature
- **Inconsistent Quality**: Recording quality varies widely with little user control
- **Fragmented Workflow**: Users need multiple apps for recording, editing, and sharing
- **Uninspiring UX**: Utilitarian interfaces discourage regular use
- **Device Limitations**: Most solutions are device-specific with no cross-platform support
- **No Decentralization**: Centralized platforms control user data and content

## 🚀 Our Solution

VOISSS addresses these challenges through a dual-platform approach:

### 📱 Mobile App (React Native + Starknet.dart)

- High-quality audio capture with adjustable parameters
- Tag-based organization system that adapts to your workflow
- Smart search and filtering by content, metadata, or custom tags
- Seamless integration with Starknet for decentralized storage

### 🌐 Decentralised App (Next.js + Starknet)

- Community features for public recordings discovery
- Decentralized storage and ownership of voice recordings
- Creator monetization through Starknet smart contracts
- Cross-platform synchronization and backup

## 🛠 Tech Stack & Architecture

VOISSS is built as a **monorepo** using npm workspaces, enabling shared code and consistent development across platforms.

### 📁 Monorepo Structure

```
voisss/
├── apps/
│   ├── mobile/          # React Native + Expo + Starknet.dart
│   └── web/             # Next.js + Starknet
├── packages/
│   ├── shared/          # Common types, utilities, constants
│   ├── contracts/       # Starknet smart contracts (Cairo)
│   └── ui/              # Shared React components
└── package.json         # Root workspace configuration
```

### 📱 Mobile App (`apps/mobile`)

- **Framework**: React Native with Expo 53
- **Blockchain**: Starknet.dart for mobile blockchain integration
- **Navigation**: Expo Router for file-based routing
- **Audio Processing**: Expo AV for recording and playback
- **Shared Dependencies**: `@voisss/shared`, `@voisss/ui`

### 🌐 Web App (`apps/web`)

- **Framework**: Next.js 15.3.2 with TypeScript
- **Blockchain**: Starknet.js for web blockchain integration
- **Styling**: Tailwind CSS 4
- **Build Tool**: Turbopack for fast development
- **Shared Dependencies**: `@voisss/shared`, `@voisss/ui`

### 📦 Shared Packages

- **`@voisss/shared`**: Common types, utilities, and constants
- **`@voisss/contracts`**: Starknet smart contracts in Cairo
- **`@voisss/ui`**: Reusable React components for both platforms

### 🏛 Architectural Decision: Monorepo

**Why Monorepo for VOISSS?**

1. **Shared Smart Contract Integration**: Both mobile and web apps interact with the same Starknet contracts, requiring consistent ABIs and types
2. **Hackathon Efficiency**: Single repository submission, unified documentation, and easier judge review
3. **Code Reuse**: Voice recording domain logic, validation rules, and UI components shared across platforms
4. **Consistent Development**: Unified tooling, testing strategies, and deployment pipelines
5. **Type Safety**: Shared TypeScript types ensure consistency between mobile and web implementations
6. **Future Scalability**: Easy to extract packages into separate repositories if needed post-hackathon

This architectural choice optimizes for the hackathon timeline while maintaining long-term flexibility and code quality.

## ✨ Current Features

### Recording & Organization

- Create high-quality voice recordings with real-time visualization
- Tag-based categorization system with custom metadata
- Smart search across all content with advanced filtering
- Auto-save and recovery options

### Decentralized Storage

- Store recordings on Starknet for true ownership
- Immutable proof of creation and authenticity
- Cross-device synchronization through blockchain
- Privacy controls with selective sharing

### Community & Discovery

- Explore curated content and trending recordings
- Follow favorite creators and build your audio network
- Monetization options for content creators
- Decentralized governance for platform decisions

### Professional Tools

- Waveform visualization for precise navigation
- Variable playback speed without pitch distortion
- Bookmarking system for important moments
- Batch operations for efficient workflow

## 🎨 Design Philosophy

- **Mainstream Adoption**: Simple, intuitive interface designed for everyday users
- **Innovation**: Novel use of Starknet for audio content ownership and monetization
- **User Experience**: Smooth, gesture-based interactions with accessibility in mind
- **Cross-Platform**: Seamless experience between mobile and web applications

## 🏗 Getting Started

### Prerequisites

- Node.js 18+
- **pnpm 8+** (recommended package manager for monorepos)
- Expo CLI (for mobile development)
- Starknet development environment (Scarb, Starkli)

### Installation

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install all dependencies for the monorepo
pnpm install
```

### Development

```bash
# Start web app development server
pnpm dev
# or specifically
pnpm dev:web

# Start mobile app development
pnpm dev:mobile

# Build all apps
pnpm build

# Run tests across all packages
pnpm test

# Lint all packages
pnpm lint
```

### Individual App Development

```bash
# Web app (Next.js)
cd apps/web
pnpm dev
# Open http://localhost:3000

# Mobile app (React Native + Expo)
cd apps/mobile
pnpm start
```

### Package Development

```bash
# Shared package
cd packages/shared
pnpm dev  # Watch mode for TypeScript compilation

# Smart contracts
cd packages/contracts
pnpm build  # Build Cairo contracts
pnpm test   # Run contract tests
```

## 📋 Hackathon Acceptance Criteria

✅ **Video Submission**: 3-minute demo video showcasing both mobile and web apps
✅ **Presentation**: Comprehensive presentation covering technical and business aspects
✅ **Open Source**: GitHub repository with complete source code
✅ **Starknet Integration**: Deployed on Starknet testnet with smart contracts
✅ **Exclusive Development**: Built exclusively for Starknet Reignite hackathon

## 🎯 Judging Criteria Alignment

### Mobile Track

- **Mainstream Adoption**: Intuitive voice recording interface for everyday users
- **Innovation**: First decentralized voice platform on Starknet mobile
- **User Experience**: Seamless mobile-first design with native feel

### Best Use of Starknet Track

- **Technical Difficulty**: Advanced audio storage and smart contract integration
- **Project Completion**: Fully functional dual-platform solution
- **Feasibility**: Clear deployment path with experienced development team
- **Business Potential**: Creator economy and content monetization opportunities
- **Innovation**: Novel approach to decentralized audio content ownership
- **User Experience**: Smooth cross-platform interaction design

## 🌟 Beyond the Hackathon

VOISSS is designed for long-term value, not "hack-and-forget":

- **Gas Rebate**: First 3 months post-launch (up to $1,000 STRK)
- **Security Credit**: Subsidized audit for 1st prize winner (up to $10,000 STRK)
- **Fast-track Support**: Starkware Marketing support and ecosystem listing
- **Startup House**: Potential selection for Cannes Startup House program

## 📚 Resources

- [Starknet.dart Documentation](https://starknetdart.dev/)
- [Starknet.dart GitHub](https://github.com/focustree/starknet.dart)
- [Mobile Wallet Example](https://starknetdart.dev/examples/mobile-wallet)
- [Starknet Counter Example](https://starknetdart.dev/examples/starknet-counter)

---

**Are you ready to Re{ignite} the future of voice recording?** 🎤✨
