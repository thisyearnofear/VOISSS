use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
use core::num::traits::Zero;

#[derive(Drop, Serde, starknet::Store)]
struct UserProfile {
    address: ContractAddress,
    username: felt252,
    display_name: felt252,
    bio: felt252,
    avatar_ipfs: felt252,
    created_at: u64,
    total_recordings: u64,
    total_plays: u64,
    followers_count: u64,
    following_count: u64,
    is_verified: bool,
}

#[derive(Drop, Serde)]
struct ProfileUpdate {
    username: felt252,
    display_name: felt252,
    bio: felt252,
    avatar_ipfs: felt252,
}

#[starknet::interface]
trait IUserRegistry<TContractState> {
    fn register_user(ref self: TContractState, profile: ProfileUpdate) -> bool;
    fn update_profile(ref self: TContractState, profile: ProfileUpdate) -> bool;
    fn get_profile(self: @TContractState, user: ContractAddress) -> UserProfile;
    fn get_profile_by_username(self: @TContractState, username: felt252) -> UserProfile;

    fn follow_user(ref self: TContractState, user_to_follow: ContractAddress) -> bool;
    fn unfollow_user(ref self: TContractState, user_to_unfollow: ContractAddress) -> bool;
    fn is_following(self: @TContractState, follower: ContractAddress, following: ContractAddress) -> bool;

    fn get_followers(self: @TContractState, user: ContractAddress, offset: u64, limit: u64) -> Array<ContractAddress>;
    fn get_following(self: @TContractState, user: ContractAddress, offset: u64, limit: u64) -> Array<ContractAddress>;

    fn increment_user_stats(ref self: TContractState, user: ContractAddress, recordings_delta: u64, plays_delta: u64);
    fn verify_user(ref self: TContractState, user: ContractAddress);

    fn is_username_available(self: @TContractState, username: felt252) -> bool;
    fn get_total_users(self: @TContractState) -> u64;
}

