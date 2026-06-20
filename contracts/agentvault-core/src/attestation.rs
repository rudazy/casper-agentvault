use odra::prelude::*;

#[odra::module]
pub struct Attestation {
    issuer: Var<Address>,
    data_hash: Var<String>,
    timestamp: Var<u64>,
    reputation_score: Var<u32>,
}

#[odra::module]
impl Attestation {
    pub fn init(&mut self, data_hash: String, initial_score: u32) {
        self.issuer.set(self.env().caller());
        self.data_hash.set(data_hash);
        self.timestamp.set(self.env().get_block_time());
        self.reputation_score.set(initial_score);
    }

    pub fn update_reputation(&mut self, new_score: u32) {
        // TODO: only owner or verifier can update
        self.reputation_score.set(new_score);
    }
}