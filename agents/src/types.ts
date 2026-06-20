export type AgentModule = "guardian" | "rwa" | "marketplace";

export type ContractActionId =
  | "guardian_scan"
  | "guardian_rebalance"
  | "guardian_risk_log"
  | "rwa_submit"
  | "rwa_verify"
  | "rwa_publish"
  | "market_browse"
  | "market_post_job"
  | "market_release";

export type ActionMode = "mock" | "rpc" | "transaction" | "advisory";

export interface AgentRequest {
  module: AgentModule;
  actionId: ContractActionId;
  publicKey?: string;
  payload?: Record<string, unknown>;
}

export interface AgentRecommendation {
  contractAction: ContractActionId;
  mode: ActionMode;
  summary: string;
  reasoning: string;
  confidence: number;
  nextSteps: string[];
  preview?: string;
}

export interface AgentResult {
  agent: string;
  module: AgentModule;
  actionId: ContractActionId;
  recommendation: AgentRecommendation;
  usedLlm: boolean;
  rawModelOutput?: string;
}

export interface AgentHandler {
  readonly name: string;
  readonly module: AgentModule;
  run(request: AgentRequest): Promise<AgentResult>;
}