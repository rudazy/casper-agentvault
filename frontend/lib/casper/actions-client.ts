import type { ContractActionId } from "@/lib/casper/contract-action-types";

export interface ActionBuildResponse {
  actionId: ContractActionId;
  label: string;
  mode: "transaction" | "rpc" | "mock";
  preview?: string;
  transaction?: Record<string, unknown>;
  balance?: string;
}

export async function requestActionBuild(
  actionId: ContractActionId,
  publicKey: string,
  payload?: Record<string, unknown>,
): Promise<ActionBuildResponse> {
  const res = await fetch("/api/casper/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actionId, publicKey, payload }),
  });

  const data = (await res.json()) as ActionBuildResponse & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to prepare on-chain action.");
  }

  return data;
}