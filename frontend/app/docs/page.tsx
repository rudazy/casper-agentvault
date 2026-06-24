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
      title="Autonomous operating system for on-chain AI agents"
      lead="AgentVault is not three separate tools — it is one platform where autonomous agents connect to Casper, reason before every action, and settle through shared wallet and contract infrastructure. Finance, Compliance, and Commerce are applications built on that operating system."
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
          built without settlement layers. AgentVault is the layer in between: an
          operating system where every application action is explained by an agent,
          signed by your wallet, and settled on Casper Network.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="The solution in one sentence">
        <DocsCallout title="AgentVault" tone="lime">
          One operating system. Three applications. Every action runs through
          agent reasoning, wallet approval, and Casper smart contracts — Escrow
          for Commerce and Attestation for Compliance signals.
        </DocsCallout>
      </DocsSection>

      <DocsSection title="Three applications on one platform">
        <DocsTable
          headers={["Application", "Domain", "What it does", "On-chain touchpoint"]}
          rows={[
            [
              "Portfolio Guardian",
              "Finance",
              "Monitors positions, simulates rebalances, surfaces risk",
              "Live CSPR balance via RPC; agent-guided simulations",
            ],
            [
              "RWA Oracle",
              "Compliance",
              "Submits and verifies real-world asset data",
              "Attestation contract — publish and update reputation scores",
            ],
            [
              "Agent Marketplace",
              "Commerce",
              "Browse agents, post jobs, release escrow on completion",
              "Escrow contract — job funding, verify_and_release",
            ],
          ]}
        />
        <DocsParagraph>
          Each application has its own tab in the{" "}
          <DocsLink href="/">dashboard</DocsLink>. Connect once with Casper Wallet
          via CSPR.click, then move across Finance, Compliance, and Commerce without
          re-authenticating — the same agent coordinator and settlement layer
          powers all three.
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
            "Native CSPR settlement on casper-test",
            "CSPR.click wallet layer for Casper Wallet connection and signing",
          ]}
        />
      </DocsSection>

      <DocsSection title="Get started">
        <DocsList
          items={[
            "Connect a funded casper-test wallet on the dashboard",
            "Run one action per application to see agent reasoning and transaction feedback",
            "Trace confirmed transactions on testnet.cspr.live",
          ]}
        />
        <DocsCallout title="New to Casper testnet?" tone="gold">
          Start with{" "}
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