const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const {
  PrivateKey,
  KeyAlgorithm,
  PurseIdentifier,
  HttpHandler,
  RpcClient,
} = require("casper-js-sdk");

const KEY_PATH = join(__dirname, "..", "..", "contracts", "agentvault-core", "secret_key.pem");
const RPC = process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? "https://node.testnet.casper.network/rpc";

function loadKey() {
  const pem = readFileSync(KEY_PATH, "utf8");
  if (pem.includes("EC PRIVATE KEY")) {
    return PrivateKey.fromPem(pem, KeyAlgorithm.SECP256K1);
  }
  return PrivateKey.fromPem(pem, KeyAlgorithm.ED25519);
}

async function main() {
  const key = loadKey();
  console.log("public_key:", key.publicKey.toHex());
  console.log("algorithm:", pemAlgorithm(readFileSync(KEY_PATH, "utf8")));
  const rpc = new RpcClient(new HttpHandler(RPC));
  try {
    const result = await rpc.queryLatestBalance(PurseIdentifier.fromPublicKey(key.publicKey));
    console.log("balance_motes:", result?.balance?.toString?.() ?? "0");
  } catch (e) {
    console.log("balance_error:", e.message || String(e));
  }
}

function pemAlgorithm(pem) {
  if (pem.includes("EC PRIVATE KEY")) return "secp256k1";
  return "ed25519";
}

main();