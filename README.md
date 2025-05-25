# VOISSS 🎤

> **Built exclusively for the Starknet Re{ignite} Hackathon**

VOISSS is a next-generation decentralized voice recording platform that transforms how we capture, organize, and share audio content. Built as a comprehensive monorepo solution with both **Web dApp** and **Mobile App** working together to offer users a complete voice recording ecosystem on Starknet.

![VOISSS Platform](https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2070&auto=format&fit=crop)

## 🏆 Starknet Re{ignite} Hackathon

**🔗 Links:**

- **Hackathon TG Group**: https://t.me/+jG3_jEJF8YFmOTY1
- **Workshop Calendar**: https://tinyurl.com/4zk6ru24
- **GitHub Repository**: https://github.com/thisyearnofear/VOISSS

**🏅 Competing Tracks:**

### 🥇 Build Mobile Apps with Starknet.dart ($10,000 USD)

- **1st Prize**: $5,000 in STRK
- **2nd Prize**: $3,000 in STRK
- **3rd Prize**: $2,000 in STRK

### 🥇 Best use of Starknet ($10,000 USD)

- **1st Prize**: $3,000 in STRK
- **2nd Prize**: 2 x $2,000 in STRK
- **3rd Prize**: 3 x $1,000 in STRK

**💰 Total Prize Pool**: Over $33,000 STRK + up to $25,000 additional funding + Startup House opportunity in Cannes

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

VOISSS is built as a **monorepo** using pnpm workspaces and Turbo for optimal development experience and code sharing across platforms.

### 📁 Project Structure

```
voisss/
├── apps/
│   ├── mobile/                 # React Native + Expo + Starknet.dart
│   │   ├── app/               # Expo Router pages
│   │   ├── components/        # Mobile-specific components
│   │   ├── hooks/             # Mobile-specific hooks (useStarknet)
│   │   └── package.json
│   └── web/                   # Next.js + Starknet.js
│       ├── src/               # Web app source
│       ├── public/            # Static assets
│       └── package.json
├── packages/
│   ├── shared/                # Common types, utilities, constants
│   │   ├── src/types/         # Shared TypeScript types
│   │   └── src/utils/         # Shared utility functions
│   ├── contracts/             # Starknet smart contracts (Cairo)
│   │   ├── src/               # Cairo contract source
│   │   └── Scarb.toml         # Cairo project config
│   └── ui/                    # Shared React components
│       ├── src/components/    # Cross-platform components
│       └── src/styles/        # Shared styling
├── turbo.json                 # Turbo build configuration
├── pnpm-workspace.yaml        # pnpm workspace config
└── package.json               # Root workspace configuration
```

### 📱 Mobile App (`apps/mobile`)

- **Framework**: React Native with Expo 53
- **Blockchain**: Starknet.dart for mobile blockchain integration
- **Navigation**: Expo Router for file-based routing
- **Audio**: Expo AV for recording and playback
- **Styling**: NativeWind (Tailwind for React Native)
- **State**: Zustand for state management
- **Dependencies**: `@voisss/shared`, `@voisss/ui`

### 🌐 Web App (`apps/web`)

- **Framework**: Next.js 15.3.2 with TypeScript
- **Blockchain**: Starknet.js + Starknet React for web integration
- **Styling**: Tailwind CSS 4
- **Build**: Turbopack for fast development
- **State**: React Context + Zustand
- **Dependencies**: `@voisss/shared`, `@voisss/ui`

### 📦 Shared Packages

- **`@voisss/shared`**: Common types, utilities, constants, and business logic
- **`@voisss/contracts`**: Starknet smart contracts written in Cairo
- **`@voisss/ui`**: Cross-platform React components and design system

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

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **pnpm 8+** (recommended for monorepos)
- **Git** for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/thisyearnofear/VOISSS.git
cd VOISSS

# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install all dependencies for the monorepo
pnpm install
```

### Development Commands

```bash
# 🌐 Start web app (Next.js)
pnpm dev:web
# Opens http://localhost:3000

# 📱 Start mobile app (Expo)
pnpm dev:mobile
# Shows QR code for Expo Go app

# 🏗️ Build all apps
pnpm build

# 🧪 Run tests across all packages
pnpm test

# 🔍 Lint all packages
pnpm lint

# 🧹 Clean all build artifacts
pnpm clean
```

### Individual App Development

For detailed setup instructions for each app, see:

- **Web App**: [`apps/web/README.md`](./apps/web/README.md)
- **Mobile App**: [`apps/mobile/README.md`](./apps/mobile/README.md)

### Package Development

```bash
# Shared utilities and types
cd packages/shared
pnpm dev  # Watch mode for TypeScript compilation

# Smart contracts (Cairo)
cd packages/contracts
pnpm build  # Build Cairo contracts
pnpm test   # Run contract tests

# UI components
cd packages/ui
pnpm dev  # Watch mode for component development
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

## � Troubleshooting

### Common Issues

#### Installation Problems

```bash
# Clear all caches and reinstall
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Mobile App Issues

- **Metro bundler fails**: Clear Expo cache with `expo start -c`
- **Starknet connection**: Ensure testnet network and wallet compatibility
- **Audio permissions**: Check device microphone permissions

#### Web App Issues

- **Build failures**: Check Node.js version (18+) and clear Next.js cache
- **Wallet connection**: Ensure browser wallet extension is installed and unlocked

#### Package Issues

- **Workspace dependencies**: Run `pnpm install` from project root
- **Type errors**: Ensure all packages are built with `pnpm build`

### Getting Help

1. **Check existing issues**: [GitHub Issues](https://github.com/thisyearnofear/VOISSS/issues)
2. **Hackathon support**: [Telegram Group](https://t.me/+jG3_jEJF8YFmOTY1)
3. **Starknet resources**: [Starknet Documentation](https://docs.starknet.io/)

## �📚 Resources & Documentation

### Starknet Development

- [Starknet.dart Documentation](https://starknetdart.dev/) - Mobile blockchain integration
- [Starknet.js Documentation](https://starknetjs.com/) - Web blockchain integration
- [Cairo Book](https://book.cairo-lang.org/) - Smart contract development
- [Starknet Foundry](https://foundry-rs.github.io/starknet-foundry/) - Testing framework

### Framework Documentation

- [Next.js Documentation](https://nextjs.org/docs) - Web framework
- [Expo Documentation](https://docs.expo.dev/) - Mobile framework
- [React Native Documentation](https://reactnative.dev/docs/getting-started) - Mobile development

### Example Projects

- [Mobile Wallet Example](https://starknetdart.dev/examples/mobile-wallet) - Starknet.dart integration
- [Starknet Counter Example](https://starknetdart.dev/examples/starknet-counter) - Basic contract interaction
- [Demo dApp Starknet](https://github.com/argentlabs/demo-dapp-starknet) - Web dApp example

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

**🎤 Ready to Re{ignite} the future of voice recording on Starknet?**

Join us in building the next generation of decentralized audio platforms! ✨
