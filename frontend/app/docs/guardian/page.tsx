import {
  DocsCallout,
  DocsList,
  DocsPage,
  DocsParagraph,
  DocsSection,
  DocsTable,
} from "@/components/docs/DocsProse";
import Link from "next/link";

export default function GuardianDocsPage() {
  return (
    <DocsPage
      eyebrow="Portfolio Guardian"
      title="Autonomous portfolio monitoring"
      lead="The Guardian module is your DeFi command layer — it reads live on-chain balances, simulates rebalance strategies, and surfaces risk signals before capital moves."
    >
      <DocsSection title="The story">
        <DocsParagraph>
          Yield strategies fail quietly. Positions drift, concentration builds, and
          by the time a human checks a dashboard the damage is done. Portfolio
          Guardian treats your Casper holdings as a live system: always scanning,
          always reasoning, always ready to act when you approve.
        </DocsParagraph>
        <DocsParagraph>
          For the demo, Guardian combines real RPC balance queries with agent-guided
          simulations. The architecture is built to extend into automated
          rebalancing once oracle feeds and DEX integrations are wired.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="Dashboard actions">
        <DocsTable
          headers={["Action", "Type", "What happens"]}
          rows={[
            [
              "Scan positions",
              "Live RPC",
              "Queries your CSPR balance from casper-test and displays it in the stats panel",
            ],
            [
              "Run rebalance sim",
              "Agent mock",
              "Guardian agent returns allocation analysis and simulated trade plan",
            ],
            [
              "View risk log",
              "Agent mock",
              "Surfaces concentration, volatility, and policy flags from agent reasoning",
            ],
          ]}
        />
      </DocsSection>

      <DocsSection title="What judges should notice">
        <DocsList
          items={[
            "Scan positions hits a real RPC endpoint — not hardcoded demo data",
            "Agent reasoning appears in the transaction feedback panel before any action completes",
            "Activity timeline records each action with timestamp and status",
            "Module uses electric lime accent — visually distinct from RWA and Marketplace",
          ]}
        />
      </DocsSection>

      <DocsCallout title="Try it now" tone="lime">
        Connect your wallet on the{" "}
        <Link href="/" className="text-[#c8f135] underline underline-offset-4">
          dashboard
        </Link>
        , open the Guardian tab, and run Scan positions to verify your faucet
        balance.
      </DocsCallout>
    </DocsPage>
  );
}