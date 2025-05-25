use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
use core::num::traits::Zero;

#[derive(Drop, Serde, starknet::Store)]
struct AccessPermission {
    recording_id: u256,
    user: ContractAddress,
    permission_type: u8, // 0: view, 1: download, 2: share
    granted_by: ContractAddress,
    granted_at: u64,
    expires_at: u64, // 0 means never expires
}

#[starknet::interface]
trait IAccessControl<TContractState> {
    fn grant_access(
        ref self: TContractState,
        recording_id: u256,
        user: ContractAddress,
        permission_type: u8,
        expires_at: u64
    ) -> bool;

    fn revoke_access(
        ref self: TContractState,
        recording_id: u256,
        user: ContractAddress,
        permission_type: u8
    ) -> bool;

    fn has_access(
        self: @TContractState,
        recording_id: u256,
        user: ContractAddress,
        permission_type: u8
    ) -> bool;

    fn get_user_permissions(
        self: @TContractState,
        recording_id: u256,
        user: ContractAddress
    ) -> Array<u8>;

    fn set_recording_public(ref self: TContractState, recording_id: u256, is_public: bool) -> bool;
    fn is_recording_public(self: @TContractState, recording_id: u256) -> bool;

    fn create_share_link(ref self: TContractState, recording_id: u256, expires_at: u64) -> felt252;
    fn verify_share_link(self: @TContractState, share_token: felt252) -> (u256, bool); // (recording_id, is_valid)
}

