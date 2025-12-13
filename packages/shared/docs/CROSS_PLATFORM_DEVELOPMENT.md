# Cross-Platform Development Guide

This guide provides best practices and patterns for developing cross-platform Web3 applications that work seamlessly across web and React Native environments.

## Core Principles

1. **ENHANCEMENT FIRST**: Extend existing patterns before creating new ones
2. **AGGRESSIVE CONSOLIDATION**: Remove redundant code and dependencies
3. **DRY (Don't Repeat Yourself)**: Single source of truth for shared logic
4. **CLEAN**: Clear separation of concerns with explicit dependencies
5. **MODULAR**: Composable, testable, independent modules
6. **PERFORMANT**: Optimized for both web and mobile environments
7. **ORGANIZED**: Consistent structure and naming conventions

## Cross-Platform Storage

### Problem
- Web uses `localStorage`
- Mobile uses `AsyncStorage`
- Different APIs, same purpose

### Solution: Unified Storage API

```typescript
import { crossPlatformStorage } from '@voisss/shared';

// Works on both platforms
await crossPlatformStorage.setItem('key', 'value');
const value = await crossPlatformStorage.getItem('key');
await crossPlatformStorage.removeItem('key');
```

### Implementation Details

**Service Layer** (`cross-platform-storage.ts`):
- Automatic environment detection
- Delegates to appropriate backend
- Unified interface

**Backends**:
- `localStorage-database.ts`: Web implementation
- `asyncStorage-database.ts`: Mobile implementation

**React Hooks** (`useCrossPlatformStorage.ts`):
- `useCrossPlatformStorage()`: Full API with status
- `useStorageState()`: Reactive state management
- `useJSONStorage()`: Automatic JSON serialization

### Migration Guide

**Before (Platform-Specific)**:
```typescript
// Web
localStorage.setItem('token', token);

// Mobile
await AsyncStorage.setItem('token', token);
```

**After (Unified)**:
```typescript
// Both platforms
await crossPlatformStorage.setItem('token', token);
```

## Wallet Connectors

### Problem
- Web: MetaMask, Coinbase Wallet, WalletConnect
- Mobile: WalletConnect only (deep linking)
- Different connector configurations

### Solution: Platform-Aware Connectors

```typescript
import { walletConnectorService } from '@voisss/shared';

// Initialize once at app startup
walletConnectorService.initializeWalletConnectors(chains, projectId);

// Get connectors for wagmi config
const connectors = walletConnectorService.getConnectors();

// Create wagmi config
const config = createConfig({
  chains,
  connectors,
  transports: { [chain.id]: http() }
});
```

### Features

- **Automatic Platform Detection**: Uses feature detection, not user agent
- **Web Connectors**: MetaMask, Coinbase Wallet, WalletConnect
- **Mobile Connectors**: WalletConnect with deep linking
- **Recommended Wallet**: Returns best wallet for current platform
- **Availability Checking**: Test if specific wallet is available

### Usage Patterns

**Basic Setup**:
```typescript
// Initialize in your app entry point
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
walletConnectorService.initializeWalletConnectors([base], projectId);

// Use in wagmi config
const config = createConfig({
  chains: [base],
  connectors: walletConnectorService.getConnectors(http()),
});
```

**Advanced Usage**:
```typescript
// Get recommended wallet
const { type, name, installUrl } = walletConnectorService.getRecommendedWallet();

// Check wallet availability
const hasMetaMask = walletConnectorService.isWalletAvailable('metamask');

// Get deep link URL (mobile only)
const deepLink = walletConnectorService.getWalletConnectionUrl('metamask');
```

## Web3 Utilities

### Problem
- Common Web3 operations scattered across codebase
- Inconsistent formatting and validation
- Platform-specific implementations

### Solution: Unified Web3 Utilities

```typescript
import { Web3StorageService, Web3Formatters, Web3Helpers } from '@voisss/shared';

// Storage operations
await Web3StorageService.storeSpendPermission(hash);
const permission = await Web3StorageService.getSpendPermissionHash();

// Formatting
const displayAmount = Web3Formatters.formatEthAmount(weiAmount);
const shortAddress = Web3Formatters.formatAddress(address);

// Validation
const isValid = Web3Helpers.isValidAddress(userInput);
```

### Available Utilities

**Storage Service**:
- `storeSpendPermission()` / `getSpendPermissionHash()`
- `storeLastConnectedWallet()` / `getLastConnectedWallet()`
- `storePreferredChain()` / `getPreferredChain()`
- `clearAllWeb3Storage()`

**Formatters**:
- `formatEthAmount()`: Format wei to ETH with proper decimals
- `formatEthWithSymbol()`: Format with currency symbol
- `formatAddress()`: Shorten address for display
- `formatTransactionHash()`: Shorten transaction hash

**Helpers**:
- `isValidAddress()`: Validate Ethereum address
- `isValidTransactionHash()`: Validate transaction hash
- `stringToHex()` / `hexToString()`: Conversion utilities
- `generateRandomHex()`: Generate random hex strings
- `getCurrentTimestamp()`: Get blockchain timestamp
- `formatRelativeTime()`: Format timestamps

**React Hooks**:
- `useWeb3Formatters()`: Access formatters in components
- `useWeb3Storage()`: Access storage in components

## Cross-Platform Patterns

### 1. Environment Detection

**Use Feature Detection, Not Platform Detection**:

```typescript
// ❌ Bad: Platform detection
if (Platform.OS === 'web') { /* ... */ }

// ✅ Good: Feature detection
if (typeof window !== 'undefined') { /* web-specific */ }
if (typeof global !== 'undefined' && global.__DEV__) { /* mobile-specific */ }
```

### 2. Service Abstraction

**Create Platform-Aware Services**:

```typescript
// Service interface
interface StorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

// Platform-specific implementations
class WebStorage implements StorageService { /* ... */ }
class MobileStorage implements StorageService { /* ... */ }

// Unified service
class CrossPlatformStorage implements StorageService {
  private service: StorageService;
  
  constructor() {
    this.service = isMobile() ? new MobileStorage() : new WebStorage();
  }
  
  // Delegate all methods
  async getItem(key: string) {
    return this.service.getItem(key);
  }
  
  async setItem(key: string, value: string) {
    return this.service.setItem(key, value);
  }
}
```

### 3. Dependency Management

**Standardize Package Versions**:

```json
// Use same versions across platforms
"viem": "^2.18.3",
"wagmi": "^2.18.1",
"@base-org/account": "^2.4.0"
```

**Remove Unused Dependencies**:

```bash
# Remove ethers.js since we use viem
pnpm remove ethers
```

### 4. Error Handling

**Graceful Degradation**:

```typescript
try {
  // Try modern API
  await crossPlatformStorage.setItem('key', 'value');
} catch (error) {
  console.warn('Modern API failed, falling back to legacy');
  // Fallback to legacy API
  if (typeof window !== 'undefined') {
    localStorage.setItem('key', 'value');
  }
}
```

### 5. Testing

**Test Both Platforms**:

```typescript
// Test storage operations
describe('CrossPlatformStorage', () => {
  it('should work on web', async () => {
    // Mock window.global for testing
    global.window = {} as any;
    
    const storage = new CrossPlatformStorage();
    await storage.setItem('test', 'value');
    const result = await storage.getItem('test');
    
    expect(result).toBe('value');
  });
  
  it('should work on mobile', async () => {
    // Mock React Native environment
    global.__DEV__ = true;
    
    const storage = new CrossPlatformStorage();
    await storage.setItem('test', 'value');
    const result = await storage.getItem('test');
    
    expect(result).toBe('value');
  });
});
```

## Migration Checklist

### Phase 1: Storage Migration
- [x] Create cross-platform storage service
- [x] Create AsyncStorage backend
- [x] Update web app to use cross-platform storage
- [x] Update mobile app to use cross-platform storage
- [x] Create React hooks for storage

### Phase 2: Wallet Connectors
- [x] Create platform-aware wallet connector service
- [x] Update web wagmi configuration
- [x] Update mobile wagmi configuration
- [x] Test wallet connections on both platforms

### Phase 3: Web3 Utilities
- [x] Create Web3 storage service
- [x] Create Web3 formatters
- [x] Create Web3 helpers
- [x] Create React hooks for Web3 operations

### Phase 4: Cleanup
- [ ] Remove unused dependencies (ethers.js)
- [ ] Standardize package versions
- [ ] Update documentation
- [ ] Add unit tests

## Best Practices

### 1. Progressive Enhancement

Start with basic functionality that works everywhere, then enhance:

```typescript
// Basic functionality (works everywhere)
function getWalletConnector() {
  return walletConnect({ projectId });
}

// Enhanced functionality (platform-specific)
function getEnhancedWalletConnectors() {
  const connectors = [getWalletConnector()];
  
  if (!isMobile()) {
    connectors.push(injected());
    connectors.push(coinbaseWallet());
  }
  
  return connectors;
}
```

### 2. Feature Flags

Use feature flags for platform-specific features:

```typescript
// Feature detection
const supportsWalletConnect = true;
const supportsInjectedWallets = !isMobile();

// Feature-flagged components
function WalletSelector() {
  if (supportsWalletConnect) {
    return <WalletConnectButton />;
  }
  
  if (supportsInjectedWallets) {
    return <InjectedWalletButton />;
  }
  
  return <NoWalletsAvailable />;
}
```

### 3. Performance Optimization

Optimize for both platforms:

```typescript
// Lazy load heavy dependencies
const { crossPlatformStorage } = await import('@voisss/shared');

// Cache frequently used data
const cachedStorage = {
  getItem: memoize(crossPlatformStorage.getItem, { max: 100 }),
  setItem: crossPlatformStorage.setItem,
};

// Batch operations
async function batchStore(items: Record<string, string>) {
  await Promise.all(
    Object.entries(items).map(([key, value]) => 
      crossPlatformStorage.setItem(key, value)
    )
  );
}
```

### 4. Type Safety

Use TypeScript for cross-platform safety:

```typescript
// Type-safe storage keys
type StorageKey = 'token' | 'user' | 'settings';

// Type-safe storage operations
async function getItem<T>(key: StorageKey): Promise<T | null> {
  const value = await crossPlatformStorage.getItem(key);
  return value ? JSON.parse(value) as T : null;
}

// Usage
const user = await getItem<User>('user');
```

## Troubleshooting

### Common Issues

**1. Module not found in React Native**:
```bash
# Install React Native compatible versions
pnpm add @react-native-async-storage/async-storage
```

**2. TypeScript errors in shared code**:
```typescript
// Use conditional types or platform-specific declarations
declare const process: {
  env: Record<string, string>;
};
```

**3. Wallet connection failures**:
```typescript
// Check WalletConnect project ID
if (!projectId) {
  throw new Error('WalletConnect project ID not configured');
}

// Verify chain configuration
if (!chains.length) {
  console.warn('No chains configured for WalletConnect');
}
```

### Debugging Tips

**Check Environment**:
```typescript
console.log('Environment:', {
  isMobile: walletConnectorService.getEnvironmentInfo().isMobile,
  platform: walletConnectorService.getEnvironmentInfo().platform,
  recommendedWallet: walletConnectorService.getEnvironmentInfo().recommendedWallet,
});
```

**Test Storage**:
```typescript
// Test storage operations
async function testStorage() {
  try {
    await crossPlatformStorage.setItem('test', 'value');
    const result = await crossPlatformStorage.getItem('test');
    console.log('Storage test:', { success: true, result });
    await crossPlatformStorage.removeItem('test');
  } catch (error) {
    console.error('Storage test failed:', error);
  }
}
```

**Verify Connectors**:
```typescript
// Check available connectors
const connectors = walletConnectorService.getConnectors();
console.log('Available connectors:', connectors.map(c => c.name));
```

## Resources

- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [Viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)
- [React Native AsyncStorage](https://github.com/react-native-async-storage/async-storage)

## Contributing

When adding new cross-platform features:

1. **Follow existing patterns** - Use the same structure as existing services
2. **Add tests** - Ensure both web and mobile scenarios are covered
3. **Update documentation** - Add examples and usage guidelines
4. **Maintain backward compatibility** - Don't break existing implementations
5. **Optimize for both platforms** - Consider performance implications

## License

This cross-platform development guide and associated code are licensed under the same terms as the main VOISSS project.