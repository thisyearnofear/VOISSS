// Auto-generated ABIs from compiled contracts
// Generated on 2025-05-26T17:59:15.301Z

export const VOICE_STORAGE_ABI = [
  {
    "type": "impl",
    "name": "VoiceStorageImpl",
    "interface_name": "voisss_contracts::voice_storage::IVoiceStorage"
  },
  {
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "voisss_contracts::voice_storage::RecordingMetadata",
    "members": [
      {
        "name": "title",
        "type": "core::felt252"
      },
      {
        "name": "description",
        "type": "core::felt252"
      },
      {
        "name": "ipfs_hash",
        "type": "core::felt252"
      },
      {
        "name": "duration",
        "type": "core::integer::u64"
      },
      {
        "name": "file_size",
        "type": "core::integer::u64"
      },
      {
        "name": "is_public",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "voisss_contracts::voice_storage::Recording",
    "members": [
      {
        "name": "id",
        "type": "core::integer::u256"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "title",
        "type": "core::felt252"
      },
      {
        "name": "description",
        "type": "core::felt252"
      },
      {
        "name": "ipfs_hash",
        "type": "core::felt252"
      },
      {
        "name": "duration",
        "type": "core::integer::u64"
      },
      {
        "name": "file_size",
        "type": "core::integer::u64"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64"
      },
      {
        "name": "is_public",
        "type": "core::bool"
      },
      {
        "name": "play_count",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "type": "interface",
    "name": "voisss_contracts::voice_storage::IVoiceStorage",
    "items": [
      {
        "type": "function",
        "name": "store_recording",
        "inputs": [
          {
            "name": "metadata",
            "type": "voisss_contracts::voice_storage::RecordingMetadata"
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
            "type": "voisss_contracts::voice_storage::Recording"
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
        "name": "update_recording_metadata",
        "inputs": [
          {
            "name": "recording_id",
            "type": "core::integer::u256"
          },
          {
            "name": "metadata",
            "type": "voisss_contracts::voice_storage::RecordingMetadata"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "delete_recording",
        "inputs": [
          {
            "name": "recording_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
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
      },
      {
        "type": "function",
        "name": "get_total_recordings",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_user_recording_count",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::voice_storage::VoiceStorage::RecordingStored",
    "kind": "struct",
    "members": [
      {
        "name": "recording_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "title",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "ipfs_hash",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::voice_storage::VoiceStorage::RecordingUpdated",
    "kind": "struct",
    "members": [
      {
        "name": "recording_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::voice_storage::VoiceStorage::RecordingDeleted",
    "kind": "struct",
    "members": [
      {
        "name": "recording_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::voice_storage::VoiceStorage::PlayCountIncremented",
    "kind": "struct",
    "members": [
      {
        "name": "recording_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "new_count",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::voice_storage::VoiceStorage::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "RecordingStored",
        "type": "voisss_contracts::voice_storage::VoiceStorage::RecordingStored",
        "kind": "nested"
      },
      {
        "name": "RecordingUpdated",
        "type": "voisss_contracts::voice_storage::VoiceStorage::RecordingUpdated",
        "kind": "nested"
      },
      {
        "name": "RecordingDeleted",
        "type": "voisss_contracts::voice_storage::VoiceStorage::RecordingDeleted",
        "kind": "nested"
      },
      {
        "name": "PlayCountIncremented",
        "type": "voisss_contracts::voice_storage::VoiceStorage::PlayCountIncremented",
        "kind": "nested"
      }
    ]
  }
];

export const USER_REGISTRY_ABI = [
  {
    "type": "impl",
    "name": "UserRegistryImpl",
    "interface_name": "voisss_contracts::user_registry::IUserRegistry"
  },
  {
    "type": "struct",
    "name": "voisss_contracts::user_registry::ProfileUpdate",
    "members": [
      {
        "name": "username",
        "type": "core::felt252"
      },
      {
        "name": "display_name",
        "type": "core::felt252"
      },
      {
        "name": "bio",
        "type": "core::felt252"
      },
      {
        "name": "avatar_ipfs",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "voisss_contracts::user_registry::UserProfile",
    "members": [
      {
        "name": "address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "username",
        "type": "core::felt252"
      },
      {
        "name": "display_name",
        "type": "core::felt252"
      },
      {
        "name": "bio",
        "type": "core::felt252"
      },
      {
        "name": "avatar_ipfs",
        "type": "core::felt252"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64"
      },
      {
        "name": "total_recordings",
        "type": "core::integer::u64"
      },
      {
        "name": "total_plays",
        "type": "core::integer::u64"
      },
      {
        "name": "followers_count",
        "type": "core::integer::u64"
      },
      {
        "name": "following_count",
        "type": "core::integer::u64"
      },
      {
        "name": "is_verified",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "interface",
    "name": "voisss_contracts::user_registry::IUserRegistry",
    "items": [
      {
        "type": "function",
        "name": "register_user",
        "inputs": [
          {
            "name": "profile",
            "type": "voisss_contracts::user_registry::ProfileUpdate"
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
        "name": "update_profile",
        "inputs": [
          {
            "name": "profile",
            "type": "voisss_contracts::user_registry::ProfileUpdate"
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
            "type": "voisss_contracts::user_registry::UserProfile"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_profile_by_username",
        "inputs": [
          {
            "name": "username",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "voisss_contracts::user_registry::UserProfile"
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
        "name": "unfollow_user",
        "inputs": [
          {
            "name": "user_to_unfollow",
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
      },
      {
        "type": "function",
        "name": "get_followers",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
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
            "type": "core::array::Array::<core::starknet::contract_address::ContractAddress>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_following",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
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
            "type": "core::array::Array::<core::starknet::contract_address::ContractAddress>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "increment_user_stats",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "recordings_delta",
            "type": "core::integer::u64"
          },
          {
            "name": "plays_delta",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "verify_user",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "is_username_available",
        "inputs": [
          {
            "name": "username",
            "type": "core::felt252"
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
        "name": "get_total_users",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::user_registry::UserRegistry::UserRegistered",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "username",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::user_registry::UserRegistry::ProfileUpdated",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "username",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::user_registry::UserRegistry::UserFollowed",
    "kind": "struct",
    "members": [
      {
        "name": "follower",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "following",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::user_registry::UserRegistry::UserUnfollowed",
    "kind": "struct",
    "members": [
      {
        "name": "follower",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "unfollowed",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::user_registry::UserRegistry::UserVerified",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::user_registry::UserRegistry::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "UserRegistered",
        "type": "voisss_contracts::user_registry::UserRegistry::UserRegistered",
        "kind": "nested"
      },
      {
        "name": "ProfileUpdated",
        "type": "voisss_contracts::user_registry::UserRegistry::ProfileUpdated",
        "kind": "nested"
      },
      {
        "name": "UserFollowed",
        "type": "voisss_contracts::user_registry::UserRegistry::UserFollowed",
        "kind": "nested"
      },
      {
        "name": "UserUnfollowed",
        "type": "voisss_contracts::user_registry::UserRegistry::UserUnfollowed",
        "kind": "nested"
      },
      {
        "name": "UserVerified",
        "type": "voisss_contracts::user_registry::UserRegistry::UserVerified",
        "kind": "nested"
      }
    ]
  }
];

export const ACCESS_CONTROL_ABI = [
  {
    "type": "impl",
    "name": "AccessControlImpl",
    "interface_name": "voisss_contracts::access_control::IAccessControl"
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "interface",
    "name": "voisss_contracts::access_control::IAccessControl",
    "items": [
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
        "name": "revoke_access",
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
        "name": "get_user_permissions",
        "inputs": [
          {
            "name": "recording_id",
            "type": "core::integer::u256"
          },
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Array::<core::integer::u8>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "set_recording_public",
        "inputs": [
          {
            "name": "recording_id",
            "type": "core::integer::u256"
          },
          {
            "name": "is_public",
            "type": "core::bool"
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
        "name": "is_recording_public",
        "inputs": [
          {
            "name": "recording_id",
            "type": "core::integer::u256"
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
      },
      {
        "type": "function",
        "name": "verify_share_link",
        "inputs": [
          {
            "name": "share_token",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "(core::integer::u256, core::bool)"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "function",
    "name": "register_recording_owner",
    "inputs": [
      {
        "name": "recording_id",
        "type": "core::integer::u256"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "event",
    "name": "voisss_contracts::access_control::AccessControl::AccessGranted",
    "kind": "struct",
    "members": [
      {
        "name": "recording_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "permission_type",
        "type": "core::integer::u8",
        "kind": "data"
      },
      {
        "name": "granted_by",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::access_control::AccessControl::AccessRevoked",
    "kind": "struct",
    "members": [
      {
        "name": "recording_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "permission_type",
        "type": "core::integer::u8",
        "kind": "data"
      },
      {
        "name": "revoked_by",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::access_control::AccessControl::RecordingMadePublic",
    "kind": "struct",
    "members": [
      {
        "name": "recording_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::access_control::AccessControl::RecordingMadePrivate",
    "kind": "struct",
    "members": [
      {
        "name": "recording_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::access_control::AccessControl::ShareLinkCreated",
    "kind": "struct",
    "members": [
      {
        "name": "recording_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "share_token",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "expires_at",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "voisss_contracts::access_control::AccessControl::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "AccessGranted",
        "type": "voisss_contracts::access_control::AccessControl::AccessGranted",
        "kind": "nested"
      },
      {
        "name": "AccessRevoked",
        "type": "voisss_contracts::access_control::AccessControl::AccessRevoked",
        "kind": "nested"
      },
      {
        "name": "RecordingMadePublic",
        "type": "voisss_contracts::access_control::AccessControl::RecordingMadePublic",
        "kind": "nested"
      },
      {
        "name": "RecordingMadePrivate",
        "type": "voisss_contracts::access_control::AccessControl::RecordingMadePrivate",
        "kind": "nested"
      },
      {
        "name": "ShareLinkCreated",
        "type": "voisss_contracts::access_control::AccessControl::ShareLinkCreated",
        "kind": "nested"
      }
    ]
  }
];

// Legacy exports for backward compatibility
export const VoiceStorageABI = VOICE_STORAGE_ABI;
export const UserRegistryABI = USER_REGISTRY_ABI;
export const AccessControlABI = ACCESS_CONTROL_ABI;
