// VOISSS Smart Contracts for Starknet
// Built for Starknet Reignite Hackathon

mod voice_storage;
mod user_registry;

pub use voice_storage::VoiceStorage;
pub use user_registry::UserRegistry;

#[starknet::contract]
mod VoissContract {
    #[storage]
    struct Storage {
        name: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.name.write('VOISSS');
    }

    #[external(v0)]
    fn get_name(self: @ContractState) -> felt252 {
        self.name.read()
    }

    #[external(v0)]
    fn set_name(ref self: ContractState, new_name: felt252) {
        self.name.write(new_name);
    }
}
