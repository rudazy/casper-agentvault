import type { AgentApiResponse, AgentInsight, AgentQueryParams } from "@/lib/agents/types";

export function toAgentInsight(response: AgentApiResponse): AgentInsight {
  return {
    agent: response.agent,
    summary: response.recommendation.summary,
    reasoning: response.recommendation.reasoning,
    confidence: response.recommendation.confidence,
    nextSteps: response.recommendation.nextSteps,
    usedLlm: response.usedLlm,
    mode: response.recommendation.mode,
    preview: response.recommendation.preview,
  };
}

export async function queryAgent(params: AgentQueryParams): Promise<AgentApiResponse> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = (await res.json()) as AgentApiResponse & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Agent request failed.");
  }

  return data;
}