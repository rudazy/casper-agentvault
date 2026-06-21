import { DocsShell } from "@/components/docs/DocsShell";
import { SiteBackground } from "@/components/SiteBackground";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | Casper AgentVault",
  description:
    "Learn how AgentVault unifies DeFi portfolio management, RWA compliance, and agent hiring on Casper Network.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteBackground />
      <DocsShell>{children}</DocsShell>
    </>
  );
}