#[starknet::contract]
mod AccessControl {
    use super::{AccessPermission, IAccessControl};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use core::array::ArrayTrait;
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        // recording_id -> user -> permission_type -> AccessPermission
        permissions: starknet::storage::Map<(u256, ContractAddress, u8), AccessPermission>,
        // recording_id -> is_public
        public_recordings: starknet::storage::Map<u256, bool>,
        // recording_id -> owner
        recording_owners: starknet::storage::Map<u256, ContractAddress>,
        // share_token -> (recording_id, expires_at)
        share_links: starknet::storage::Map<felt252, (u256, u64)>,
        // recording_id -> share_token (for cleanup)
        recording_share_tokens: starknet::storage::Map<u256, felt252>,
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AccessGranted: AccessGranted,
        AccessRevoked: AccessRevoked,
        RecordingMadePublic: RecordingMadePublic,
        RecordingMadePrivate: RecordingMadePrivate,
        ShareLinkCreated: ShareLinkCreated,
    }

    #[derive(Drop, starknet::Event)]
    struct AccessGranted {
        recording_id: u256,
        user: ContractAddress,
        permission_type: u8,
        granted_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct AccessRevoked {
        recording_id: u256,
        user: ContractAddress,
        permission_type: u8,
        revoked_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct RecordingMadePublic {
        recording_id: u256,
        owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct RecordingMadePrivate {
        recording_id: u256,
        owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct ShareLinkCreated {
        recording_id: u256,
        share_token: felt252,
        expires_at: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
    }

    #[abi(embed_v0)]
    impl AccessControlImpl of IAccessControl<ContractState> {
        fn grant_access(
            ref self: ContractState,
            recording_id: u256,
            user: ContractAddress,
            permission_type: u8,
            expires_at: u64
        ) -> bool {
            let caller = get_caller_address();
            let owner = self.recording_owners.read(recording_id);

            // Only recording owner can grant access
            assert(caller == owner, 'Only owner can grant access');

            // Validate permission type (0: view, 1: download, 2: share)
            assert(permission_type <= 2, 'Invalid permission type');

            let permission = AccessPermission {
                recording_id,
                user,
                permission_type,
                granted_by: caller,
                granted_at: get_block_timestamp(),
                expires_at,
            };

            self.permissions.write((recording_id, user, permission_type), permission);

            self.emit(AccessGranted {
                recording_id,
                user,
                permission_type,
                granted_by: caller,
            });

            true
        }

        fn revoke_access(
            ref self: ContractState,
            recording_id: u256,
            user: ContractAddress,
            permission_type: u8
        ) -> bool {
            let caller = get_caller_address();
            let owner = self.recording_owners.read(recording_id);

            // Only recording owner can revoke access
            assert(caller == owner, 'Only owner can revoke access');

            // Clear the permission
            let empty_permission = AccessPermission {
                recording_id: 0,
                user: Zero::zero(),
                permission_type: 0,
                granted_by: Zero::zero(),
                granted_at: 0,
                expires_at: 0,
            };

            self.permissions.write((recording_id, user, permission_type), empty_permission);

            self.emit(AccessRevoked {
                recording_id,
                user,
                permission_type,
                revoked_by: caller,
            });

            true
        }

        fn has_access(
            self: @ContractState,
            recording_id: u256,
            user: ContractAddress,
            permission_type: u8
        ) -> bool {
            // Check if recording is public (everyone has view access)
            if permission_type == 0 && self.public_recordings.read(recording_id) {
                return true;
            }

            // Check if user is the owner
            let owner = self.recording_owners.read(recording_id);
            if user == owner {
                return true;
            }

            // Check specific permission
            let permission = self.permissions.read((recording_id, user, permission_type));

            // Check if permission exists and hasn't expired
            if permission.user == user {
                let current_time = get_block_timestamp();
                if permission.expires_at == 0 || current_time <= permission.expires_at {
                    return true;
                }
            }

            false
        }

        fn get_user_permissions(
            self: @ContractState,
            recording_id: u256,
            user: ContractAddress
        ) -> Array<u8> {
            let mut permissions = ArrayTrait::new();

            // Check each permission type (0: view, 1: download, 2: share)
            let mut i = 0;
            loop {
                if i > 2 {
                    break;
                }
                if self.has_access(recording_id, user, i) {
                    permissions.append(i);
                }
                i += 1;
            };

            permissions
        }

        fn set_recording_public(ref self: ContractState, recording_id: u256, is_public: bool) -> bool {
            let caller = get_caller_address();
            let owner = self.recording_owners.read(recording_id);

            // Only recording owner can change public status
            assert(caller == owner, 'Only owner can change status');

            self.public_recordings.write(recording_id, is_public);

            if is_public {
                self.emit(RecordingMadePublic {
                    recording_id,
                    owner: caller,
                });
            } else {
                self.emit(RecordingMadePrivate {
                    recording_id,
                    owner: caller,
                });
            }

            true
        }

        fn is_recording_public(self: @ContractState, recording_id: u256) -> bool {
            self.public_recordings.read(recording_id)
        }

        fn create_share_link(ref self: ContractState, recording_id: u256, expires_at: u64) -> felt252 {
            let caller = get_caller_address();
            let owner = self.recording_owners.read(recording_id);

            // Only recording owner can create share links
            assert(caller == owner, 'Only owner can create links');

            // Generate a simple share token (in production, use proper randomization)
            let timestamp = get_block_timestamp();
            let share_token: felt252 = (recording_id.low + timestamp.into()).into();

            // Store the share link
            self.share_links.write(share_token, (recording_id, expires_at));
            self.recording_share_tokens.write(recording_id, share_token);

            self.emit(ShareLinkCreated {
                recording_id,
                share_token,
                expires_at,
            });

            share_token
        }

        fn verify_share_link(self: @ContractState, share_token: felt252) -> (u256, bool) {
            let (recording_id, expires_at) = self.share_links.read(share_token);

            if recording_id == 0 {
                return (0, false);
            }

            let current_time = get_block_timestamp();
            let is_valid = expires_at == 0 || current_time <= expires_at;

            (recording_id, is_valid)
        }
    }

    // Helper function to register recording ownership (called by VoiceStorage contract)
    #[external(v0)]
    fn register_recording_owner(ref self: ContractState, recording_id: u256, owner: ContractAddress) {
        // In production, this should only be callable by the VoiceStorage contract
        self.recording_owners.write(recording_id, owner);
    }
}
