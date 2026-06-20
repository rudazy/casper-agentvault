import type { AgentRecommendation, ContractActionId, ActionMode } from "./types.js";

interface ParsedAgentJson {
  summary?: string;
  reasoning?: string;
  confidence?: number;
  nextSteps?: string[];
  mode?: ActionMode;
  preview?: string;
}

export function extractJsonBlock(text: string): string | null {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }

  return null;
}

export function parseAgentRecommendation(
  text: string,
  fallback: AgentRecommendation,
): AgentRecommendation {
  const jsonText = extractJsonBlock(text);
  if (!jsonText) return fallback;

  try {
    const parsed = JSON.parse(jsonText) as ParsedAgentJson;
    return {
      contractAction: fallback.contractAction,
      mode: parsed.mode ?? fallback.mode,
      summary: parsed.summary?.trim() || fallback.summary,
      reasoning: parsed.reasoning?.trim() || fallback.reasoning,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.min(1, Math.max(0, parsed.confidence))
          : fallback.confidence,
      nextSteps:
        Array.isArray(parsed.nextSteps) && parsed.nextSteps.length > 0
          ? parsed.nextSteps.map(String)
          : fallback.nextSteps,
      preview: parsed.preview?.trim() || fallback.preview,
    };
  } catch {
    return fallback;
  }
}

export function buildPrompt(
  role: string,
  actionId: ContractActionId,
  context: Record<string, unknown>,
): string {
  return [
    `You are the ${role} for Casper AgentVault.`,
    `Analyze action "${actionId}" and respond with JSON only:`,
    "{",
    '  "summary": "one-line decision",',
    '  "reasoning": "short technical rationale",',
    '  "confidence": 0.0,',
    '  "nextSteps": ["step 1", "step 2"],',
    '  "mode": "mock|rpc|transaction|advisory",',
    '  "preview": "optional on-chain call preview"',
    "}",
    "Context:",
    JSON.stringify(context, null, 2),
  ].join("\n");
}