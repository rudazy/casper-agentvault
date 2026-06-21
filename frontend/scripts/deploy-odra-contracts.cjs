/**
 * Deploy AgentVault Odra contracts to casper-test (Windows-friendly alternative to cargo odra CLI).
 * Requires funded secret_key.pem in contracts/agentvault-core/ (see generate-deploy-key.cjs + faucet).
 */
const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const {
  AccountIdentifier,
  Args,
  CLValue,
  HttpHandler,
  Key,
  PrivateKey,
  KeyAlgorithm,
  PurseIdentifier,
  RpcClient,
  SessionBuilder,
} = require("casper-js-sdk");

const ROOT = join(__dirname, "..", "..");
const CONTRACTS_DIR = join(ROOT, "contracts", "agentvault-core");
const KEY_PATH = join(CONTRACTS_DIR, "secret_key.pem");
const WASM_DIR = join(CONTRACTS_DIR, "wasm");
const CONTRACTS_TOML = join(CONTRACTS_DIR, "resources", "casper-test-contracts.toml");
const ENV_LOCAL = join(__dirname, "..", ".env.local");
const CONFIG_TS = join(__dirname, "..", "lib", "casper", "contract-config.ts");

const RPC_URL =
  process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? "https://node.testnet.casper.network/rpc";
const CHAIN_NAME = process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME ?? "casper-test";
const DEPLOY_PAYMENT = 500_000_000_000; // 500 CSPR max payment (matches Odra CLI deploy gas)
const TTL_MS = 1_800_000;

const ODRA_ARGS = {
  isUpgradable: "odra_cfg_is_upgradable",
  isUpgrade: "odra_cfg_is_upgrade",
  allowKeyOverride: "odra_cfg_allow_key_override",
  packageHashKeyName: "odra_cfg_package_hash_key_name",
};

function loadOrCreateKey() {
  if (existsSync(KEY_PATH)) {
    const pem = readFileSync(KEY_PATH, "utf8");
    const alg = pem.includes("EC PRIVATE KEY") ? KeyAlgorithm.SECP256K1 : KeyAlgorithm.ED25519;
    return PrivateKey.fromPem(pem, alg);
  }
  const key = PrivateKey.generate(KeyAlgorithm.ED25519);
  writeFileSync(KEY_PATH, key.toPem());
  console.log("Created secret_key.pem — fund it on https://testnet.cspr.live/tools/faucet");
  return key;
}

async function getBalanceMotes(rpc, publicKey) {
  const result = await rpc.queryLatestBalance(PurseIdentifier.fromPublicKey(publicKey));
  return result?.balance?.toString?.() ?? "0";
}

async function waitForFinalization(rpc, txHash, label) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    try {
      const info = await rpc.getTransactionByTransactionHash(txHash);
      const err = info?.executionInfo?.executionResult?.errorMessage;
      if (err) {
        throw new Error(`${label} failed: ${err}`);
      }
      if (info?.executionInfo?.executionResult) {
        return;
      }
    } catch (e) {
      if (String(e.message || e).includes("failed:")) throw e;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`${label} timed out waiting for finalization`);
}

function addressCLValue(publicKey) {
  return CLValue.newCLKey(Key.newKey(publicKey.accountHash().toPrefixedString()));
}

function odraInstallArgs(contractName, initArgs) {
  return Args.fromMap({
    [ODRA_ARGS.packageHashKeyName]: CLValue.newCLString(`${contractName}_package_hash`),
    [ODRA_ARGS.allowKeyOverride]: CLValue.newCLValueBool(true),
    [ODRA_ARGS.isUpgradable]: CLValue.newCLValueBool(false),
    [ODRA_ARGS.isUpgrade]: CLValue.newCLValueBool(false),
    ...initArgs,
  });
}

