/**
 * Dry-run demo transactions on casper-test for video/sample hashes.
 * Uses contracts/agentvault-core/secret_key.pem (gitignored).
 *
 * Flow:
 *  1) Attestation.publish
 *  2) Escrow.post_job
 *  3) Deploy Vault if package hash missing
 *  4) Vault.authorize_agent
 *  5) Vault.revoke_agent
 *
 * Usage:
 *   node frontend/scripts/dry-run-demo-txs.cjs
 *   node frontend/scripts/dry-run-demo-txs.cjs --skip-vault-deploy   # use env/toml vault hash only
 */
const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const {
  AccountIdentifier,
  Args,
  CasperNetwork,
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
const OUT_JSON = join(ROOT, "docs", "demo-dry-run-hashes.json");

const RPC_URL =
  process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? "https://node.testnet.casper.network/rpc";
const CHAIN_NAME = process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME ?? "casper-test";
const CALL_PAYMENT = 5_000_000_000; // 5 CSPR
const DEPLOY_PAYMENT = 500_000_000_000; // 500 CSPR max
const TTL_MS = 1_800_000;
// casper-test rejects some tolerances (e.g. 5 → invalid pricing mode). Use 1.
const GAS_PRICE_TOLERANCE = 1;
const ACTION_TRANSFER = 1;
const DAY_MS = 86_400_000;

const DEFAULT_ESCROW =
  "hash-75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb";
const DEFAULT_ATTESTATION =
  "hash-25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95";

const ODRA_ARGS = {
  isUpgradable: "odra_cfg_is_upgradable",
  isUpgrade: "odra_cfg_is_upgrade",
  allowKeyOverride: "odra_cfg_allow_key_override",
  packageHashKeyName: "odra_cfg_package_hash_key_name",
};

function loadKey(path = KEY_PATH) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}. Run: node frontend/scripts/generate-deploy-key.cjs`);
  }
  const pem = readFileSync(path, "utf8");
  const alg = pem.includes("EC PRIVATE KEY") ? KeyAlgorithm.SECP256K1 : KeyAlgorithm.ED25519;
  return PrivateKey.fromPem(pem, alg);
}

function normalizePackageHash(hash) {
  return String(hash || "").replace(/^hash-/, "");
}

function withHashPrefix(hash) {
  const raw = normalizePackageHash(hash);
  return raw ? `hash-${raw}` : "";
}

function addressCLValue(publicKey) {
  return CLValue.newCLKey(Key.newKey(publicKey.accountHash().toPrefixedString()));
}

function readTomlHashes() {
  if (!existsSync(CONTRACTS_TOML)) return {};
  const text = readFileSync(CONTRACTS_TOML, "utf8");
  const out = {};
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const name = line.match(/^name\s*=\s*"([^"]+)"/);
    if (name) current = name[1];
    const ph = line.match(/^package_hash\s*=\s*"([^"]+)"/);
    if (ph && current) out[current.toLowerCase()] = ph[1];
  }
  return out;
}

function setEnvLine(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  return re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
}

function persistVaultHash(vaultHash) {
  const toml = readTomlHashes();
  const escrow = withHashPrefix(toml.escrow || DEFAULT_ESCROW);
  const attestation = withHashPrefix(toml.attestation || DEFAULT_ATTESTATION);
  const vault = withHashPrefix(vaultHash);
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(
    CONTRACTS_TOML,
    `last_updated = "${now}"

[[contracts]]
name = "Escrow"
package_name = "Escrow"
package_hash = "${escrow}"

[[contracts]]
name = "Attestation"
package_name = "Attestation"
package_hash = "${attestation}"

