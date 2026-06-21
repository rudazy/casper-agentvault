import { HttpHandler, RpcClient } from "casper-js-sdk";

const DEFAULT_RPC = "https://node.testnet.casper.network/rpc";

/** Browser cannot call most RPC endpoints directly (CORS). Use /api/casper/actions instead. */

export function getCasperRpcUrl(): string {
  return process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? DEFAULT_RPC;
}

export function createRpcClient(): RpcClient {
  const handler = new HttpHandler(getCasperRpcUrl());
  const authToken = process.env.NEXT_PUBLIC_CSPR_CLOUD_AUTH_TOKEN;
  if (authToken) {
    handler.setCustomHeaders({ Authorization: authToken });
  }
  return new RpcClient(handler);
}