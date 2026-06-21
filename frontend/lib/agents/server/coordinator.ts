import type { ContractActionId } from "@/lib/casper/contract-action-types";

type AgentDispatchOptions = {
  publicKey?: string;
  payload?: Record<string, unknown>;
};

type CoordinatorLike = {
  dispatchByAction: (
    actionId: ContractActionId,
    options?: AgentDispatchOptions,
  ) => Promise<unknown>;
};

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

class MockAgentCoordinator implements CoordinatorLike {
  async dispatchByAction(actionId: ContractActionId, _options: AgentDispatchOptions = {}) {
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
        summary: "Agent advisory response pending full coordinator deployment.",
        reasoning:
          "Module agents are operating in advisory mode until the coordinator runtime is synced.",
        confidence: 0,
        nextSteps: ["Connect your wallet and retry after the coordinator service is available."],
      },
    };
  }
}

const mockCoordinator = new MockAgentCoordinator();

export async function dispatchAgentAction(
  actionId: ContractActionId,
  options: AgentDispatchOptions = {},
) {
  try {
    const mod = await import("../runtime/dist/coordinator.js");
    return await mod.coordinator.dispatchByAction(actionId, options);
  } catch {
    return mockCoordinator.dispatchByAction(actionId, options);
  }
}