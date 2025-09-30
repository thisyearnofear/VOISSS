# VOISSS Development Roadmap

## 🎯 Vision

Transform VOISSS into a comprehensive AI-powered voice platform where users record high-quality audio, transform it with professional AI voices, complete SocialFi missions for STRK rewards, and participate in a creator economy built on Starknet.

## 🚀 Current State: RevenueCat Shipaton 2025 Submission

**Live Platform**: https://voisss.netlify.app/
**Hackathon Deadline**: October 1, 2025 @ 9:45am GMT+3 (~22 hours)

### ✅ What's Working
- **AI Voice Transformation**: ElevenLabs professional integration (Web)
- **Freemium Business Model**: Proven conversion funnel with wallet-gated premium
- **Mobile-Optimized**: Primary audience properly served
- **Secure Architecture**: Server-side API key management
- **Starknet Integration**: Smart contracts deployed and working
- **Three-App Ecosystem**: Web, React Native, and Flutter apps
- **Shared Package**: Foundation for cross-platform logic

### 🚧 In Progress (Hackathon Sprint)
- **RevenueCat SDK Integration**: Currently implementing for React Native
- **Subscription Flow**: Building dual-path monetization (Subscription + Web3)
- **Feature Gating**: Implementing tier logic (Free/Premium/Web3/Ultimate)
- **App Store Submission**: Preparing for iOS/Android deployment

## 🏗️ Ecosystem Architecture: Strategic Platform Differentiation

### Core Philosophy: "Shared Core, Optimized Experience"

Rather than forcing 100% feature parity across platforms, VOISSS follows a **"Core + Context"** strategy where each platform serves its optimal use case while sharing foundational logic.

```
┌─────────────────────────────────────────┐
│      @voisss/shared (Core - 100%)       │
│  - Mission Service                      │
│  - Starknet Contracts & Services        │
│  - IPFS Storage Service                 │
│  - Data Models & Types                  │
│  - Business Logic & Validation          │
│  - Recording Pipeline                   │
└─────────────────────────────────────────┘
                    ▲
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼─────┐ ┌──▼──────┐ ┌──▼──────────┐
│   Web App   │ │ RN App  │ │ Flutter App │
│  "Studio"   │ │"Social+"│ │"Lightweight"│
│             │ │         │ │             │
│ Full AI     │ │ Quick   │ │ Core Only   │
│ Suite       │ │ Capture │ │ Recording   │
│ Advanced    │ │ Social  │ │ Basic IPFS  │
│ Features    │ │ Features│ │ Missions    │
└─────────────┘ └─────────┘ └─────────────┘
```

### Platform Roles

#### **Web App: "Creation Studio"** 🎨
**Target User:** Desktop/laptop users with time for complex workflows
**Core Strengths:**
- Full AI dubbing suite (29+ languages)
- Advanced voice transformation
- Detailed mission board with filtering
- Analytics and insights
- Long-form content creation
- Professional editing tools

#### **Mobile React Native: "Quick Capture + Social"** 📱
**Target User:** On-the-go recording, social engagement
**Core Strengths:**
- Fast recording (primary use case)
- Location-based mission quick-accept
- Social discovery (trending, communities, leaderboard)
- Basic AI voice transformation (3-5 popular voices)
- Simplified dubbing (top 5 languages)
- Offline-first architecture

#### **Mobile Flutter: "Lightweight Recorder"** 🪶
**Target User:** Emerging markets, performance-focused users
**Core Strengths:**
- Core recording functionality
- Mission completion
- Basic IPFS storage
- Minimal app size
- Fast performance
- Essential features only

## 🚀 Current State: Production Ready + Strategic Consolidation

**Live Platform**: https://voisss.netlify.app/

### ✅ What's Working
- **AI Voice Transformation**: ElevenLabs professional integration (Web)
- **Freemium Business Model**: Proven conversion funnel with wallet-gated premium
- **Mobile-Optimized**: Primary audience properly served
- **Secure Architecture**: Server-side API key management
- **Starknet Integration**: Smart contracts deployed and working
- **Three-App Ecosystem**: Web, React Native, and Flutter apps
- **Shared Package**: Foundation for cross-platform logic

