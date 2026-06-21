import "server-only";

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  AccountIdentifier,
  Args,
  CLValue,
  Key,
  PublicKey,
  PurseIdentifier,
  SessionBuilder,
} from "casper-js-sdk";
import {
  ATTESTATION_PACKAGE_HASH,
  CASPER_CHAIN_NAME,
  ESCROW_PACKAGE_HASH,
  normalizePackageHash,
} from "@/lib/casper/contract-config";
import { createRpcClient } from "@/lib/casper/rpc";

const REPO_ROOT = join(process.cwd(), "..");
const CONTRACTS_DIR = join(REPO_ROOT, "contracts", "agentvault-core");
const WASM_DIR = join(CONTRACTS_DIR, "wasm");
const CONTRACTS_TOML = join(CONTRACTS_DIR, "resources", "casper-test-contracts.toml");
const ENV_LOCAL = join(process.cwd(), ".env.local");
const CONFIG_TS = join(process.cwd(), "lib", "casper", "contract-config.ts");

const DEPLOY_PAYMENT = 500_000_000_000;
const TTL_MS = 1_800_000;

const ODRA_ARGS = {
  isUpgradable: "odra_cfg_is_upgradable",
  isUpgrade: "odra_cfg_is_upgrade",
  allowKeyOverride: "odra_cfg_allow_key_override",
  packageHashKeyName: "odra_cfg_package_hash_key_name",
} as const;

export type DeployContractName = "Escrow" | "Attestation";

function wasmPath(name: DeployContractName): string {
  const file = join(WASM_DIR, `${name}.wasm`);
  if (!existsSync(file)) {
    throw new Error(
      `Missing ${name}.wasm. Run contracts/agentvault-core/scripts/build-windows.ps1 first.`,
    );
  }
  return file;
}

function addressCLValue(publicKey: PublicKey): CLValue {
  return CLValue.newCLKey(Key.newKey(publicKey.accountHash().toPrefixedString()));
}

function odraInstallArgs(contractName: DeployContractName, initArgs: Record<string, CLValue>) {
  return Args.fromMap({
    [ODRA_ARGS.packageHashKeyName]: CLValue.newCLString(`${contractName}_package_hash`),
    [ODRA_ARGS.allowKeyOverride]: CLValue.newCLValueBool(true),
    [ODRA_ARGS.isUpgradable]: CLValue.newCLValueBool(false),
    [ODRA_ARGS.isUpgrade]: CLValue.newCLValueBool(false),
    ...initArgs,
  });
}

function senderKey(publicKeyHex: string): PublicKey {
  return PublicKey.fromHex(publicKeyHex);
}

export function buildDeployTransaction(
  contractName: DeployContractName,
  publicKeyHex: string,
) {
  const sender = senderKey(publicKeyHex);
  const wasmBytes = readFileSync(wasmPath(contractName));

  const initArgs: Record<string, CLValue> =
    contractName === "Escrow"
      ? {
          recipient: addressCLValue(sender),
          amount: CLValue.newCLUInt512("0"),
        }
      : {
          data_hash: CLValue.newCLString("agentvault-genesis"),
          initial_score: CLValue.newCLUInt32(0),
        };

  return new SessionBuilder()
    .from(sender)
    .wasm(wasmBytes)
    .installOrUpgrade()
    .runtimeArgs(odraInstallArgs(contractName, initArgs))
    .chainName(CASPER_CHAIN_NAME)
    .ttl(TTL_MS)
    .payment(DEPLOY_PAYMENT, 5)
    .build();
}

