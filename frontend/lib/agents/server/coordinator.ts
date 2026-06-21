import type { ContractActionId } from "@/lib/casper/contract-actions";

type AgentModule = "guardian" | "rwa" | "marketplace";

const MODULE_ACTIONS: Record<AgentModule, ContractActionId[]> = {
  guardian: ["guardian_scan", "guardian_rebalance", "guardian_risk_log"],
  rwa: ["rwa_submit", "rwa_verify", "rwa_publish"],
  marketplace: ["market_browse", "market_post_job", "market_release"],
};

function resolveModule(actionId: ContractActionId): AgentModule | null {
  for (const [module, actions] of Object.entries(MODULE_ACTIONS)) {
    if (actions.includes(actionId)) {
      return module as AgentModule;
    }
  }
  return null;
}

class MockAgentCoordinator {
  async dispatchByAction(
    actionId: ContractActionId,
    _options: { publicKey?: string; payload?: Record<string, unknown> } = {},
  ) {
    const module = resolveModule(actionId);
    if (!module) {
      throw new Error(`No module registered for action "${actionId}".`);
    }

    return {
      agent: "mock-coordinator",
      module,
      actionId,
      usedLlm: false,
      recommendation: {
        contractAction: actionId,
        mode: "mock" as const,
        summary: "Mock agent coordinator — agents runtime not built yet.",
        reasoning: "The agents package has not been compiled for production.",
        confidence: 0,
        nextSteps: ["Build and sync the agents package before enabling live dispatch."],
      },
    };
  }
}

export const coordinator = new MockAgentCoordinator();
export default coordinator;