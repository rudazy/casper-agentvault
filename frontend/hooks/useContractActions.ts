"use client";

import { useCasperWallet } from "@/components/providers/CasperClickProvider";
import type { ActivityEntry } from "@/components/dashboard/types";
import { queryAgent, toAgentInsight } from "@/lib/agents/client";
import type { AgentInsight } from "@/lib/agents/types";
import { requestActionBuild } from "@/lib/casper/actions-client";
import type { ContractActionId } from "@/lib/casper/contract-action-types";
import { humanizeOnChainError } from "@/lib/casper/on-chain-errors";
import {
  broadcastSignedTransaction,
  waitForTransactionConfirmation,
} from "@/lib/casper/submit-client";
import { useCallback, useState } from "react";

export type TxStatus = "idle" | "building" | "signing" | "success" | "error";

export interface TxFeedback {
  status: TxStatus;
  actionLabel?: string;
  message: string;
  transactionHash?: string;
  agent?: AgentInsight;
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

function formatAgentMessage(insight: AgentInsight, suffix?: string): string {
  const base = `${insight.summary} — ${insight.reasoning}`;
  return suffix ? `${base} ${suffix}` : base;
}

function shortenHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
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
    async (actionId: ContractActionId, payload?: Record<string, unknown>) => {
      if (!publicKey) {
        setFeedback({
          status: "error",
          message: "Connect your wallet before running module actions.",
        });
        return;
      }

      setBusyAction(actionId);
      setFeedback({
        status: "building",
        actionLabel: ACTION_LABELS[actionId],
        message: "Consulting module agent...",
      });

      let agentInsight: AgentInsight | undefined;

      try {
        try {
          const agentResponse = await queryAgent({
            actionId,
            publicKey,
            payload,
          });
          agentInsight = toAgentInsight(agentResponse);
        } catch {
          agentInsight = undefined;
        }

        setFeedback({
          status: "building",
          actionLabel: ACTION_LABELS[actionId],
          message: agentInsight
            ? agentInsight.summary
            : "Preparing action...",
          agent: agentInsight,
        });

        const built = await requestActionBuild(actionId, publicKey, payload);

        if (built.mode === "mock") {
          const message = agentInsight
            ? formatAgentMessage(agentInsight)
            : (built.preview ?? "Action completed.");
          const result: TxFeedback = {
            status: "success",
            actionLabel: built.label,
            message,
            agent: agentInsight,
          };
          setFeedback(result);
          recordActivity(actionId, "success", message);
          return;
        }

        if (built.mode === "rpc") {
          const balance = built.balance ?? "0.0000 CSPR";
          setLastBalance(balance);
          const suffix = `(Live balance: ${balance})`;
          const message = agentInsight
            ? formatAgentMessage(agentInsight, suffix)
            : `Live balance: ${balance}`;
          const result: TxFeedback = {
            status: "success",
            actionLabel: built.label,
            message,
            agent: agentInsight,
          };
          setFeedback(result);
          recordActivity(actionId, "success", message);
          return;
        }

        if (!clickRef) {
          const result: TxFeedback = {
            status: "error",
            actionLabel: built.label,
            message: "CSPR.click is not ready. Refresh and try again.",
            agent: agentInsight,
          };
          setFeedback(result);
          recordActivity(actionId, "error", result.message);
          return;
        }

        if (!built.transaction) {
          throw new Error("Transaction was not built.");
        }

        const txPreview =
          agentInsight?.preview ?? built.preview ?? "Approve the transaction in your wallet.";

        setFeedback({
          status: "signing",
          actionLabel: built.label,
          message: `${txPreview} Approve in Casper Wallet. Testnet confirmation takes ~1–2 minutes.`,
          agent: agentInsight,
        });

        const chainName = clickRef.chainName ?? "casper-test";
        const signPayload = { ...built.transaction, chain_name: chainName };

        const signResult = await clickRef.sign(signPayload, publicKey);

        if (!signResult) {
          const fb: TxFeedback = {
            status: "error",
            actionLabel: built.label,
            message:
              "No response from wallet. Unlock Casper Wallet, approve the prompt, and try again.",
            agent: agentInsight,
          };
          setFeedback(fb);
          recordActivity(actionId, "error", fb.message);
          return;
        }

        if (signResult.cancelled) {
          const fb: TxFeedback = {
            status: "error",
            actionLabel: built.label,
            message: "Transaction cancelled in wallet.",
            agent: agentInsight,
          };
          setFeedback(fb);
          recordActivity(actionId, "error", fb.message);
          return;
        }

        if (signResult.error) {
          const fb: TxFeedback = {
            status: "error",
            actionLabel: built.label,
            message: String(signResult.error),
            agent: agentInsight,
          };
          setFeedback(fb);
          recordActivity(actionId, "error", fb.message);
          return;
        }

        const signedTx = signResult.transaction ?? signResult.deploy;
        if (!signedTx || typeof signedTx !== "object") {
          throw new Error("Wallet did not return a signed transaction.");
        }

        setFeedback({
          status: "signing",
          actionLabel: built.label,
          message: "Signed. Broadcasting to casper-test...",
          agent: agentInsight,
        });

        const { transactionHash } = await broadcastSignedTransaction(
          signedTx as Record<string, unknown>,
        );

        setFeedback({
          status: "signing",
          actionLabel: built.label,
          message: `Submitted ${shortenHash(transactionHash)}. Waiting for finalization (~1–2 min on testnet)...`,
          transactionHash,
          agent: agentInsight,
        });

        const confirmation = await waitForTransactionConfirmation(transactionHash);

        if (confirmation.state === "failed") {
          const fb: TxFeedback = {
            status: "error",
            actionLabel: built.label,
            message: humanizeOnChainError(
              confirmation.errorMessage ?? "Transaction failed on-chain.",
            ),
            transactionHash,
            agent: agentInsight,
          };
          setFeedback(fb);
          recordActivity(actionId, "error", fb.message, transactionHash);
          return;
        }

        if (confirmation.state === "pending") {
          const fb: TxFeedback = {
            status: "error",
            actionLabel: built.label,
            message:
              "Transaction was submitted but did not finalize in time. Check testnet.cspr.live for status.",
            transactionHash,
            agent: agentInsight,
          };
          setFeedback(fb);
          recordActivity(actionId, "error", fb.message, transactionHash);
          return;
        }

        const fb: TxFeedback = {
          status: "success",
          actionLabel: built.label,
          message: agentInsight
            ? formatAgentMessage(agentInsight, `Confirmed on ${chainName}.`)
            : `Confirmed on ${chainName}.`,
          transactionHash,
          agent: agentInsight,
        };
        setFeedback(fb);
        recordActivity(actionId, "success", fb.message, transactionHash);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Action failed unexpectedly.";
        setFeedback({ status: "error", message, agent: agentInsight });
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