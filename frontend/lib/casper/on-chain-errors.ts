export function humanizeOnChainError(message: string): string {
  const normalized = message.trim();

  // casper-js-sdk DER/PEM parser — almost always a mangled CASPER_VAULT_OPERATOR_PEM.
  if (/Failed to decode tag of ["']?seq["']?/i.test(normalized)) {
    return (
      "Operator private key could not be parsed (PEM/DER). " +
      "On Vercel, set CASPER_VAULT_OPERATOR_PEM to the full EC/ED25519 PEM " +
      "(BEGIN…END), with real newlines or literal \\n between lines — no quotes. " +
      "Must match the wallet that installed the Vault package."
    );
  }

  if (/413|payload too large|PUT_PAYLOAD_TOO_LARGE/i.test(normalized)) {
    return (
      "RPC rejected the payable deposit session (payload too large). " +
      "Deposit must be put via https://node.testnet.casper.network/rpc — not CSPR.cloud. " +
      "On Vercel set CASPER_PUT_RPC_URL=https://node.testnet.casper.network/rpc and redeploy. " +
      "Owner wallet + CASPER_VAULT_OPERATOR_PEM still required."
    );
  }

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

  // Odra VaultError codes surface as "User error: N" from casper-test execution results.
  const userCode = normalized.match(/user error:\s*(\d+)/i);
  if (userCode) {
    const code = Number(userCode[1]);
    const vaultMessages: Record<number, string> = {
      1:
        "Not owner. authorize_agent / revoke_agent / withdraw only work for the wallet that installed this Vault package. Deploy Vault from the connected wallet (or switch to the installer key).",
      2:
        "Agent not authorized. The signing wallet is not an active agent on this Vault. Authorize this key first (for a one-wallet demo: set agent = your connected key, Authorize, then Agent spend). Order: authorize → spend → revoke.",
      3:
        "Agent revoked. Re-authorize the agent before agent spend (demo order: authorize → spend → revoke).",
      4: "Session expired. Re-authorize with a later expires_at.",
      5: "Action not allowed by agent bitmask (transfer bit not set).",
      6: "Spend cap exceeded for this window.",
      7:
        "Insufficient vault balance. Use Deposit with a positive CSPR amount first (payable proxy attaches funds). Plain deposit without attach leaves the vault empty.",
      8: "Invalid policy (spend cap, period, or expiry).",
    };
    if (vaultMessages[code]) {
      return vaultMessages[code];
    }
  }

  return normalized;
}