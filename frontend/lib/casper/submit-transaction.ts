import "server-only";

import { CasperNetwork, Transaction } from "casper-js-sdk";
import { createRpcClient } from "@/lib/casper/rpc";

let networkClient: CasperNetwork | null = null;

async function getNetwork(): Promise<CasperNetwork> {
  if (!networkClient) {
    networkClient = await CasperNetwork.create(createRpcClient());
  }
  return networkClient;
}

export function parseSignedTransaction(payload: unknown): Transaction {
  if (!payload || typeof payload !== "object") {
    throw new Error("Signed transaction payload is missing.");
  }
  return Transaction.fromJSON(payload);
}

export async function broadcastSignedTransaction(payload: unknown): Promise<string> {
  const transaction = parseSignedTransaction(payload);
  const network = await getNetwork();
  const result = await network.putTransaction(transaction);

  if ("transactionHash" in result && result.transactionHash) {
    return result.transactionHash.toHex();
  }
  if ("deployHash" in result && result.deployHash) {
    return result.deployHash.toHex();
  }

  throw new Error("Node accepted the transaction but returned no hash.");
}

export type TransactionExecutionState = "pending" | "success" | "failed";

export async function queryTransactionState(hash: string): Promise<{
  state: TransactionExecutionState;
  errorMessage?: string;
}> {
  const network = await getNetwork();
  const rpc = createRpcClient();

  try {
    const info = await network.getTransaction(hash);
    const executionInfo = info.executionInfo;

    if (!executionInfo) {
      return { state: "pending" };
    }

    const errorMessage = executionInfo.executionResult?.errorMessage;
    if (errorMessage) {
      return { state: "failed", errorMessage };
    }

    return { state: "success" };
  } catch {
    // Native purse fund path returns a legacy deploy hash — poll getDeploy.
    try {
      const deployInfo = await rpc.getDeploy(hash);
      const executionInfo =
        (deployInfo as { executionInfo?: { executionResult?: { errorMessage?: string } } })
          ?.executionInfo ??
        (
          deployInfo as {
            rawJSON?: {
              execution_info?: {
                execution_result?: { error_message?: string; Success?: unknown; Failure?: unknown };
              };
            };
          }
        )?.rawJSON?.execution_info;

      if (!executionInfo) {
        return { state: "pending" };
      }

      const er =
        (executionInfo as { executionResult?: { errorMessage?: string } }).executionResult ??
        (executionInfo as { execution_result?: { error_message?: string } }).execution_result;

      const errorMessage =
        er && "errorMessage" in er
          ? er.errorMessage
          : er && "error_message" in er
            ? er.error_message
            : undefined;

      if (errorMessage) {
        return { state: "failed", errorMessage };
      }

      // Deploy present with execution result and no error → success.
      return { state: "success" };
    } catch {
      return { state: "pending" };
    }
  }
}