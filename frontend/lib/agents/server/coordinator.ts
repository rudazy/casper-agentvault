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

type AgentModule = "guardian" | "rwa" | "marketplace" | "vault";

const MODULE_ACTIONS: Record<AgentModule, ContractActionId[]> = {
  guardian: ["guardian_scan", "guardian_rebalance", "guardian_risk_log"],
  rwa: ["rwa_submit", "rwa_verify", "rwa_publish"],
  marketplace: ["market_browse", "market_post_job", "market_release"],
  vault: ["vault_deposit", "vault_authorize", "vault_transfer", "vault_revoke"],
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
  async dispatchByAction(actionId: ContractActionId, options?: AgentDispatchOptions) {
    void options;
    const resolvedModule = resolveModule(actionId);
    if (!resolvedModule) {
      throw new Error(`No module registered for action "${actionId}".`);
    }

    return {
      agent: "mock-coordinator",
      module: resolvedModule,
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