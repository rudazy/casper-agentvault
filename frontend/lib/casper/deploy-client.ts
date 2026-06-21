export type DeployContractName = "Escrow" | "Attestation";

export interface DeployBuildResponse {
  contract: DeployContractName;
  label: string;
  preview: string;
  paymentHint: string;
  transaction: Record<string, unknown>;
}

export interface DeployStatusResponse {
  postJobSupported: boolean;
  configured: { escrow: string; attestation: string };
  deployer: { escrow?: string; attestation?: string; balance?: string };
}

export async function requestDeployBuild(
  contract: DeployContractName,
  publicKey: string,
): Promise<DeployBuildResponse> {
  const res = await fetch("/api/casper/deploy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contract, publicKey }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to build deploy transaction.");
  }
  return data as DeployBuildResponse;
}

export async function fetchDeployStatus(publicKey: string): Promise<DeployStatusResponse> {
  const res = await fetch(
    `/api/casper/deploy?publicKey=${encodeURIComponent(publicKey)}`,
    { cache: "no-store" },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to read deploy status.");
  }
  return data as DeployStatusResponse;
}

export async function syncDeployedHashes(publicKey: string): Promise<{
  escrow: string;
  attestation: string;
  restartRequired: boolean;
}> {
  const res = await fetch("/api/casper/deploy", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to sync deployed package hashes.");
  }
  return data;
}