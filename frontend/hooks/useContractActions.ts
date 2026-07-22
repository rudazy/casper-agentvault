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
  vault_deposit: "Deposit to vault",
  vault_authorize: "Authorize agent",
  vault_transfer: "Agent transfer",
  vault_revoke: "Revoke agent",
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
          message: "Connect your wallet before running application actions.",
        });
        return;
      }

      setBusyAction(actionId);
      setFeedback({
        status: "building",
        actionLabel: ACTION_LABELS[actionId],
        message: "Consulting agent...",
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

        // Payable Vault.deposit embeds Odra proxy WASM (~0.35MB JSON). CSPR.click
        // rejects that sign payload (HTTP 413). Owner deposits go through a
        // server route that signs with the package operator key (local pem / env).
        if (actionId === "vault_deposit") {
          setFeedback({
            status: "signing",
            actionLabel: ACTION_LABELS[actionId],
            message:
              agentInsight?.summary ??
              "Submitting payable deposit (owner/operator path — no large wallet session)...",
            agent: agentInsight,
          });

          const depositRes = await fetch("/api/casper/vault-deposit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              publicKey,
              amountCspr: payload?.depositAmountCspr ?? "2",
            }),
          });
          const depositData = (await depositRes.json()) as {
            error?: string;
            transactionHash?: string;
            preview?: string;
            code?: string;
          };

          if (!depositRes.ok || !depositData.transactionHash) {
            throw new Error(
              depositData.error ??
                "Vault deposit failed. Owner wallet + CASPER_VAULT_OPERATOR_PEM (or local secret_key.pem) required.",
            );
          }

          const transactionHash = depositData.transactionHash;
          setFeedback({
            status: "signing",
            actionLabel: ACTION_LABELS[actionId],
            message: `Submitted ${shortenHash(transactionHash)}. Waiting for finalization...`,
            transactionHash,
            agent: agentInsight,
          });

          const confirmation = await waitForTransactionConfirmation(transactionHash);
          if (confirmation.state === "failed") {
            const fb: TxFeedback = {
              status: "error",
              actionLabel: ACTION_LABELS[actionId],
              message: humanizeOnChainError(
                confirmation.errorMessage ?? "Deposit failed on-chain.",
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
              actionLabel: ACTION_LABELS[actionId],
              message:
                "Deposit submitted but did not finalize in time. Check testnet.cspr.live.",
              transactionHash,
              agent: agentInsight,
            };
            setFeedback(fb);
            recordActivity(actionId, "error", fb.message, transactionHash);
            return;
          }

          const fb: TxFeedback = {
            status: "success",
            actionLabel: ACTION_LABELS[actionId],
            message: agentInsight
              ? formatAgentMessage(agentInsight, "Confirmed on casper-test.")
              : (depositData.preview ?? "Deposit confirmed on casper-test."),
            transactionHash,
            agent: agentInsight,
          };
          setFeedback(fb);
          recordActivity(actionId, "success", fb.message, transactionHash);
          return;
        }

        let actionLabel = ACTION_LABELS[actionId];
        let txPreview =
          agentInsight?.preview ?? "Approve the transaction in your wallet.";
        let transactionJson: Record<string, unknown>;

        {
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

          if (!built.transaction) {
            throw new Error("Transaction was not built.");
          }

          actionLabel = built.label;
          txPreview =
            agentInsight?.preview ?? built.preview ?? "Approve the transaction in your wallet.";
          transactionJson = built.transaction;
        }

        if (!clickRef) {
          const result: TxFeedback = {
            status: "error",
            actionLabel,
            message: "CSPR.click is not ready. Refresh and try again.",
            agent: agentInsight,
          };
          setFeedback(result);
          recordActivity(actionId, "error", result.message);
          return;
        }

        setFeedback({
          status: "signing",
          actionLabel,
          message: `${txPreview} Approve in Casper Wallet. Testnet confirmation takes ~1–2 minutes.`,
          agent: agentInsight,
        });

        const chainName = clickRef.chainName ?? "casper-test";
        const signPayload = { ...transactionJson, chain_name: chainName };

        const signResult = await clickRef.sign(signPayload, publicKey);

        if (!signResult) {
          const fb: TxFeedback = {
            status: "error",
            actionLabel,
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
            actionLabel,
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
            actionLabel,
            message: humanizeOnChainError(String(signResult.error)),
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
          actionLabel,
          message: "Signed. Broadcasting to casper-test...",
          agent: agentInsight,
        });

        const { transactionHash } = await broadcastSignedTransaction(
          signedTx as Record<string, unknown>,
        );

        setFeedback({
          status: "signing",
          actionLabel,
          message: `Submitted ${shortenHash(transactionHash)}. Waiting for finalization (~1–2 min on testnet)...`,
          transactionHash,
          agent: agentInsight,
        });

        const confirmation = await waitForTransactionConfirmation(transactionHash);

        if (confirmation.state === "failed") {
          const fb: TxFeedback = {
            status: "error",
            actionLabel,
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
            actionLabel,
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
          actionLabel,
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