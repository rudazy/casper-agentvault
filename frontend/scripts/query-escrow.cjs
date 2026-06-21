const { HttpHandler, RpcClient, Hash } = require("casper-js-sdk");

const RPC = process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? "https://node.testnet.casper.network/rpc";
const PACKAGE =
  "433e15a9b6297ce06d257bc71e4e3be5d91b1d86f9a5879e7dbcc0b943e03f4a";

async function main() {
  const rpc = new RpcClient(new HttpHandler(RPC));
  const key = `hash-${PACKAGE}`;
  const result = await rpc.queryGlobalState(null, key, []);
  console.log(JSON.stringify(result?.rawJSON ?? result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});