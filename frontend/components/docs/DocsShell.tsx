"use client";

import { DocsSidebar } from "@/components/docs/DocsSidebar";
import Link from "next/link";
import { useState } from "react";

export function DocsShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen text-[#f5f5f5]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[#c8f135]/40 bg-[#c8f135]/10 font-sans text-xs font-bold text-[#c8f135]">
                AV
              </div>
              <div className="min-w-0">
                <p className="truncate font-sans text-sm font-semibold tracking-wide sm:text-base">
                  AgentVault
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#666]">
                  Documentation
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#aaa] lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="docs-sidebar"
            >
              {mobileOpen ? "Close" : "Menu"}
            </button>
            <Link
              href="/"
              className="rounded border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#aaa] transition hover:border-[#c8f135]/40 hover:text-[#c8f135] sm:px-4"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-0 px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
        <aside
          id="docs-sidebar"
          className={`${
            mobileOpen ? "block" : "hidden"
          } fixed inset-x-0 top-[57px] z-30 max-h-[calc(100vh-57px)] overflow-y-auto border-b border-white/10 bg-[#0a0a0a] px-4 py-6 lg:static lg:block lg:w-56 lg:shrink-0 lg:overflow-visible lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 xl:w-64`}
        >
          <DocsSidebar onNavigate={() => setMobileOpen(false)} />
        </aside>

        <main className="min-w-0 flex-1 lg:pl-10 xl:pl-14">{children}</main>
      </div>
    </div>
  );
}