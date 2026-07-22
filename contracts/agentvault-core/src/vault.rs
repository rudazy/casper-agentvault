use odra::casper_types::U512;
use odra::prelude::*;

/// Bit 0 of `allowed_actions`: native CSPR transfer. Bits 1..31 reserved
/// for future actions (escrow proxying, attestation publishing).
pub const ACTION_TRANSFER: u32 = 1 << 0;

#[odra::odra_type]
pub struct AgentPolicy {
    /// Max motes the agent may spend per window.
    pub spend_cap: U512,
    /// Window length in milliseconds.
    pub period_ms: u64,
    /// Bitmask of permitted actions.
    pub allowed_actions: u32,
    /// Absolute block time (ms); policy is valid while `now < expires_at`.
    pub expires_at: u64,
    /// False after revocation (Mapping has no delete).
    pub active: bool,
    pub window_start: u64,
    pub spent_in_window: U512,
}

#[odra::odra_error]
pub enum VaultError {
    NotOwner = 1,
    AgentNotAuthorized = 2,
    AgentRevoked = 3,
    SessionExpired = 4,
    ActionNotAllowed = 5,
    SpendCapExceeded = 6,
    InsufficientVaultBalance = 7,
    InvalidPolicy = 8,
}

#[odra::event]
pub struct Deposited {
    pub depositor: Address,
    pub amount: U512,
}

#[odra::event]
pub struct Withdrawn {
    pub owner: Address,
    pub amount: U512,
}

#[odra::event]
pub struct AgentAuthorized {
    pub agent: Address,
    pub spend_cap: U512,
    pub period_ms: u64,
    pub allowed_actions: u32,
    pub expires_at: u64,
}

#[odra::event]
pub struct AgentRevoked {
    pub agent: Address,
}

#[odra::event]
pub struct AgentSpent {
    pub agent: Address,
    pub recipient: Address,
    pub amount: U512,
    pub spent_in_window: U512,
}

/// Session-key vault: the owner deposits CSPR and grants agent keypairs
/// bounded spending authority (cap per time window, action bitmask, expiry).
#[odra::module(
    errors = VaultError,
    events = [Deposited, Withdrawn, AgentAuthorized, AgentRevoked, AgentSpent]
)]
pub struct Vault {
    owner: Var<Address>,
    policies: Mapping<Address, AgentPolicy>,
}

#[odra::module]
impl Vault {
    pub fn init(&mut self) {
        self.owner.set(self.env().caller());
    }

    #[odra(payable)]
    pub fn deposit(&mut self) {
        let amount = self.env().attached_value();
        let depositor = self.env().caller();
        self.env().emit_event(Deposited { depositor, amount });
    }

    pub fn withdraw(&mut self, amount: U512) {
        let owner = self.assert_owner();
        if amount > self.env().self_balance() {
            self.env().revert(VaultError::InsufficientVaultBalance);
        }
        self.env().transfer_tokens(&owner, &amount);
        self.env().emit_event(Withdrawn { owner, amount });
    }

    pub fn authorize_agent(
        &mut self,
        agent: Address,
        spend_cap: U512,
        period_ms: u64,
        allowed_actions: u32,
        expires_at: u64,
    ) {
        self.assert_owner();
        let now = self.env().get_block_time();
        if spend_cap.is_zero() || period_ms == 0 || expires_at <= now {
            self.env().revert(VaultError::InvalidPolicy);
        }
        // Re-authorizing replaces the policy and resets window accounting.
        self.policies.set(
            &agent,
            AgentPolicy {
                spend_cap,
                period_ms,
                allowed_actions,
                expires_at,
                active: true,
                window_start: now,
                spent_in_window: U512::zero(),
            },
        );
        self.env().emit_event(AgentAuthorized {
            agent,
            spend_cap,
            period_ms,
            allowed_actions,
            expires_at,
        });
    }

    pub fn revoke_agent(&mut self, agent: Address) {
        self.assert_owner();
        let mut policy = match self.policies.get(&agent) {
            Some(policy) => policy,
            None => self.env().revert(VaultError::AgentNotAuthorized),
        };
        // Idempotent: revoking twice is a no-op, a panic button must not fail.
        policy.active = false;
        self.policies.set(&agent, policy);
        self.env().emit_event(AgentRevoked { agent });
    }

