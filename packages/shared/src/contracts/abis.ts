// Contract ABIs for VOISSS platform
// These will be auto-generated from Cairo contracts in production

export const VoiceStorageABI = [
  {
    "type": "function",
    "name": "store_recording",
    "inputs": [
      {
        "name": "metadata",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [
      {
        "type": "core::integer::u256"
      }
    ],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "get_recording",
    "inputs": [
      {
        "name": "recording_id",
        "type": "core::integer::u256"
      }
    ],
    "outputs": [
      {
        "type": "Recording"
      }
    ],
    "state_mutability": "view"
  },
  {
    "type": "function",
    "name": "get_user_recordings",
    "inputs": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [
      {
        "type": "core::array::Array::<core::integer::u256>"
      }
    ],
    "state_mutability": "view"
  },
  {
    "type": "function",
    "name": "get_public_recordings",
    "inputs": [
      {
        "name": "offset",
        "type": "core::integer::u64"
      },
      {
        "name": "limit",
        "type": "core::integer::u64"
      }
    ],
    "outputs": [
      {
        "type": "core::array::Array::<core::integer::u256>"
      }
    ],
    "state_mutability": "view"
  },
  {
    "type": "function",
    "name": "increment_play_count",
    "inputs": [
      {
        "name": "recording_id",
        "type": "core::integer::u256"
      }
    ],
    "outputs": [],
    "state_mutability": "external"
  }
];

export const UserRegistryABI = [
  {
    "type": "function",
    "name": "register_user",
    "inputs": [
      {
        "name": "profile",
        "type": "ProfileUpdate"
      }
    ],
    "outputs": [
      {
        "type": "core::bool"
      }
    ],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "get_profile",
    "inputs": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [
      {
        "type": "UserProfile"
      }
    ],
    "state_mutability": "view"
  },
  {
    "type": "function",
    "name": "follow_user",
    "inputs": [
      {
        "name": "user_to_follow",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [
      {
        "type": "core::bool"
      }
    ],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "is_following",
    "inputs": [
      {
        "name": "follower",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "following",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [
      {
        "type": "core::bool"
      }
    ],
    "state_mutability": "view"
  }
];

export const AccessControlABI = [
  {
    "type": "function",
    "name": "grant_access",
    "inputs": [
      {
        "name": "recording_id",
        "type": "core::integer::u256"
      },
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "permission_type",
        "type": "core::integer::u8"
      },
      {
        "name": "expires_at",
        "type": "core::integer::u64"
      }
    ],
    "outputs": [
      {
        "type": "core::bool"
      }
    ],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "has_access",
    "inputs": [
      {
        "name": "recording_id",
        "type": "core::integer::u256"
      },
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "permission_type",
        "type": "core::integer::u8"
      }
    ],
    "outputs": [
      {
        "type": "core::bool"
      }
    ],
    "state_mutability": "view"
  },
  {
    "type": "function",
    "name": "create_share_link",
    "inputs": [
      {
        "name": "recording_id",
        "type": "core::integer::u256"
      },
      {
        "name": "expires_at",
        "type": "core::integer::u64"
      }
    ],
    "outputs": [
      {
        "type": "core::felt252"
      }
    ],
    "state_mutability": "external"
  }
];

// Contract addresses (will be populated after deployment)
export const CONTRACT_ADDRESSES = {
  VOICE_STORAGE: '',
  USER_REGISTRY: '',
  ACCESS_CONTROL: '',
};

// Network configuration
export const NETWORK_CONFIG = {
  testnet: {
    name: 'Starknet Sepolia',
    rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
    chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA
  },
  mainnet: {
    name: 'Starknet Mainnet',
    rpcUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
    chainId: '0x534e5f4d41494e', // SN_MAIN
  },
};
