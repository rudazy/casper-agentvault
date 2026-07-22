/**
 * Client-side Vault.deposit builder.
 * Server-built session txs embed proxy WASM (~185KB) and hit HTTP 413 / wallet payload limits
 * when returned through /api/casper/actions. Static /wasm + browser SessionBuilder avoids that.
 */
import { buildOdraProxyCallArgs } from "@casper-ecosystem/odra-js-client";
import { Args, PublicKey, SessionBuilder, type Transaction } from "casper-js-sdk";
import {
  CASPER_CHAIN_NAME,
  DEFAULT_TTL_MS,
  VAULT_PACKAGE_HASH,
  hasVaultContract,
  normalizePackageHash,
} from "@/lib/casper/contract-config";

const PROXY_WASM_URL = "/wasm/proxy_caller_with_return.wasm";
/** Session gas for Odra proxy (5 CSPR is too low → out of gas). */
const PROXY_PAYMENT_MOTES = 100_000_000_000;

function csprToMotes(amount: unknown, fallback = "2"): string {
  const raw = typeof amount === "string" || typeof amount === "number" ? String(amount) : fallback;
  const cspr = Number(raw);
  if (!Number.isFinite(cspr) || cspr <= 0) {
    return String(Math.round(Number(fallback) * 1_000_000_000));
  }
  return String(Math.round(cspr * 1_000_000_000));
}

let cachedProxyWasm: Uint8Array | null = null;

async function loadProxyWasm(): Promise<Uint8Array> {
  if (cachedProxyWasm) return cachedProxyWasm;
  const res = await fetch(PROXY_WASM_URL);
  if (!res.ok) {
    throw new Error(
      `Failed to load payable proxy WASM (${res.status}). Ensure public/wasm/proxy_caller_with_return.wasm is deployed.`,
    );
  }
  cachedProxyWasm = new Uint8Array(await res.arrayBuffer());
  return cachedProxyWasm;
}

export async function buildVaultDepositClient(
  publicKeyHex: string,
  payload?: Record<string, unknown>,
): Promise<{ label: string; preview: string; transaction: Transaction }> {
  if (!hasVaultContract()) {
    throw new Error(
      "Vault package hash is not configured. Set NEXT_PUBLIC_VAULT_PACKAGE_HASH or install a Vault package.",
    );
  }

  const amountMotes = csprToMotes(payload?.depositAmountCspr, "2");
  const cspr = (Number(amountMotes) / 1_000_000_000).toFixed(2);
  const proxyWasm = await loadProxyWasm();
  const outerArgs = buildOdraProxyCallArgs(
    normalizePackageHash(VAULT_PACKAGE_HASH),
    "deposit",
    Args.fromMap({}),
    amountMotes,
  );

  const transaction = new SessionBuilder()
    .from(PublicKey.fromHex(publicKeyHex))
    .wasm(proxyWasm)
    .runtimeArgs(outerArgs)
    .chainName(CASPER_CHAIN_NAME)
    .ttl(DEFAULT_TTL_MS)
    .payment(PROXY_PAYMENT_MOTES, 1)
    .build();

  return {
    label: "Deposit to vault",
    preview: `Vault.deposit() via Odra payable proxy — ${cspr} CSPR attached (keep ~100 CSPR free for session payment)`,
    transaction,
  };
}
