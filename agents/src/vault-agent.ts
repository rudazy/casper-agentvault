import { assertAction, runWithReasoning } from "./agent-runner.js";
import type { AgentHandler, AgentRecommendation, AgentRequest, AgentResult } from "./types.js";

const VAULT_ACTIONS = [
  "vault_deposit",
  "vault_authorize",
  "vault_transfer",
  "vault_revoke",
] as const;

function fallbackFor(actionId: AgentRequest["actionId"]): AgentRecommendation {
  const map: Record<(typeof VAULT_ACTIONS)[number], AgentRecommendation> = {
    vault_deposit: {
      contractAction: "vault_deposit",
      mode: "transaction",
      summary: "Fund the session vault so authorized agents can spend within policy.",
      reasoning:
        "Owner deposits CSPR into the Vault package. Balance is held on-chain and only spent through policy-gated agent_transfer.",
      confidence: 0.92,
      nextSteps: [
        "Call Vault.deposit with attached CSPR.",
        "Authorize an agent key with spend cap and expiry.",
      ],
      preview: "Vault.deposit()",
    },
    vault_authorize: {
      contractAction: "vault_authorize",
      mode: "transaction",
      summary: "Grant a bounded agent session key with spend cap and expiry.",
      reasoning:
        "Session keys are the core agentic primitive: agents act without the owner key, but cannot exceed cap, window, action bitmask, or expiry.",
      confidence: 0.94,
      nextSteps: [
        "Call Vault.authorize_agent(agent, spend_cap, period_ms, allowed_actions, expires_at).",
        "Agent may call agent_transfer until cap or expiry.",
      ],
      preview: "Vault.authorize_agent(...)",
    },
    vault_transfer: {
      contractAction: "vault_transfer",
      mode: "transaction",
      summary: "Execute a policy-checked agent spend from the vault.",
      reasoning:
        "Agent key signs agent_transfer. Contract enforces active policy, expiry, ACTION_TRANSFER bitmask, rolling spend window, and vault balance.",
      confidence: 0.93,
      nextSteps: [
        "Sign as the authorized agent account.",
        "Confirm spent_in_window advances and events emit AgentSpent.",
      ],
      preview: "Vault.agent_transfer(recipient, amount)",
    },
    vault_revoke: {
      contractAction: "vault_revoke",
      mode: "transaction",
      summary: "Revoke an agent session key immediately (panic button).",
      reasoning:
        "Owner can revoke without waiting for expiry. Revocation is idempotent so emergency ops never fail on double-click.",
      confidence: 0.95,
      nextSteps: [
        "Call Vault.revoke_agent(agent).",
        "Confirm subsequent agent_transfer reverts with AgentRevoked.",
      ],
      preview: "Vault.revoke_agent(agent)",
    },
  };

  return map[actionId as (typeof VAULT_ACTIONS)[number]];
}

export class VaultAgent implements AgentHandler {
  readonly name = "Session Vault Controller";
  readonly module = "vault" as const;

  async run(request: AgentRequest): Promise<AgentResult> {
    assertAction(request, [...VAULT_ACTIONS]);
    return runWithReasoning(
      this.name,
      this.module,
      "Session Vault — bounded agent spending authority on Casper",
      request,
      fallbackFor(request.actionId),
    );
  }
}

export const vaultAgent = new VaultAgent();
