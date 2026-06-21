"use client";

import { CasperClickProvider } from "@/components/providers/CasperClickProvider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return <CasperClickProvider>{children}</CasperClickProvider>;
}