    pub fn agent_transfer(&mut self, recipient: Address, amount: U512) {
        let agent = self.env().caller();
        let now = self.env().get_block_time();
        let mut policy = match self.policies.get(&agent) {
            Some(policy) => policy,
            None => self.env().revert(VaultError::AgentNotAuthorized),
        };
        if !policy.active {
            self.env().revert(VaultError::AgentRevoked);
        }
        if now >= policy.expires_at {
            self.env().revert(VaultError::SessionExpired);
        }
        if policy.allowed_actions & ACTION_TRANSFER == 0 {
            self.env().revert(VaultError::ActionNotAllowed);
        }
        // saturating_add: a huge period_ms must never wrap and reset the
        // window on every call (release profile has overflow checks off).
        if now >= policy.window_start.saturating_add(policy.period_ms) {
            policy.window_start = now;
            policy.spent_in_window = U512::zero();
        }
        let new_spent = match policy.spent_in_window.checked_add(amount) {
            Some(total) if total <= policy.spend_cap => total,
            _ => self.env().revert(VaultError::SpendCapExceeded),
        };
        if amount > self.env().self_balance() {
            self.env().revert(VaultError::InsufficientVaultBalance);
        }
        // Effects before interaction.
        policy.spent_in_window = new_spent;
        self.policies.set(&agent, policy);
        self.env().transfer_tokens(&recipient, &amount);
        self.env().emit_event(AgentSpent {
            agent,
            recipient,
            amount,
            spent_in_window: new_spent,
        });
    }

    pub fn get_policy(&self, agent: Address) -> Option<AgentPolicy> {
        self.policies.get(&agent)
    }

    pub fn vault_balance(&self) -> U512 {
        self.env().self_balance()
    }

    pub fn get_owner(&self) -> Address {
        self.owner.get_or_revert_with(ExecutionError::MissingAddress)
    }

    fn assert_owner(&self) -> Address {
        let owner = self.owner.get_or_revert_with(ExecutionError::MissingAddress);
        if self.env().caller() != owner {
            self.env().revert(VaultError::NotOwner);
        }
        owner
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv, HostRef, NoArgs};

    const DAY_MS: u64 = 86_400_000;

    fn motes(cspr: u64) -> U512 {
        U512::from(cspr) * U512::from(1_000_000_000u64)
    }

    /// Owner = account 0, agent = account 1, recipient = account 2.
    /// Vault is funded with 100 CSPR by the owner.
    fn setup() -> (HostEnv, VaultHostRef, Address, Address, Address) {
        let env = odra_test::env();
        let owner = env.get_account(0);
        let agent = env.get_account(1);
        let recipient = env.get_account(2);
        env.set_caller(owner);
        let vault = Vault::deploy(&env, NoArgs);
        vault.with_tokens(motes(100)).deposit();
        (env, vault, owner, agent, recipient)
    }

    fn authorize_default(vault: &mut VaultHostRef, agent: Address, now: u64) {
        vault.authorize_agent(agent, motes(10), DAY_MS, ACTION_TRANSFER, now + 7 * DAY_MS);
    }

    #[test]
    fn deposit_credits_vault_and_emits() {
        let (env, vault, owner, agent, _) = setup();
        assert_eq!(vault.vault_balance(), motes(100));
        assert!(env.emitted_event(
            &vault,
            Deposited {
                depositor: owner,
                amount: motes(100)
            }
        ));

        // Deposits are open to anyone, not just the owner.
        env.set_caller(agent);
        vault.with_tokens(motes(5)).deposit();
        assert_eq!(vault.vault_balance(), motes(105));
    }

    #[test]
    fn owner_withdraw_transfers_and_emits() {
        let (env, mut vault, owner, _, _) = setup();
        let before = env.balance_of(&owner);
        vault.withdraw(motes(40));
        assert_eq!(vault.vault_balance(), motes(60));
        assert!(env.balance_of(&owner) > before);
        assert!(env.emitted_event(
            &vault,
            Withdrawn {
                owner,
                amount: motes(40)
            }
        ));
    }

    #[test]
    fn non_owner_withdraw_reverts() {
        let (env, mut vault, _, agent, _) = setup();
        env.set_caller(agent);
        assert_eq!(
            vault.try_withdraw(motes(1)).unwrap_err(),
            VaultError::NotOwner.into()
        );
    }

