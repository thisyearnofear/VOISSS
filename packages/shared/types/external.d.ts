// Type declarations for external modules used in the shared package
// This resolves "Cannot find module" errors for wagmi, viem, and other dependencies

declare module 'wagmi/connectors' {
  import { type Connector } from 'wagmi';
  export { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';
}

declare module 'viem' {
  import { type Chain, type Transport, http } from 'viem';
  export { 
    createPublicClient, 
    createWalletClient,
    http,
    parseEther,
    formatEther,
    parseUnits,
    formatUnits,
    getContract,
    encodeFunctionData,
    keccak256,
    toHex,
    verifyMessage
  } from 'viem';
  export { base, mainnet } from 'viem/chains';
}

declare module 'wagmi' {
  import { type Chain } from 'viem';
  export { 
    createConfig,
    useAccount,
    useConnect,
    useDisconnect,
    useWalletClient
  } from 'wagmi';
  export { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';
}

declare module '@base-org/account' {
  export { 
    createBaseAccountSDK,
    requestSpendPermission,
    fetchPermissions,
    getPermissionStatus
  } from '@base-org/account';
}

declare module '@base-org/account/spend-permission/browser' {
  export { 
    requestSpendPermission,
    fetchPermissions,
    getPermissionStatus,
    getHash
  } from '@base-org/account/spend-permission/browser';
}