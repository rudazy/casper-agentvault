import {
  CasperNetwork,
  Deploy,
  DeployHeader,
  Duration,
  ExecutableDeployItem,
  PrivateKey,
  TransferDeployItem,
  URef,
  type RpcClient,
} from "casper-js-sdk";
import {
  CASPER_CHAIN_NAME,
  DEFAULT_TTL_MS,
  VAULT_PACKAGE_HASH,
  normalizePackageHash,
} from "@/lib/casper/contract-config";

/** Casper network minimum native transfer (motes). Below this put is rejected. */
export const MIN_TRANSFER_MOTES = 2_500_000_000;

const TRANSFER_PAYMENT_MOTES = "100000000"; // 0.1 CSPR

type NamedKeyLike = { name?: string; key?: unknown };

function asPrefixedHash(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    return value.replace(/^contract-/, "").replace(/^hash-/, "");
  }
  const obj = value as {
    toPrefixedString?: () => string;
    toJSON?: () => unknown;
    hash?: { toHex?: () => string; hashBytes?: Uint8Array };
  };
  if (typeof obj.toPrefixedString === "function") {
    return obj
      .toPrefixedString()
      .replace(/^contract-/, "")
      .replace(/^hash-/, "");
  }
  if (typeof obj.toJSON === "function") {
    const j = obj.toJSON();
    if (typeof j === "string") {
      return j.replace(/^contract-/, "").replace(/^hash-/, "");
    }
  }
  if (obj.hash?.toHex) {
    return obj.hash.toHex();
  }
  if (obj.hash?.hashBytes instanceof Uint8Array) {
    return Buffer.from(obj.hash.hashBytes).toString("hex");
  }
  return "";
}

function keyToUref(key: unknown): URef {
  if (!key) {
    throw new Error("Missing purse key.");
  }
  if (key instanceof URef) {
    return key;
  }
  const obj = key as {
    toPrefixedString?: () => string;
    toJSON?: () => unknown;
    uRef?: URef;
    uref?: URef;
  };
  if (obj.uRef instanceof URef) return obj.uRef;
  if (obj.uref instanceof URef) return obj.uref;
  if (typeof obj.toPrefixedString === "function") {
    const s = obj.toPrefixedString();
    if (s.startsWith("uref-")) return URef.fromString(s);
  }
  if (typeof obj.toJSON === "function") {
    const j = obj.toJSON();
    if (typeof j === "string" && j.startsWith("uref-")) {
      return URef.fromString(j);
    }
  }
  const asString = String(key);
  if (asString.startsWith("uref-")) return URef.fromString(asString);
  throw new Error(`Unexpected main purse key format: ${asString.slice(0, 80)}`);
}

/**
 * Resolve the Vault package's active contract hash, then `__contract_main_purse`.
 * Odra stores vault CSPR on that purse; vault_balance() = purse balance.
 */
export async function resolveVaultMainPurseUref(
  rpc: RpcClient,
): Promise<URef> {
  const packageKey = `hash-${normalizePackageHash(VAULT_PACKAGE_HASH)}`;
  const packageState = await rpc.queryLatestGlobalState(packageKey, []);
  const stored =
    (packageState as { storedValue?: unknown; rawJSON?: { stored_value?: unknown } })
      ?.storedValue ??
    (packageState as { rawJSON?: { stored_value?: unknown } })?.rawJSON
      ?.stored_value;

  const pkg =
    (stored as { contractPackage?: Record<string, unknown> })?.contractPackage ??
    (stored as { ContractPackage?: Record<string, unknown> })?.ContractPackage ??
    stored;

  const versions =
    (pkg as { versions?: Array<Record<string, unknown>> })?.versions ??
    (pkg as { Versions?: Array<Record<string, unknown>> })?.Versions ??
    [];

  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error("Vault package has no contract versions on-chain.");
  }

  const latest = versions[versions.length - 1] as {
    contractHash?: unknown;
    contract_hash?: unknown;
    ContractHash?: unknown;
  };
  const contractHash = asPrefixedHash(
    latest.contractHash ?? latest.contract_hash ?? latest.ContractHash,
  );
  if (!/^[0-9a-fA-F]{64}$/.test(contractHash)) {
    throw new Error(
      `Could not resolve Vault contract hash from package (${contractHash || "empty"}).`,
    );
  }

  const contractKey = `hash-${contractHash}`;
  const contractState = await rpc.queryLatestGlobalState(contractKey, []);
  const cStored =
    (contractState as { storedValue?: unknown; rawJSON?: { stored_value?: unknown } })
      ?.storedValue ??
    (contractState as { rawJSON?: { stored_value?: unknown } })?.rawJSON
      ?.stored_value;

  const contract =
    (cStored as { contract?: { namedKeys?: NamedKeyLike[] } })?.contract ??
    (cStored as { Contract?: { namedKeys?: NamedKeyLike[] } })?.Contract;

  const namedKeys: NamedKeyLike[] =
    contract?.namedKeys ??
    (cStored as { namedKeys?: NamedKeyLike[] })?.namedKeys ??
    [];

  const purseEntry = namedKeys.find(
    (k) => (k.name ?? "").toLowerCase() === "__contract_main_purse",
  );
  if (!purseEntry?.key) {
    throw new Error(
      "Vault __contract_main_purse is missing. The package may never have received funds. " +
        "Install/redeploy Vault, or run one local payable deposit once to create the purse.",
    );
  }

  return keyToUref(purseEntry.key);
}

/**
 * Build a ~1KB native transfer into the Vault main purse.
 * Funds vault_balance without Odra payable proxy WASM (~370KB / Vercel 413).
 */
export function buildVaultPurseFundTransaction(
  operator: PrivateKey,
  purse: URef,
  amountMotes: string,
): ReturnType<typeof Deploy.newTransactionFromDeploy> {
  const amount = BigInt(amountMotes);
  if (amount < BigInt(MIN_TRANSFER_MOTES)) {
    throw new Error(
      `Deposit amount must be at least 2.5 CSPR (network minimum transfer). Got ${amountMotes} motes.`,
    );
  }

  const session = new ExecutableDeployItem();
  session.transfer = TransferDeployItem.newTransfer(
    amountMotes,
    purse,
    undefined,
    Date.now(),
  );
  const payment = ExecutableDeployItem.standardPayment(TRANSFER_PAYMENT_MOTES);
  const header = DeployHeader.default();
  header.account = operator.publicKey;
  header.chainName = CASPER_CHAIN_NAME;
  header.ttl = new Duration(DEFAULT_TTL_MS);

  const deploy = Deploy.makeDeploy(header, payment, session);
  deploy.sign(operator);
  return Deploy.newTransactionFromDeploy(deploy);
}

export async function putVaultFundTransaction(
  network: CasperNetwork,
  transaction: ReturnType<typeof Deploy.newTransactionFromDeploy>,
): Promise<string> {
  const result = await network.putTransaction(transaction);
  if (result && "transactionHash" in result && result.transactionHash) {
    return result.transactionHash.toHex();
  }
  if (result && "deployHash" in result && result.deployHash) {
    return result.deployHash.toHex();
  }
  // Legacy deploy hash may only appear after put_deploy path
  throw new Error("Node accepted fund transfer but returned no hash.");
}
