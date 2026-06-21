export const CASPER_CHAIN_NAME =
  process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME ?? "casper-test";

/** Deployed on casper-test — see contracts/agentvault-core/resources/casper-test-contracts.toml */
const CASPER_TEST_ESCROW_PACKAGE_HASH =
  "hash-75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb";

const CASPER_TEST_ATTESTATION_PACKAGE_HASH =
  "hash-25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95";

export const ESCROW_PACKAGE_HASH =
  process.env.NEXT_PUBLIC_ESCROW_PACKAGE_HASH ?? CASPER_TEST_ESCROW_PACKAGE_HASH;

export const ATTESTATION_PACKAGE_HASH =
  process.env.NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH ??
  CASPER_TEST_ATTESTATION_PACKAGE_HASH;

/** Minimum payment (motes) accepted by casper-test for contract package calls. */
export const DEFAULT_DEPLOY_COST = 5_000_000_000;
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