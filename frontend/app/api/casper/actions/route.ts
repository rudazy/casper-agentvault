import type { ContractActionId } from "@/lib/casper/contract-action-types";
import { buildAction, queryAccountBalance } from "@/lib/casper/contract-actions";
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

    if (typeof body.publicKey !== "string" || body.publicKey.length === 0) {
      return NextResponse.json({ error: "Missing publicKey." }, { status: 400 });
    }

    const payload =
      body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
        ? (body.payload as Record<string, unknown>)
        : undefined;

    const built = await buildAction(body.actionId, body.publicKey, payload);

    if (built.mode === "rpc") {
      const balance = await queryAccountBalance(body.publicKey);
      return NextResponse.json({
        actionId: built.actionId,
        label: built.label,
        mode: built.mode,
        preview: built.preview,
        balance,
      });
    }

    if (built.mode === "transaction" && built.transaction) {
      const transactionJson = built.transaction.toJSON();
      const transaction =
        typeof transactionJson === "string"
          ? (JSON.parse(transactionJson) as Record<string, unknown>)
          : (transactionJson as Record<string, unknown>);

      return NextResponse.json({
        actionId: built.actionId,
        label: built.label,
        mode: built.mode,
        preview: built.preview,
        transaction,
      });
    }

    return NextResponse.json({
      actionId: built.actionId,
      label: built.label,
      mode: built.mode,
      preview: built.preview,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build contract action.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}