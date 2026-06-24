import {
  DocsFlow,
  DocsList,
  DocsPage,
  DocsParagraph,
  DocsSection,
  DocsTable,
} from "@/components/docs/DocsProse";

export default function ArchitectureDocsPage() {
  return (
    <DocsPage
      eyebrow="Architecture"
      title="How the pieces connect"
      lead="AgentVault is an operating system for on-chain AI agents. The dashboard is the shell; CSPR.click is the wallet layer; module agents form the reasoning layer; Odra contracts on casper-test are the settlement layer. Finance, Compliance, and Commerce are applications built on top."
    >
      <DocsSection title="System layers">
        <DocsTable
          headers={["Layer", "Role", "Responsibility"]}
          rows={[
            [
              "Presentation",
              "Web dashboard",
              "Module tabs, transaction feedback, activity timeline",
            ],
            [
              "Wallet",
              "CSPR.click + Casper Wallet",
              "Connect, sign, and broadcast transactions to casper-test",
            ],
            [
              "Agents",
              "Module-specific reasoning",
              "Evaluate each action before wallet approval",
            ],
            [
              "Settlement",
              "Odra contracts (Escrow, Attestation)",
              "Persist escrow state and attestation reputation on-chain",
            ],
            [
              "Chain access",
              "Casper RPC",
              "Balance queries and transaction construction",
            ],
          ]}
        />
      </DocsSection>

      <DocsSection title="Action pipeline">
        <DocsFlow
          steps={[
            {
              label: "User action",
              detail: "User selects an action in Guardian, RWA, or Marketplace",
            },
            {
              label: "Agent reasoning",
              detail: "Module agent returns summary, risk notes, and preview",
            },
            {
              label: "Transaction build",
              detail: "System prepares RPC read, simulation, or signed transaction",
            },
            {
              label: "Wallet signing",
              detail: "CSPR.click requests approval and submits to casper-test",
            },
            {
              label: "Feedback",
              detail: "Dashboard updates status and activity timeline",
            },
          ]}
        />
      </DocsSection>

      <DocsSection title="Agent coordinator pattern">
        <DocsParagraph>
          Each application maps to a dedicated agent — Guardian, RWA, Marketplace. A
          shared coordinator dispatches requests by action ID, normalizes responses,
          and returns structured insight (summary, reasoning, preview) to the
          dashboard. Module logic stays isolated behind one API surface.
        </DocsParagraph>
        <DocsList
          items={[
            "Advisory actions return agent reasoning without a chain call",
            "RPC actions query live chain state — Guardian balance scan",
            "Transaction actions require wallet approval and on-chain settlement",
          ]}
        />
      </DocsSection>

      <DocsSection title="Core components">
        <DocsList
          items={[
            "Agent layer — module agents and shared coordinator",
            "Dashboard — wallet connection, application UI, transaction feedback",
            "Contracts — Odra Escrow and Attestation on casper-test",
          ]}
        />
      </DocsSection>
    </DocsPage>
  );
}