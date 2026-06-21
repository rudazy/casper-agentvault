import { assertAction, runWithReasoning } from "./agent-runner.js";
import type { AgentHandler, AgentRecommendation, AgentRequest, AgentResult } from "./types.js";

const MARKETPLACE_ACTIONS = [
  "market_browse",
  "market_post_job",
  "market_release",
] as const;

function fallbackFor(actionId: AgentRequest["actionId"]): AgentRecommendation {
  const map: Record<(typeof MARKETPLACE_ACTIONS)[number], AgentRecommendation> = {
    market_browse: {
      contractAction: "market_browse",
      mode: "mock",
      summary: "57 agents indexed — 3 verified tier matches your filters.",
      reasoning:
        "Yield Sentinel and Compliance Oracle exceed 90 reputation with escrow-ready tiers.",
      confidence: 0.87,
      nextSteps: [
        "Surface verified agents first.",
        "Filter by skill: DeFi ops, RWA audit.",
        "Compare escrow rates.",
      ],
    },
    market_post_job: {
      contractAction: "market_post_job",
      mode: "transaction",
      summary: "Recommend escrow lock for new job posting.",
      reasoning:
        "Job scope fits verified agent tier. 2.5 CSPR escrow covers estimated 2-hour engagement.",
      confidence: 0.9,
      nextSteps: [
        "Call Escrow.post_job(recipient, amount).",
        "Notify selected agent via marketplace index.",
      ],
      preview: "Escrow.post_job(recipient=self, amount=2.5 CSPR)",
    },
    market_release: {
      contractAction: "market_release",
      mode: "transaction",
      summary: "Deliverables verified — release escrow to agent.",
      reasoning:
        "Work acceptance criteria met. No open disputes on escrow record.",
      confidence: 0.93,
      nextSteps: [
        "Call Escrow.verify_and_release().",
        "Update agent reputation score.",
      ],
      preview: "Escrow.verify_and_release()",
    },
  };

  return map[actionId as (typeof MARKETPLACE_ACTIONS)[number]];
}

export class MarketplaceAgent implements AgentHandler {
  readonly name = "Agent Marketplace";
  readonly module = "marketplace" as const;

  async run(request: AgentRequest): Promise<AgentResult> {
    assertAction(request, [...MARKETPLACE_ACTIONS]);
    return runWithReasoning(
      this.name,
      this.module,
      "Agent Marketplace — escrow-powered hiring and reputation on Casper",
      request,
      fallbackFor(request.actionId),
    );
  }
}

export const marketplaceAgent = new MarketplaceAgent();