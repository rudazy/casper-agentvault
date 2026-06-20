import { assertAction, runWithReasoning } from "./agent-runner.js";
import type { AgentHandler, AgentRecommendation, AgentRequest, AgentResult } from "./types.js";

const RWA_ACTIONS = ["rwa_submit", "rwa_verify", "rwa_publish"] as const;

function fallbackFor(actionId: AgentRequest["actionId"]): AgentRecommendation {
  const map: Record<(typeof RWA_ACTIONS)[number], AgentRecommendation> = {
    rwa_submit: {
      contractAction: "rwa_submit",
      mode: "mock",
      summary: "Asset intake queued for compliance review.",
      reasoning:
        "Metadata hash and jurisdiction captured. Oracle will run KYC/AML rules before attestation.",
      confidence: 0.86,
      nextSteps: [
        "Validate document hash format.",
        "Run jurisdiction-specific compliance checks.",
        "Add to verification queue.",
      ],
    },
    rwa_verify: {
      contractAction: "rwa_verify",
      mode: "transaction",
      summary: "Hash verified — recommend on-chain reputation update.",
      reasoning:
        "Document hash matches submitted intake. Score 94 meets publish threshold.",
      confidence: 0.91,
      nextSteps: [
        "Call Attestation.update_reputation(new_score=94).",
        "Emit audit trail to activity log.",
      ],
      preview: "Attestation.update_reputation(new_score=94)",
    },
    rwa_publish: {
      contractAction: "rwa_publish",
      mode: "transaction",
      summary: "Ready to publish attestation on Casper.",
      reasoning:
        "Compliance checks passed. Initial trust score 85 is appropriate for new asset class.",
      confidence: 0.89,
      nextSteps: [
        "Call Attestation.init with data_hash and initial_score.",
        "Index attestation for marketplace reputation.",
      ],
      preview: 'Attestation.init(data_hash, initial_score=85)',
    },
  };

  return map[actionId as (typeof RWA_ACTIONS)[number]];
}

export class RwaAgent implements AgentHandler {
  readonly name = "RWA Compliance Oracle";
  readonly module = "rwa" as const;

  async run(request: AgentRequest): Promise<AgentResult> {
    assertAction(request, [...RWA_ACTIONS]);
    return runWithReasoning(
      this.name,
      this.module,
      "RWA Compliance Oracle — trustless attestations for real-world assets on Casper",
      request,
      fallbackFor(request.actionId),
    );
  }
}

export const rwaAgent = new RwaAgent();