/**
 * VoiceLicenseMarket Contract ABI
 * Minimal marketplace for voice licensing
 */

export const VoiceLicenseMarketABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_usdc", "type": "address" },
      { "internalType": "address", "name": "_platformTreasury", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "licenseId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "voiceId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "licensee", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "isExclusive", "type": "bool" }
    ],
    "name": "LicensePurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "newFeeBps", "type": "uint256" }
    ],
    "name": "PlatformFeeUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "licenseId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "voiceId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "usageCount", "type": "uint256" }
    ],
    "name": "UsageReported",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "voiceId", "type": "uint256" }
    ],
    "name": "VoiceDelisted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "voiceId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "oldPrice", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "newPrice", "type": "uint256" }
    ],
    "name": "VoicePriceUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "voiceId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "contributor", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "isExclusive", "type": "bool" }
    ],
    "name": "VoiceListed",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "voiceId", "type": "uint256" }
    ],
    "name": "delistVoice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "exclusiveLicenses",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "licenseId", "type": "uint256" }
    ],
    "name": "getLicense",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "licensee", "type": "address" },
          { "internalType": "uint256", "name": "voiceId", "type": "uint256" },
          { "internalType": "bool", "name": "isExclusive", "type": "bool" },
          { "internalType": "uint256", "name": "purchasedAt", "type": "uint256" },
          { "internalType": "uint256", "name": "usageCount", "type": "uint256" },
          { "internalType": "bool", "name": "isActive", "type": "bool" }
        ],
        "internalType": "struct VoiceLicenseMarket.License",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "voiceId", "type": "uint256" }
    ],
    "name": "getListing",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "contributor", "type": "address" },
          { "internalType": "uint256", "name": "price", "type": "uint256" },
          { "internalType": "bool", "name": "isExclusive", "type": "bool" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "uint256", "name": "totalSales", "type": "uint256" },
          { "internalType": "uint256", "name": "totalUsage", "type": "uint256" }
        ],
        "internalType": "struct VoiceLicenseMarket.VoiceListing",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "voiceId", "type": "uint256" },
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getUserLicense",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "voiceId", "type": "uint256" },
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "hasActiveLicense",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "licenses",
    "outputs": [
      { "internalType": "address", "name": "licensee", "type": "address" },
      { "internalType": "uint256", "name": "voiceId", "type": "uint256" },
      { "internalType": "bool", "name": "isExclusive", "type": "bool" },
      { "internalType": "uint256", "name": "purchasedAt", "type": "uint256" },
      { "internalType": "uint256", "name": "usageCount", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "voiceId", "type": "uint256" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "bool", "name": "isExclusive", "type": "bool" }
    ],
    "name": "listVoice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "listings",
    "outputs": [
      { "internalType": "address", "name": "contributor", "type": "address" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "bool", "name": "isExclusive", "type": "bool" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      { "internalType": "uint256", "name": "totalSales", "type": "uint256" },
      { "internalType": "uint256", "name": "totalUsage", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextLicenseId",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFeeBps",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformTreasury",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "voiceId", "type": "uint256" }
    ],
    "name": "purchaseLicense",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "licenseId", "type": "uint256" },
      { "internalType": "uint256", "name": "usageCount", "type": "uint256" }
    ],
    "name": "reportUsage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "newFeeBps", "type": "uint256" }
    ],
    "name": "updatePlatformFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "voiceId", "type": "uint256" },
      { "internalType": "uint256", "name": "newPrice", "type": "uint256" }
    ],
    "name": "updateListingPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "newTreasury", "type": "address" }
    ],
    "name": "updatePlatformTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [
      { "internalType": "contract IERC20", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "userLicenses",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const VOICE_LICENSE_MARKET_ADDRESS = process.env.NEXT_PUBLIC_VOICE_LICENSE_MARKET_ADDRESS as `0x${string}` | undefined;
