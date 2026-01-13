// Web3 formatters for mobile app
export const Web3Formatters = {
  formatAddress: (address: string, chars = 4): string => {
    if (!address) return '';
    return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
  },
  
  formatBalance: (balance: string, decimals = 18, symbol = 'ETH'): string => {
    if (!balance) return '0 ' + symbol;
    // Convert from wei to ether
    const ethBalance = Number(balance) / 10 ** decimals;
    return `${ethBalance.toFixed(4)} ${symbol}`;
  },
  
  formatChainName: (chainId: number): string => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 11155111: return 'Sepolia';
      case 80001: return 'Polygon Mumbai';
      case 137: return 'Polygon';
      case 42161: return 'Arbitrum';
      case 10: return 'Optimism';
      default: return `Chain ${chainId}`;
    }
  },
  
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
  
  truncateMiddle: (str: string, startChars = 4, endChars = 4): string => {
    if (!str) return '';
    if (str.length <= startChars + endChars) return str;
    return `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`;
  },
};