export async function queryDeployerPackageHashes(publicKeyHex: string): Promise<{
  escrow?: string;
  attestation?: string;
}> {
  const rpc = createRpcClient();
  const publicKey = senderKey(publicKeyHex);
  const account = await rpc.getAccountInfo(
    null,
    new AccountIdentifier(undefined, publicKey),
  );
  const namedKeys = account.account.namedKeys ?? [];

  const findHash = (name: string): string | undefined => {
    const entry = namedKeys.find((k: { name?: string }) => k.name === name);
    if (!entry?.key) return undefined;
    const raw = String(entry.key).replace(/^hash-/, "");
    return raw.startsWith("hash-") ? raw : `hash-${raw}`;
  };

  return {
    escrow: findHash("Escrow_package_hash"),
    attestation: findHash("Attestation_package_hash"),
  };
}

export async function escrowSupportsPostJob(): Promise<boolean> {
  const rpc = createRpcClient();
  const packageKey = `hash-${normalizePackageHash(ESCROW_PACKAGE_HASH)}`;
  const pkg = await rpc.queryLatestGlobalState(packageKey, []);
  const stored = pkg?.storedValue ?? pkg?.rawJSON?.stored_value;
  const versions = stored?.contractPackage?.versions;
  if (!Array.isArray(versions) || versions.length === 0) {
    return false;
  }

  const latest = versions[versions.length - 1];
  const contractHash = String(latest.contractHash ?? "").replace(/^contract-/, "");
  const contractKey = `hash-${contractHash}`;
  const contractState = await rpc.queryLatestGlobalState(contractKey, []);
  const contractStored =
    contractState?.storedValue ?? contractState?.rawJSON?.stored_value;
  const entryPoints = contractStored?.contract?.entryPoints ?? [];
  return entryPoints.some((ep: { name?: string }) => ep.name === "post_job");
}

export async function queryDeployerBalance(publicKeyHex: string): Promise<string> {
  const rpc = createRpcClient();
  const result = await rpc.queryLatestBalance(
    PurseIdentifier.fromPublicKey(senderKey(publicKeyHex)),
  );
  const motes = result?.balance?.toString?.() ?? "0";
  const cspr = Number(motes) / 1_000_000_000;
  return `${cspr.toFixed(4)} CSPR`;
}

function setEnvLine(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  return re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
}

function updateContractConfigTs(escrowHash: string, attestationHash: string) {
  if (!existsSync(CONFIG_TS)) return;
  let content = readFileSync(CONFIG_TS, "utf8");
  content = content.replace(
    /const CASPER_TEST_ESCROW_PACKAGE_HASH =\s*\n\s*"[^"]+";/,
    `const CASPER_TEST_ESCROW_PACKAGE_HASH =\n  "${escrowHash}";`,
  );
  content = content.replace(
    /const CASPER_TEST_ATTESTATION_PACKAGE_HASH =\s*\n\s*"[^"]+";/,
    `const CASPER_TEST_ATTESTATION_PACKAGE_HASH =\n  "${attestationHash}";`,
  );
  writeFileSync(CONFIG_TS, content);
}

export function persistDeployedHashes(escrowHash: string, attestationHash: string) {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(
    CONTRACTS_TOML,
    `last_updated = "${now}"

[[contracts]]
name = "Escrow"
package_name = "Escrow"
package_hash = "${escrowHash}"

[[contracts]]
name = "Attestation"
package_name = "Attestation"
package_hash = "${attestationHash}"
`,
  );

  if (existsSync(ENV_LOCAL)) {
    let env = readFileSync(ENV_LOCAL, "utf8");
    env = setEnvLine(env, "NEXT_PUBLIC_ESCROW_PACKAGE_HASH", escrowHash);
    env = setEnvLine(env, "NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH", attestationHash);
    writeFileSync(ENV_LOCAL, env.endsWith("\n") ? env : `${env}\n`);
  }

  updateContractConfigTs(escrowHash, attestationHash);
  process.env.NEXT_PUBLIC_ESCROW_PACKAGE_HASH = escrowHash;
  process.env.NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH = attestationHash;
}

export function getConfiguredHashes() {
  return {
    escrow: ESCROW_PACKAGE_HASH,
    attestation: ATTESTATION_PACKAGE_HASH,
  };
}