"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useState } from "react";

type TabId = "guardian" | "rwa" | "marketplace";
type LoginMethod = "casper" | "email" | null;

const TABS: { id: TabId; label: string; shortLabel: string; accent: string }[] = [
  { id: "guardian", label: "Portfolio Guardian", shortLabel: "Guardian", accent: "#c8f135" },
  { id: "rwa", label: "RWA Oracle", shortLabel: "RWA", accent: "#f5c842" },
  { id: "marketplace", label: "Agent Marketplace", shortLabel: "Market", accent: "#ff8a3d" },
];

const MODULE_CONTENT: Record<
  TabId,
  {
    title: string;
    subtitle: string;
    cards: { title: string; body: string }[];
    stats: { label: string; value: string }[];
  }
> = {
  guardian: {
    title: "Portfolio Guardian",
    subtitle: "Autonomous yield farming and risk protection agent",
    cards: [
      { title: "Portfolio Overview", body: "6 positions tracked across Casper DeFi pools. Mock APY 8.4%." },
      { title: "Agent Status", body: "Sentinel active. Last rebalance simulation passed all guardrails." },
    ],
    stats: [
      { label: "Net APY", value: "8.4%" },
      { label: "Risk", value: "Low" },
      { label: "Alerts", value: "0" },
    ],
  },
  rwa: {
    title: "RWA Compliance Oracle",
    subtitle: "Trustless attestations for real-world assets",
    cards: [
      { title: "Submit Asset Data", body: "Upload hashes and metadata for compliance review and on-chain attestation." },
      { title: "Verification Queue", body: "3 assets awaiting oracle review. Demo pipeline ready for contract wiring." },
    ],
    stats: [
      { label: "Attestations", value: "128" },
      { label: "Trust Score", value: "94" },
      { label: "Pending", value: "3" },
    ],
  },
  marketplace: {
    title: "Agent Marketplace",
    subtitle: "Hire verified AI agents with escrow and reputation",
    cards: [
      { title: "Browse Agents", body: "57 agents listed. Filter by skill, escrow tier, and on-chain reputation." },
      { title: "Open Escrows", body: "12.4k CSPR locked across 24 active jobs. x402 payments mocked for demo." },
    ],
    stats: [
      { label: "Jobs", value: "24" },
      { label: "Agents", value: "57" },
      { label: "Escrowed", value: "12.4k" },
    ],
  },
};

export function AgentVaultDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("guardian");
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(null);
  const [connecting, setConnecting] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const activeTabMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const module = MODULE_CONTENT[activeTab];

  const connectCasper = async () => {
    setConnecting(true);
    setStatusMessage("");
    await new Promise((r) => setTimeout(r, 700));
    setLoginMethod("casper");
    setConnected(true);
    setAddress("casper1q8mock7wallet9demo4hackathon");
    setConnecting(false);
    setStatusMessage("Casper wallet connected (demo session).");
  };

  const submitEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes("@")) return;

    setConnecting(true);
    await new Promise((r) => setTimeout(r, 900));
    const domain = emailInput.split("@")[1] ?? "vault.demo";
    setLoginMethod("email");
    setConnected(true);
    setAddress(`email-wallet@${domain}`);
    setEmailOpen(false);
    setEmailInput("");
    setConnecting(false);
    setStatusMessage("Email wallet provisioned (demo — Web3Auth-style flow coming soon).");
  };

  const disconnect = () => {
    setConnected(false);
    setAddress("");
    setLoginMethod(null);
    setStatusMessage("");
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
            {connected ? (
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 sm:flex">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#c8f135]" />
                  <span className="max-w-[140px] truncate font-mono text-xs">{address}</span>
                  <span className="font-mono text-[10px] uppercase text-[#666]">
                    {loginMethod === "email" ? "email" : "casper"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={disconnect}
                  className="rounded border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#aaa] transition hover:border-white/30 hover:text-white sm:px-4"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={connectCasper}
                  disabled={connecting}
                  className="rounded bg-[#f5f5f5] px-3 py-2.5 font-sans text-xs font-medium text-[#0a0a0a] transition hover:bg-white disabled:opacity-60 sm:px-5 sm:text-sm"
                >
                  {connecting ? "..." : "Casper"}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailOpen(true)}
                  disabled={connecting}
                  className="rounded border border-white/25 px-3 py-2.5 font-sans text-xs font-medium transition hover:bg-white/5 disabled:opacity-60 sm:px-5 sm:text-sm"
                >
                  Email
                </button>
              </>
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

            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="font-sans text-2xl font-semibold tracking-wide sm:text-4xl">
                  {module.title}
                </h2>
                <p className="mt-2 font-mono text-sm text-[#888] sm:text-lg">{module.subtitle}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {module.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded border border-white/10 bg-black/40 p-3 text-center sm:p-4"
                  >
                    <p className="font-mono text-[9px] uppercase tracking-wider text-[#666] sm:text-[10px]">
                      {stat.label}
                    </p>
                    <p
                      className="mt-1 font-sans text-lg font-semibold sm:text-2xl"
                      style={{ color: activeTabMeta.accent }}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                {module.cards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded border border-white/10 bg-black/45 p-5 backdrop-blur-md sm:p-8"
                  >
                    <h3 className="font-sans text-lg font-medium tracking-wide sm:text-xl">
                      {card.title}
                    </h3>
                    <p className="mt-3 font-mono text-xs leading-relaxed text-[#888] sm:text-sm">
                      {card.body}
                    </p>
                  </div>
                ))}
              </div>

              {connected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 rounded border border-[#c8f135]/20 bg-[#c8f135]/5 px-4 py-3 sm:hidden"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#c8f135]" />
                  <span className="truncate font-mono text-xs">{address}</span>
                </motion.div>
              )}
            </div>
          </motion.section>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {emailOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
            onClick={() => setEmailOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded border border-white/15 bg-[#111]/95 p-6 backdrop-blur-xl"
            >
              <h3 className="font-sans text-xl font-semibold tracking-wide">Email Wallet</h3>
              <p className="mt-2 font-mono text-xs leading-relaxed text-[#888]">
                Demo flow for passwordless login. Real Web3Auth or Casper email auth will replace
                this.
              </p>
              <form onSubmit={submitEmailLogin} className="mt-6 space-y-4">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full rounded border border-white/15 bg-black/50 px-4 py-3 font-mono text-sm outline-none transition focus:border-[#f5c842]/60"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEmailOpen(false)}
                    className="flex-1 rounded border border-white/15 py-3 font-mono text-xs uppercase tracking-wider text-[#aaa]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={connecting}
                    className="flex-1 rounded bg-[#f5c842] py-3 font-sans text-sm font-medium text-[#0a0a0a] disabled:opacity-60"
                  >
                    {connecting ? "Sending..." : "Send Magic Link"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}