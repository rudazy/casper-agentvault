import { queryTransactionState } from "@/lib/casper/submit-transaction";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const hash = new URL(request.url).searchParams.get("hash");

    if (!hash) {
      return NextResponse.json({ error: "Missing hash query parameter." }, { status: 400 });
    }

    const result = await queryTransactionState(hash);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to query transaction status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}