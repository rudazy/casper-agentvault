const { HttpHandler, RpcClient } = require("casper-js-sdk");

const RPC =
  process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? "https://node.testnet.casper.network/rpc";
const CONTRACT_HASH =
  process.env.CONTRACT_HASH ??
  "22e51cbba739ef46f057ba4a7206140581d0bdefba9d0e72dc6c0cb751aa8773";

async function main() {
  const rpc = new RpcClient(new HttpHandler(RPC));
  const key = `hash-${CONTRACT_HASH.replace(/^(contract-|hash-)/, "")}`;
  const result = await rpc.queryLatestGlobalState(key, []);
  const stored = result?.storedValue ?? result?.rawJSON?.stored_value;
  const entryPoints =
    stored?.contract?.entryPoints ??
    stored?.Contract?.entry_points ??
    stored?.contractPackage;
  if (stored?.contract?.entryPoints) {
    const names = stored.contract.entryPoints.map((e) => e.name ?? e.entryPoint?.name);
    console.log("entry_points:", names);
  } else {
    console.log(JSON.stringify(stored, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});