//! CLI tool for deploying and interacting with AgentVault core contracts.

use agentvault_core::attestation::{Attestation, AttestationInitArgs};
use agentvault_core::escrow::{Escrow, EscrowInitArgs};
use agentvault_core::vault::Vault;
use odra::casper_types::U512;
use odra::host::{HostEnv, NoArgs};
use odra::schema::casper_contract_schema::NamedCLType;
use odra_cli::{
    deploy::DeployScript,
    scenario::{Args, Error, Scenario, ScenarioMetadata},
    CommandArg, DeployedContractsContainer, DeployerExt, OdraCli,
};

const DEPLOY_GAS: u64 = 500_000_000_000;

/// Deploys contracts and adds them to the container.
pub struct AgentVaultDeployScript;

impl DeployScript for AgentVaultDeployScript {
    fn deploy(
        &self,
        env: &HostEnv,
        container: &mut DeployedContractsContainer,
    ) -> Result<(), odra_cli::deploy::Error> {
        env.set_gas(DEPLOY_GAS);

        Escrow::load_or_deploy(
            env,
            EscrowInitArgs {
                recipient: env.caller(),
                amount: U512::zero(),
            },
            container,
            DEPLOY_GAS,
        )?;

        Attestation::load_or_deploy(
            env,
            AttestationInitArgs {
                data_hash: String::from("agentvault-genesis"),
                initial_score: 0,
            },
            container,
            DEPLOY_GAS,
        )?;

        Vault::load_or_deploy(env, NoArgs, container, DEPLOY_GAS)?;

        Ok(())
    }
}

/// Placeholder scenario for local contract interaction.
pub struct AgentVaultScenario;

impl Scenario for AgentVaultScenario {
    fn args(&self) -> Vec<CommandArg> {
        vec![CommandArg::new(
            "action",
            "Action to perform against AgentVault contracts",
            NamedCLType::String,
        )]
    }

    fn run(
        &self,
        _env: &HostEnv,
        _container: &DeployedContractsContainer,
        args: Args,
    ) -> Result<(), Error> {
        let _action = args.get_single::<String>("action")?;
        Ok(())
    }
}

impl ScenarioMetadata for AgentVaultScenario {
    const NAME: &'static str = "agentvault";
    const DESCRIPTION: &'static str = "Interact with AgentVault core contracts.";
}

pub fn main() {
    OdraCli::new()
        .about("CLI tool for AgentVault core smart contracts")
        .deploy(AgentVaultDeployScript)
        .contract::<Escrow>()
        .contract::<Attestation>()
        .contract::<Vault>()
        .scenario(AgentVaultScenario)
        .build()
        .run();
}