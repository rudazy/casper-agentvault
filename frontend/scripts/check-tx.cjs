const { HttpHandler, RpcClient } = require("casper-js-sdk");

const RPC = process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? "https://node.testnet.casper.network/rpc";
const hash = process.argv[2];
if (!hash) {
  console.error("Usage: node check-tx.cjs <txHash>");
  process.exit(1);
}

async function main() {
  const rpc = new RpcClient(new HttpHandler(RPC));
  const info = await rpc.getTransactionByTransactionHash(hash);
  console.log(JSON.stringify({
    hash,
    executionInfo: info?.executionInfo ?? null,
    raw: info?.rawJSON ?? null,
  }, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});