use odra::prelude::*;

#[odra::odra_error]
pub enum AttestationError {
    NotIssuer = 1,
}

#[odra::module(errors = AttestationError)]
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

    /// Callable entry point for publishing attestations (init is deploy-only in Odra).
    pub fn publish(&mut self, data_hash: String, initial_score: u32) {
        self.issuer.set(self.env().caller());
        self.data_hash.set(data_hash);
        self.timestamp.set(self.env().get_block_time());
        self.reputation_score.set(initial_score);
    }

    pub fn update_reputation(&mut self, new_score: u32) {
        let issuer = self.issuer.get_or_revert_with(ExecutionError::MissingAddress);
        if self.env().caller() != issuer {
            self.env().revert(AttestationError::NotIssuer);
        }
        self.reputation_score.set(new_score);
    }

    pub fn get_reputation(&self) -> u32 {
        self.reputation_score.get_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::Deployer;

    fn deploy() -> (odra::host::HostEnv, AttestationHostRef) {
        let env = odra_test::env();
        env.set_caller(env.get_account(0));
        let attestation = Attestation::deploy(
            &env,
            AttestationInitArgs {
                data_hash: "test-hash".to_string(),
                initial_score: 50,
            },
        );
        (env, attestation)
    }

    #[test]
    fn issuer_update_succeeds() {
        let (_env, mut attestation) = deploy();
        attestation.update_reputation(80);
        assert_eq!(attestation.get_reputation(), 80);
    }

    #[test]
    fn non_issuer_update_reverts() {
        let (env, mut attestation) = deploy();
        env.set_caller(env.get_account(1));
        assert_eq!(
            attestation.try_update_reputation(99).unwrap_err(),
            AttestationError::NotIssuer.into()
        );
        assert_eq!(attestation.get_reputation(), 50);
    }
}
