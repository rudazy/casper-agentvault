export function humanizeOnChainError(message: string): string {
  const normalized = message.trim();

  if (/invalid context/i.test(normalized)) {
    return (
      "The deployed Escrow contract does not expose post_job yet (Odra init is deploy-only). " +
      "Rebuild and redeploy contracts/agentvault-core, then update NEXT_PUBLIC_ESCROW_PACKAGE_HASH."
    );
  }

  if (/entry point.*not found|unknown entry point/i.test(normalized)) {
    return (
      "Contract entry point missing on-chain. Redeploy the upgraded Escrow contract with post_job, " +
      "then update the escrow package hash in your env."
    );
  }

  return normalized;
}