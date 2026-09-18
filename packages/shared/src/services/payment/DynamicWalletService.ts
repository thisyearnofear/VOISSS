/**
 * DynamicWalletService — Agentic Wallet / Payment Experience
 *
 * Runtime track: Dynamic — Best Agentic Wallet or Payment Experience
 * Docs: https://www.dynamic.xyz/docs/overview/agents/overview
 *       https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview
 *       https://www.dynamic.xyz/docs/overview/agents/agent-payments
 *
 * Pattern used: Server wallets (backend-owned, API-token auth, MPC signing).
 *   - No Dynamic user / JWT needed — fully automated bots, cron, agent flows.
 *   - Node EVM SDK: @dynamic-labs-wallet/node-evm + @dynamic-labs-wallet/core
 *   - Only runs on Node.js 18+ (not edge). All vocalize routes are `nodejs`.
 *
 * Design: graceful degradation — the service compiles and runs even when the
 * native MPC package is not installed or env is not set. That lets the
 * codebase build on Netlify/Vercel and lets the Runtime demo fall back to a
 * viem EOA server wallet (DYNAMIC_WALLET_PRIVATE_KEY) until Dynamic dashboard
 * access is provisioned. When DYNAMIC_API_TOKEN + DYNAMIC_ENVIRONMENT_ID are
 * set AND the native package is installed, the MPC path is used.
 *
 * Storage note: SDK is stateless — createWalletAccount returns
 * walletMetadata + externalServerKeyShares. You must persist both yourself.
 * With backUpToDynamic:true, Dynamic holds the encrypted backup and you can
 * recover via recoverEncryptedBackupByWallet. This service abstracts that and
 * caches to postgres/redis when available, falling back to in-memory for dev.
 */

import { getAddress, isAddress } from 'viem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DynamicWalletScheme = 'TWO_OF_TWO' | 'TWO_OF_THREE';

export interface DynamicServerWalletMeta {
  accountAddress: `0x${string}`;
  // opaque Dynamic metadata — pass through to every sign / recover call
  walletMetadata: unknown;
  createdAt: string;
  environmentId: string;
}

export interface DynamicWalletServiceConfig {
  apiToken?: string;
  environmentId?: string;
  walletPassword?: string;
  scheme?: DynamicWalletScheme;
  enableMPCAccelerator?: boolean;
  /** Fallback EOA private key for hackathon/demo when MPC not yet provisioned */
  fallbackPrivateKey?: `0x${string}`;
}

export interface DynamicSignResult {
  address: `0x${string}`;
  signature?: string;
  signedTransaction?: string;
  method: 'mpc' | 'eoa-fallback';
}

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function env(name: string): string | undefined {
  try {
    return (process.env as Record<string, string | undefined>)[name];
  } catch {
    return undefined;
  }
}

function resolveConfig(overrides: Partial<DynamicWalletServiceConfig> = {}): DynamicWalletServiceConfig {
  return {
    apiToken: overrides.apiToken ?? env('DYNAMIC_API_TOKEN') ?? env('DYNAMIC_AUTH_TOKEN'),
    environmentId: overrides.environmentId ?? env('DYNAMIC_ENVIRONMENT_ID'),
    walletPassword: overrides.walletPassword ?? env('DYNAMIC_WALLET_PASSWORD') ?? env('WALLET_PASSWORD'),
    scheme: overrides.scheme ?? 'TWO_OF_TWO',
    enableMPCAccelerator: overrides.enableMPCAccelerator ?? false,
    fallbackPrivateKey: overrides.fallbackPrivateKey ?? (env('DYNAMIC_WALLET_PRIVATE_KEY') as `0x${string}` | undefined),
  };
}

export function isDynamicConfigured(config?: Partial<DynamicWalletServiceConfig>): boolean {
  const c = resolveConfig(config);
  // MPC path requires both; fallback EOA path requires private key
  const hasMPC = !!c.apiToken && !!c.environmentId;
  const hasFallback = !!c.fallbackPrivateKey && /^0x[0-9a-fA-F]{64}$/.test(c.fallbackPrivateKey);
  return hasMPC || hasFallback;
}