### ⚠️ What Needs Consolidation
- **Duplicate Logic**: Mission service exists in web, needs extraction to shared
- **Inconsistent Types**: Recording types vary across platforms
- **Mock Data**: React Native discover tab uses mock data instead of real services
- **Incomplete Sync**: Flutter has sync architecture but not fully implemented
- **Feature Gaps**: Mobile apps lag behind web in core functionality

## 💰 Business Model: Dual-Path Monetization (Subscription + Web3)

### Free Tier (No Account Required)
- 1 AI voice transformation per session
- 3 curated voice options (Web only, mobile gets 1)
- Preview and download capabilities
- High-quality recording features (all platforms)

### Premium Subscription Tier (RevenueCat)
- **Monthly/Annual Subscriptions**: $4.99/month or $39.99/year
- Unlimited AI transformations (Web: full suite, Mobile: basic)
- Full voice library access (Web: 50+ voices, Mobile: 10 voices)
- Cloud storage and cross-platform sync
- Priority processing and support
- **Optional**: Connect wallet for Web3 features

### Web3 Wallet Tier (Starknet Integration)
- **Free wallet connection** (no subscription required)
- Permanent storage on IPFS + Starknet (all platforms)
- SocialFi mission rewards (STRK tokens)
- NFT minting capabilities (Web only initially)
- Governance participation
- **Limited AI usage**: 5 transformations per day (Web only)

### Ultimate Tier (Subscription + Wallet Connected)
- **Best of both worlds**: All Premium + All Web3 features
- Unlimited AI transformations + STRK rewards
- Cloud storage + Permanent blockchain storage
- Priority support + Governance rights
- **Premium pricing for Web3 users**: $3.99/month (20% discount)

## 🗺️ Development Phases

### Phase 0: Foundation Consolidation 🚀 CURRENT PRIORITY
**Timeline**: 2 weeks
**Goal**: Extract web features to shared package, establish single source of truth

#### Core Principles Applied
- **ENHANCEMENT FIRST**: Consolidate existing mission service from web to shared
- **AGGRESSIVE CONSOLIDATION**: Delete duplicate code, standardize types
- **PREVENT BLOAT**: Audit before adding new features
- **DRY**: Single source of truth for all shared logic

#### Technical Tasks

**Week 1: Shared Package Enhancement**
1. **Extract Mission Service** (2 days)
   - Move [`mission-service.ts`](packages/shared/src/services/mission-service.ts) implementation from web to shared
   - Create [`persistent-mission-service.ts`](packages/shared/src/services/persistent-mission-service.ts) wrapper
   - Update web to consume from shared package
   - Delete duplicate code from web

2. **Standardize Data Models** (2 days)
   - Audit [`VoiceRecording`](packages/shared/src/types.ts) type across all platforms
   - Consolidate into single definition in shared
   - Update all platforms to use shared types
   - Remove platform-specific type definitions

3. **Extract AI Services** (1 day)
   - Move ElevenLabs service interfaces to shared
   - Create platform-agnostic AI service contracts
   - Prepare for mobile implementation

**Week 2: Mobile React Native Core Features**
4. **Starknet Integration** (2 days)
   - Implement full wallet connection flow
   - Add on-chain recording storage using shared service
   - Test transaction flow end-to-end

5. **IPFS Storage** (2 days)
   - Integrate shared IPFS service
   - Implement recording pipeline (convert → upload → store)
   - Add progress tracking UI

6. **Mission System Foundation** (1 day)
   - Replace mock discover data with real mission service
   - Implement mission acceptance flow
   - Connect to shared mission service

### Phase 1: Mobile React Native Feature Parity 📱
**Timeline**: 3 weeks (Weeks 3-5)
**Goal**: Bring React Native to strategic feature parity with web

#### Week 3: AI Features (Basic)
- **Voice Transformation** (3 days)
  - Integrate ElevenLabs with 3-5 popular voices
  - Simple transformation UI (no advanced options)
  - Preview and download functionality

