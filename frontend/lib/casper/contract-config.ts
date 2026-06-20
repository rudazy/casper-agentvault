export const CASPER_CHAIN_NAME =
  process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME ?? "casper-test";

export const ESCROW_PACKAGE_HASH =
  process.env.NEXT_PUBLIC_ESCROW_PACKAGE_HASH ?? "";

export const ATTESTATION_PACKAGE_HASH =
  process.env.NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH ?? "";

export const DEFAULT_DEPLOY_COST = 100_000_000;
export const DEFAULT_TTL_MS = 1_800_000;

export function normalizePackageHash(hash: string): string {
  return hash.replace(/^hash-/, "");
}

export function hasEscrowContract(): boolean {
  return ESCROW_PACKAGE_HASH.length > 0;
}

export function hasAttestationContract(): boolean {
  return ATTESTATION_PACKAGE_HASH.length > 0;
}