[[contracts]]
name = "Vault"
package_name = "Vault"
package_hash = "${vault}"
`,
  );

  if (existsSync(CONFIG_TS)) {
    let content = readFileSync(CONFIG_TS, "utf8");
    content = content.replace(
      /const CASPER_TEST_VAULT_PACKAGE_HASH =\s*\n\s*"[^"]*";/,
      `const CASPER_TEST_VAULT_PACKAGE_HASH =\n  "${vault}";`,
    );
    writeFileSync(CONFIG_TS, content);
  }

  let env = existsSync(ENV_LOCAL) ? readFileSync(ENV_LOCAL, "utf8") : "";
  env = setEnvLine(env, "NEXT_PUBLIC_ESCROW_PACKAGE_HASH", escrow);
  env = setEnvLine(env, "NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH", attestation);
  env = setEnvLine(env, "NEXT_PUBLIC_VAULT_PACKAGE_HASH", vault);
  env = setEnvLine(env, "NEXT_PUBLIC_CASPER_CHAIN_NAME", CHAIN_NAME);
  if (!/NEXT_PUBLIC_CASPER_RPC_URL=/.test(env)) {
    env = setEnvLine(env, "NEXT_PUBLIC_CASPER_RPC_URL", RPC_URL);
  }
  writeFileSync(ENV_LOCAL, env.endsWith("\n") ? env : `${env}\n`);
}

async function getBalanceMotes(rpc, publicKey) {
  try {
    const result = await rpc.queryLatestBalance(PurseIdentifier.fromPublicKey(publicKey));
    return result?.balance?.toString?.() ?? "0";
  } catch {
    return "0";
  }
}

async function waitForFinalization(rpc, txHash, label) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    try {
      const info = await rpc.getTransactionByTransactionHash(txHash);
      const err = info?.executionInfo?.executionResult?.errorMessage;
      if (err) throw new Error(`${label} failed on-chain: ${err}`);
      if (info?.executionInfo?.executionResult) {
        console.log(`  finalized: ${label}`);
        return;
      }
    } catch (e) {
      if (String(e.message || e).includes("failed on-chain")) throw e;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`${label} timed out waiting for finalization (${txHash})`);
}

async function submitPackageCall(network, rpc, privateKey, packageHash, entryPoint, args, label) {
  const transaction = network.createContractPackageCallTransaction(
    privateKey.publicKey,
    normalizePackageHash(packageHash),
    entryPoint,
    CHAIN_NAME,
    CALL_PAYMENT,
    args,
    TTL_MS,
    undefined,
    GAS_PRICE_TOLERANCE,
  );

  transaction.sign(privateKey);
  const result = await network.putTransaction(transaction);
  const txHash =
    result?.transactionHash?.toHex?.() ?? result?.deployHash?.toHex?.() ?? String(result);
  console.log(`Submitted ${label}: ${txHash}`);
  console.log(`  explorer: https://testnet.cspr.live/transaction/${txHash}`);
  await waitForFinalization(rpc, txHash, label);
  return txHash;
}

async function deployVault(network, rpc, privateKey) {
  const wasmPath = join(WASM_DIR, "Vault.wasm");
  if (!existsSync(wasmPath)) {
    throw new Error("Missing Vault.wasm — run contracts/agentvault-core/scripts/build-windows.ps1");
  }
  const wasmBytes = readFileSync(wasmPath);
  const transaction = new SessionBuilder()
    .from(privateKey.publicKey)
    .wasm(wasmBytes)
    .installOrUpgrade()
    .runtimeArgs(
      Args.fromMap({
        [ODRA_ARGS.packageHashKeyName]: CLValue.newCLString("Vault_package_hash"),
        [ODRA_ARGS.allowKeyOverride]: CLValue.newCLValueBool(true),
        [ODRA_ARGS.isUpgradable]: CLValue.newCLValueBool(false),
        [ODRA_ARGS.isUpgrade]: CLValue.newCLValueBool(false),
      }),
    )
    .chainName(CHAIN_NAME)
    .ttl(TTL_MS)
    .payment(DEPLOY_PAYMENT, GAS_PRICE_TOLERANCE)
    .build();

  transaction.sign(privateKey);
  const result = await network.putTransaction(transaction);
  const txHash =
    result?.transactionHash?.toHex?.() ?? result?.deployHash?.toHex?.() ?? String(result);
  console.log(`Submitted Vault install: ${txHash}`);
  console.log(`  explorer: https://testnet.cspr.live/transaction/${txHash}`);
  await waitForFinalization(rpc, txHash, "Vault install");

  const account = await rpc.getAccountInfo(
    null,
    new AccountIdentifier(undefined, privateKey.publicKey),
  );
  const namedKeys = account.account.namedKeys ?? [];
  const entry = namedKeys.find((k) => k.name === "Vault_package_hash");
  if (!entry?.key) throw new Error("Vault_package_hash named key not found after install");
  const rawKey =
    typeof entry.key === "string"
      ? entry.key
      : entry.key?.toPrefixedString?.() ?? entry.key?.toString?.() ?? String(entry.key);
  const packageHash = withHashPrefix(rawKey);
  console.log(`Vault package_hash: ${packageHash}`);
  persistVaultHash(packageHash);
  return { packageHash, txHash };
}

