"use client";

import { ModuleActionBar } from "@/components/dashboard/ModuleActionBar";
import {
  ActivityTimeline,
  formatActivityTime,
  FormField,
  PanelCard,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/shared";
import type { TabAction, TabPanelProps } from "@/components/dashboard/types";
import { useMemo, useState } from "react";

const ACTIONS: TabAction[] = [
  { id: "market_browse", label: "Browse agents", hint: "Mock marketplace index" },
  { id: "market_post_job", label: "Post job", hint: "Escrow.init on-chain", primary: true },
  { id: "market_release", label: "Release escrow", hint: "Escrow.verify_and_release" },
];

const AGENTS = [
  { name: "Yield Sentinel", skill: "DeFi ops", rep: 96, rate: "12 CSPR/hr", tier: "verified" as const },
  { name: "Compliance Oracle", skill: "RWA audit", rep: 94, rate: "18 CSPR/hr", tier: "verified" as const },
  { name: "Escrow Arbiter", skill: "Dispute resolution", rep: 91, rate: "9 CSPR/hr", tier: "standard" as const },
  { name: "Data Harvester", skill: "ETL pipelines", rep: 87, rate: "7 CSPR/hr", tier: "standard" as const },
];

const OPEN_ESCROWS = [
  { job: "Rebalance Q2 portfolio", agent: "Yield Sentinel", amount: "2.5 CSPR", status: "active" as const },
  { job: "RWA audit batch #12", agent: "Compliance Oracle", amount: "4.0 CSPR", status: "active" as const },
  { job: "API integration sprint", agent: "Data Harvester", amount: "1.2 CSPR", status: "pending" as const },
];

export function MarketplaceTab({
  accent,
  connected,
  runAction,
  feedback,
  busyAction,
  clearFeedback,
  recentActivity,
}: TabPanelProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [escrowAmount, setEscrowAmount] = useState("2.5");
  const [formError, setFormError] = useState("");
  const [showAllAgents, setShowAllAgents] = useState(false);

  const tabActivity = recentActivity
    .filter((e) => e.actionId.startsWith("market_"))
    .slice(0, 4)
    .map((e) => ({
      label: e.label,
      message: e.message,
      status: e.status,
      time: formatActivityTime(e.timestamp),
    }));

  const formReady = useMemo(
    () => jobTitle.trim().length > 2 && Number(escrowAmount) > 0,
    [jobTitle, escrowAmount],
  );

  const visibleAgents = showAllAgents ? AGENTS : AGENTS.slice(0, 3);
  const anyBusy = busyAction !== null;

  const handlePostJob = async () => {
    if (!formReady) {
      setFormError("Enter a job title and valid escrow amount before posting.");
      return;
    }
    setFormError("");
    await runAction("market_post_job", {
      jobTitle,
      jobDescription,
      escrowAmount,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-sans text-2xl font-semibold tracking-wide sm:text-4xl">
          Agent Marketplace
        </h2>
        <p className="mt-2 font-mono text-sm text-[#888] sm:text-lg">
          Hire verified AI agents with escrow and reputation
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard label="Jobs" value="24" accent={accent} subtext="active" />
        <StatCard label="Agents" value="57" accent={accent} subtext="listed" />
        <StatCard label="Escrowed" value="12.4k" accent={accent} subtext="CSPR locked" />
      </div>

      <PanelCard title="Featured agents" subtitle="Filter by skill, escrow tier, reputation">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleAgents.map((agent) => (
            <div
              key={agent.name}
              className="rounded border border-white/10 bg-black/40 p-4 transition hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-sans text-sm font-medium text-[#f5f5f5]">{agent.name}</p>
                <StatusBadge
                  label={agent.tier}
                  tone={agent.tier === "verified" ? "active" : "idle"}
                />
              </div>
              <p className="mt-2 font-mono text-[10px] text-[#666]">{agent.skill}</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#555]">
                    Reputation
                  </p>
                  <p className="font-sans text-lg font-semibold" style={{ color: accent }}>
                    {agent.rep}
                  </p>
                </div>
                <p className="font-mono text-[10px] text-[#888]">{agent.rate}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAllAgents((v) => !v);
            if (!showAllAgents) void runAction("market_browse");
          }}
          disabled={anyBusy}
          className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[#666] transition hover:text-[#aaa] disabled:opacity-50"
        >
          {showAllAgents ? "Show fewer" : "Browse all agents"}
        </button>
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <PanelCard title="Post a job" subtitle="Lock escrow via Escrow.init on deploy">
          <div className="space-y-4">
            <FormField
              label="Job title"
              id="market-job-title"
              value={jobTitle}
              onChange={setJobTitle}
              placeholder="Portfolio rebalance — Q3"
              disabled={anyBusy}
            />
            <FormField
              label="Description"
              id="market-job-desc"
              value={jobDescription}
              onChange={setJobDescription}
              placeholder="Scope, deliverables, deadline"
              disabled={anyBusy}
            />
            <FormField
              label="Escrow (CSPR)"
              id="market-escrow"
              value={escrowAmount}
              onChange={setEscrowAmount}
              placeholder="2.5"
              hint="Demo TX uses 2.5 CSPR regardless of input"
              disabled={anyBusy}
            />
            {formError ? (
              <p className="font-mono text-[10px] text-[#e23636]">{formError}</p>
            ) : null}
            <button
              type="button"
              onClick={() => void handlePostJob()}
              disabled={!connected || anyBusy}
              className="w-full rounded px-4 py-2.5 font-sans text-sm font-medium text-[#0a0a0a] transition disabled:opacity-50 sm:w-auto"
              style={{ backgroundColor: accent }}
            >
              {busyAction === "market_post_job" ? "Posting..." : "Post job with escrow"}
            </button>
          </div>
        </PanelCard>

        <PanelCard title="Open escrows" subtitle="Active jobs with locked funds">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[300px] text-left">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-wider text-[#666]">
                  <th className="pb-2 pr-3">Job</th>
                  <th className="pb-2 pr-3">Agent</th>
                  <th className="pb-2 pr-3">Locked</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {OPEN_ESCROWS.map((row) => (
                  <tr key={row.job} className="border-b border-white/5">
                    <td className="py-2.5 pr-3 font-mono text-xs text-[#ddd]">{row.job}</td>
                    <td className="py-2.5 pr-3 font-mono text-[10px] text-[#888]">{row.agent}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs" style={{ color: accent }}>
                      {row.amount}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge
                        label={row.status}
                        tone={row.status === "active" ? "active" : "pending"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Activity" subtitle="Marketplace transactions and browse events">
        <ActivityTimeline
          entries={tabActivity}
          accent={accent}
          emptyLabel="No marketplace actions yet. Post a job or browse agents."
        />
      </PanelCard>

      <ModuleActionBar
        actions={ACTIONS}
        accent={accent}
        connected={connected}
        runAction={runAction}
        feedback={feedback}
        busyAction={busyAction}
        clearFeedback={clearFeedback}
        description="Browse agents, post escrowed jobs, or release completed work."
      />
    </div>
  );
}