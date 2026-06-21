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
      lead="AgentVault is a three-layer system: a Next.js dashboard with CSPR.click wallet integration, a multi-agent reasoning layer, and Odra smart contracts on Casper testnet."
    >
      <DocsSection title="System layers">
        <DocsTable
          headers={["Layer", "Technology", "Responsibility"]}
          rows={[
            [
              "Presentation",
              "Next.js 16, React, Tailwind, Framer Motion",
              "Dashboard UI, module tabs, tx feedback, activity timeline",
            ],
            [
              "Wallet",
              "CSPR.click + Casper Wallet",
              "Connect, sign, and broadcast transactions to casper-test",
            ],
            [
              "Agents",
              "LangChain coordinator, module agents",
              "Reason about each action before wallet approval",
            ],
            [
              "Settlement",
              "Odra contracts (Escrow, Attestation)",
              "Persist escrow state and attestation reputation on-chain",
            ],
            [
              "Chain access",
              "casper-js-sdk, CSPR.cloud RPC",
              "Balance queries and transaction construction",
            ],
          ]}
        />
      </DocsSection>

      <DocsSection title="Action pipeline">
        <DocsFlow
          steps={[
            {
              label: "UI trigger",
              detail: "User clicks a module action in Guardian, RWA, or Marketplace",
            },
            {
              label: "Agent API",
              detail: "POST /api/agents routes to the module-specific agent",
            },
            {
              label: "Tx builder",
              detail: "contract-actions.ts builds RPC, mock, or signed transaction",
            },
            {
              label: "CSPR.click send",
              detail: "Wallet signs and submits to casper-test",
            },
            {
              label: "Feedback loop",
              detail: "useContractActions updates status and activity timeline",
            },
          ]}
        />
      </DocsSection>

      <DocsSection title="Agent coordinator pattern">
        <DocsParagraph>
          Each module maps to a dedicated agent — Guardian, RWA, Marketplace. A
          shared coordinator dispatches requests by action ID, normalizes responses,
          and returns structured insight (summary, reasoning, preview) to the UI.
          This keeps module logic isolated while sharing one API surface.
        </DocsParagraph>
        <DocsList
          items={[
            "Mock actions skip the chain — agent reasoning only",
            "RPC actions query live state — Guardian balance scan",
            "Transaction actions build casper-js-sdk payloads — wallet required",
          ]}
        />
      </DocsSection>

      <DocsSection title="Repository layout">
        <DocsList
          items={[
            "agents/ — TypeScript agent implementations and coordinator",
            "frontend/ — Dashboard, docs, wallet providers, contract actions",
            "contracts/agentvault-core/ — Odra Escrow and Attestation modules",
          ]}
        />
      </DocsSection>
    </DocsPage>
  );
}