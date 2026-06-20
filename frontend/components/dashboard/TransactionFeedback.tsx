"use client";

import type { TxFeedback } from "@/hooks/useContractActions";
import { AnimatePresence, motion } from "framer-motion";

function feedbackAccent(status: string): string {
  if (status === "success") return "#c8f135";
  if (status === "error") return "#e23636";
  if (status === "signing" || status === "building") return "#ff8a3d";
  return "#666666";
}

function shortenHash(hash: string): string {
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

const STATUS_STEPS = ["building", "signing", "success"] as const;

export function TransactionFeedback({
  feedback,
  onDismiss,
}: {
  feedback: TxFeedback;
  onDismiss: () => void;
}) {
  const show = feedback.status !== "idle";
  const accent = feedbackAccent(feedback.status);
  const activeStep =
    feedback.status === "building"
      ? 0
      : feedback.status === "signing"
        ? 1
        : feedback.status === "success"
          ? 2
          : -1;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 overflow-hidden"
        >
          <div
            className="rounded border px-4 py-3"
            style={{
              borderColor: `${accent}40`,
              backgroundColor: `${accent}10`,
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#888]">
                Transaction pipeline
              </p>
              <button
                type="button"
                onClick={onDismiss}
                className="font-mono text-[10px] uppercase tracking-wider text-[#666] transition hover:text-[#aaa]"
              >
                Dismiss
              </button>
            </div>

            {(feedback.status === "building" ||
              feedback.status === "signing" ||
              feedback.status === "success") && (
              <div className="mb-3 flex items-center gap-1">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex flex-1 items-center gap-1">
                    <div
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{
                        backgroundColor:
                          i <= activeStep ? accent : "rgba(255,255,255,0.08)",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2">
              {(feedback.status === "building" || feedback.status === "signing") && (
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full"
                  style={{ backgroundColor: accent }}
                />
              )}
              <div className="min-w-0 flex-1">
                {feedback.actionLabel ? (
                  <p
                    className="font-sans text-xs font-medium sm:text-sm"
                    style={{ color: accent }}
                  >
                    {feedback.actionLabel}
                  </p>
                ) : null}
                <p className="mt-1 font-mono text-xs leading-relaxed text-[#ccc]">
                  {feedback.message}
                </p>
                {feedback.transactionHash ? (
                  <p className="mt-2 font-mono text-[10px] text-[#888]">
                    TX: {shortenHash(feedback.transactionHash)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}