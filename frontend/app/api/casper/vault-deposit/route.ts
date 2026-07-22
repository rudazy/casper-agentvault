import {
  CasperNetwork,
} from "casper-js-sdk";
import {
  hasVaultContract,
} from "@/lib/casper/contract-config";
import { loadOperatorPrivateKey } from "@/lib/casper/operator-pem";
import { createPutRpcClient, createRpcClient } from "@/lib/casper/rpc";
import {
  MIN_TRANSFER_MOTES,
  buildVaultPurseFundTransaction,
  putVaultFundTransaction,
  resolveVaultMainPurseUref,
} from "@/lib/casper/vault-purse";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_DEPOSIT_CSPR = 20;
/** Casper min transfer is 2.5 CSPR — default deposit must meet it. */
const DEFAULT_DEPOSIT_CSPR = "3";

function csprToMotes(amount: unknown, fallback = DEFAULT_DEPOSIT_CSPR): string {
  const raw =
    typeof amount === "string" || typeof amount === "number"
      ? String(amount)
      : fallback;
  const cspr = Number(raw);
  if (!Number.isFinite(cspr) || cspr <= 0) {
    return String(Math.round(Number(fallback) * 1_000_000_000));
  }
  const capped = Math.min(cspr, MAX_DEPOSIT_CSPR);
  return String(Math.round(capped * 1_000_000_000));
}

/**
 * Owner-operated vault fund.
 *
 * Avoids Odra payable proxy session WASM (~370KB JSON) which CSPR.click and
 * Vercel→RPC paths reject with HTTP 413. Instead: native transfer into the
 * contract `__contract_main_purse` (vault_balance = self_balance).
 *
 * Requires CASPER_VAULT_OPERATOR_PEM matching the connected wallet.
 */
export async function POST(request: Request) {
  try {
    if (!hasVaultContract()) {
      return NextResponse.json(
        { error: "Vault package hash is not configured." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      publicKey?: unknown;
      amountCspr?: unknown;
    };

    if (typeof body.publicKey !== "string" || body.publicKey.length < 16) {
      return NextResponse.json({ error: "Missing publicKey." }, { status: 400 });
    }

    const operatorLoad = loadOperatorPrivateKey();
    if (!operatorLoad.ok) {
      return NextResponse.json(
        {
          error: operatorLoad.detail,
          code:
            operatorLoad.reason === "invalid"
              ? "OPERATOR_KEY_INVALID"
              : "OPERATOR_KEY_MISSING",
        },
        { status: operatorLoad.reason === "invalid" ? 500 : 503 },
      );
    }
    const operator = operatorLoad.key;

    const operatorHex = operator.publicKey.toHex().toLowerCase();
    const callerHex = body.publicKey.trim().toLowerCase();
    if (operatorHex !== callerHex) {
      return NextResponse.json(
        {
          error:
            "Deposit via server is only available for the Vault package owner key. " +
            "Connected wallet is not the operator. Install your own Vault package " +
            "or connect the owner wallet.",
          code: "NOT_OPERATOR",
          operatorPublicKeyPrefix: `${operatorHex.slice(0, 12)}...`,
        },
        { status: 403 },
      );
    }

    let amountMotes = csprToMotes(body.amountCspr, DEFAULT_DEPOSIT_CSPR);
    if (BigInt(amountMotes) < BigInt(MIN_TRANSFER_MOTES)) {
      // Bump silently to network minimum so UI "2" still funds.
      amountMotes = String(MIN_TRANSFER_MOTES);
    }

    const queryRpc = createRpcClient();
    let purse;
    try {
      purse = await resolveVaultMainPurseUref(queryRpc);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        {
          error: `Could not resolve Vault main purse: ${msg}`,
          code: "VAULT_PURSE_MISSING",
        },
        { status: 500 },
      );
    }

    let transaction;
    try {
      transaction = buildVaultPurseFundTransaction(operator, purse, amountMotes);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        {
          error: `Failed to build vault fund transfer: ${msg}`,
          code: "TRANSFER_BUILD_FAILED",
        },
        { status: 500 },
      );
    }

    const network = await CasperNetwork.create(createPutRpcClient());
    let transactionHash: string;
    try {
      transactionHash = await putVaultFundTransaction(network, transaction);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        {
          error: `Node rejected vault fund transfer: ${msg}`,
          code: "PUT_TRANSACTION_FAILED",
        },
        { status: 502 },
      );
    }

    const cspr = (Number(amountMotes) / 1_000_000_000).toFixed(2);
    return NextResponse.json({
      transactionHash,
      amountCspr: cspr,
      mode: "operator_purse_transfer",
      preview: `Funded Vault main purse with ${cspr} CSPR (native transfer — vault_balance increases)`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Vault deposit failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