#[starknet::contract]
mod UserRegistry {
    use super::{UserProfile, ProfileUpdate, IUserRegistry};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use core::array::ArrayTrait;
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        profiles: starknet::storage::Map<ContractAddress, UserProfile>,
        username_to_address: starknet::storage::Map<felt252, ContractAddress>,
        following: starknet::storage::Map<(ContractAddress, ContractAddress), bool>,
        followers: starknet::storage::Map<(ContractAddress, u64), ContractAddress>,
        following_list: starknet::storage::Map<(ContractAddress, u64), ContractAddress>,
        total_users: u64,
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        UserRegistered: UserRegistered,
        ProfileUpdated: ProfileUpdated,
        UserFollowed: UserFollowed,
        UserUnfollowed: UserUnfollowed,
        UserVerified: UserVerified,
    }

    #[derive(Drop, starknet::Event)]
    struct UserRegistered {
        user: ContractAddress,
        username: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct ProfileUpdated {
        user: ContractAddress,
        username: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct UserFollowed {
        follower: ContractAddress,
        following: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct UserUnfollowed {
        follower: ContractAddress,
        unfollowed: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct UserVerified {
        user: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.total_users.write(0);
    }

    #[abi(embed_v0)]
    impl UserRegistryImpl of IUserRegistry<ContractState> {
        fn register_user(ref self: ContractState, profile: ProfileUpdate) -> bool {
            let caller = get_caller_address();
            let timestamp = get_block_timestamp();

            // Check if user already exists
            let existing_profile = self.profiles.read(caller);
            assert(existing_profile.address.is_zero(), 'User already registered');

            // Check if username is available
            assert(self.is_username_available(profile.username), 'Username taken');

            let user_profile = UserProfile {
                address: caller,
                username: profile.username,
                display_name: profile.display_name,
                bio: profile.bio,
                avatar_ipfs: profile.avatar_ipfs,
                created_at: timestamp,
                total_recordings: 0,
                total_plays: 0,
                followers_count: 0,
                following_count: 0,
                is_verified: false,
            };

            self.profiles.write(caller, user_profile);
            self.username_to_address.write(profile.username, caller);
            self.total_users.write(self.total_users.read() + 1);

            self.emit(UserRegistered {
                user: caller,
                username: profile.username,
            });

            true
        }

        fn update_profile(ref self: ContractState, profile: ProfileUpdate) -> bool {
            let caller = get_caller_address();
            let mut user_profile = self.profiles.read(caller);

            // Check if user exists
            assert(!user_profile.address.is_zero(), 'User not registered');

            // If username is changing, check availability
            if user_profile.username != profile.username {
                assert(self.is_username_available(profile.username), 'Username taken');
                // Remove old username mapping
                self.username_to_address.write(user_profile.username, Zero::zero());
                // Add new username mapping
                self.username_to_address.write(profile.username, caller);
            }

            user_profile.username = profile.username;
            user_profile.display_name = profile.display_name;
            user_profile.bio = profile.bio;
            user_profile.avatar_ipfs = profile.avatar_ipfs;

            self.profiles.write(caller, user_profile);

            self.emit(ProfileUpdated {
                user: caller,
                username: profile.username,
            });

            true
        }

        fn get_profile(self: @ContractState, user: ContractAddress) -> UserProfile {
            self.profiles.read(user)
        }

        fn get_profile_by_username(self: @ContractState, username: felt252) -> UserProfile {
            let address = self.username_to_address.read(username);
            self.profiles.read(address)
        }

        fn follow_user(ref self: ContractState, user_to_follow: ContractAddress) -> bool {
            let caller = get_caller_address();

            // Can't follow yourself
            assert(caller != user_to_follow, 'Cannot follow yourself');

            // Check if already following
            assert(!self.following.read((caller, user_to_follow)), 'Already following');

            // Update following relationship
            self.following.write((caller, user_to_follow), true);

            // Update follower's following count
            let mut follower_profile = self.profiles.read(caller);
            follower_profile.following_count += 1;
            self.profiles.write(caller, follower_profile);

            // Update followed user's followers count
            let mut followed_profile = self.profiles.read(user_to_follow);
            followed_profile.followers_count += 1;
            self.profiles.write(user_to_follow, followed_profile);

            self.emit(UserFollowed {
                follower: caller,
                following: user_to_follow,
            });

            true
        }

        fn unfollow_user(ref self: ContractState, user_to_unfollow: ContractAddress) -> bool {
            let caller = get_caller_address();

            // Check if currently following
            assert(self.following.read((caller, user_to_unfollow)), 'Not following');

            // Update following relationship
            self.following.write((caller, user_to_unfollow), false);

            // Update follower's following count
            let mut follower_profile = self.profiles.read(caller);
            follower_profile.following_count -= 1;
            self.profiles.write(caller, follower_profile);

            // Update unfollowed user's followers count
            let mut unfollowed_profile = self.profiles.read(user_to_unfollow);
            unfollowed_profile.followers_count -= 1;
            self.profiles.write(user_to_unfollow, unfollowed_profile);

            self.emit(UserUnfollowed {
                follower: caller,
                unfollowed: user_to_unfollow,
            });

            true
        }

        fn is_following(self: @ContractState, follower: ContractAddress, following: ContractAddress) -> bool {
            self.following.read((follower, following))
        }

        fn get_followers(self: @ContractState, user: ContractAddress, offset: u64, limit: u64) -> Array<ContractAddress> {
            let mut followers = ArrayTrait::new();
            // Implementation would require additional storage structure for efficient querying
            // This is a simplified version
            followers
        }

        fn get_following(self: @ContractState, user: ContractAddress, offset: u64, limit: u64) -> Array<ContractAddress> {
            let mut following = ArrayTrait::new();
            // Implementation would require additional storage structure for efficient querying
            // This is a simplified version
            following
        }

        fn increment_user_stats(ref self: ContractState, user: ContractAddress, recordings_delta: u64, plays_delta: u64) {
            let mut profile = self.profiles.read(user);
            profile.total_recordings += recordings_delta;
            profile.total_plays += plays_delta;
            self.profiles.write(user, profile);
        }

        fn verify_user(ref self: ContractState, user: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can verify');

            let mut profile = self.profiles.read(user);
            profile.is_verified = true;
            self.profiles.write(user, profile);

            self.emit(UserVerified { user });
        }

        fn is_username_available(self: @ContractState, username: felt252) -> bool {
            let address = self.username_to_address.read(username);
            address.is_zero()
        }

        fn get_total_users(self: @ContractState) -> u64 {
            self.total_users.read()
        }
    }
}
