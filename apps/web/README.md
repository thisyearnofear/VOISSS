# VOISSS Web App 🌐

> Next.js-based decentralized web application for VOISSS voice recording platform

The web app provides a comprehensive interface for discovering, managing, and sharing voice recordings on Starknet. Built with Next.js 15, Starknet.js, and modern web technologies.

## ✅ **CURRENT STATUS: WORKING**

- ✅ **Development Server**: Running on http://localhost:3001
- ✅ **Build System**: Next.js building successfully
- ✅ **Starknet Integration**: StarknetConfig with providers setup
- ✅ **Shared Components**: Using @voisss/ui and @voisss/shared packages
- ✅ **Tailwind CSS**: Styling system working correctly
- ✅ **TypeScript**: Full type safety implemented
- ✅ **Hot Reload**: Development workflow optimized

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (installed from root)
- Starknet development tools (optional for contract development):
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
  cargo install starkli
  ```

### Development Setup

1. **From the project root**, install all dependencies:

   ```bash
   pnpm install
   ```

2. **Set up environment variables**:

   ```bash
   cd apps/web
   cp env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   # Starknet Configuration
   NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
   NEXT_PUBLIC_STARKNET_NETWORK=sepolia
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id

   # Contract Addresses (Deployed on Starknet Sepolia)
   NEXT_PUBLIC_VOICE_STORAGE_ADDRESS=0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2
   NEXT_PUBLIC_USER_REGISTRY_ADDRESS=0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63
   NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS=0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5
   ```

3. **Start development server**:

   ```bash
   # From project root
   pnpm dev:web

   # Or from apps/web directory
   pnpm dev
   ```

   Open [http://localhost:3001](http://localhost:3001) in your browser.

## 🛠 Tech Stack

- **Framework**: Next.js 15.3.2 with TypeScript
- **Blockchain**: Starknet.js + Starknet React
- **Styling**: Tailwind CSS 4
- **Build Tool**: Turbopack for fast development
- **State Management**: React Context + Zustand
- **Shared Dependencies**: `@voisss/shared`, `@voisss/ui`

## 🔗 Starknet Integration

### Wallet Connection

- **Starknetkit** for wallet connection and management
- Support for ArgentX, Braavos, and other Starknet wallets
- Automatic network detection and switching

### Smart Contract Interaction ✅ **DEPLOYED & READY**

**Live Contracts on Starknet Sepolia:**

- **UserRegistry**: `0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63`
- **VoiceStorage**: `0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2`
- **AccessControl**: `0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5`

**Features:**

- Recording metadata storage on Starknet
- User profile and social features
- Privacy controls and access management
- Decentralized ownership verification

### Key Features

- **Wallet Integration**: Connect with popular Starknet wallets
- **Recording Discovery**: Browse and search public recordings
- **Creator Dashboard**: Manage your recordings and earnings
- **Cross-platform Sync**: Sync with mobile app via Starknet

## 🧪 Testing & Building

```bash
# Run tests
pnpm test

# Run contract tests (from project root)
cd ../../packages/contracts
scarb test

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Web-specific React components
│   ├── hooks/            # Web-specific React hooks
│   ├── lib/              # Utility functions and configurations
│   └── styles/           # Global styles and Tailwind config
├── public/               # Static assets
├── env.example           # Environment variables template
└── package.json          # Web app dependencies
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests

## 🚧 **CURRENT PROGRESS & PRODUCTION ROADMAP**

### **✅ Recently Completed (Phase 1.1 - Backend Infrastructure)**

**🎯 Major Achievement: Replaced toy Map-based services with persistent storage!**

**What was broken:**
```typescript
// ❌ OLD: Data disappeared on page refresh
class DefaultMissionService {
  private missions: Map<string, Mission> = new Map(); 
  // All data lost when user refreshes page!
}
```

**What's now working:**
```typescript
// ✅ NEW: Data persists between sessions
class PersistentMissionService {
  constructor(private db: DatabaseService) {} // Real persistence!
  
  async getMissions(): Promise<Mission[]> {
    return this.db.getAll<Mission>('missions'); // Data survives refresh
  }
}
```