export function getDynamicConfigStatus() {
  const c = resolveConfig();
  const hasMPC = !!c.apiToken && !!c.environmentId;
  const hasFallback = !!c.fallbackPrivateKey && /^0x[0-9a-fA-F]{64}$/.test(c.fallbackPrivateKey);
  return {
    configured: hasMPC || hasFallback,
    mode: hasMPC ? ('mpc' as const) : hasFallback ? ('eoa-fallback' as const) : ('none' as const),
    hasApiToken: !!c.apiToken,
    hasEnvironmentId: !!c.environmentId,
    hasPassword: !!c.walletPassword,
    hasFallbackKey: hasFallback,
    scheme: c.scheme,
  };
}

// ---------------------------------------------------------------------------
// In-memory wallet cache (dev) — replace with postgres/redis in prod
// In prod, persist walletMetadata + externalServerKeyShares to vault + DB
// per https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview
// ---------------------------------------------------------------------------

const walletMemoryCache = new Map<string, { meta: DynamicServerWalletMeta; shares?: unknown }>();

function cacheKey(agentAddress: string): string {
  return agentAddress.toLowerCase();
}

// ---------------------------------------------------------------------------
// Dynamic SDK lazy loader
// ---------------------------------------------------------------------------

type DynamicEvmWalletClientLike = {
  authenticateApiToken(token: string): Promise<void>;
  createWalletAccount(opts: Record<string, unknown>): Promise<{ walletMetadata: unknown; externalServerKeyShares?: unknown; rawPublicKey?: string; publicKeyHex?: string }>;
  signMessage(opts: Record<string, unknown>): Promise<string>;
  signTransaction(opts: Record<string, unknown>): Promise<string>;
  signTypedData(opts: Record<string, unknown>): Promise<string>;
  recoverEncryptedBackupByWallet(opts: Record<string, unknown>): Promise<{ externalServerKeyShares: unknown }>;
  getWalletClient(opts: Record<string, unknown>): Promise<unknown>;
};

let cachedEvmClient: DynamicEvmWalletClientLike | null = null;

