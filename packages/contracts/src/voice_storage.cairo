use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
use core::num::traits::Zero;

#[derive(Drop, Serde, starknet::Store, Copy)]
struct Recording {
    id: u256,
    owner: ContractAddress,
    title: felt252,
    description: felt252,
    ipfs_hash: felt252,
    duration: u64,
    file_size: u64,
    created_at: u64,
    is_public: bool,
    play_count: u64,
}

#[derive(Drop, Serde)]
struct RecordingMetadata {
    title: felt252,
    description: felt252,
    ipfs_hash: felt252,
    duration: u64,
    file_size: u64,
    is_public: bool,
}

#[starknet::interface]
trait IVoiceStorage<TContractState> {
    fn store_recording(
        ref self: TContractState,
        metadata: RecordingMetadata
    ) -> u256;

    fn get_recording(self: @TContractState, recording_id: u256) -> Recording;
    fn get_user_recordings(self: @TContractState, user: ContractAddress) -> Array<u256>;
    fn get_public_recordings(self: @TContractState, offset: u64, limit: u64) -> Array<u256>;

    fn update_recording_metadata(
        ref self: TContractState,
        recording_id: u256,
        metadata: RecordingMetadata
    );

    fn delete_recording(ref self: TContractState, recording_id: u256);
    fn increment_play_count(ref self: TContractState, recording_id: u256);

    fn get_total_recordings(self: @TContractState) -> u256;
    fn get_user_recording_count(self: @TContractState, user: ContractAddress) -> u256;
}

#[starknet::contract]
mod VoiceStorage {
    use super::{Recording, RecordingMetadata, IVoiceStorage};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use core::array::ArrayTrait;

    #[storage]
    struct Storage {
        recordings: starknet::storage::Map<u256, Recording>,
        user_recordings: starknet::storage::Map<(ContractAddress, u256), u256>,
        user_recording_counts: starknet::storage::Map<ContractAddress, u256>,
        next_recording_id: u256,
        total_recordings: u256,
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        RecordingStored: RecordingStored,
        RecordingUpdated: RecordingUpdated,
        RecordingDeleted: RecordingDeleted,
        PlayCountIncremented: PlayCountIncremented,
    }

    #[derive(Drop, starknet::Event)]
    struct RecordingStored {
        recording_id: u256,
        owner: ContractAddress,
        title: felt252,
        ipfs_hash: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct RecordingUpdated {
        recording_id: u256,
        owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct RecordingDeleted {
        recording_id: u256,
        owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct PlayCountIncremented {
        recording_id: u256,
        new_count: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.next_recording_id.write(1);
        self.total_recordings.write(0);
    }

    #[abi(embed_v0)]
    impl VoiceStorageImpl of IVoiceStorage<ContractState> {
        fn store_recording(
            ref self: ContractState,
            metadata: RecordingMetadata
        ) -> u256 {
            let caller = get_caller_address();
            let recording_id = self.next_recording_id.read();
            let timestamp = get_block_timestamp();

            let recording = Recording {
                id: recording_id,
                owner: caller,
                title: metadata.title,
                description: metadata.description,
                ipfs_hash: metadata.ipfs_hash,
                duration: metadata.duration,
                file_size: metadata.file_size,
                created_at: timestamp,
                is_public: metadata.is_public,
                play_count: 0,
            };

            // Store the recording
            self.recordings.write(recording_id, recording);

            // Update user's recording list
            let user_count = self.user_recording_counts.read(caller);
            self.user_recordings.write((caller, user_count), recording_id);
            self.user_recording_counts.write(caller, user_count + 1);

            // Update counters
            self.next_recording_id.write(recording_id + 1);
            self.total_recordings.write(self.total_recordings.read() + 1);

            // Emit event
            self.emit(RecordingStored {
                recording_id,
                owner: caller,
                title: metadata.title,
                ipfs_hash: metadata.ipfs_hash,
            });

            recording_id
        }

        fn get_recording(self: @ContractState, recording_id: u256) -> Recording {
            self.recordings.read(recording_id)
        }

        fn get_user_recordings(self: @ContractState, user: ContractAddress) -> Array<u256> {
            let mut recordings = ArrayTrait::new();
            let count = self.user_recording_counts.read(user);

            let mut i = 0;
            loop {
                if i >= count {
                    break;
                }
                let recording_id = self.user_recordings.read((user, i));
                recordings.append(recording_id);
                i += 1;
            };

            recordings
        }

        fn get_public_recordings(self: @ContractState, offset: u64, limit: u64) -> Array<u256> {
            let mut recordings = ArrayTrait::new();
            let total = self.total_recordings.read();

            let mut i = offset;
            let end = if offset + limit > total.try_into().unwrap() {
                total.try_into().unwrap()
            } else {
                offset + limit
            };

            loop {
                if i >= end {
                    break;
                }
                let recording_id: u256 = (i + 1).into();
                let recording = self.recordings.read(recording_id);
                if recording.is_public {
                    recordings.append(recording_id);
                }
                i += 1;
            };

            recordings
        }

        fn update_recording_metadata(
            ref self: ContractState,
            recording_id: u256,
            metadata: RecordingMetadata
        ) {
            let caller = get_caller_address();
            let mut recording = self.recordings.read(recording_id);

            // Only owner can update
            assert(recording.owner == caller, 'Only owner can update');

            recording.title = metadata.title;
            recording.description = metadata.description;
            recording.ipfs_hash = metadata.ipfs_hash;
            recording.duration = metadata.duration;
            recording.file_size = metadata.file_size;
            recording.is_public = metadata.is_public;

            self.recordings.write(recording_id, recording);

            self.emit(RecordingUpdated {
                recording_id,
                owner: caller,
            });
        }

        fn delete_recording(ref self: ContractState, recording_id: u256) {
            let caller = get_caller_address();
            let recording = self.recordings.read(recording_id);

            // Only owner can delete
            assert(recording.owner == caller, 'Only owner can delete');

            // Note: In a production system, you might want to mark as deleted
            // rather than actually removing to maintain data integrity

            self.emit(RecordingDeleted {
                recording_id,
                owner: caller,
            });
        }

        fn increment_play_count(ref self: ContractState, recording_id: u256) {
            let mut recording = self.recordings.read(recording_id);
            let new_count = recording.play_count + 1;
            recording.play_count = new_count;
            self.recordings.write(recording_id, recording);

            self.emit(PlayCountIncremented {
                recording_id,
                new_count,
            });
        }

        fn get_total_recordings(self: @ContractState) -> u256 {
            self.total_recordings.read()
        }

        fn get_user_recording_count(self: @ContractState, user: ContractAddress) -> u256 {
            self.user_recording_counts.read(user)
        }
    }
}
