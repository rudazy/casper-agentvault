import { coordinator } from "@/lib/agents/server/coordinator";
import type { ContractActionId } from "@/lib/casper/contract-actions";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_ACTIONS: ContractActionId[] = [
  "guardian_scan",
  "guardian_rebalance",
  "guardian_risk_log",
  "rwa_submit",
  "rwa_verify",
  "rwa_publish",
  "market_browse",
  "market_post_job",
  "market_release",
];

function isActionId(value: unknown): value is ContractActionId {
  return typeof value === "string" && VALID_ACTIONS.includes(value as ContractActionId);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      actionId?: unknown;
      publicKey?: unknown;
      payload?: unknown;
    };

    if (!isActionId(body.actionId)) {
      return NextResponse.json({ error: "Invalid or missing actionId." }, { status: 400 });
    }

    const publicKey =
      typeof body.publicKey === "string" && body.publicKey.length > 0
        ? body.publicKey
        : undefined;

    const payload =
      body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
        ? (body.payload as Record<string, unknown>)
        : undefined;

    const result = await coordinator.dispatchByAction(body.actionId, {
      publicKey,
      payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent dispatch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}