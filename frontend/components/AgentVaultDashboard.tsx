"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type TabId = "guardian" | "rwa" | "marketplace";

const TABS: { id: TabId; label: string; tagline: string; accent: string }[] = [
  {
    id: "guardian",
    label: "Portfolio Guardian",
    tagline: "Yield + risk autopilot",
    accent: "#c8f135",
  },
  {
    id: "rwa",
    label: "RWA Oracle",
    tagline: "Compliance attestations",
    accent: "#f5c842",
  },
  {
    id: "marketplace",
    label: "Agent Marketplace",
    tagline: "Escrow + reputation",
    accent: "#ff8a3d",
  },
];

const MODULE_COPY: Record<
  TabId,
  { title: string; description: string; stats: { label: string; value: string }[]; actions: string[] }
> = {
  guardian: {
    title: "Portfolio Guardian",
    description:
      "Autonomous DeFi yield optimizer and risk sentinel. Monitors positions, rebalances safely, explains every move.",
    stats: [
      { label: "Net APY", value: "8.4%" },
      { label: "Risk Score", value: "Low" },
      { label: "Positions", value: "6" },
    ],
    actions: ["Scan positions", "Run rebalance sim", "View risk log"],
  },
  rwa: {
    title: "RWA Compliance Oracle",
    description:
      "AI-powered compliance pipeline that fetches real-world data and posts verifiable on-chain attestations.",
    stats: [
      { label: "Attestations", value: "128" },
      { label: "Avg Trust", value: "94" },
      { label: "Pending", value: "3" },
    ],
    actions: ["Submit asset data", "Verify hash", "Publish attestation"],
  },
  marketplace: {
    title: "Agent Marketplace",
    description:
      "Escrow-powered marketplace to hire AI agents, verify deliverables, and build on-chain reputation via x402.",
    stats: [
      { label: "Active Jobs", value: "24" },
      { label: "Agents Live", value: "57" },
      { label: "Escrowed", value: "12.4k CSPR" },
    ],
    actions: ["Browse agents", "Post a job", "Release escrow"],
  },
};

export function AgentVaultDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("guardian");
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [connecting, setConnecting] = useState(false);

  const activeAccent = TABS.find((t) => t.id === activeTab)?.accent ?? "#c8f135";
  const module = MODULE_COPY[activeTab];

  const connectWallet = async () => {
    if (connected) return;
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 900));
    setConnected(true);
    setAddress("01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2");
    setConnecting(false);
  };

  return (
    <div className="relative min-h-screen text-[#f5f5f5]">
      <header className="sticky top-0 z-20 border-b border-[#1f1f1f]/80 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-[#333] bg-[#141414] text-xs font-bold tracking-widest text-[#c8f135]">
              AV
            </div>
            <div>
              <p className="font-sans text-sm font-semibold tracking-wide">AgentVault</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">
                Casper Network
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={connectWallet}
            disabled={connecting}
            className="group relative overflow-hidden border border-[#333] bg-[#111] px-5 py-2.5 font-mono text-xs uppercase tracking-wider transition hover:border-[#c8f135]/50 disabled:opacity-60"
          >
            <span
              className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-[#c8f135]/0 via-[#c8f135]/20 to-[#c8f135]/0 transition-transform duration-500 group-hover:translate-x-[100%]"
              aria-hidden
            />
            {connecting
              ? "Connecting..."
              : connected
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Connect Wallet"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-[#ff8a3d]">
            Unified agentic wallet
          </p>
          <h1 className="font-sans text-4xl font-semibold tracking-wide md:text-5xl">
            One vault. Three agents.
          </h1>
          <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-[#666]">
            DeFi guardian, RWA oracle, and agent marketplace — orchestrated from a single Casper smart
            wallet. Contract calls are mocked until on-chain wiring lands.
          </p>
        </motion.section>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Modules", value: "3", hue: "#c8f135" },
            { label: "Chain", value: "Casper", hue: "#f5c842" },
            { label: "Status", value: connected ? "Live" : "Offline", hue: "#ff8a3d" },
          ].map((item) => (
            <div
              key={item.label}
              className="border border-[#1f1f1f] bg-[#111]/80 p-5"
              style={{ boxShadow: `inset 3px 0 0 ${item.hue}` }}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#666]">
                {item.label}
              </p>
              <p className="mt-2 font-sans text-2xl font-semibold tracking-wide">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-[#1f1f1f] pb-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative px-5 py-4 text-left transition"
              >
                <span
                  className="font-sans text-sm font-medium tracking-wide transition"
                  style={{ color: isActive ? tab.accent : "#666" }}
                >
                  {tab.label}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-[#444]">
                  {tab.tagline}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: tab.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border border-[#1f1f1f] bg-[#111]/90"
            style={{ boxShadow: `0 0 80px ${activeAccent}15` }}
          >
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, ${activeAccent}, transparent)`,
              }}
            />

            <div className="grid gap-8 p-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="font-sans text-2xl font-semibold tracking-wide">{module.title}</h2>
                <p className="mt-3 font-mono text-sm leading-relaxed text-[#666]">
                  {module.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {module.actions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      className="border border-[#333] bg-[#0a0a0a] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#f5f5f5] transition hover:border-[#555]"
                      style={{
                        boxShadow: connected ? `0 0 20px ${activeAccent}22` : undefined,
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {module.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3"
                  >
                    <span className="font-mono text-xs uppercase tracking-wider text-[#666]">
                      {stat.label}
                    </span>
                    <span
                      className="font-sans text-lg font-semibold"
                      style={{ color: activeAccent }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}

                <div className="border border-dashed border-[#333] bg-[#0a0a0a]/60 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#666]">
                    Contract status
                  </p>
                  <p className="mt-2 font-mono text-xs text-[#888]">
                    {connected
                      ? "Mock session active — escrow + attestation stubs ready on testnet."
                      : "Connect wallet to simulate module calls."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}