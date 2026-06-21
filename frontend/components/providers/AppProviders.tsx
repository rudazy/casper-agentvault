"use client";

import { CasperClickProvider } from "@/components/providers/CasperClickProvider";
import { CsprClickInit } from "@/components/providers/CsprClickInit";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CasperClickProvider>
      <CsprClickInit />
      {children}
      <div id="csprclick-ui" aria-hidden="true" />
    </CasperClickProvider>
  );
}