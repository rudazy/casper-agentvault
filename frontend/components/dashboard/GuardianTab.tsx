"use client";

import { ModuleActionBar } from "@/components/dashboard/ModuleActionBar";
import {
  ActivityTimeline,
  formatActivityTime,
  PanelCard,
  StatCard,
  StatusBadge,
  TableSkeleton,
} from "@/components/dashboard/shared";
import type { TabAction, TabPanelProps } from "@/components/dashboard/types";

const ACTIONS: TabAction[] = [
  { id: "guardian_scan", label: "Scan positions", hint: "Live RPC balance query", primary: true },
  { id: "guardian_rebalance", label: "Rebalance sim", hint: "Agent-guided allocation analysis" },
  { id: "guardian_risk_log", label: "Risk log", hint: "Agent risk audit trail" },
];

const POSITIONS = [
  { pool: "CSPR / USDC", allocation: 32, apy: "9.1%", status: "active" as const },
  { pool: "Liquid staking", allocation: 28, apy: "7.8%", status: "active" as const },
  { pool: "LP rewards", allocation: 18, apy: "11.2%", status: "active" as const },
  { pool: "Stable vault", allocation: 14, apy: "5.4%", status: "idle" as const },
  { pool: "Reserve buffer", allocation: 8, apy: "0.0%", status: "idle" as const },
];

const RISK_EVENTS = [
  { event: "Drawdown guard", detail: "Max 2.1% — within 5% threshold", level: "ok" as const },
  { event: "Pool concentration", detail: "Top pool at 32% — below 40% cap", level: "ok" as const },
  { event: "Oracle drift", detail: "Price feed latency 420ms", level: "watch" as const },
];

export function GuardianTab({
  accent,
  connected,
  runAction,
  feedback,
  busyAction,
  clearFeedback,
  lastBalance,
  recentActivity,
}: TabPanelProps) {
  const scanning = busyAction === "guardian_scan";
  const rebalancing = busyAction === "guardian_rebalance";
  const tabActivity = recentActivity
    .filter((e) => e.actionId.startsWith("guardian_"))
    .slice(0, 4)
    .map((e) => ({
      label: e.label,
      message: e.message,
      status: e.status,
      time: formatActivityTime(e.timestamp),
    }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-sans text-2xl font-semibold tracking-wide sm:text-4xl">
          Portfolio Guardian
        </h2>
        <p className="mt-2 font-mono text-sm text-[#888] sm:text-lg">
          Autonomous yield farming and risk protection agent
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
        <StatCard label="Net APY" value="8.4%" accent={accent} subtext="30d rolling" />
        <StatCard label="Risk" value="Low" accent={accent} />
        <StatCard label="Positions" value="6" accent={accent} />
        <StatCard
          label="Live balance"
          value={lastBalance ?? "--"}
          accent={accent}
          loading={scanning}
          subtext={lastBalance ? "from RPC scan" : "run scan"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <PanelCard
          title="Agent status"
          subtitle="Sentinel monitoring loop"
          className="lg:col-span-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#888]">State</span>
              <StatusBadge label="Active" tone="active" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#888]">Last rebalance</span>
              <span className="font-mono text-xs text-[#ccc]">2h ago (sim)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#888]">Next check</span>
              <span className="font-mono text-xs text-[#ccc]">14m</span>
            </div>
            <div className="rounded border border-white/8 bg-black/40 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Guardrails
              </p>
              <ul className="mt-2 space-y-1.5 font-mono text-[10px] text-[#888]">
                <li>Max drawdown: 5%</li>
                <li>Max single-pool: 40%</li>
                <li>Min reserve: 5%</li>
              </ul>
            </div>
            {rebalancing ? (
              <div className="rounded border border-[#ff8a3d]/25 bg-[#ff8a3d]/8 px-3 py-2">
                <p className="font-mono text-[10px] text-[#ff8a3d]">
                  Running rebalance simulation...
                </p>
              </div>
            ) : null}
          </div>
        </PanelCard>

        <PanelCard
          title="Positions"
          subtitle="Casper DeFi allocation"
          className="lg:col-span-2"
        >
          {scanning ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-wider text-[#666]">
                    <th className="pb-2 pr-4">Pool</th>
                    <th className="pb-2 pr-4">Alloc</th>
                    <th className="pb-2 pr-4">APY</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {POSITIONS.map((pos) => (
                    <tr key={pos.pool} className="border-b border-white/5">
                      <td className="py-2.5 pr-4 font-mono text-xs text-[#ddd]">{pos.pool}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pos.allocation}%`,
                                backgroundColor: accent,
                              }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-[#888]">
                            {pos.allocation}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs" style={{ color: accent }}>
                        {pos.apy}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge
                          label={pos.status}
                          tone={pos.status === "active" ? "active" : "idle"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PanelCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <PanelCard title="Risk log" subtitle="Latest sentinel events">
          <ul className="space-y-3">
            {RISK_EVENTS.map((item) => (
              <li
                key={item.event}
                className="flex items-start justify-between gap-3 rounded border border-white/8 bg-black/35 px-3 py-2.5"
              >
                <div>
                  <p className="font-sans text-xs font-medium text-[#ddd]">{item.event}</p>
                  <p className="mt-1 font-mono text-[10px] text-[#777]">{item.detail}</p>
                </div>
                <StatusBadge
                  label={item.level === "ok" ? "clear" : "watch"}
                  tone={item.level === "ok" ? "active" : "warn"}
                />
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Activity" subtitle="Recent guardian actions">
          <ActivityTimeline
            entries={tabActivity}
            accent={accent}
            emptyLabel="No guardian actions yet. Run a scan or simulation."
          />
        </PanelCard>
      </div>

      <ModuleActionBar
        actions={ACTIONS}
        accent={accent}
        connected={connected}
        runAction={runAction}
        feedback={feedback}
        busyAction={busyAction}
        clearFeedback={clearFeedback}
        description="Scan live balance via RPC or queue mock agent pipelines."
      />
    </div>
  );
}