import { HumanMessage } from "@langchain/core/messages";
import { createChatModel } from "./llm.js";
import { buildPrompt, parseAgentRecommendation } from "./parse-response.js";
import type {
  AgentModule,
  AgentRecommendation,
  AgentRequest,
  AgentResult,
  ContractActionId,
} from "./types.js";

export async function runWithReasoning(
  agentName: string,
  module: AgentModule,
  role: string,
  request: AgentRequest,
  fallback: AgentRecommendation,
): Promise<AgentResult> {
  const model = createChatModel();

  if (!model) {
    return {
      agent: agentName,
      module,
      actionId: request.actionId,
      recommendation: fallback,
      usedLlm: false,
    };
  }

  const prompt = buildPrompt(role, request.actionId, {
    publicKey: request.publicKey,
    payload: request.payload ?? {},
    chain: process.env.CASPER_CHAIN_NAME ?? "casper-test",
  });

  const response = await model.invoke([new HumanMessage(prompt)]);
  const text =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return {
    agent: agentName,
    module,
    actionId: request.actionId,
    recommendation: parseAgentRecommendation(text, fallback),
    usedLlm: true,
    rawModelOutput: text,
  };
}

export function assertAction(
  request: AgentRequest,
  allowed: ContractActionId[],
): void {
  if (!allowed.includes(request.actionId)) {
    throw new Error(
      `Action "${request.actionId}" is not handled by ${request.module} agent.`,
    );
  }
}