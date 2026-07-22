import { guardianAgent } from "./guardian-agent.js";
import { marketplaceAgent } from "./marketplace-agent.js";
import { rwaAgent } from "./rwa-agent.js";
import { vaultAgent } from "./vault-agent.js";
import type {
  AgentHandler,
  AgentModule,
  AgentRequest,
  AgentResult,
  ContractActionId,
} from "./types.js";

const MODULE_ACTIONS: Record<AgentModule, ContractActionId[]> = {
  guardian: ["guardian_scan", "guardian_rebalance", "guardian_risk_log"],
  rwa: ["rwa_submit", "rwa_verify", "rwa_publish"],
  marketplace: ["market_browse", "market_post_job", "market_release"],
  vault: ["vault_deposit", "vault_authorize", "vault_transfer", "vault_revoke"],
};

const HANDLERS: Record<AgentModule, AgentHandler> = {
  guardian: guardianAgent,
  rwa: rwaAgent,
  marketplace: marketplaceAgent,
  vault: vaultAgent,
};

export class AgentCoordinator {
  private readonly handlers: Record<AgentModule, AgentHandler>;

  constructor(handlers: Record<AgentModule, AgentHandler> = HANDLERS) {
    this.handlers = handlers;
  }

  listModules(): AgentModule[] {
    return Object.keys(this.handlers) as AgentModule[];
  }

  listActions(module: AgentModule): ContractActionId[] {
    return MODULE_ACTIONS[module];
  }

  resolveModule(actionId: ContractActionId): AgentModule | null {
    for (const [module, actions] of Object.entries(MODULE_ACTIONS)) {
      if (actions.includes(actionId)) {
        return module as AgentModule;
      }
    }
    return null;
  }

  async dispatch(request: AgentRequest): Promise<AgentResult> {
    const handler = this.handlers[request.module];
    if (!handler) {
      throw new Error(`Unknown module: ${request.module}`);
    }

    if (!MODULE_ACTIONS[request.module].includes(request.actionId)) {
      throw new Error(
        `Action "${request.actionId}" is not valid for module "${request.module}".`,
      );
    }

    return handler.run(request);
  }

  async dispatchByAction(
    actionId: ContractActionId,
    options: Omit<AgentRequest, "module" | "actionId"> = {},
  ): Promise<AgentResult> {
    const module = this.resolveModule(actionId);
    if (!module) {
      throw new Error(`No module registered for action "${actionId}".`);
    }

    return this.dispatch({
      module,
      actionId,
      ...options,
    });
  }
}

export const coordinator = new AgentCoordinator();