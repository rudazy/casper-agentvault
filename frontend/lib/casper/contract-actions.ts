import {
  Args,
  CasperNetwork,
  CLValue,
  PublicKey,
  PurseIdentifier,
  type Transaction,
} from "casper-js-sdk";
import {
  ATTESTATION_PACKAGE_HASH,
  CASPER_CHAIN_NAME,
  DEFAULT_DEPLOY_COST,
  DEFAULT_TTL_MS,
  ESCROW_PACKAGE_HASH,
  hasAttestationContract,
  hasEscrowContract,
  normalizePackageHash,
} from "@/lib/casper/contract-config";
import { createRpcClient } from "@/lib/casper/rpc";

export type ContractActionId =
  | "guardian_scan"
  | "guardian_rebalance"
  | "guardian_risk_log"
  | "rwa_submit"
  | "rwa_verify"
  | "rwa_publish"
  | "market_browse"
  | "market_post_job"
  | "market_release";

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

function buildEscrowInit(network: CasperNetwork, publicKeyHex: string): Transaction {
  if (!hasEscrowContract()) {
    throw new Error("Set NEXT_PUBLIC_ESCROW_PACKAGE_HASH after deploying escrow.");
  }

  const sender = senderKey(publicKeyHex);
  const args = Args.fromMap({
    recipient: CLValue.newCLPublicKey(sender),
    amount: CLValue.newCLUInt512("2500000000"),
  });

  return network.createContractPackageCallTransaction(
    sender,
    normalizePackageHash(ESCROW_PACKAGE_HASH),
    "init",
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

function buildAttestationInit(
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
    "init",
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
    const transaction = buildEscrowInit(networkClient!, publicKeyHex);
    return {
      actionId,
      label: labels[actionId],
      mode: "transaction",
      transaction,
      preview: "Escrow.init(recipient=self, amount=2.5 CSPR)",
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
    const transaction = buildAttestationInit(networkClient!, publicKeyHex, hash);
    return {
      actionId,
      label: labels[actionId],
      mode: "transaction",
      transaction,
      preview: `Attestation.init(data_hash="${hash}", initial_score=85)`,
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