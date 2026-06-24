import {
  DocsCallout,
  DocsLink,
  DocsList,
  DocsPage,
  DocsParagraph,
  DocsSection,
  DocsSteps,
} from "@/components/docs/DocsProse";
import Link from "next/link";

export default function GettingStartedPage() {
  return (
    <DocsPage
      eyebrow="Getting Started"
      title="Start using AgentVault"
      lead="Connect a funded casper-test wallet, explore the three applications on the AgentVault OS, and run your first on-chain actions from the dashboard."
    >
      <DocsSection title="Before you begin">
        <DocsList
          items={[
            "A Casper Wallet with casper-test CSPR for transaction fees",
            "Casper Wallet browser extension installed and unlocked",
          ]}
        />
        <DocsParagraph>
          If you need a wallet or testnet funds, follow{" "}
          <DocsLink href="/docs/faucet">Wallet & Faucet</DocsLink> first.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="Quick start">
        <DocsSteps
          steps={[
            {
              title: "Open the dashboard",
              body: (
                <p>
                  Go to the{" "}
                  <Link
                    href="/"
                    className="text-[#c8f135] underline underline-offset-4"
                  >
                    AgentVault dashboard
                  </Link>
                  .
                </p>
              ),
            },
            {
              title: "Connect your wallet",
              body: (
                <p>
                  Click <strong className="text-[#e0e0e0]">Connect Wallet</strong>{" "}
                  and approve the connection in Casper Wallet when prompted.
                </p>
              ),
            },
            {
              title: "Verify your balance",
              body: (
                <p>
                  Open the Guardian tab and run{" "}
                  <strong className="text-[#e0e0e0]">Scan positions</strong>. A live
                  CSPR balance confirms your wallet is funded and connected.
                </p>
              ),
            },
            {
              title: "Run actions across all three applications",
              body: (
                <DocsList
                  items={[
                    "Guardian — Scan positions (live RPC balance)",
                    "RWA — Publish attestation (on-chain Attestation.init)",
                    "Marketplace — Post a job (on-chain Escrow.init)",
                  ]}
                />
              ),
            },
          ]}
        />
      </DocsSection>

      <DocsSection title="Confirm on-chain activity">
        <DocsParagraph>
          Transaction actions show building, signing, and success states in the
          feedback panel. Each confirmed transaction appears in the application activity
          timeline. Copy the transaction hash from the success message and trace it
          on{" "}
          <DocsLink href="https://testnet.cspr.live" external>
            testnet.cspr.live
          </DocsLink>
          .
        </DocsParagraph>
        <DocsCallout title="Recommended first run" tone="amber">
          Complete one action per application — Guardian scan, RWA publish, and
          Marketplace post job — and confirm each shows success feedback with a
          transaction hash where applicable.
        </DocsCallout>
      </DocsSection>

      <DocsSection title="Go deeper">
        <DocsParagraph>
          Explore the application guides —{" "}
          <DocsLink href="/docs/guardian">Portfolio Guardian</DocsLink>,{" "}
          <DocsLink href="/docs/rwa">RWA Oracle</DocsLink>,{" "}
          <DocsLink href="/docs/marketplace">Agent Marketplace</DocsLink> — and
          the <DocsLink href="/docs/architecture">architecture overview</DocsLink>.
        </DocsParagraph>
      </DocsSection>
    </DocsPage>
  );
}