    #[test]
    fn withdraw_over_balance_reverts() {
        let (_env, mut vault, _, _, _) = setup();
        assert_eq!(
            vault.try_withdraw(motes(101)).unwrap_err(),
            VaultError::InsufficientVaultBalance.into()
        );
    }

    #[test]
    fn non_owner_authorize_reverts() {
        let (env, mut vault, _, agent, _) = setup();
        let now = env.block_time();
        env.set_caller(agent);
        assert_eq!(
            vault
                .try_authorize_agent(agent, motes(10), DAY_MS, ACTION_TRANSFER, now + DAY_MS)
                .unwrap_err(),
            VaultError::NotOwner.into()
        );
    }

    #[test]
    fn authorize_invalid_args_revert() {
        let (env, mut vault, _, agent, _) = setup();
        let now = env.block_time();
        assert_eq!(
            vault
                .try_authorize_agent(agent, U512::zero(), DAY_MS, ACTION_TRANSFER, now + DAY_MS)
                .unwrap_err(),
            VaultError::InvalidPolicy.into()
        );
        assert_eq!(
            vault
                .try_authorize_agent(agent, motes(10), 0, ACTION_TRANSFER, now + DAY_MS)
                .unwrap_err(),
            VaultError::InvalidPolicy.into()
        );
        assert_eq!(
            vault
                .try_authorize_agent(agent, motes(10), DAY_MS, ACTION_TRANSFER, now)
                .unwrap_err(),
            VaultError::InvalidPolicy.into()
        );
    }

    #[test]
    fn agent_transfer_happy_path() {
        let (env, mut vault, _, agent, recipient) = setup();
        let now = env.block_time();
        authorize_default(&mut vault, agent, now);

        let before = env.balance_of(&recipient);
        env.set_caller(agent);
        vault.agent_transfer(recipient, motes(4));

        assert_eq!(vault.vault_balance(), motes(96));
        assert_eq!(env.balance_of(&recipient), before + motes(4));
        let policy = vault.get_policy(agent).expect("policy must exist");
        assert_eq!(policy.spent_in_window, motes(4));
        assert!(env.emitted_event(
            &vault,
            AgentSpent {
                agent,
                recipient,
                amount: motes(4),
                spent_in_window: motes(4)
            }
        ));
    }

    #[test]
    fn unknown_agent_reverts() {
        let (env, mut vault, _, agent, recipient) = setup();
        env.set_caller(agent);
        assert_eq!(
            vault.try_agent_transfer(recipient, motes(1)).unwrap_err(),
            VaultError::AgentNotAuthorized.into()
        );
    }

    #[test]
    fn revoked_agent_reverts_and_revoke_is_idempotent() {
        let (env, mut vault, owner, agent, recipient) = setup();
        let now = env.block_time();
        authorize_default(&mut vault, agent, now);
        vault.revoke_agent(agent);
        // Second revoke is a no-op, not an error.
        vault.revoke_agent(agent);
        assert!(env.emitted_event(&vault, AgentRevoked { agent }));

        env.set_caller(agent);
        assert_eq!(
            vault.try_agent_transfer(recipient, motes(1)).unwrap_err(),
            VaultError::AgentRevoked.into()
        );

        // Revoking a never-authorized agent is an error.
        env.set_caller(owner);
        assert_eq!(
            vault.try_revoke_agent(recipient).unwrap_err(),
            VaultError::AgentNotAuthorized.into()
        );
    }

    #[test]
    fn expired_session_reverts() {
        let (env, mut vault, _, agent, recipient) = setup();
        let now = env.block_time();
        authorize_default(&mut vault, agent, now);
        // Boundary: exactly at expires_at is already expired.
        env.advance_block_time(7 * DAY_MS);
        env.set_caller(agent);
        assert_eq!(
            vault.try_agent_transfer(recipient, motes(1)).unwrap_err(),
            VaultError::SessionExpired.into()
        );
    }

