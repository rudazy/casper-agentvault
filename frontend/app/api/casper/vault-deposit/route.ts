import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildOdraProxyCallArgs } from "@casper-ecosystem/odra-js-client";
import {
  Args,
  CasperNetwork,
  KeyAlgorithm,
  PrivateKey,
  SessionBuilder,
} from "casper-js-sdk";
import {
  CASPER_CHAIN_NAME,
  VAULT_PACKAGE_HASH,
  hasVaultContract,
  normalizePackageHash,
} from "@/lib/casper/contract-config";
import { createRpcClient } from "@/lib/casper/rpc";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Session payment for Odra proxy (motes). 5 CSPR is too low (out of gas). */
const PROXY_PAYMENT = 100_000_000_000;
const MAX_DEPOSIT_CSPR = 20;

function loadOperatorKey(): PrivateKey | null {
  // Prefer env (Vercel secret). Fallback to local gitignored pem for operator demos.
  const fromEnv = process.env.CASPER_VAULT_OPERATOR_PEM?.replace(/\\n/g, "\n")?.trim();
  if (fromEnv?.includes("PRIVATE KEY")) {
    const alg = fromEnv.includes("EC PRIVATE KEY")
      ? KeyAlgorithm.SECP256K1
      : KeyAlgorithm.ED25519;
    return PrivateKey.fromPem(fromEnv, alg);
  }

  const candidates = [
    join(process.cwd(), "..", "contracts", "agentvault-core", "secret_key.pem"),
    join(process.cwd(), "contracts", "agentvault-core", "secret_key.pem"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const pem = readFileSync(path, "utf8");
    const alg = pem.includes("EC PRIVATE KEY")
      ? KeyAlgorithm.SECP256K1
      : KeyAlgorithm.ED25519;
    return PrivateKey.fromPem(pem, alg);
  }
  return null;
}

function resolveProxyWasm(): Uint8Array {
  const candidates = [
    join(process.cwd(), "wasm", "proxy_caller_with_return.wasm"),
    join(process.cwd(), "public", "wasm", "proxy_caller_with_return.wasm"),
    join(process.cwd(), "frontend", "wasm", "proxy_caller_with_return.wasm"),
    join(process.cwd(), "frontend", "public", "wasm", "proxy_caller_with_return.wasm"),
    join(__dirname, "..", "..", "..", "wasm", "proxy_caller_with_return.wasm"),
    join(__dirname, "..", "..", "..", "public", "wasm", "proxy_caller_with_return.wasm"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return new Uint8Array(readFileSync(path));
  }
  throw new Error("Missing proxy_caller_with_return.wasm on server.");
}

function csprToMotes(amount: unknown, fallback = "2"): string {
  const raw = typeof amount === "string" || typeof amount === "number" ? String(amount) : fallback;
  const cspr = Number(raw);
  if (!Number.isFinite(cspr) || cspr <= 0) {
    return String(Math.round(Number(fallback) * 1_000_000_000));
  }
  const capped = Math.min(cspr, MAX_DEPOSIT_CSPR);
  return String(Math.round(capped * 1_000_000_000));
}

/**
 * Owner-operated payable deposit.
 * CSPR.click rejects large session+WASM sign payloads (HTTP 413). This route
 * signs the Odra proxy session with the package operator key and broadcasts
 * directly to casper-test — only when the connected publicKey matches the operator.
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

    const operator = loadOperatorKey();
    if (!operator) {
      return NextResponse.json(
        {
          error:
            "Server operator key not configured. Set CASPER_VAULT_OPERATOR_PEM " +
            "(same key that owns the Vault package) for wallet-friendly deposits. " +
            "Large session deposits cannot be signed via CSPR.click (413).",
          code: "OPERATOR_KEY_MISSING",
        },
        { status: 503 },
      );
    }

    const operatorHex = operator.publicKey.toHex().toLowerCase();
    const callerHex = body.publicKey.trim().toLowerCase();
    if (operatorHex !== callerHex) {
      return NextResponse.json(
        {
          error:
            "Deposit via server is only available for the Vault package owner key. " +
            "Connected wallet is not the operator. Install your own Vault package " +
            "or connect the owner wallet. (CSPR.click cannot sign large payable session txs.)",
          code: "NOT_OPERATOR",
          operatorPublicKeyPrefix: `${operatorHex.slice(0, 12)}...`,
        },
        { status: 403 },
      );
    }

    const amountMotes = csprToMotes(body.amountCspr, "2");
    let proxyWasm: Uint8Array;
    try {
      proxyWasm = resolveProxyWasm();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        {
          error: `${msg} cwd=${process.cwd()}`,
          code: "PROXY_WASM_MISSING",
        },
        { status: 500 },
      );
    }

    if (proxyWasm.byteLength < 1000) {
      return NextResponse.json(
        {
          error: `Proxy WASM looks corrupt (size=${proxyWasm.byteLength}).`,
          code: "PROXY_WASM_INVALID",
        },
        { status: 500 },
      );
    }

    let transaction;
    try {
      const outerArgs = buildOdraProxyCallArgs(
        normalizePackageHash(VAULT_PACKAGE_HASH),
        "deposit",
        Args.fromMap({}),
        amountMotes,
      );

      transaction = new SessionBuilder()
        .from(operator.publicKey)
        .wasm(proxyWasm)
        .runtimeArgs(outerArgs)
        .chainName(CASPER_CHAIN_NAME)
        .ttl(1_800_000)
        .payment(PROXY_PAYMENT, 1)
        .build();

      transaction.sign(operator);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        {
          error: `Failed to build/sign payable deposit session: ${msg}`,
          code: "SESSION_BUILD_FAILED",
          hint:
            "Usually a casper-js-sdk bundling issue. Ensure serverExternalPackages includes casper-js-sdk.",
        },
        { status: 500 },
      );
    }

    const rpc = createRpcClient();
    const network = await CasperNetwork.create(rpc);
    let result;
    try {
      result = await network.putTransaction(transaction);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        {
          error: `Node rejected deposit transaction: ${msg}`,
          code: "PUT_TRANSACTION_FAILED",
        },
        { status: 502 },
      );
    }
    const transactionHash =
      result && "transactionHash" in result && result.transactionHash
        ? result.transactionHash.toHex()
        : result && "deployHash" in result && result.deployHash
          ? result.deployHash.toHex()
          : null;

    if (!transactionHash) {
      throw new Error("Node accepted deposit but returned no transaction hash.");
    }

    const cspr = (Number(amountMotes) / 1_000_000_000).toFixed(2);
    return NextResponse.json({
      transactionHash,
      amountCspr: cspr,
      mode: "operator_session",
      preview: `Vault.deposit() ${cspr} CSPR via server-signed Odra proxy (owner only)`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Vault deposit failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