async function main() {
  const skipVaultDeploy = process.argv.includes("--skip-vault-deploy");
  const privateKey = loadKey();
  const publicKey = privateKey.publicKey;
  const agentKey = PrivateKey.generate(KeyAlgorithm.ED25519);

  console.log("Deployer:", publicKey.toHex());
  console.log("Agent (demo key):", agentKey.publicKey.toHex());
  console.log("RPC:", RPC_URL);

  const rpc = new RpcClient(new HttpHandler(RPC_URL));
  const network = await CasperNetwork.create(rpc);
  const balance = await getBalanceMotes(rpc, publicKey);
  const balanceCspr = Number(balance) / 1e9;
  console.log(`Balance: ${balanceCspr.toFixed(4)} CSPR (${balance} motes)`);

  const toml = readTomlHashes();
  const escrowHash = withHashPrefix(
    process.env.NEXT_PUBLIC_ESCROW_PACKAGE_HASH || toml.escrow || DEFAULT_ESCROW,
  );
  const attestationHash = withHashPrefix(
    process.env.NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH ||
      toml.attestation ||
      DEFAULT_ATTESTATION,
  );
  let vaultHash = withHashPrefix(
    process.env.NEXT_PUBLIC_VAULT_PACKAGE_HASH || toml.vault || "",
  );

  const needVaultDeploy = !vaultHash && !skipVaultDeploy;
  const minCspr = needVaultDeploy ? 520 : 25;
  if (balanceCspr < minCspr) {
    console.error(`
INSUFFICIENT BALANCE for dry-run.
Need at least ~${minCspr} CSPR free (have ${balanceCspr.toFixed(4)}).

Fund this public key:
  ${publicKey.toHex()}

Faucet: https://testnet.cspr.live/tools/faucet
Then re-run:
  node frontend/scripts/dry-run-demo-txs.cjs
`);
    process.exit(2);
  }

  const results = {
    network: CHAIN_NAME,
    deployer: publicKey.toHex(),
    agent: agentKey.publicKey.toHex(),
    packages: {
      escrow: escrowHash,
      attestation: attestationHash,
      vault: vaultHash || null,
    },
    transactions: {},
    explorers: {},
    recordedAt: new Date().toISOString(),
  };

  // 1) RWA publish
  const dataHash = `rwa-demo-${Date.now()}`;
  results.transactions.rwa_publish = await submitPackageCall(
    network,
    rpc,
    privateKey,
    attestationHash,
    "publish",
    Args.fromMap({
      data_hash: CLValue.newCLString(dataHash),
      initial_score: CLValue.newCLUInt32(85),
    }),
    "Attestation.publish",
  );
  results.explorers.rwa_publish = `https://testnet.cspr.live/transaction/${results.transactions.rwa_publish}`;

  // 2) Marketplace post job
  results.transactions.market_post_job = await submitPackageCall(
    network,
    rpc,
    privateKey,
    escrowHash,
    "post_job",
    Args.fromMap({
      recipient: addressCLValue(publicKey),
      amount: CLValue.newCLUInt512(String(2_500_000_000)), // 2.5 CSPR
    }),
    "Escrow.post_job",
  );
  results.explorers.market_post_job = `https://testnet.cspr.live/transaction/${results.transactions.market_post_job}`;

  // 3) Vault install if needed
  if (needVaultDeploy) {
    const deployed = await deployVault(network, rpc, privateKey);
    vaultHash = deployed.packageHash;
    results.packages.vault = vaultHash;
    results.transactions.vault_install = deployed.txHash;
    results.explorers.vault_install = `https://testnet.cspr.live/transaction/${deployed.txHash}`;
  } else if (!vaultHash) {
    throw new Error("No Vault package hash and --skip-vault-deploy was set.");
  } else {
    persistVaultHash(vaultHash);
  }

  // 4) authorize agent (7-day expiry, 10 CSPR cap, transfer bit)
  const expiresAt = Date.now() + 7 * DAY_MS;
  results.transactions.vault_authorize = await submitPackageCall(
    network,
    rpc,
    privateKey,
    vaultHash,
    "authorize_agent",
    Args.fromMap({
      agent: addressCLValue(agentKey.publicKey),
      spend_cap: CLValue.newCLUInt512(String(10_000_000_000)),
      period_ms: CLValue.newCLUint64(DAY_MS),
      allowed_actions: CLValue.newCLUInt32(ACTION_TRANSFER),
      expires_at: CLValue.newCLUint64(expiresAt),
    }),
    "Vault.authorize_agent",
  );
  results.explorers.vault_authorize = `https://testnet.cspr.live/transaction/${results.transactions.vault_authorize}`;

  // 5) revoke agent
  results.transactions.vault_revoke = await submitPackageCall(
    network,
    rpc,
    privateKey,
    vaultHash,
    "revoke_agent",
    Args.fromMap({
      agent: addressCLValue(agentKey.publicKey),
    }),
    "Vault.revoke_agent",
  );
  results.explorers.vault_revoke = `https://testnet.cspr.live/transaction/${results.transactions.vault_revoke}`;

  writeFileSync(OUT_JSON, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`\nWrote ${OUT_JSON}`);
  console.log("\n=== DRY RUN COMPLETE ===");
  console.log(JSON.stringify(results.transactions, null, 2));
  console.log("\nFill docs/TESTNET.md from these hashes, then film.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
