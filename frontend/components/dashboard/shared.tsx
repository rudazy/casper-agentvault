"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  accent,
  loading,
  subtext,
}: {
  label: string;
  value: string;
  accent: string;
  loading?: boolean;
  subtext?: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-black/40 p-3 text-center sm:p-4">
      <p className="font-mono text-[9px] uppercase tracking-wider text-[#666] sm:text-[10px]">
        {label}
      </p>
      {loading ? (
        <div className="mx-auto mt-2 h-6 w-16 animate-pulse rounded bg-white/10 sm:h-7 sm:w-20" />
      ) : (
        <p
          className="mt-1 font-sans text-lg font-semibold sm:text-2xl"
          style={{ color: accent }}
        >
          {value}
        </p>
      )}
      {subtext ? (
        <p className="mt-1 font-mono text-[9px] text-[#555] sm:text-[10px]">{subtext}</p>
      ) : null}
    </div>
  );
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "active" | "pending" | "idle" | "warn";
}) {
  const colors = {
    active: { bg: "#c8f13518", border: "#c8f13540", text: "#c8f135" },
    pending: { bg: "#f5c84218", border: "#f5c84240", text: "#f5c842" },
    idle: { bg: "#ffffff08", border: "#ffffff18", text: "#888" },
    warn: { bg: "#ff8a3d18", border: "#ff8a3d40", text: "#ff8a3d" },
  };
  const c = colors[tone];

  return (
    <span
      className="inline-flex items-center rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider sm:text-[10px]"
      style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text }}
    >
      {label}
    </span>
  );
}

export function PanelCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded border border-white/10 bg-black/45 p-5 backdrop-blur-md sm:p-6 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-sans text-base font-medium tracking-wide sm:text-lg">{title}</h3>
          {subtitle ? (
            <p className="mt-1 font-mono text-[10px] text-[#666] sm:text-xs">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function FormField({
  label,
  id,
  value,
  onChange,
  placeholder,
  hint,
  disabled,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1.5 w-full rounded border border-white/10 bg-black/60 px-3 py-2.5 font-mono text-xs text-[#f5f5f5] placeholder:text-[#444] outline-none transition focus:border-white/25 disabled:opacity-50"
      />
      {hint ? <p className="mt-1 font-mono text-[9px] text-[#555]">{hint}</p> : null}
    </div>
  );
}

export function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
      ))}
    </div>
  );
}

export function ActivityTimeline({
  entries,
  accent,
  emptyLabel,
}: {
  entries: { label: string; message: string; status: string; time: string }[];
  accent: string;
  emptyLabel: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="font-mono text-xs text-[#555]">{emptyLabel}</p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry, i) => (
        <motion.li
          key={`${entry.label}-${i}`}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-3 border-l border-white/10 pl-3"
          style={{ borderLeftColor: `${accent}30` }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs font-medium text-[#ddd]">{entry.label}</span>
              <StatusBadge
                label={entry.status}
                tone={
                  entry.status === "success"
                    ? "active"
                    : entry.status === "error"
                      ? "warn"
                      : "idle"
                }
              />
            </div>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-[#777]">
              {entry.message}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[9px] text-[#555]">{entry.time}</span>
        </motion.li>
      ))}
    </ul>
  );
}

export function formatActivityTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}