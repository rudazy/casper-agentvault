import type { ReactNode } from "react";

export function DocsPage({
  title,
  eyebrow,
  lead,
  children,
}: {
  title: string;
  eyebrow?: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <article>
      {eyebrow ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#ff8a3d]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-3 font-sans text-3xl font-bold tracking-wide text-[#f5f5f5] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-[#888] sm:text-base">
        {lead}
      </p>
      <div className="mt-10 space-y-8">{children}</div>
    </article>
  );
}

export function DocsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-sans text-xl font-semibold tracking-wide text-[#f5f5f5] sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 font-mono text-sm leading-relaxed text-[#999]">
        {children}
      </div>
    </section>
  );
}

export function DocsParagraph({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed">{children}</p>;
}

export function DocsList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#c8f135]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DocsSteps({
  steps,
}: {
  steps: { title: string; body: ReactNode }[];
}) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="relative flex gap-4 border-l border-[#1f1f1f] pb-8 pl-6 last:pb-0"
        >
          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded border border-[#c8f135]/40 bg-[#111] font-sans text-[11px] font-semibold text-[#c8f135]">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-sans text-base font-medium tracking-wide text-[#e8e8e8]">
              {step.title}
            </h3>
            <div className="mt-2 space-y-2 font-mono text-sm leading-relaxed text-[#888]">
              {step.body}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DocsCallout({
  title,
  children,
  tone = "lime",
}: {
  title: string;
  children: ReactNode;
  tone?: "lime" | "gold" | "amber";
}) {
  const colors = {
    lime: { border: "#c8f13540", bg: "#c8f13510", title: "#c8f135" },
    gold: { border: "#f5c84240", bg: "#f5c84210", title: "#f5c842" },
    amber: { border: "#ff8a3d40", bg: "#ff8a3d10", title: "#ff8a3d" },
  };
  const c = colors[tone];

  return (
    <div
      className="rounded border p-4 sm:p-5"
      style={{ borderColor: c.border, backgroundColor: c.bg }}
    >
      <p
        className="font-sans text-sm font-medium tracking-wide"
        style={{ color: c.title }}
      >
        {title}
      </p>
      <div className="mt-2 font-mono text-sm leading-relaxed text-[#aaa]">
        {children}
      </div>
    </div>
  );
}

export function DocsLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="text-[#c8f135] underline decoration-[#c8f135]/30 underline-offset-4 transition hover:decoration-[#c8f135]"
    >
      {children}
    </a>
  );
}

export function DocsCode({ children }: { children: string }) {
  return (
    <code className="rounded border border-white/10 bg-black/50 px-1.5 py-0.5 font-mono text-xs text-[#d8f58a]">
      {children}
    </code>
  );
}

export function DocsTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded border border-white/10">
      <table className="w-full min-w-[480px] text-left font-mono text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-[#111]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-sans text-[10px] font-medium uppercase tracking-wider text-[#666]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-[#aaa]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocsFlow({
  steps,
}: {
  steps: { label: string; detail: string }[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
      {steps.map((step, i) => (
        <div key={step.label} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col rounded border border-white/10 bg-[#111] p-4">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#666]">
              Step {i + 1}
            </span>
            <span className="mt-1 font-sans text-sm font-medium text-[#e0e0e0]">
              {step.label}
            </span>
            <span className="mt-1 font-mono text-[11px] leading-relaxed text-[#777]">
              {step.detail}
            </span>
          </div>
          {i < steps.length - 1 ? (
            <span className="hidden shrink-0 font-mono text-[#444] sm:inline">
              &rarr;
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}