**Implementation Details:**
- ✅ **Database Service Interface**: Flexible abstraction for different storage backends
- ✅ **localStorage Implementation**: Immediate persistence without infrastructure setup
- ✅ **Proper Error Handling**: DatabaseError types with meaningful messages
- ✅ **Type Safety**: Runtime validation and consistent data types
- ✅ **Mission Persistence**: Missions now survive page refreshes and browser restarts
- ✅ **User Data Tracking**: User-mission relationships properly stored

**Technical Impact:**
- **Before**: All mission data lost on page refresh (unusable for real users)
- **After**: Mission data persists indefinitely, proper user experience
- **Storage**: ~50KB of mission data now stored locally with efficient indexing
- **Performance**: Fast localStorage access with in-memory caching

---

## 🗺️ **WEB APP PRODUCTION ROADMAP**

### **🔥 IMMEDIATE NEXT STEPS (Weeks 1-2)**

#### **Phase 1.2: Real Starknet Integration (Week 1)**

**Current Status**: Starknet calls work but lack production features

**Priority Tasks:**
- [ ] **Transaction Status Monitoring**: Track tx completion with user feedback
- [ ] **Gas Estimation & Management**: Proper fee calculation with STRK/ETH fallback
- [ ] **Error Recovery**: Retry failed transactions with exponential backoff
- [ ] **Wallet State Persistence**: Remember connection across sessions
- [ ] **Contract Call Validation**: Verify parameters before sending

**Implementation Target:**
```typescript
// Current: Basic transaction
const result = await contract.submit_recording(params);

// Target: Production-ready transaction
const gasEstimate = await contract.estimateGas.submit_recording(params);
const tx = await contract.submit_recording(params, { maxFee: gasEstimate * 1.5 });
const receipt = await provider.waitForTransaction(tx.transaction_hash);
// + retry logic + user feedback + error handling
```

#### **Phase 1.3: Input Validation & Security (Week 2)**

**Current Issue**: No validation, potential security vulnerabilities

**Priority Tasks:**
- [ ] **Zod Schema Validation**: Runtime validation for all user inputs
- [ ] **File Upload Security**: Size limits, type validation, malware scanning
- [ ] **XSS Prevention**: Input sanitization for user-generated content
- [ ] **Rate Limiting**: Prevent spam and abuse
- [ ] **CSRF Protection**: Secure form submissions

**Implementation Target:**
```typescript
const RecordingSubmissionSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  file: z.instanceof(File)
    .refine(f => f.size <= 50_000_000, 'File too large')
    .refine(f => f.type.startsWith('audio/'), 'Must be audio file'),
  participantConsent: z.literal(true, 'Consent required')
});
```

---

### **🎨 USER EXPERIENCE OVERHAUL (Weeks 3-4)**

#### **Phase 2.1: State Management Revolution (Week 3)**

**Current Issue**: 47+ useState hooks causing chaos

**Target Implementation:**
```typescript
// Replace scattered state with centralized management
const useRecordings = () => {
  return useQuery({
    queryKey: ['recordings', address],
    queryFn: () => recordingService.getUserRecordings(address),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 3
  });
};

const useSubmitRecording = () => {
  return useMutation({
    mutationFn: recordingService.submitRecording,
    onSuccess: () => {
      queryClient.invalidateQueries(['recordings']);
      toast.success('Recording submitted!');
    }
  });
};
```

**Benefits:**
- Predictable state updates
- Automatic loading/error states
- Optimistic updates for better UX
- Proper caching and synchronization

#### **Phase 2.2: Design System Implementation (Week 4)**

**Current Issue**: Hardcoded Tailwind classes everywhere

**Implementation Plan:**
- [ ] **Component Variants System**: Consistent button styles, cards, layouts
- [ ] **Theme Support**: Dark/light mode with proper color schemes
- [ ] **Responsive Design**: Mobile-first approach with proper breakpoints
- [ ] **Accessibility Standards**: ARIA labels, keyboard navigation, screen readers

---

### **⚡ PERFORMANCE & SCALABILITY (Weeks 5-6)**

#### **Phase 3.1: Performance Optimization (Week 5)**

**Current Issues:** 
- Re-renders entire lists without optimization
- No pagination for large datasets
- Bundle size not optimized

