// Mock wallet connector service for mobile app
export const walletConnectorService = {
  connectWallet: async (connectorType: string) => {
    console.log(`Connecting wallet with ${connectorType}`);
    // Mock implementation
    return {
      address: '0x1234567890123456789012345678901234567890',
      chainId: 1,
    };
  },
  
  disconnectWallet: async () => {
    console.log('Disconnecting wallet');
    // Mock implementation
    return true;
  },
  
  getAvailableWallets: () => {
    return [
      { id: 'metamask', name: 'MetaMask', icon: 'metamask' },
      { id: 'rainbow', name: 'Rainbow', icon: 'rainbow' },
      { id: 'trust', name: 'Trust Wallet', icon: 'trust' },
      { id: 'coinbase', name: 'Coinbase Wallet', icon: 'coinbase' },
    ];
  },
  
  isWalletInstalled: (walletId: string) => {
    // Mock implementation
    return true;
  },
  
  switchChain: async (chainId: number) => {
    console.log(`Switching to chain ${chainId}`);
    // Mock implementation
    return true;
  },
};