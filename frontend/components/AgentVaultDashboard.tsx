"use client";

import { GuardianTab } from "@/components/dashboard/GuardianTab";
import { MarketplaceTab } from "@/components/dashboard/MarketplaceTab";
import { RwaTab } from "@/components/dashboard/RwaTab";
import type { TabId } from "@/components/dashboard/types";
import { useCasperWallet } from "@/components/providers/CasperClickProvider";
import { TransactionFeedback } from "@/components/dashboard/TransactionFeedback";
import { useContractActions } from "@/hooks/useContractActions";
import { useContractDeploy } from "@/hooks/useContractDeploy";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

const TABS: { id: TabId; label: string; shortLabel: string; accent: string }[] = [
  { id: "guardian", label: "Portfolio Guardian", shortLabel: "Guardian", accent: "#c8f135" },
  { id: "rwa", label: "RWA Oracle", shortLabel: "RWA", accent: "#f5c842" },
  { id: "marketplace", label: "Agent Marketplace", shortLabel: "Market", accent: "#ff8a3d" },
];

function shortenKey(key: string): string {
  if (key.length <= 16) return key;
  return `${key.slice(0, 8)}...${key.slice(-6)}`;
}

export function AgentVaultDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("guardian");
  const {
    publicKey,
    provider,
    isReady,
    isConnecting,
    connectError,
    connectWallet,
    disconnectWallet,
    switchAccount,
  } = useCasperWallet();

  const {
    runAction,
    feedback,
    busyAction,
    clearFeedback,
    lastBalance,
    recentActivity,
  } = useContractActions();

  const contractDeploy = useContractDeploy();

  const connected = Boolean(publicKey);
  const activeTabMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  const statusMessage = useMemo(() => {
    if (connectError) return connectError;
    if (!isReady) return "Loading CSPR.click wallet runtime...";
    if (isConnecting) {
      return "Approve the connection in Casper Wallet or the CSPR.click modal.";
    }
    if (connected) {
      return `Connected via ${provider ?? "Casper wallet"}.`;
    }
    return "";
  }, [connected, connectError, isConnecting, isReady, provider]);

  const tabProps = {
    accent: activeTabMeta.accent,
    connected,
    publicKey,
    runAction,
    feedback,
    busyAction,
    clearFeedback,
    lastBalance,
    recentActivity,
  };

  return (
    <div className="relative min-h-screen text-[#f5f5f5]">
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[#c8f135]/40 bg-[#c8f135]/10 font-sans text-xs font-bold text-[#c8f135] sm:h-10 sm:w-10">
              AV
            </div>
            <div className="min-w-0">
              <p className="truncate font-sans text-base font-semibold tracking-wide sm:text-lg">
                AgentVault
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666]">
                Casper Network
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/docs"
              className="rounded border border-white/15 px-2.5 py-2 font-mono text-[10px] uppercase tracking-wider text-[#aaa] transition hover:border-[#c8f135]/40 hover:text-[#c8f135] sm:px-3"
            >
              Docs
            </Link>
            {connected ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={switchAccount}
                  className="hidden items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 sm:flex"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#c8f135]" />
                  <span className="max-w-[180px] truncate font-mono text-xs">
                    {shortenKey(publicKey ?? "")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={disconnectWallet}
                  className="rounded border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#aaa] transition hover:border-white/30 hover:text-white sm:px-4"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                disabled={isConnecting || (!isReady && !connectError)}
                className="rounded bg-[#f5f5f5] px-4 py-2.5 font-sans text-xs font-medium text-[#0a0a0a] transition hover:bg-white disabled:opacity-60 sm:px-5 sm:text-sm"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 text-center sm:mb-12"
        >
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[#ff8a3d] sm:text-xs">
            Agentic command center
          </p>
          <h1 className="font-sans text-3xl font-bold tracking-tight sm:text-5xl">
            Your Agentic Command Center
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-mono text-sm leading-relaxed text-[#888] sm:text-base">
            One wallet. Three autonomous agents working for you on Casper.
          </p>
          {statusMessage ? (
            <p className="mx-auto mt-4 max-w-xl rounded border border-[#c8f135]/25 bg-[#c8f135]/10 px-4 py-2 font-mono text-xs text-[#d8f58a]">
              {statusMessage}
            </p>
          ) : null}
        </motion.section>

        {feedback.status !== "idle" ? (
          <div className="mb-6">
            <TransactionFeedback feedback={feedback} onDismiss={clearFeedback} />
          </div>
        ) : null}

        <div className="mb-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded px-5 py-3 font-sans text-sm font-medium transition-all sm:px-8 sm:py-4 ${
                  isActive
                    ? "bg-[#f5f5f5] text-[#0a0a0a] shadow-[0_8px_30px_rgba(200,241,53,0.15)]"
                    : "border border-white/10 bg-white/5 text-[#aaa] hover:bg-white/10"
                }`}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden rounded border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl sm:p-8 md:p-12"
            style={{ boxShadow: `0 0 60px ${activeTabMeta.accent}12` }}
          >
            <div
              className="mb-6 h-1 w-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${activeTabMeta.accent}, transparent)`,
              }}
            />

            {activeTab === "guardian" && <GuardianTab {...tabProps} />}
            {activeTab === "rwa" && <RwaTab {...tabProps} />}
            {activeTab === "marketplace" && (
              <MarketplaceTab {...tabProps} deploy={contractDeploy} />
            )}

            {connected && publicKey && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 rounded border border-[#c8f135]/20 bg-[#c8f135]/5 px-4 py-3 sm:hidden"
              >
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                  Active account
                </p>
                <p className="mt-1 truncate font-mono text-xs">{shortenKey(publicKey)}</p>
              </motion.div>
            )}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}