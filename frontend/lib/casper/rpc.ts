import { HttpHandler, RpcClient } from "casper-js-sdk";

const DEFAULT_RPC = "https://node.testnet.casper.network/rpc";

export function getCasperRpcUrl(): string {
  return process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? DEFAULT_RPC;
}

export function createRpcClient(): RpcClient {
  return new RpcClient(new HttpHandler(getCasperRpcUrl()));
}