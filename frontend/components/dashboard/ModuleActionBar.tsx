"use client";

import type { TabAction } from "@/components/dashboard/types";
import type { ContractActionId } from "@/lib/casper/contract-actions";
import type { TxFeedback } from "@/hooks/useContractActions";
import { TransactionFeedback } from "@/components/dashboard/TransactionFeedback";

export function ModuleActionBar({
  actions,
  accent,
  connected,
  runAction,
  feedback,
  busyAction,
  clearFeedback,
  description,
}: {
  actions: TabAction[];
  accent: string;
  connected: boolean;
  runAction: (actionId: ContractActionId) => Promise<void>;
  feedback: TxFeedback;
  busyAction: ContractActionId | null;
  clearFeedback: () => void;
  description: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-black/50 p-4 sm:p-6">
      <div className="mb-4">
        <p className="font-sans text-sm font-medium tracking-wide sm:text-base">
          Module actions
        </p>
        <p className="mt-1 font-mono text-[10px] text-[#666] sm:text-xs">
          {connected
            ? description
            : "Connect wallet to enable on-chain actions."}
        </p>
      </div>

      <TransactionFeedback feedback={feedback} onDismiss={clearFeedback} />

      <div className="flex flex-wrap gap-2 sm:gap-3">
        {actions.map((action) => {
          const isBusy = busyAction === action.id;
          const anyBusy = busyAction !== null;
          const disabled = !connected || anyBusy;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => void runAction(action.id)}
              disabled={disabled}
              title={action.hint}
              className={`rounded px-4 py-2.5 font-sans text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-sm ${
                action.primary
                  ? "text-[#0a0a0a] disabled:text-[#0a0a0a]/60"
                  : "border border-white/15 text-[#ddd] hover:border-white/30 hover:bg-white/5"
              }`}
              style={action.primary ? { backgroundColor: accent } : undefined}
            >
              {isBusy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-70" />
                  Working...
                </span>
              ) : (
                action.label
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}