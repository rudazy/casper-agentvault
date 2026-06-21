import {
  DocsCallout,
  DocsFlow,
  DocsLink,
  DocsList,
  DocsPage,
  DocsParagraph,
  DocsSection,
  DocsTable,
} from "@/components/docs/DocsProse";
import Link from "next/link";

export default function DocsIntroductionPage() {
  return (
    <DocsPage
      eyebrow="Documentation"
      title="The unified smart wallet for agentic finance"
      lead="AgentVault gives users one Casper wallet and three autonomous modules — portfolio protection, RWA compliance, and agent hiring — each backed by on-chain contracts and AI reasoning before every action."
    >
      <DocsSection title="The problem">
        <DocsParagraph>
          Autonomous agents are moving from chat interfaces into real financial
          workflows: rebalancing portfolios, verifying asset data, and hiring
          specialist agents to execute tasks. That shift creates a trust gap.
          Users need to know what an agent will do, why it recommends an action,
          and that funds and attestations are enforced on-chain — not buried in a
          black-box API call.
        </DocsParagraph>
        <DocsParagraph>
          Most wallets were built for manual clicks. Most agent frameworks were
          built without settlement layers. AgentVault bridges both: a single
          dashboard where every module action is explained by an agent, signed by
          your wallet, and settled on Casper Network.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="The solution in one sentence">
        <DocsCallout title="AgentVault" tone="lime">
          One wallet. Three modules. Every action runs through agent reasoning,
          wallet approval, and Casper smart contracts — Escrow for payments and
          Attestation for reputation and compliance signals.
        </DocsCallout>
      </DocsSection>

      <DocsSection title="Three modules, one command center">
        <DocsTable
          headers={["Module", "What it does", "On-chain touchpoint"]}
          rows={[
            [
              "Portfolio Guardian",
              "Monitors positions, simulates rebalances, surfaces risk",
              "Live CSPR balance via RPC; agent-guided simulations",
            ],
            [
              "RWA Oracle",
              "Submits and verifies real-world asset data",
              "Attestation contract — publish and update reputation scores",
            ],
            [
              "Agent Marketplace",
              "Browse agents, post jobs, release escrow on completion",
              "Escrow contract — init job funding, verify_and_release",
            ],
          ]}
        />
        <DocsParagraph>
          Each module has its own tab in the{" "}
          <DocsLink href="/">dashboard</DocsLink>. Connect once with Casper Wallet
          or CSPR.click email login, then move between modules without
          re-authenticating.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="How a single action flows">
        <DocsFlow
          steps={[
            {
              label: "You choose an action",
              detail: "Scan balance, publish attestation, post a job, etc.",
            },
            {
              label: "Agent reasons first",
              detail: "Module agent returns summary, risk notes, and preview.",
            },
            {
              label: "Wallet signs",
              detail: "CSPR.click opens Casper Wallet for on-chain calls.",
            },
            {
              label: "Casper settles",
              detail: "Transaction confirms; feedback and activity update live.",
            },
          ]}
        />
      </DocsSection>

      <DocsSection title="Why Casper">
        <DocsList
          items={[
            "Upgradeable Odra contract packages for Escrow and Attestation",
            "Low-latency finality suitable for agent-driven workflows",
            "Native CSPR settlement without wrapping assets for the demo path",
            "CSPR.click wallet layer for Casper Wallet and email onboarding",
          ]}
        />
      </DocsSection>

      <DocsSection title="What judges should look for">
        <DocsList
          items={[
            "End-to-end path: connect wallet → run module action → see agent + tx feedback",
            "On-chain proof: Attestation and Escrow package calls on casper-test",
            "Modular architecture: separate agents per module, shared coordinator",
            "Production-minded UX: transaction states, activity timeline, clear module boundaries",
          ]}
        />
        <DocsCallout title="Try it in 5 minutes" tone="gold">
          New to Casper testnet? Start with{" "}
          <DocsLink href="/docs/faucet">Wallet & Faucet</DocsLink>, then open the{" "}
          <Link href="/" className="text-[#f5c842] underline underline-offset-4">
            dashboard
          </Link>
          .
        </DocsCallout>
      </DocsSection>
    </DocsPage>
  );
}