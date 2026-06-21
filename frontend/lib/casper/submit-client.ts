export interface SubmitTransactionResponse {
  transactionHash: string;
}

export type TransactionStatusResponse = {
  state: "pending" | "success" | "failed";
  errorMessage?: string;
};

export async function broadcastSignedTransaction(
  transaction: Record<string, unknown>,
): Promise<SubmitTransactionResponse> {
  const res = await fetch("/api/casper/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction }),
  });

  const data = (await res.json()) as SubmitTransactionResponse & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to broadcast transaction.");
  }

  return data;
}

export async function queryTransactionStatus(
  transactionHash: string,
): Promise<TransactionStatusResponse> {
  const res = await fetch(
    `/api/casper/status?hash=${encodeURIComponent(transactionHash)}`,
    { cache: "no-store" },
  );

  const data = (await res.json()) as TransactionStatusResponse & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to query transaction status.");
  }

  return data;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForTransactionConfirmation(
  transactionHash: string,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<TransactionStatusResponse> {
  const maxAttempts = options?.maxAttempts ?? 36;
  const intervalMs = options?.intervalMs ?? 5_000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await queryTransactionStatus(transactionHash);
    if (status.state !== "pending") {
      return status;
    }
    if (attempt < maxAttempts - 1) {
      await sleep(intervalMs);
    }
  }

  return { state: "pending" };
}