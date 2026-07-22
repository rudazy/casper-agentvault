import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildOdraProxyCallArgs } from "@casper-ecosystem/odra-js-client";
import {
  Args,
  CasperNetwork,
  CLValue,
  Key,
  PublicKey,
  PurseIdentifier,
  SessionBuilder,
  type Transaction,
} from "casper-js-sdk";
import type { ContractActionId } from "@/lib/casper/contract-action-types";
import {
  ATTESTATION_PACKAGE_HASH,
  CASPER_CHAIN_NAME,
  DEFAULT_DEPLOY_COST,
  DEFAULT_TTL_MS,
  ESCROW_PACKAGE_HASH,
  VAULT_PACKAGE_HASH,
  hasAttestationContract,
  hasEscrowContract,
  hasVaultContract,
  normalizePackageHash,
} from "@/lib/casper/contract-config";
import { createRpcClient } from "@/lib/casper/rpc";

export type { ContractActionId } from "@/lib/casper/contract-action-types";

export interface ActionBuildResult {
  actionId: ContractActionId;
  label: string;
  mode: "transaction" | "rpc" | "mock";
  transaction?: Transaction;
  preview?: string;
}

let networkClient: CasperNetwork | null = null;

async function getNetwork(): Promise<CasperNetwork> {
  if (!networkClient) {
    networkClient = await CasperNetwork.create(createRpcClient());
  }
  return networkClient;
}

function senderKey(publicKeyHex: string): PublicKey {
  return PublicKey.fromHex(publicKeyHex);
}

function csprToMotes(amount: unknown, fallback = "2.5"): string {
  const raw = typeof amount === "string" || typeof amount === "number" ? String(amount) : fallback;
  const cspr = Number(raw);
  if (!Number.isFinite(cspr) || cspr <= 0) {
    return String(Math.round(Number(fallback) * 1_000_000_000));
  }
  return String(Math.round(cspr * 1_000_000_000));
}

function buildEscrowPostJob(
  network: CasperNetwork,
  publicKeyHex: string,
  payload?: Record<string, unknown>,
): Transaction {
  if (!hasEscrowContract()) {
    throw new Error("Set NEXT_PUBLIC_ESCROW_PACKAGE_HASH after deploying escrow.");
  }

  const sender = senderKey(publicKeyHex);
  const escrowMotes = csprToMotes(payload?.escrowAmount);
  const args = Args.fromMap({
    recipient: CLValue.newCLKey(Key.newKey(sender.accountHash().toPrefixedString())),
    amount: CLValue.newCLUInt512(escrowMotes),
  });

  return network.createContractPackageCallTransaction(
    sender,
    normalizePackageHash(ESCROW_PACKAGE_HASH),
    "post_job",
    CASPER_CHAIN_NAME,
    DEFAULT_DEPLOY_COST,
    args,
    DEFAULT_TTL_MS,
  );
}

function buildEscrowRelease(network: CasperNetwork, publicKeyHex: string): Transaction {
  if (!hasEscrowContract()) {
    throw new Error("Set NEXT_PUBLIC_ESCROW_PACKAGE_HASH after deploying escrow.");
  }

  const sender = senderKey(publicKeyHex);

  return network.createContractPackageCallTransaction(
    sender,
    normalizePackageHash(ESCROW_PACKAGE_HASH),
    "verify_and_release",
    CASPER_CHAIN_NAME,
    DEFAULT_DEPLOY_COST,
    Args.fromMap({}),
    DEFAULT_TTL_MS,
  );
}

function buildAttestationPublish(
  network: CasperNetwork,
  publicKeyHex: string,
  dataHash: string,
): Transaction {
  if (!hasAttestationContract()) {
    throw new Error(
      "Set NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH after deploying attestation.",
    );
  }

  const sender = senderKey(publicKeyHex);
  const args = Args.fromMap({
    data_hash: CLValue.newCLString(dataHash),
    initial_score: CLValue.newCLUInt32(85),
  });

  return network.createContractPackageCallTransaction(
    sender,
    normalizePackageHash(ATTESTATION_PACKAGE_HASH),
    "publish",
    CASPER_CHAIN_NAME,
    DEFAULT_DEPLOY_COST,
    args,
    DEFAULT_TTL_MS,
  );
}

