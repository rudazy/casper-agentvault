import {
  DocsCallout,
  DocsCode,
  DocsLink,
  DocsList,
  DocsPage,
  DocsParagraph,
  DocsSection,
  DocsSteps,
} from "@/components/docs/DocsProse";

export default function GettingStartedPage() {
  return (
    <DocsPage
      eyebrow="Getting Started"
      title="Run AgentVault locally"
      lead="Clone the repo, configure environment variables, start the dashboard, and connect a funded casper-test wallet. The full path takes about five minutes if you already have testnet CSPR."
    >
      <DocsSection title="Prerequisites">
        <DocsList
          items={[
            "Node.js 20+ and npm",
            "A casper-test wallet with CSPR for transaction fees (see Wallet & Faucet)",
            "Optional: OPENAI_API_KEY for richer agent reasoning in the API layer",
          ]}
        />
      </DocsSection>

      <DocsSection title="Setup steps">
        <DocsSteps
          steps={[
            {
              title: "Install and build agents",
              body: (
                <>
                  <p>
                    The frontend embeds the multi-agent coordinator. Build it
                    first:
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded border border-white/10 bg-black/60 p-4 font-mono text-xs text-[#d8f58a]">
                    cd agents{"\n"}npm install{"\n"}npm run build
                  </pre>
                </>
              ),
            },
            {
              title: "Configure the frontend",
              body: (
                <>
                  <p>Copy the example env and set deployed contract hashes:</p>
                  <pre className="mt-2 overflow-x-auto rounded border border-white/10 bg-black/60 p-4 font-mono text-xs text-[#d8f58a]">
                    cd frontend{"\n"}cp .env.example .env.local
                  </pre>
                  <p className="mt-2">
                    Required public variables:{" "}
                    <DocsCode>NEXT_PUBLIC_CASPER_RPC_URL</DocsCode>,{" "}
                    <DocsCode>NEXT_PUBLIC_CASPER_CHAIN_NAME</DocsCode> (
                    <DocsCode>casper-test</DocsCode>),{" "}
                    <DocsCode>NEXT_PUBLIC_ESCROW_PACKAGE_HASH</DocsCode>,{" "}
                    <DocsCode>NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH</DocsCode>.
                  </p>
                </>
              ),
            },
            {
              title: "Start the dev server",
              body: (
                <>
                  <pre className="overflow-x-auto rounded border border-white/10 bg-black/60 p-4 font-mono text-xs text-[#d8f58a]">
                    npm install{"\n"}npm run dev
                  </pre>
                  <p className="mt-2">
                    Open <DocsLink href="/">http://localhost:3000</DocsLink>.
                    The predev script rebuilds agents automatically on each start.
                  </p>
                </>
              ),
            },
            {
              title: "Connect your wallet",
              body: (
                <>
                  <p>
                    Click <strong className="text-[#e0e0e0]">Connect Wallet</strong>{" "}
                    and choose your wallet in the CSPR.click modal. Approve the
                    connection to continue.
                  </p>
                  <p>
                    If you do not have testnet funds yet, follow{" "}
                    <DocsLink href="/docs/faucet">Wallet & Faucet</DocsLink> first.
                  </p>
                </>
              ),
            },
            {
              title: "Run actions across all three tabs",
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

      <DocsSection title="Verify on-chain calls">
        <DocsParagraph>
          Transaction actions show building, signing, and success states in the
          feedback panel. Each confirmed transaction also appears in the module
          activity timeline. Look for the transaction hash in the success message
          and trace it on{" "}
          <DocsLink href="https://testnet.cspr.live" external>
            testnet.cspr.live
          </DocsLink>
          .
        </DocsParagraph>
        <DocsCallout title="Smoke test" tone="amber">
          Run one action per module tab — Guardian scan (RPC), RWA publish
          (on-chain), Marketplace post job (on-chain) — and confirm each shows
          success feedback with a transaction hash where applicable.
        </DocsCallout>
      </DocsSection>
    </DocsPage>
  );
}