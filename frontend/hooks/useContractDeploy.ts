"use client";

import { useCasperWallet } from "@/components/providers/CasperClickProvider";
import type { TxFeedback } from "@/hooks/useContractActions";
import {
  fetchDeployStatus,
  requestDeployBuild,
  syncDeployedHashes,
  type DeployContractName,
} from "@/lib/casper/deploy-client";
import { humanizeOnChainError } from "@/lib/casper/on-chain-errors";
import {
  broadcastSignedTransaction,
  waitForTransactionConfirmation,
} from "@/lib/casper/submit-client";
import { useCallback, useEffect, useState } from "react";

function shortenHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function useContractDeploy() {
  const { publicKey, clickRef } = useCasperWallet();
  const [feedback, setFeedback] = useState<TxFeedback>({ status: "idle", message: "" });
  const [busyContract, setBusyContract] = useState<DeployContractName | "sync" | null>(null);
  const [postJobSupported, setPostJobSupported] = useState<boolean | null>(null);
  const [deployerHashes, setDeployerHashes] = useState<{
    escrow?: string;
    attestation?: string;
  }>({});

  const refreshStatus = useCallback(async () => {
    if (!publicKey) {
      setPostJobSupported(null);
      setDeployerHashes({});
      return;
    }
    try {
      const status = await fetchDeployStatus(publicKey);
      setPostJobSupported(status.postJobSupported);
      setDeployerHashes({
        escrow: status.deployer.escrow,
        attestation: status.deployer.attestation,
      });
    } catch {
      setPostJobSupported(null);
    }
  }, [publicKey]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const runDeploy = useCallback(
    async (contract: DeployContractName) => {
      if (!publicKey) {
        setFeedback({
          status: "error",
          message: "Connect your wallet before deploying contracts.",
        });
        return;
      }

      if (!clickRef) {
        setFeedback({
          status: "error",
          message: "CSPR.click is not ready. Refresh and try again.",
        });
        return;
      }

      setBusyContract(contract);
      const label = `Deploy ${contract}`;

      try {
        setFeedback({ status: "building", actionLabel: label, message: "Building install transaction..." });
        const built = await requestDeployBuild(contract, publicKey);

        setFeedback({
          status: "signing",
          actionLabel: label,
          message: `${built.preview} Approve in Casper Wallet.`,
        });

        const chainName = clickRef.chainName ?? "casper-test";
        const signResult = await clickRef.sign(
          { ...built.transaction, chain_name: chainName },
          publicKey,
        );

        if (!signResult || signResult.cancelled) {
          setFeedback({ status: "error", actionLabel: label, message: "Deploy cancelled in wallet." });
          return;
        }
        if (signResult.error) {
          setFeedback({
            status: "error",
            actionLabel: label,
            message: String(signResult.error),
          });
          return;
        }

        const signedTx = signResult.transaction ?? signResult.deploy;
        if (!signedTx || typeof signedTx !== "object") {
          throw new Error("Wallet did not return a signed transaction.");
        }

        setFeedback({
          status: "signing",
          actionLabel: label,
          message: "Signed. Broadcasting deploy to casper-test...",
        });

        const { transactionHash } = await broadcastSignedTransaction(
          signedTx as Record<string, unknown>,
        );

        setFeedback({
          status: "signing",
          actionLabel: label,
          message: `Submitted ${shortenHash(transactionHash)}. Waiting for finalization...`,
          transactionHash,
        });

        const confirmation = await waitForTransactionConfirmation(transactionHash);
        if (confirmation.state === "failed") {
          setFeedback({
            status: "error",
            actionLabel: label,
            message: humanizeOnChainError(
              confirmation.errorMessage ?? "Deploy failed on-chain.",
            ),
            transactionHash,
          });
          return;
        }
        if (confirmation.state === "pending") {
          setFeedback({
            status: "error",
            actionLabel: label,
            message: "Deploy submitted but did not finalize in time. Check testnet.cspr.live.",
            transactionHash,
          });
          return;
        }

        await refreshStatus();
        setFeedback({
          status: "success",
          actionLabel: label,
          message: `${contract} deployed. Deploy Attestation next, then Sync hashes.`,
          transactionHash,
        });
      } catch (error) {
        setFeedback({
          status: "error",
          message: error instanceof Error ? error.message : "Deploy failed unexpectedly.",
        });
      } finally {
        setBusyContract(null);
      }
    },
    [clickRef, publicKey, refreshStatus],
  );

  const runSync = useCallback(async () => {
    if (!publicKey) {
      setFeedback({ status: "error", message: "Connect your wallet before syncing hashes." });
      return;
    }

    setBusyContract("sync");
    try {
      const result = await syncDeployedHashes(publicKey);
      setPostJobSupported(true);
      setDeployerHashes({ escrow: result.escrow, attestation: result.attestation });
      setFeedback({
        status: "success",
        actionLabel: "Sync package hashes",
        message: result.restartRequired
          ? "Hashes saved. Restart npm run dev, then post a job."
          : "Hashes saved. You can post a job now.",
      });
    } catch (error) {
      setFeedback({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to sync package hashes.",
      });
    } finally {
      setBusyContract(null);
    }
  }, [publicKey]);

  const clearFeedback = useCallback(() => {
    setFeedback({ status: "idle", message: "" });
  }, []);

  return {
    feedback,
    busyContract,
    postJobSupported,
    deployerHashes,
    runDeploy,
    runSync,
    clearFeedback,
    refreshStatus,
  };
}