function buildAttestationUpdate(
  network: CasperNetwork,
  publicKeyHex: string,
  score: number,
): Transaction {
  if (!hasAttestationContract()) {
    throw new Error(
      "Set NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH after deploying attestation.",
    );
  }

  const sender = senderKey(publicKeyHex);
  const args = Args.fromMap({
    new_score: CLValue.newCLUInt32(score),
  });

  return network.createContractPackageCallTransaction(
    sender,
    normalizePackageHash(ATTESTATION_PACKAGE_HASH),
    "update_reputation",
    CASPER_CHAIN_NAME,
    DEFAULT_DEPLOY_COST,
    args,
    DEFAULT_TTL_MS,
  );
}

const ACTION_TRANSFER_BIT = 1;

function requireVault(): void {
  if (!hasVaultContract()) {
    throw new Error(
      "Set NEXT_PUBLIC_VAULT_PACKAGE_HASH after deploying Vault (or deploy Vault from the dashboard and sync hashes).",
    );
  }
}

function addressFromHex(publicKeyHex: string): CLValue {
  const key = senderKey(publicKeyHex);
  return CLValue.newCLKey(Key.newKey(key.accountHash().toPrefixedString()));
}

function parseAgentKey(
  payload?: Record<string, unknown>,
  fallbackPublicKey?: string,
): string {
  const fromPayload =
    typeof payload?.agentPublicKey === "string" ? payload.agentPublicKey.trim() : "";
  const agent = fromPayload || (fallbackPublicKey ?? "").trim();
  if (!agent || agent.length < 16) {
    throw new Error("Provide a valid agent public key (hex).");
  }
  return agent;
}

function resolveProxyWasm(): Uint8Array {
  const candidates = [
    join(process.cwd(), "wasm", "proxy_caller_with_return.wasm"),
    join(process.cwd(), "frontend", "wasm", "proxy_caller_with_return.wasm"),
    join(__dirname, "..", "..", "wasm", "proxy_caller_with_return.wasm"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return new Uint8Array(readFileSync(path));
    }
  }
  throw new Error(
    "Missing proxy_caller_with_return.wasm (required for payable Vault.deposit). " +
      "Expected at frontend/wasm/proxy_caller_with_return.wasm.",
  );
}

/**
 * Odra payable entry points require a Session call via proxy WASM so CSPR is
 * transferred into the contract purse (package calls alone attach 0 value).
 */
function buildVaultDeposit(
  _network: CasperNetwork,
  publicKeyHex: string,
  payload?: Record<string, unknown>,
): Transaction {
  requireVault();
  const amountMotes = csprToMotes(payload?.depositAmountCspr, "5");
  const proxyWasm = resolveProxyWasm();
  const outerArgs = buildOdraProxyCallArgs(
    normalizePackageHash(VAULT_PACKAGE_HASH),
    "deposit",
    Args.fromMap({}),
    amountMotes,
  );

  // Proxy session is heavier than a package call — 5 CSPR payment OOMs on casper-test.
  const PROXY_PAYMENT = 100_000_000_000; // 100 CSPR max payment
  return new SessionBuilder()
    .from(senderKey(publicKeyHex))
    .wasm(proxyWasm)
    .runtimeArgs(outerArgs)
    .chainName(CASPER_CHAIN_NAME)
    .ttl(DEFAULT_TTL_MS)
    .payment(PROXY_PAYMENT, 1)
    .build();
}

function buildVaultAuthorize(
  network: CasperNetwork,
  publicKeyHex: string,
  payload?: Record<string, unknown>,
): Transaction {
  requireVault();
  // Default agent = signer so one-wallet demos (any judge wallet) work without a second key.
  const agentKey = parseAgentKey(payload, publicKeyHex);
  const spendCapMotes = csprToMotes(payload?.spendCapCspr, "10");
  const periodMsRaw = Number(payload?.periodMs ?? 86_400_000);
  const periodMs =
    Number.isFinite(periodMsRaw) && periodMsRaw > 0 ? Math.floor(periodMsRaw) : 86_400_000;
  const daysRaw = Number(payload?.expiresInDays ?? 7);
  const expiresInDays =
    Number.isFinite(daysRaw) && daysRaw > 0 ? Math.floor(daysRaw) : 7;
  // Absolute ms deadline from now (matches Odra block time units used in tests).
  const expiresAt = Date.now() + 7 * 86_400_000;
  // Prefer explicit days from payload when valid; keep 7d floor for demo stability.
  const expiresAtFinal =
    Number.isFinite(daysRaw) && daysRaw > 0
      ? Date.now() + expiresInDays * 86_400_000
      : expiresAt;
  const allowedActions =
    typeof payload?.allowedActions === "number"
      ? payload.allowedActions
      : ACTION_TRANSFER_BIT;

  return network.createContractPackageCallTransaction(
    senderKey(publicKeyHex),
    normalizePackageHash(VAULT_PACKAGE_HASH),
    "authorize_agent",
    CASPER_CHAIN_NAME,
    DEFAULT_DEPLOY_COST,
    Args.fromMap({
      agent: addressFromHex(agentKey),
      spend_cap: CLValue.newCLUInt512(spendCapMotes),
      period_ms: CLValue.newCLUint64(periodMs),
      allowed_actions: CLValue.newCLUInt32(allowedActions),
      expires_at: CLValue.newCLUint64(expiresAtFinal),
    }),
    DEFAULT_TTL_MS,
  );
}

