import { broadcastSignedTransaction } from "@/lib/casper/submit-transaction";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { transaction?: unknown };

    if (!body.transaction || typeof body.transaction !== "object") {
      return NextResponse.json({ error: "Missing signed transaction." }, { status: 400 });
    }

    const transactionHash = await broadcastSignedTransaction(body.transaction);

    return NextResponse.json({ transactionHash });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to broadcast transaction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}