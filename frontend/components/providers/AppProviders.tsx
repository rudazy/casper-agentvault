"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

const ClickStack = dynamic(
  () => import("@/components/providers/ClickStack").then((mod) => mod.ClickStack),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-[#0a0a0a]" aria-hidden="true" />,
  },
);

export function AppProviders({ children }: { children: ReactNode }) {
  return <ClickStack>{children}</ClickStack>;
}