async function getEvmClient(cfg: DynamicWalletServiceConfig): Promise<DynamicEvmWalletClientLike | null> {
  if (cachedEvmClient) return cachedEvmClient;
  if (!cfg.apiToken || !cfg.environmentId) return null;
  try {
    // Use new Function("return import(...)") so tsc / Next's ts checker and
    // webpack don't try to statically trace the optional native addon. At
    // runtime this only resolves if the package is actually installed.
    // Without the package we fall back to the viem EOA wallet.
    const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
    const mod: unknown = await dynamicImport('@dynamic-labs-wallet/node-evm').catch(() => null);
    if (!mod || typeof mod !== 'object' || !('DynamicEvmWalletClient' in mod)) return null;
    const { DynamicEvmWalletClient } = mod as { DynamicEvmWalletClient: new (opts: unknown) => DynamicEvmWalletClientLike };
    const client = new DynamicEvmWalletClient({
      environmentId: cfg.environmentId,
      enableMPCAccelerator: cfg.enableMPCAccelerator ?? false,
    });
    await client.authenticateApiToken(cfg.apiToken);
    cachedEvmClient = client;
    return client;
  } catch (e) {
    console.warn('[DynamicWalletService] EVM client not available (package not installed or native addon missing):', (e as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export class DynamicWalletService {
  private cfg: DynamicWalletServiceConfig;

  constructor(config: Partial<DynamicWalletServiceConfig> = {}) {
    this.cfg = resolveConfig(config);
  }

  /** Whether any wallet path (MPC or fallback) can be used */
  isConfigured(): boolean {
    return isDynamicConfigured(this.cfg);
  }

  /** Human-readable status for /api/agents/dynamic-wallet and diagnostics */
  getStatus() {
    return getDynamicConfigStatus();
  }

  /**
   * Get existing wallet for an agent, or create one.
   * Persists walletMetadata to memory cache (swap for DB/vault in prod).
   */
  async getOrCreateWallet(agentAddress: string): Promise<DynamicServerWalletMeta | null> {
    if (!isAddress(agentAddress)) throw new Error(`Invalid agent address: ${agentAddress}`);
    const key = cacheKey(agentAddress);
    const cached = walletMemoryCache.get(key);
    if (cached) return cached.meta;

    // Try MPC path
    const client = await getEvmClient(this.cfg);
    if (client) {
      try {
        const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
        const coreMod = await dynamicImport('@dynamic-labs-wallet/core').catch(() => ({ ThresholdSignatureScheme: { TWO_OF_TWO: 'TWO_OF_TWO' } as unknown as Record<string, unknown> })) as Record<string, unknown>;
        const { ThresholdSignatureScheme } = coreMod as unknown as { ThresholdSignatureScheme: Record<string, unknown> };
        const scheme = this.cfg.scheme === 'TWO_OF_THREE'
          ? (ThresholdSignatureScheme as unknown as Record<string, unknown>).TWO_OF_THREE ?? 'TWO_OF_THREE'
          : (ThresholdSignatureScheme as unknown as Record<string, unknown>).TWO_OF_TWO ?? 'TWO_OF_TWO';
        const created = await client.createWalletAccount({
          thresholdSignatureScheme: scheme,
          password: this.cfg.walletPassword,
          onError: (err: Error) => console.error('[DynamicWalletService] createWalletAccount error:', err),
          backUpToDynamic: true,
        });
        const meta = created.walletMetadata as { accountAddress?: string } | undefined;
        const addr = (meta?.accountAddress ?? '') as string;
        if (!isAddress(addr)) throw new Error('MPC wallet returned no accountAddress');
        const record: DynamicServerWalletMeta = {
          accountAddress: getAddress(addr),
          walletMetadata: created.walletMetadata,
          createdAt: new Date().toISOString(),
          environmentId: this.cfg.environmentId!,
        };
        walletMemoryCache.set(key, { meta: record, shares: created.externalServerKeyShares });
        console.log(`[DynamicWalletService] Created MPC server wallet ${record.accountAddress} for ${agentAddress}`);
        return record;
      } catch (e) {
        console.warn('[DynamicWalletService] MPC createWalletAccount failed, falling back:', (e as Error).message);
      }
    }

    // Fallback: deterministic EOA derived from DYNAMIC_WALLET_PRIVATE_KEY
    // For demo we return one global fallback wallet per agent — not per-agent derivation,
    // because the point is to have a working signing path before MPC onboarding.
    if (this.cfg.fallbackPrivateKey) {
      try {
        const { privateKeyToAccount } = await import('viem/accounts');
        const acct = privateKeyToAccount(this.cfg.fallbackPrivateKey);
        const record: DynamicServerWalletMeta = {
          accountAddress: acct.address,
          walletMetadata: { fallback: true, derivedFrom: 'DYNAMIC_WALLET_PRIVATE_KEY', agentAddress: getAddress(agentAddress) },
          createdAt: new Date().toISOString(),
          environmentId: this.cfg.environmentId ?? 'fallback',
        };
        walletMemoryCache.set(key, { meta: record });
        console.log(`[DynamicWalletService] Using EOA fallback wallet ${record.accountAddress} for ${agentAddress}`);
        return record;
      } catch (e) {
        console.error('[DynamicWalletService] Fallback wallet derivation failed:', (e as Error).message);
        return null;
      }
    }

    return null;
  }

  /** Lookup without creating */
  getWallet(agentAddress: string): DynamicServerWalletMeta | null {
    const hit = walletMemoryCache.get(cacheKey(agentAddress));
    return hit?.meta ?? null;
  }

  /**
   * Sign an EIP-712 TransferWithAuthorization payload for x402.
   * Used by PaymentRouter.processDynamicPayment — returns a signature
   * that can be placed in X-PAYMENT and verified by the CDP facilitator.
   *
   * For MPC wallets, this does a real MPC signTypedData. For fallback, signs
   * with the viem account so the x402 flow still works end-to-end in demo.
   */
  async signX402Authorization(opts: {
    agentAddress: string;
    typedData: { domain: unknown; types: unknown; primaryType: string; message: Record<string, unknown> };
  }): Promise<DynamicSignResult> {
    const meta = await this.getOrCreateWallet(opts.agentAddress);
    if (!meta) throw new Error('No Dynamic wallet available — set DYNAMIC_API_TOKEN + DYNAMIC_ENVIRONMENT_ID or DYNAMIC_WALLET_PRIVATE_KEY');

    // MPC path
    const client = await getEvmClient(this.cfg);
    if (client && !(meta.walletMetadata as Record<string, unknown>)?.fallback) {
      const cached = walletMemoryCache.get(cacheKey(opts.agentAddress));
      let shares = cached?.shares;
      if (!shares) {
        const recovered = await client.recoverEncryptedBackupByWallet({
          walletMetadata: meta.walletMetadata,
          password: this.cfg.walletPassword,
        }).catch(() => null);
        shares = recovered?.externalServerKeyShares ?? null;
      }
      const signature = await client.signTypedData({
        walletMetadata: meta.walletMetadata,
        externalServerKeyShares: shares,
        typedData: opts.typedData,
        password: this.cfg.walletPassword,
      });
      return { address: meta.accountAddress, signature, method: 'mpc' };
    }

    // Fallback EOA path — sign typed data with viem
    if (!this.cfg.fallbackPrivateKey) throw new Error('Fallback private key not configured');
    const { privateKeyToAccount } = await import('viem/accounts');
    const acct = privateKeyToAccount(this.cfg.fallbackPrivateKey);
    // The X402Client.createTypedData shape is already EIP-712; signTypedData expects flattened
    const sig = await acct.signTypedData(opts.typedData as unknown as Parameters<typeof acct.signTypedData>[0]);
    return { address: acct.address, signature: sig, method: 'eoa-fallback' };
  }

  /** Sign arbitrary message (used for agent verification / demos) */
  async signMessage(agentAddress: string, message: string): Promise<DynamicSignResult> {
    const meta = await this.getOrCreateWallet(agentAddress);
    if (!meta) throw new Error('No Dynamic wallet available');
    const client = await getEvmClient(this.cfg);
    if (client && !(meta.walletMetadata as Record<string, unknown>)?.fallback) {
      const cached = walletMemoryCache.get(cacheKey(agentAddress));
      let shares = cached?.shares;
      if (!shares) {
        const recovered = await client.recoverEncryptedBackupByWallet({
          walletMetadata: meta.walletMetadata,
          password: this.cfg.walletPassword,
        }).catch(() => null);
        shares = recovered?.externalServerKeyShares ?? null;
      }
      const signature = await client.signMessage({
        walletMetadata: meta.walletMetadata,
        externalServerKeyShares: shares,
        message,
        password: this.cfg.walletPassword,
      });
      return { address: meta.accountAddress, signature, method: 'mpc' };
    }
    if (!this.cfg.fallbackPrivateKey) throw new Error('Fallback private key not configured');
    const { privateKeyToAccount } = await import('viem/accounts');
    const acct = privateKeyToAccount(this.cfg.fallbackPrivateKey);
    const signature = await acct.signMessage({ message });
    return { address: acct.address, signature, method: 'eoa-fallback' };
  }

  /**
   * Get a viem WalletClient for the server wallet — for direct contract writes
   * (e.g. purchaseLicense on VoiceLicenseMarket). Only available when MPC client
   * is active; fallback path should use spender-wallet or direct viem client.
   */
  async getViemWalletClient(agentAddress: string, chainId: number, rpcUrl: string): Promise<unknown | null> {
    const meta = this.getWallet(agentAddress);
    if (!meta) return null;
    const client = await getEvmClient(this.cfg);
    if (!client || (meta.walletMetadata as Record<string, unknown>)?.fallback) return null;
    try {
      return await (client as unknown as { getWalletClient: (opts: unknown) => Promise<unknown> }).getWalletClient({
        accountAddress: meta.accountAddress,
        chainId,
        rpcUrl,
      });
    } catch {
      return null;
    }
  }

  /** For tests / reset */
  static clearCache(): void {
    walletMemoryCache.clear();
    cachedEvmClient = null;
  }
}

// Singleton
let singleton: DynamicWalletService | null = null;
export function getDynamicWalletService(config?: Partial<DynamicWalletServiceConfig>): DynamicWalletService {
  if (!singleton) singleton = new DynamicWalletService(config);
  return singleton;
}
export function createDynamicWalletService(config?: Partial<DynamicWalletServiceConfig>): DynamicWalletService {
  return new DynamicWalletService(config);
}
export function resetDynamicWalletService(): void {
  singleton = null;
  DynamicWalletService.clearCache();
}