function buildVaultTransfer(
  network: CasperNetwork,
  publicKeyHex: string,
  payload?: Record<string, unknown>,
): Transaction {
  requireVault();
  const recipientRaw =
    typeof payload?.recipientPublicKey === "string" && payload.recipientPublicKey.trim()
      ? payload.recipientPublicKey.trim()
      : publicKeyHex;
  const amountMotes = csprToMotes(payload?.transferAmountCspr, "1");

  return network.createContractPackageCallTransaction(
    senderKey(publicKeyHex),
    normalizePackageHash(VAULT_PACKAGE_HASH),
    "agent_transfer",
    CASPER_CHAIN_NAME,
    DEFAULT_DEPLOY_COST,
    Args.fromMap({
      recipient: addressFromHex(recipientRaw),
      amount: CLValue.newCLUInt512(amountMotes),
    }),
    DEFAULT_TTL_MS,
  );
}

function buildVaultRevoke(
  network: CasperNetwork,
  publicKeyHex: string,
  payload?: Record<string, unknown>,
): Transaction {
  requireVault();
  const agentKey = parseAgentKey(payload, publicKeyHex);

  return network.createContractPackageCallTransaction(
    senderKey(publicKeyHex),
    normalizePackageHash(VAULT_PACKAGE_HASH),
    "revoke_agent",
    CASPER_CHAIN_NAME,
    DEFAULT_DEPLOY_COST,
    Args.fromMap({
      agent: addressFromHex(agentKey),
    }),
    DEFAULT_TTL_MS,
  );
}

