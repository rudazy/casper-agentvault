import { HttpHandler, RpcClient } from "casper-js-sdk";

/** Direct testnet node — accepts large session WASM put_transaction bodies (~370KB). */
const DEFAULT_RPC = "https://node.testnet.casper.network/rpc";

/** Browser cannot call most RPC endpoints directly (CORS). Use /api/casper/actions instead. */

export function getCasperRpcUrl(): string {
  return process.env.NEXT_PUBLIC_CASPER_RPC_URL ?? DEFAULT_RPC;
}

/**
 * RPC for put_transaction of large payloads (Odra proxy session + WASM).
 *
 * CSPR.cloud and some gateways return HTTP 413 Payload Too Large for ~370KB
 * session txs even when reads work fine. Prefer a direct casper.network node
 * unless CASPER_PUT_RPC_URL is set explicitly.
 */
export function getCasperPutRpcUrl(): string {
  const override = process.env.CASPER_PUT_RPC_URL?.trim();
  if (override) return override;

  const publicUrl = getCasperRpcUrl();
  // Direct node already configured — keep it.
  if (/casper\.network/i.test(publicUrl)) {
    return publicUrl;
  }
  // Avoid cspr.cloud (and similar) for large puts.
  return DEFAULT_RPC;
}

function buildClient(url: string): RpcClient {
  const handler = new HttpHandler(url);
  // Cloud token only when hitting cspr.cloud — never send it to casper.network.
  if (/cspr\.cloud/i.test(url)) {
    const authToken = process.env.NEXT_PUBLIC_CSPR_CLOUD_AUTH_TOKEN;
    if (authToken) {
      handler.setCustomHeaders({ Authorization: authToken });
    }
  }
  return new RpcClient(handler);
}

export function createRpcClient(): RpcClient {
  return buildClient(getCasperRpcUrl());
}

/** Prefer for SessionBuilder put_transaction (Vault deposit proxy, etc.). */
export function createPutRpcClient(): RpcClient {
  return buildClient(getCasperPutRpcUrl());
}