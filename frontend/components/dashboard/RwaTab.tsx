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
  { id: "rwa_submit", label: "Submit asset", hint: "Mock compliance intake" },
  { id: "rwa_verify", label: "Verify hash", hint: "On-chain reputation update", primary: true },
  { id: "rwa_publish", label: "Publish attestation", hint: "Attestation.publish on-chain" },
];

const QUEUE = [
  { id: "RWA-1042", asset: "Commercial note — Austin", hash: "a3f8...9c21", status: "review" as const },
  { id: "RWA-1041", asset: "Warehouse receipt — EU", hash: "7b12...4e88", status: "pending" as const },
  { id: "RWA-1040", asset: "Invoice bundle — SG", hash: "c901...1a77", status: "pending" as const },
];

const RECENT_ATTESTATIONS = [
  { asset: "Treasury bill — US", score: 97, date: "Jun 18" },
  { asset: "Real estate token — UK", score: 91, date: "Jun 16" },
  { asset: "Carbon credit — BR", score: 88, date: "Jun 14" },
];

export function RwaTab({
  accent,
  connected,
  runAction,
  feedback,
  busyAction,
  clearFeedback,
  recentActivity,
}: TabPanelProps) {
  const [assetId, setAssetId] = useState("");
  const [dataHash, setDataHash] = useState("");
  const [jurisdiction, setJurisdiction] = useState("US");
  const [formError, setFormError] = useState("");

  const tabActivity = recentActivity
    .filter((e) => e.actionId.startsWith("rwa_"))
    .slice(0, 4)
    .map((e) => ({
      label: e.label,
      message: e.message,
      status: e.status,
      time: formatActivityTime(e.timestamp),
    }));

  const formReady = useMemo(
    () => assetId.trim().length > 0 && dataHash.trim().length >= 8,
    [assetId, dataHash],
  );

  const handleSubmit = async (actionId: TabAction["id"]) => {
    if (!formReady && (actionId === "rwa_submit" || actionId === "rwa_verify")) {
      setFormError("Enter asset ID and data hash (min 8 chars) before submitting.");
      return;
    }
    setFormError("");
    await runAction(actionId, { assetId, dataHash, jurisdiction });
  };

  const anyBusy = busyAction !== null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-sans text-2xl font-semibold tracking-wide sm:text-4xl">
          RWA Compliance Oracle
        </h2>
        <p className="mt-2 font-mono text-sm text-[#888] sm:text-lg">
          Trustless attestations for real-world assets
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard label="Attestations" value="128" accent={accent} subtext="all time" />
        <StatCard label="Trust score" value="94" accent={accent} subtext="network avg" />
        <StatCard label="Pending" value="3" accent={accent} subtext="in queue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        <PanelCard
          title="Asset intake"
          subtitle="Submit data for oracle review"
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            <FormField
              label="Asset ID"
              id="rwa-asset-id"
              value={assetId}
              onChange={setAssetId}
              placeholder="RWA-1043"
              disabled={anyBusy}
            />
            <FormField
              label="Data hash"
              id="rwa-data-hash"
              value={dataHash}
              onChange={setDataHash}
              placeholder="SHA-256 hex or IPFS CID"
              hint="Used for verify and publish flows"
              disabled={anyBusy}
            />
            <div>
              <label
                htmlFor="rwa-jurisdiction"
                className="font-mono text-[10px] uppercase tracking-wider text-[#666]"
              >
                Jurisdiction
              </label>
              <select
                id="rwa-jurisdiction"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                disabled={anyBusy}
                className="mt-1.5 w-full rounded border border-white/10 bg-black/60 px-3 py-2.5 font-mono text-xs text-[#f5f5f5] outline-none focus:border-white/25 disabled:opacity-50"
              >
                <option value="US">United States</option>
                <option value="EU">European Union</option>
                <option value="SG">Singapore</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>
            {formError ? (
              <p className="font-mono text-[10px] text-[#e23636]">{formError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => void handleSubmit("rwa_submit")}
                disabled={!connected || anyBusy}
                className="rounded border border-white/15 px-4 py-2 font-sans text-xs text-[#ddd] transition hover:bg-white/5 disabled:opacity-50"
              >
                {busyAction === "rwa_submit" ? "Submitting..." : "Queue submission"}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit("rwa_verify")}
                disabled={!connected || anyBusy}
                className="rounded px-4 py-2 font-sans text-xs font-medium text-[#0a0a0a] disabled:opacity-50"
                style={{ backgroundColor: accent }}
              >
                {busyAction === "rwa_verify" ? "Verifying..." : "Verify on-chain"}
              </button>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Verification queue"
          subtitle="Assets awaiting oracle review"
          className="lg:col-span-3"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-left">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-wider text-[#666]">
                  <th className="pb-2 pr-3">ID</th>
                  <th className="pb-2 pr-3">Asset</th>
                  <th className="pb-2 pr-3">Hash</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {QUEUE.map((row) => (
                  <tr key={row.id} className="border-b border-white/5">
                    <td className="py-2.5 pr-3 font-mono text-[10px] text-[#aaa]">{row.id}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-[#ddd]">{row.asset}</td>
                    <td className="py-2.5 pr-3 font-mono text-[10px] text-[#666]">{row.hash}</td>
                    <td className="py-2.5">
                      <StatusBadge
                        label={row.status}
                        tone={row.status === "review" ? "warn" : "pending"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <PanelCard title="Recent attestations" subtitle="Published on-chain scores">
          <ul className="space-y-3">
            {RECENT_ATTESTATIONS.map((item) => (
              <li
                key={item.asset}
                className="flex items-center justify-between rounded border border-white/8 bg-black/35 px-3 py-2.5"
              >
                <div>
                  <p className="font-sans text-xs font-medium text-[#ddd]">{item.asset}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[#666]">{item.date}</p>
                </div>
                <span className="font-sans text-sm font-semibold" style={{ color: accent }}>
                  {item.score}
                </span>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Activity" subtitle="RWA pipeline events">
          <ActivityTimeline
            entries={tabActivity}
            accent={accent}
            emptyLabel="No RWA actions yet. Submit an asset or publish an attestation."
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
        description="Submit assets, verify hashes on-chain, or publish new attestations."
      />
    </div>
  );
}