async function deployContract(rpc, privateKey, contractName, wasmPath, initArgs) {
  const wasmBytes = readFileSync(wasmPath);
  const publicKey = privateKey.publicKey;

  const transaction = new SessionBuilder()
    .from(publicKey)
    .wasm(wasmBytes)
    .installOrUpgrade()
    .runtimeArgs(odraInstallArgs(contractName, initArgs))
    .chainName(CHAIN_NAME)
    .ttl(TTL_MS)
    .payment(DEPLOY_PAYMENT, 5)
    .build();

  transaction.sign(privateKey);
  const result = await rpc.putTransaction(transaction);
  const txHash =
    result?.transactionHash?.toHex?.() ?? result?.deployHash?.toHex?.() ?? String(result);
  console.log(`Submitted ${contractName} deploy: ${txHash}`);
  await waitForFinalization(rpc, txHash, contractName);

  const account = await rpc.getAccountInfo(null, new AccountIdentifier(undefined, publicKey));
  const namedKeys = account.account.namedKeys ?? [];

  const keyName = `${contractName}_package_hash`;
  const entry = namedKeys.find((k) => k.name === keyName);
  if (!entry?.key) {
    throw new Error(`Named key ${keyName} not found after ${contractName} deploy`);
  }

  const rawKey =
    typeof entry.key === "string"
      ? entry.key
      : entry.key?.toPrefixedString?.() ?? entry.key?.toString?.() ?? String(entry.key);
  const keyStr = rawKey.replace(/^hash-/, "");
  const packageHash = keyStr.startsWith("hash-") ? keyStr : `hash-${keyStr}`;
  console.log(`${contractName} package_hash: ${packageHash}`);
  return packageHash;
}

function writeContractsToml(escrowHash, attestationHash) {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const content = `last_updated = "${now}"

[[contracts]]
name = "Escrow"
package_name = "Escrow"
package_hash = "${escrowHash}"

[[contracts]]
name = "Attestation"
package_name = "Attestation"
package_hash = "${attestationHash}"
`;
  writeFileSync(CONTRACTS_TOML, content);
  console.log(`Wrote ${CONTRACTS_TOML}`);
}

function updateContractConfigTs(escrowHash, attestationHash) {
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
  console.log(`Updated ${CONFIG_TS}`);
}

function updateEnvLocal(escrowHash, attestationHash) {
  let env = existsSync(ENV_LOCAL) ? readFileSync(ENV_LOCAL, "utf8") : "";
  const set = (key, value) => {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    env = re.test(env) ? env.replace(re, line) : `${env.trimEnd()}\n${line}\n`;
  };
  set("NEXT_PUBLIC_ESCROW_PACKAGE_HASH", escrowHash);
  set("NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH", attestationHash);
  set("NEXT_PUBLIC_CASPER_CHAIN_NAME", CHAIN_NAME);
  if (!/NEXT_PUBLIC_CASPER_RPC_URL=/.test(env)) {
    set("NEXT_PUBLIC_CASPER_RPC_URL", RPC_URL);
  }
  writeFileSync(ENV_LOCAL, env.endsWith("\n") ? env : `${env}\n`);
  console.log(`Updated ${ENV_LOCAL}`);
}

async function main() {
  const privateKey = loadOrCreateKey();
  const publicKey = privateKey.publicKey;
  console.log("Deployer:", publicKey.toHex());

  const rpc = new RpcClient(new HttpHandler(RPC_URL));
  const balance = await getBalanceMotes(rpc, publicKey);
  console.log("Balance (motes):", balance);

  if (BigInt(balance) < BigInt(DEPLOY_PAYMENT) * 2n) {
    console.error(
      "\nInsufficient CSPR. Fund this public key at https://testnet.cspr.live/tools/faucet\n" +
        "Then re-run: node frontend/scripts/deploy-odra-contracts.cjs\n",
    );
    process.exit(1);
  }

  const escrowWasm = join(WASM_DIR, "Escrow.wasm");
  const attestationWasm = join(WASM_DIR, "Attestation.wasm");
  if (!existsSync(escrowWasm) || !existsSync(attestationWasm)) {
    throw new Error("Missing wasm files. Run contracts/agentvault-core/scripts/build-windows.ps1 first.");
  }

  const escrowHash = await deployContract(rpc, privateKey, "Escrow", escrowWasm, {
    recipient: addressCLValue(publicKey),
    amount: CLValue.newCLUInt512("0"),
  });

  const attestationHash = await deployContract(rpc, privateKey, "Attestation", attestationWasm, {
    data_hash: CLValue.newCLString("agentvault-genesis"),
    initial_score: CLValue.newCLUInt32(0),
  });

  writeContractsToml(escrowHash, attestationHash);
  updateEnvLocal(escrowHash, attestationHash);
  updateContractConfigTs(escrowHash, attestationHash);
  console.log("\nDeploy complete. Restart npm run dev and post a job.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});