- **Basic Dubbing** (2 days)
  - Top 5 languages only (Spanish, French, German, Portuguese, Hindi)
  - Simplified language selector
  - Progress tracking

#### Week 4: Social Features
- **Mission Board** (3 days)
  - Full mission board UI with filtering
  - Location-based mission suggestions
  - Mission acceptance and recording flow

- **Discovery Feed** (2 days)
  - Trending recordings (real data)
  - Basic social interactions
  - Community features

#### Week 5: Polish & Optimization
- **Offline Support** (2 days)
  - Local-first architecture
  - Background sync queue
  - Conflict resolution

- **Performance** (2 days)
  - Optimize recording pipeline
  - Implement caching strategies
  - Reduce bundle size

- **Testing** (1 day)
  - E2E tests for critical flows
  - Cross-platform integration tests

### Phase 2: Flutter Core Implementation 🪶
**Timeline**: 3 weeks (Weeks 6-8)
**Goal**: Lightweight, performant core functionality

#### Week 6: Foundation
- **Complete Starknet Integration** (2 days)
  - On-chain recording storage
  - Transaction tracking
  - Wallet state management

- **IPFS Pipeline** (3 days)
  - Complete IPFS upload implementation
  - Recording conversion
  - Progress tracking UI

#### Week 7: Mission System
- **Mission Board UI** (3 days)
  - Simple mission list
  - Mission acceptance
  - Recording submission

- **Basic Features** (2 days)
  - Recording playback
  - Local storage
  - Settings screen

#### Week 8: Polish
- **Performance Optimization** (2 days)
  - Minimize app size
  - Optimize startup time
  - Efficient resource usage

- **Testing & Bug Fixes** (3 days)
  - Platform-specific testing
  - Bug fixes
  - Documentation

### Phase 3: Cross-Platform Sync & API Gateway 🔄
**Timeline**: 2 weeks (Weeks 9-10)
**Goal**: Unified experience with secure API access

#### Week 9: API Gateway
- **Backend Proxy** (3 days)
  - Create API gateway for ElevenLabs
  - Implement rate limiting
  - Add feature gating
  - Protect API keys

- **Authentication** (2 days)
  - Unified auth across platforms
  - JWT token management
  - Session handling

#### Week 10: Sync Implementation
- **Real-time Sync** (3 days)
  - IPFS + Starknet as source of truth
  - Conflict resolution
  - Background sync

- **Testing** (2 days)
  - Cross-platform sync testing
  - Edge case handling
  - Performance validation

### Phase 4: RevenueCat Integration 💰
**Timeline**: 1 week (Week 11)
**Goal**: Launch subscription model across all platforms

#### Dual-Path Implementation
- **RevenueCat SDK** (2 days)
  - Install and configure for all platforms
  - Subscription state management
  - Purchase flow implementation

- **Feature Gating** (2 days)
  - Update feature flags for subscription + wallet
  - Implement tier logic (Free/Premium/Web3/Ultimate)
  - Cross-tier incentives

- **Testing & Launch** (1 day)
  - End-to-end testing all tiers
  - App store submission
  - Launch monitoring

### Phase 5: Advanced Features (Post-Launch) 🚀
**Timeline**: Ongoing
**Goal**: Platform-specific enhancements based on usage data

#### Web Platform Enhancements
- Advanced AI features (voice cloning, batch processing)
- Professional editing tools
- Analytics dashboard
- API access for developers

#### Mobile Enhancements
- Enhanced social features
- Community challenges
- Leaderboard system
- Push notifications

#### Flutter Optimizations
- Further size reduction
- Emerging market features
- Offline-first improvements
- Performance tuning

## 🎯 Core Principles Implementation

### ENHANCEMENT FIRST ✅
- **Consolidate Before Adding**: Extract web features to shared before building mobile
- **Reuse Over Rebuild**: Mobile apps consume shared services, don't recreate
- **Progressive Enhancement**: Start with core, add platform-specific features based on data

