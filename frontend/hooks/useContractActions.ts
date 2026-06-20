"use client";

import { useCasperWallet } from "@/components/providers/CasperClickProvider";
import type { ActivityEntry } from "@/components/dashboard/types";
import { queryAgent, toAgentInsight } from "@/lib/agents/client";
import type { AgentInsight } from "@/lib/agents/types";
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

        const built = await buildAction(actionId, publicKey, payload);

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
          const balance = await queryAccountBalance(publicKey);
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
          message: txPreview,
          agent: agentInsight,
        });

        const chainName = clickRef.chainName ?? "casper-test";
        const transactionJson = built.transaction.toJSON();
        const parsed: Record<string, unknown> =
          typeof transactionJson === "string"
            ? (JSON.parse(transactionJson) as Record<string, unknown>)
            : (transactionJson as Record<string, unknown>);
        const sendPayload = { ...parsed, chain_name: chainName };

        const result = await clickRef.send(sendPayload, publicKey, (status) => {
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
            agent: agentInsight,
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
            agent: agentInsight,
          };
          setFeedback(fb);
          recordActivity(actionId, "error", fb.message);
          return;
        }

        if (result?.transactionHash) {
          const fb: TxFeedback = {
            status: "success",
            actionLabel: built.label,
            message: agentInsight
              ? formatAgentMessage(agentInsight, `Confirmed on ${chainName}.`)
              : `Confirmed on ${chainName}.`,
            transactionHash: result.transactionHash,
            agent: agentInsight,
          };
          setFeedback(fb);
          recordActivity(actionId, "success", fb.message, result.transactionHash);
          return;
        }

        const fb: TxFeedback = {
          status: "success",
          actionLabel: built.label,
          message: agentInsight
            ? formatAgentMessage(agentInsight, "Transaction submitted.")
            : "Transaction submitted.",
          agent: agentInsight,
        };
        setFeedback(fb);
        recordActivity(actionId, "success", fb.message);
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