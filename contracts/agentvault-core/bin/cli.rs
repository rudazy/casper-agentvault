//! CLI tool for deploying and interacting with AgentVault core contracts.

use odra::host::HostEnv;
use odra::schema::casper_contract_schema::NamedCLType;
use odra_cli::{
    deploy::DeployScript,
    scenario::{Args, Error, Scenario, ScenarioMetadata},
    CommandArg, DeployedContractsContainer, OdraCli,
};

/// Deploys contracts and adds them to the container.
pub struct AgentVaultDeployScript;

impl DeployScript for AgentVaultDeployScript {
    fn deploy(
        &self,
        _env: &HostEnv,
        _container: &mut DeployedContractsContainer,
    ) -> Result<(), odra_cli::deploy::Error> {
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
        .scenario(AgentVaultScenario)
        .build()
        .run();
}