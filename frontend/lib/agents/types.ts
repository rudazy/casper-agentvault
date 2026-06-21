import type { ContractActionId } from "@/lib/casper/contract-action-types";

export interface AgentInsight {
  agent: string;
  summary: string;
  reasoning: string;
  confidence: number;
  nextSteps: string[];
  usedLlm: boolean;
  mode: string;
  preview?: string;
}

export interface AgentApiResponse {
  agent: string;
  module: string;
  actionId: ContractActionId;
  usedLlm: boolean;
  recommendation: {
    contractAction: ContractActionId;
    mode: string;
    summary: string;
    reasoning: string;
    confidence: number;
    nextSteps: string[];
    preview?: string;
  };
}

export interface AgentQueryParams {
  actionId: ContractActionId;
  publicKey?: string;
  payload?: Record<string, unknown>;
}