export async function buildAction(
  actionId: ContractActionId,
  publicKeyHex: string,
  payload?: Record<string, unknown>,
): Promise<ActionBuildResult> {
  const labels: Record<ContractActionId, string> = {
    guardian_scan: "Scan positions",
    guardian_rebalance: "Run rebalance sim",
    guardian_risk_log: "View risk log",
    rwa_submit: "Submit asset data",
    rwa_verify: "Verify hash",
    rwa_publish: "Publish attestation",
    market_browse: "Browse agents",
    market_post_job: "Post a job",
    market_release: "Release escrow",
    vault_deposit: "Deposit to vault",
    vault_authorize: "Authorize agent",
    vault_transfer: "Agent transfer",
    vault_revoke: "Revoke agent",
  };

  if (actionId === "guardian_scan") {
    return {
      actionId,
      label: labels[actionId],
      mode: "rpc",
      preview: `Query live CSPR balance for ${publicKeyHex.slice(0, 12)}... via RPC.`,
    };
  }

  if (
    actionId === "guardian_rebalance" ||
    actionId === "guardian_risk_log" ||
    actionId === "market_browse" ||
    actionId === "rwa_submit"
  ) {
    return {
      actionId,
      label: labels[actionId],
      mode: "mock",
      preview: `Agent pipeline completed for "${labels[actionId]}".`,
    };
  }

  await getNetwork();

  if (actionId === "rwa_verify") {
    if (hasAttestationContract()) {
      const transaction = buildAttestationUpdate(networkClient!, publicKeyHex, 94);
      return {
        actionId,
        label: labels[actionId],
        mode: "transaction",
        transaction,
        preview: "Attestation.update_reputation(new_score=94)",
      };
    }

    return {
      actionId,
      label: labels[actionId],
      mode: "mock",
      preview: `Agent pipeline queued for "${labels[actionId]}". Deploy attestation to call on-chain.`,
    };
  }

  if (actionId === "market_post_job") {
    const escrowMotes = csprToMotes(payload?.escrowAmount);
    const escrowCspr = (Number(escrowMotes) / 1_000_000_000).toFixed(2);
    const transaction = buildEscrowPostJob(networkClient!, publicKeyHex, payload);
    return {
      actionId,
      label: labels[actionId],
      mode: "transaction",
      transaction,
      preview: `Escrow.post_job(recipient=self, amount=${escrowCspr} CSPR)`,
    };
  }

  if (actionId === "market_release") {
    const transaction = buildEscrowRelease(networkClient!, publicKeyHex);
    return {
      actionId,
      label: labels[actionId],
      mode: "transaction",
      transaction,
      preview: "Escrow.verify_and_release()",
    };
  }

  if (actionId === "rwa_publish") {
    const hash =
      typeof payload?.dataHash === "string" && payload.dataHash.length > 0
        ? payload.dataHash
        : `rwa-demo-${Date.now()}`;
    const transaction = buildAttestationPublish(networkClient!, publicKeyHex, hash);
    return {
      actionId,
      label: labels[actionId],
      mode: "transaction",
      transaction,
      preview: `Attestation.publish(data_hash="${hash}", initial_score=85)`,
    };
  }

  if (actionId === "vault_deposit") {
    if (!hasVaultContract()) {
      return {
        actionId,
        label: labels[actionId],
        mode: "mock",
        preview:
          "Vault package not configured. Deploy Vault on casper-test and set NEXT_PUBLIC_VAULT_PACKAGE_HASH.",
      };
    }
    const amount = csprToMotes(payload?.depositAmountCspr, "5");
    const cspr = (Number(amount) / 1_000_000_000).toFixed(2);
    const transaction = buildVaultDeposit(networkClient!, publicKeyHex, payload);
    return {
      actionId,
      label: labels[actionId],
      mode: "transaction",
      transaction,
      preview: `Vault.deposit() via Odra payable proxy — ${cspr} CSPR attached`,
    };
  }

  if (actionId === "vault_authorize") {
    if (!hasVaultContract()) {
      return {
        actionId,
        label: labels[actionId],
        mode: "mock",
        preview:
          "Vault package not configured. Deploy Vault and sync package hashes before authorizing agents.",
      };
    }
    const agentKey = parseAgentKey(payload);
    const cap = (Number(csprToMotes(payload?.spendCapCspr, "10")) / 1_000_000_000).toFixed(2);
    const transaction = buildVaultAuthorize(networkClient!, publicKeyHex, payload);
    return {
      actionId,
      label: labels[actionId],
      mode: "transaction",
      transaction,
      preview: `Vault.authorize_agent(agent=${agentKey.slice(0, 12)}..., spend_cap=${cap} CSPR)`,
    };
  }

  if (actionId === "vault_transfer") {
    if (!hasVaultContract()) {
      return {
        actionId,
        label: labels[actionId],
        mode: "mock",
        preview: "Vault package not configured. Cannot run agent_transfer.",
      };
    }
    const amount = (Number(csprToMotes(payload?.transferAmountCspr, "1")) / 1_000_000_000).toFixed(
      2,
    );
    const transaction = buildVaultTransfer(networkClient!, publicKeyHex, payload);
    return {
      actionId,
      label: labels[actionId],
      mode: "transaction",
      transaction,
      preview: `Vault.agent_transfer(amount=${amount} CSPR) — sign as authorized agent`,
    };
  }

  if (actionId === "vault_revoke") {
    if (!hasVaultContract()) {
      return {
        actionId,
        label: labels[actionId],
        mode: "mock",
        preview: "Vault package not configured. Cannot revoke agents.",
      };
    }
    const agentKey = parseAgentKey(payload);
    const transaction = buildVaultRevoke(networkClient!, publicKeyHex, payload);
    return {
      actionId,
      label: labels[actionId],
      mode: "transaction",
      transaction,
      preview: `Vault.revoke_agent(agent=${agentKey.slice(0, 12)}...)`,
    };
  }

  throw new Error(`Unhandled action: ${actionId}`);
}

export async function queryAccountBalance(publicKeyHex: string): Promise<string> {
  const network = await getNetwork();
  const publicKey = PublicKey.fromHex(publicKeyHex);
  const result = await network.queryLatestBalance(
    PurseIdentifier.fromPublicKey(publicKey),
  );

  if (!result?.balance) {
    return "0.0000 CSPR";
  }

  const motes = result.balance.toString();
  const cspr = Number(motes) / 1_000_000_000;
  return `${cspr.toFixed(4)} CSPR`;
}