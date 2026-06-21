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
      <DocsSection title="Overview">
        <DocsParagraph>
          Yield strategies fail quietly. Positions drift, concentration builds, and
          by the time a human checks a dashboard the damage is done. Portfolio
          Guardian treats your Casper holdings as a live system: always scanning,
          always reasoning, always ready to act when you approve.
        </DocsParagraph>
        <DocsParagraph>
          Guardian combines live RPC balance queries with agent-guided simulations.
          The module is designed to extend into automated rebalancing as oracle feeds
          and DEX integrations are added.
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
              "Advisory",
              "Guardian agent returns allocation analysis and simulated trade plan",
            ],
            [
              "View risk log",
              "Advisory",
              "Surfaces concentration, volatility, and policy flags from agent reasoning",
            ],
          ]}
        />
      </DocsSection>

      <DocsSection title="Key capabilities">
        <DocsList
          items={[
            "Scan positions reads live balance data from the Casper network",
            "Agent reasoning appears in the transaction feedback panel before actions complete",
            "Activity timeline records each action with timestamp and status",
          ]}
        />
      </DocsSection>

      <DocsCallout title="Try it now" tone="lime">
        Connect your wallet on the{" "}
        <Link href="/" className="text-[#c8f135] underline underline-offset-4">
          dashboard
        </Link>
        , open the Guardian tab, and run Scan positions to verify your balance.
      </DocsCallout>
    </DocsPage>
  );
}