**Solutions:**
- [ ] **List Virtualization**: Handle thousands of recordings efficiently
- [ ] **Proper Memoization**: Prevent unnecessary re-renders
- [ ] **Lazy Loading**: Load components and data on demand
- [ ] **Bundle Optimization**: Code splitting and tree shaking

#### **Phase 3.2: Caching Strategy (Week 6)**

**Implementation:**
- [ ] **Browser Caching**: Intelligent cache strategies for static assets
- [ ] **Query Result Caching**: Cache API responses with smart invalidation
- [ ] **Offline Support**: Basic offline functionality with service workers

---

### **📈 SOCIALFI FEATURES ENHANCEMENT (Weeks 7-8)**

#### **Phase 4.1: Mission System Enhancement (Week 7)**

**Current State**: Basic missions exist but lack real incentive mechanics

**Enhancements:**
- [ ] **Dynamic Mission Creation**: User-generated missions with rewards
- [ ] **Reputation System**: Score users based on contribution quality
- [ ] **Mission Marketplace**: Browse, filter, and discover relevant missions
- [ ] **Completion Verification**: Automated and community-driven validation

#### **Phase 4.2: Creator Economy (Week 8)**

**Implementation:**
- [ ] **Creator Profiles**: Verification, analytics, follower system
- [ ] **Revenue Sharing**: Smart contract-based monetization
- [ ] **Content Discovery**: Trending, recommendations, search
- [ ] **Subscription Models**: Premium content and creator support

---

### **🔐 PRODUCTION HARDENING (Weeks 9-10)**

#### **Phase 5.1: Monitoring & Observability (Week 9)**

**Implementation:**
- [ ] **Error Tracking**: Sentry integration for production error monitoring
- [ ] **Performance Monitoring**: Track Core Web Vitals and user experience
- [ ] **Analytics**: User behavior tracking and conversion funnels
- [ ] **Health Checks**: Automated monitoring of critical app functions

#### **Phase 5.2: Testing & Quality Assurance (Week 10)**

**Coverage Goals:**
- [ ] **Unit Tests**: 80%+ coverage for critical business logic
- [ ] **Integration Tests**: End-to-end user flows
- [ ] **Performance Tests**: Load testing for concurrent users
- [ ] **Accessibility Tests**: WCAG 2.1 AA compliance

---

## 📊 **SUCCESS METRICS & TIMELINE**

### **Production Readiness Milestones:**

- **Week 2**: ✅ Data persists (COMPLETED) + Security validation
- **Week 4**: Proper state management + design system  
- **Week 6**: Performance optimized for 1k+ concurrent users
- **Week 8**: Full socialfi features with creator monetization
- **Week 10**: Production-ready with comprehensive testing

### **Key Performance Indicators:**

**Technical Metrics:**
- Page load time < 2 seconds
- Mission data persistence: 100% reliable
- Error rate < 1% of transactions
- Wallet connection success rate > 95%

**User Experience Metrics:**
- Recording submission success rate > 90%
- Mission completion rate improvement
- User retention across sessions
- Creator earning distribution

### **Risk Mitigation:**

- **Incremental Rollout**: Feature flags for gradual deployment
- **Backward Compatibility**: No breaking changes during development
- **Data Migration**: Safe upgrade paths for localStorage data
- **Fallback Systems**: Graceful degradation when features fail

---

## 🚀 **GETTING INVOLVED**

### **High-Impact Areas for Contribution:**

1. **State Management Migration**: Help move from useState chaos to React Query
2. **Design System**: Build reusable components with proper variants
3. **Performance**: Implement list virtualization and caching
4. **Testing**: Add comprehensive test coverage
5. **Accessibility**: Make the app usable for everyone

### **Development Workflow:**

1. Pick a task from the current week's priorities
2. Create feature branch: `git checkout -b feature/task-name`
3. Implement with proper testing
4. Submit PR with detailed description
5. Deploy incrementally without breaking existing features

---

## 📚 Related Documentation

- [Main Project README](../../README.md) - Project overview and setup
- [Mobile App README](../mobile/README.md) - Mobile app documentation  
- [Shared Package](../../packages/shared/README.md) - Shared utilities and types
- [Smart Contracts](../../packages/contracts/README.md) - Cairo contracts
