import {
  buildDeployTransaction,
  escrowSupportsPostJob,
  getConfiguredHashes,
  getWasmAvailability,
  persistDeployedHashes,
  queryDeployerBalance,
  queryDeployerPackageHashes,
  type DeployContractName,
} from "@/lib/casper/deploy-contracts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isDeployContract(value: unknown): value is DeployContractName {
  return value === "Escrow" || value === "Attestation" || value === "Vault";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicKey = searchParams.get("publicKey")?.trim() ?? "";

    const postJobSupported = await escrowSupportsPostJob();
    const configured = getConfiguredHashes();
    const wasmAvailable = getWasmAvailability();

    let deployer: {
      escrow?: string;
      attestation?: string;
      vault?: string;
      balance?: string;
    } = {};

    if (publicKey) {
      deployer = await queryDeployerPackageHashes(publicKey);
      try {
        deployer.balance = await queryDeployerBalance(publicKey);
      } catch {
        deployer.balance = undefined;
      }
    }

    return NextResponse.json({
      postJobSupported,
      configured,
      wasmAvailable,
      deployer,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read deploy status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      contract?: unknown;
      publicKey?: unknown;
    };

    if (!isDeployContract(body.contract)) {
      return NextResponse.json({ error: "Invalid or missing contract." }, { status: 400 });
    }

    if (typeof body.publicKey !== "string" || body.publicKey.length === 0) {
      return NextResponse.json({ error: "Missing publicKey." }, { status: 400 });
    }

    const transaction = buildDeployTransaction(body.contract, body.publicKey);
    const transactionJson = transaction.toJSON();
    const parsed =
      typeof transactionJson === "string"
        ? (JSON.parse(transactionJson) as Record<string, unknown>)
        : (transactionJson as Record<string, unknown>);

    return NextResponse.json({
      contract: body.contract,
      label: `Deploy ${body.contract}`,
      preview: `Install upgraded ${body.contract} WASM to casper-test (up to 500 CSPR max payment per install).`,
      paymentHint:
        "Fund the deployer with at least 500 CSPR for one install, or 1500 CSPR before Escrow + Attestation + Vault. Each install reserves up to 500 CSPR payment.",
      transaction: parsed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build deploy transaction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { publicKey?: unknown };
    if (typeof body.publicKey !== "string" || body.publicKey.length === 0) {
      return NextResponse.json({ error: "Missing publicKey." }, { status: 400 });
    }

    const hashes = await queryDeployerPackageHashes(body.publicKey);
    if (!hashes.escrow || !hashes.attestation) {
      return NextResponse.json(
        {
          error:
            "Deploy Escrow and Attestation from this wallet before syncing package hashes. Vault is optional but recommended for Session Vault demos.",
        },
        { status: 400 },
      );
    }

    const vaultHash = hashes.vault ?? "";
    persistDeployedHashes(hashes.escrow, hashes.attestation, vaultHash);

    return NextResponse.json({
      escrow: hashes.escrow,
      attestation: hashes.attestation,
      vault: vaultHash || undefined,
      restartRequired: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync package hashes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}