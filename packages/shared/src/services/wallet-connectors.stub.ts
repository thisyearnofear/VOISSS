/**
 * Stub for wallet-connectors
 * This prevents wagmi and other web-only dependencies from being bundled
 * in React Native builds
 */

export class WalletConnectorService {
  constructor(config: any) {
    throw new Error('WalletConnectorService is not available in React Native. Use web-specific imports instead.');
  }

  getConnectors() {
    throw new Error('WalletConnectorService is not available in React Native.');
  }

  getEnvironmentInfo() {
    throw new Error('WalletConnectorService is not available in React Native.');
  }
}

export function createWalletConnectorService(config: any): WalletConnectorService {
  throw new Error('WalletConnectorService is not available in React Native.');
}

export function getWalletConnectorService() {
  throw new Error('WalletConnectorService is not available in React Native.');
}

export function initializeWalletConnectors() {
  throw new Error('WalletConnectorService is not available in React Native.');
}

export function getWalletConnectors() {
  throw new Error('WalletConnectorService is not available in React Native.');
}

export interface WalletConnectorConfig {}