### AGGRESSIVE CONSOLIDATION ✅
- **Delete Duplicate Code**: Remove platform-specific implementations when shared version exists
- **Standardize Types**: Single source of truth for all data models
- **Unified Services**: One mission service, one IPFS service, one Starknet service

### PREVENT BLOAT ✅
- **Audit Before Adding**: Review existing code before implementing new features
- **Platform-Appropriate Features**: Don't force web features onto mobile if they don't fit
- **Essential Features Only**: Focus on core value proposition per platform

### DRY (Don't Repeat Yourself) ✅
- **Shared Package First**: All business logic lives in [`@voisss/shared`](packages/shared)
- **Platform-Specific UI Only**: Platforms only implement UI and platform APIs
- **Single Source of Truth**: One implementation, consumed by all platforms

### CLEAN ✅
- **Clear Separation**: Business logic (shared) vs UI (platform-specific)
- **Explicit Dependencies**: Clear imports from shared package
- **Predictable Structure**: Consistent patterns across all platforms

### MODULAR ✅
- **Independent Modules**: Mission, IPFS, Starknet, AI services are separate
- **Composable Features**: Platforms pick which modules to include
- **Testable Units**: Each module can be tested independently

### PERFORMANT ✅
- **Lazy Loading**: Load features only when needed
- **Smart Caching**: Cache expensive operations (API calls, blockchain queries)
- **Adaptive Loading**: Different strategies per platform (web vs mobile)
- **Resource Optimization**: Minimize bundle size, optimize assets

### ORGANIZED ✅
- **Domain-Driven Design**: Code organized by domain (missions, recordings, ai)
- **Predictable File Structure**: Consistent naming and organization
- **Clear Module Boundaries**: Each domain has clear responsibilities

## 📊 Success Metrics

### Technical Metrics
- **Code Reuse**: >80% of business logic in shared package
- **Bundle Size**: Web <500KB, RN <10MB, Flutter <5MB
- **Performance**: <2s initial load, <100ms interaction response
- **Test Coverage**: >80% for shared package, >60% for platforms

### User Metrics
- **Conversion Rate**: Free → Premium (target: 5%)
- **Retention**: 30-day retention (target: 40%)
- **Engagement**: Daily active users (target: 1000 by Q2 2025)
- **Cross-Platform**: Users active on multiple platforms (target: 20%)

### Business Metrics
- **MRR**: Monthly recurring revenue from subscriptions
- **Web3 Adoption**: Wallet connection rate (target: 15%)
- **Ultimate Tier**: Subscription + Wallet users (target: 5%)
- **Mission Completion**: Active mission participants (target: 500)

## 🚀 Platform-Specific Advantages

### Web: Professional Creation Studio
- **Strength**: Complex workflows, advanced features
- **Target**: Content creators, professionals, power users
- **Monetization**: Premium subscriptions, API access

### Mobile RN: Social + Quick Capture
- **Strength**: On-the-go recording, social engagement
- **Target**: Casual users, social creators, mobile-first users
- **Monetization**: Freemium subscriptions, in-app purchases

### Flutter: Lightweight Performance
- **Strength**: Small size, fast performance, emerging markets
- **Target**: Resource-conscious users, developing markets
- **Monetization**: Basic subscriptions, Web3 rewards

## 🔮 Long-term Vision (12+ months)

### Unified Ecosystem
- **Cross-Platform Sync**: Seamless experience across all devices
- **Shared Rewards**: STRK tokens earned on any platform
- **Unified Identity**: Single account across web and mobile

### Platform Evolution
- **Web**: Professional studio with advanced AI tools
- **Mobile**: Social platform with creator economy
- **Flutter**: Lightweight recorder for global accessibility

### Community Growth
- **Creator Economy**: Multiple revenue streams for creators
- **Global Community**: Worldwide network of voice creators
- **Decentralized Governance**: Community-driven platform decisions

---

**Current Milestone**: Complete Phase 0 (Foundation Consolidation) by Week 2, then proceed with strategic platform differentiation.

**Next Review**: After Phase 0 completion, assess mobile feature priorities based on user feedback and usage data.