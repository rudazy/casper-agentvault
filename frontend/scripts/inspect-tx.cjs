const {
  Args,
  CasperNetwork,
  CLValue,
  PublicKey,
  HttpHandler,
  RpcClient,
} = require("casper-js-sdk");

async function main() {
  const RPC =
    process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? "https://node.testnet.casper.network/rpc";
  const PACKAGE =
    "433e15a9b6297ce06d257bc71e4e3be5d91b1d86f9a5879e7dbcc0b943e03f4a";
  const pk = PublicKey.fromHex(
    "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
  );

  const handler = new HttpHandler(RPC);
  const rpc = new RpcClient(handler);
  const network = await CasperNetwork.create(rpc);

  const args = Args.fromMap({
    recipient: CLValue.newCLPublicKey(pk),
    amount: CLValue.newCLUInt512("2500000000"),
  });

  const tx = network.createContractPackageCallTransaction(
    pk,
    PACKAGE,
    "init",
    "casper-test",
    5_000_000_000,
    args,
    1_800_000,
  );

  console.log(JSON.stringify(tx.toJSON(), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});