    #[test]
    fn bitmask_without_transfer_reverts() {
        let (env, mut vault, _, agent, recipient) = setup();
        let now = env.block_time();
        vault.authorize_agent(agent, motes(10), DAY_MS, 0, now + DAY_MS);
        env.set_caller(agent);
        assert_eq!(
            vault.try_agent_transfer(recipient, motes(1)).unwrap_err(),
            VaultError::ActionNotAllowed.into()
        );
    }

    #[test]
    fn single_spend_over_cap_reverts() {
        let (env, mut vault, _, agent, recipient) = setup();
        let now = env.block_time();
        authorize_default(&mut vault, agent, now);
        env.set_caller(agent);
        assert_eq!(
            vault.try_agent_transfer(recipient, motes(11)).unwrap_err(),
            VaultError::SpendCapExceeded.into()
        );
    }

    #[test]
    fn cumulative_spends_hit_cap() {
        let (env, mut vault, _, agent, recipient) = setup();
        let now = env.block_time();
        authorize_default(&mut vault, agent, now);
        env.set_caller(agent);
        vault.agent_transfer(recipient, motes(6));
        vault.agent_transfer(recipient, motes(4));
        assert_eq!(
            vault.try_agent_transfer(recipient, motes(1)).unwrap_err(),
            VaultError::SpendCapExceeded.into()
        );
    }

    #[test]
    fn window_not_reset_before_period() {
        let (env, mut vault, _, agent, recipient) = setup();
        let now = env.block_time();
        authorize_default(&mut vault, agent, now);
        env.set_caller(agent);
        vault.agent_transfer(recipient, motes(10));
        env.advance_block_time(DAY_MS - 1);
        assert_eq!(
            vault.try_agent_transfer(recipient, motes(1)).unwrap_err(),
            VaultError::SpendCapExceeded.into()
        );
    }

    #[test]
    fn window_resets_after_period() {
        let (env, mut vault, _, agent, recipient) = setup();
        let now = env.block_time();
        authorize_default(&mut vault, agent, now);
        env.set_caller(agent);
        vault.agent_transfer(recipient, motes(10));
        env.advance_block_time(DAY_MS);
        vault.agent_transfer(recipient, motes(10));
        let policy = vault.get_policy(agent).expect("policy must exist");
        assert_eq!(policy.spent_in_window, motes(10));
    }

    #[test]
    fn reauthorize_replaces_policy_and_resets_window() {
        let (env, mut vault, owner, agent, recipient) = setup();
        let now = env.block_time();
        authorize_default(&mut vault, agent, now);
        env.set_caller(agent);
        vault.agent_transfer(recipient, motes(10));

        env.set_caller(owner);
        vault.authorize_agent(agent, motes(20), DAY_MS, ACTION_TRANSFER, now + 7 * DAY_MS);
        let policy = vault.get_policy(agent).expect("policy must exist");
        assert_eq!(policy.spent_in_window, U512::zero());
        assert_eq!(policy.spend_cap, motes(20));

        env.set_caller(agent);
        vault.agent_transfer(recipient, motes(15));
    }

    #[test]
    fn agent_transfer_over_vault_balance_reverts() {
        let (env, mut vault, owner, agent, recipient) = setup();
        let now = env.block_time();
        // Cap above the vault balance so the balance check is what trips.
        vault.authorize_agent(agent, motes(500), DAY_MS, ACTION_TRANSFER, now + DAY_MS);
        env.set_caller(agent);
        assert_eq!(
            vault.try_agent_transfer(recipient, motes(101)).unwrap_err(),
            VaultError::InsufficientVaultBalance.into()
        );
        let _ = owner;
    }

    #[test]
    fn huge_period_ms_does_not_wrap() {
        let (env, mut vault, _, agent, recipient) = setup();
        let now = env.block_time();
        vault.authorize_agent(agent, motes(10), u64::MAX, ACTION_TRANSFER, now + 30 * DAY_MS);
        env.set_caller(agent);
        vault.agent_transfer(recipient, motes(10));
        env.advance_block_time(DAY_MS);
        // Window must never roll over: cap stays exhausted.
        assert_eq!(
            vault.try_agent_transfer(recipient, motes(1)).unwrap_err(),
            VaultError::SpendCapExceeded.into()
        );
    }

    #[test]
    fn get_owner_returns_deployer() {
        let (_env, vault, owner, _, _) = setup();
        assert_eq!(vault.get_owner(), owner);
    }
}
