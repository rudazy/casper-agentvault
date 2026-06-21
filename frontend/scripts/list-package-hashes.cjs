const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const {
  AccountIdentifier,
  HttpHandler,
  PrivateKey,
  KeyAlgorithm,
  RpcClient,
} = require("casper-js-sdk");

const KEY_PATH = join(__dirname, "..", "..", "contracts", "agentvault-core", "secret_key.pem");
const RPC = process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? "https://node.testnet.casper.network/rpc";

async function main() {
  const pem = readFileSync(KEY_PATH, "utf8");
  const alg = pem.includes("EC PRIVATE KEY") ? KeyAlgorithm.SECP256K1 : KeyAlgorithm.ED25519;
  const key = PrivateKey.fromPem(pem, alg);
  const rpc = new RpcClient(new HttpHandler(RPC));
  const account = await rpc.getAccountInfo(null, new AccountIdentifier(undefined, key.publicKey));
  const named = (account.account.namedKeys ?? []).filter((k) => k.name?.includes("package_hash"));
  console.log(JSON.stringify(named, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});