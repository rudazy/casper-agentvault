import { assertAction, runWithReasoning } from "./agent-runner.js";
import type { AgentHandler, AgentRecommendation, AgentRequest, AgentResult } from "./types.js";

const GUARDIAN_ACTIONS = [
  "guardian_scan",
  "guardian_rebalance",
  "guardian_risk_log",
] as const;

function fallbackFor(actionId: AgentRequest["actionId"]): AgentRecommendation {
  const map: Record<(typeof GUARDIAN_ACTIONS)[number], AgentRecommendation> = {
    guardian_scan: {
      contractAction: "guardian_scan",
      mode: "rpc",
      summary: "Scan wallet balance and refresh position snapshot.",
      reasoning:
        "Live RPC balance is the ground truth before any rebalance simulation.",
      confidence: 0.92,
      nextSteps: [
        "Query latest purse balance via Casper RPC.",
        "Compare against reserve buffer guardrail (5%).",
      ],
      preview: "queryLatestBalance(publicKey)",
    },
    guardian_rebalance: {
      contractAction: "guardian_rebalance",
      mode: "mock",
      summary: "Rebalance simulation passed all guardrails.",
      reasoning:
        "Top pool at 32% is below the 40% cap. Drawdown at 2.1% is within 5% limit.",
      confidence: 0.88,
      nextSteps: [
        "Shift 4% from LP rewards to liquid staking.",
        "Keep reserve buffer at 8%.",
        "Schedule next check in 14 minutes.",
      ],
    },
    guardian_risk_log: {
      contractAction: "guardian_risk_log",
      mode: "mock",
      summary: "Risk log clear — one oracle latency watch item.",
      reasoning:
        "No drawdown or concentration breaches. Oracle drift at 420ms is within tolerance.",
      confidence: 0.9,
      nextSteps: [
        "Continue monitoring oracle drift.",
        "Alert if latency exceeds 800ms.",
      ],
    },
  };

  return map[actionId as (typeof GUARDIAN_ACTIONS)[number]];
}

export class GuardianAgent implements AgentHandler {
  readonly name = "Portfolio Guardian";
  readonly module = "guardian" as const;

  async run(request: AgentRequest): Promise<AgentResult> {
    assertAction(request, [...GUARDIAN_ACTIONS]);
    return runWithReasoning(
      this.name,
      this.module,
      "Portfolio Guardian — autonomous DeFi yield and risk sentinel on Casper",
      request,
      fallbackFor(request.actionId),
    );
  }
}

export const guardianAgent = new GuardianAgent();