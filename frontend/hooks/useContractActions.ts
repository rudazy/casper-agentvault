"use client";

import { useCasperWallet } from "@/components/providers/CasperClickProvider";
import type { ActivityEntry } from "@/components/dashboard/types";
import {
  buildAction,
  queryAccountBalance,
  type ContractActionId,
} from "@/lib/casper/contract-actions";
import { useCallback, useState } from "react";

export type TxStatus = "idle" | "building" | "signing" | "success" | "error";

export interface TxFeedback {
  status: TxStatus;
  actionLabel?: string;
  message: string;
  transactionHash?: string;
}

const IDLE_FEEDBACK: TxFeedback = { status: "idle", message: "" };
const MAX_ACTIVITY = 8;

const ACTION_LABELS: Record<ContractActionId, string> = {
  guardian_scan: "Scan positions",
  guardian_rebalance: "Run rebalance sim",
  guardian_risk_log: "View risk log",
  rwa_submit: "Submit asset data",
  rwa_verify: "Verify hash",
  rwa_publish: "Publish attestation",
  market_browse: "Browse agents",
  market_post_job: "Post a job",
  market_release: "Release escrow",
};

function pushActivity(
  prev: ActivityEntry[],
  entry: Omit<ActivityEntry, "id" | "timestamp">,
): ActivityEntry[] {
  const next: ActivityEntry = {
    ...entry,
    id: `${entry.actionId}-${Date.now()}`,
    timestamp: Date.now(),
  };
  return [next, ...prev].slice(0, MAX_ACTIVITY);
}

export function useContractActions() {
  const { publicKey, clickRef } = useCasperWallet();
  const [feedback, setFeedback] = useState<TxFeedback>(IDLE_FEEDBACK);
  const [busyAction, setBusyAction] = useState<ContractActionId | null>(null);
  const [lastBalance, setLastBalance] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  const recordActivity = useCallback(
    (
      actionId: ContractActionId,
      status: TxStatus,
      message: string,
      transactionHash?: string,
    ) => {
      if (status === "idle" || status === "building" || status === "signing") return;
      setRecentActivity((prev) =>
        pushActivity(prev, {
          actionId,
          label: ACTION_LABELS[actionId],
          status,
          message,
          transactionHash,
        }),
      );
    },
    [],
  );

  const runAction = useCallback(
    async (actionId: ContractActionId) => {
      if (!publicKey) {
        setFeedback({
          status: "error",
          message: "Connect your wallet before running module actions.",
        });
        return;
      }

      setBusyAction(actionId);
      setFeedback({ status: "building", message: "Preparing action..." });

      try {
        const built = await buildAction(actionId, publicKey);

        if (built.mode === "mock") {
          const result: TxFeedback = {
            status: "success",
            actionLabel: built.label,
            message: built.preview ?? "Mock action completed.",
          };
          setFeedback(result);
          recordActivity(actionId, "success", result.message);
          return;
        }

        if (built.mode === "rpc") {
          const balance = await queryAccountBalance(publicKey);
          setLastBalance(balance);
          const result: TxFeedback = {
            status: "success",
            actionLabel: built.label,
            message: `Live balance: ${balance}`,
          };
          setFeedback(result);
          recordActivity(actionId, "success", result.message);
          return;
        }

        if (!clickRef) {
          const result: TxFeedback = {
            status: "error",
            actionLabel: built.label,
            message: "CSPR.click is not ready. Refresh and try again.",
          };
          setFeedback(result);
          recordActivity(actionId, "error", result.message);
          return;
        }

        if (!built.transaction) {
          throw new Error("Transaction was not built.");
        }

        setFeedback({
          status: "signing",
          actionLabel: built.label,
          message: built.preview ?? "Approve the transaction in your wallet.",
        });

        const chainName = clickRef.chainName ?? "casper-test";
        const transactionJson = built.transaction.toJSON();
        const parsed: Record<string, unknown> =
          typeof transactionJson === "string"
            ? (JSON.parse(transactionJson) as Record<string, unknown>)
            : (transactionJson as Record<string, unknown>);
        const payload = { ...parsed, chain_name: chainName };

        const result = await clickRef.send(payload, publicKey, (status) => {
          if (status === "sent") {
            setFeedback((prev) => ({
              ...prev,
              status: "signing",
              message: "Transaction sent. Waiting for network confirmation...",
            }));
          }
        });

        if (result?.cancelled) {
          const fb: TxFeedback = {
            status: "error",
            actionLabel: built.label,
            message: "Transaction cancelled in wallet.",
          };
          setFeedback(fb);
          recordActivity(actionId, "error", fb.message);
          return;
        }

        if (result?.error) {
          const fb: TxFeedback = {
            status: "error",
            actionLabel: built.label,
            message: String(result.error),
          };
          setFeedback(fb);
          recordActivity(actionId, "error", fb.message);
          return;
        }

        if (result?.transactionHash) {
          const fb: TxFeedback = {
            status: "success",
            actionLabel: built.label,
            message: `Confirmed on ${chainName}.`,
            transactionHash: result.transactionHash,
          };
          setFeedback(fb);
          recordActivity(actionId, "success", fb.message, result.transactionHash);
          return;
        }

        const fb: TxFeedback = {
          status: "success",
          actionLabel: built.label,
          message: "Transaction submitted.",
        };
        setFeedback(fb);
        recordActivity(actionId, "success", fb.message);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Action failed unexpectedly.";
        setFeedback({ status: "error", message });
        recordActivity(actionId, "error", message);
      } finally {
        setBusyAction(null);
      }
    },
    [clickRef, publicKey, recordActivity],
  );

  const clearFeedback = useCallback(() => {
    setFeedback(IDLE_FEEDBACK);
  }, []);

  return {
    runAction,
    feedback,
    busyAction,
    clearFeedback,
    lastBalance,
    recentActivity,
  };
}