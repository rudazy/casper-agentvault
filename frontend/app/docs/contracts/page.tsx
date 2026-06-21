import {
  DocsCallout,
  DocsCode,
  DocsPage,
  DocsParagraph,
  DocsSection,
  DocsTable,
} from "@/components/docs/DocsProse";

export default function ContractsDocsPage() {
  return (
    <DocsPage
      eyebrow="Smart Contracts"
      title="On-chain settlement on casper-test"
      lead="AgentVault deploys two Odra contract packages to Casper testnet. Escrow handles job funding and release. Attestation stores RWA data hashes and reputation scores."
    >
      <DocsSection title="Deployed packages">
        <DocsParagraph>
          Package hashes are configured via environment variables in the frontend.
          The dashboard normalizes the <DocsCode>hash-</DocsCode> prefix
          automatically.
        </DocsParagraph>
        <DocsTable
          headers={["Contract", "Env variable", "Entry points"]}
          rows={[
            [
              "Escrow",
              "NEXT_PUBLIC_ESCROW_PACKAGE_HASH",
              "init, verify_and_release",
            ],
            [
              "Attestation",
              "NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH",
              "init, update_reputation",
            ],
          ]}
        />
      </DocsSection>

      <DocsSection title="Escrow module">
        <DocsParagraph>
          Manages job-scoped payment state. On init, the caller becomes owner and
          stores recipient plus amount. verify_and_release is owner-gated and flips
          the verified flag — the hook for future CSPR transfer logic.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="Attestation module">
        <DocsParagraph>
          Records compliance metadata for RWA workflows. init captures issuer,
          data_hash, block timestamp, and initial_score. update_reputation allows
          score revisions after verification — the path RWA Verify uses in the
          dashboard.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="Transaction payment">
        <DocsParagraph>
          Contract package calls reserve{" "}
          <DocsCode>5_000_000_000</DocsCode> motes (5 CSPR) per transaction.
          Wallets need sufficient testnet balance for multiple demo actions.
        </DocsParagraph>
      </DocsSection>

      <DocsCallout title="Build and deploy" tone="gold">
        Contracts live in <DocsCode>contracts/agentvault-core/</DocsCode>. Use the
        Odra CLI with <DocsCode>DEPLOY_GAS = 500_000_000_000</DocsCode> for
        deployment. Manifest output is written to{" "}
        <DocsCode>resources/casper-test-contracts.toml</DocsCode>.
      </DocsCallout>

      <DocsCallout title="Trace transactions" tone="lime">
        Every on-chain dashboard action returns a transaction hash on success.
        Paste it into testnet.cspr.live to show judges verifiable settlement.
      </DocsCallout>
    </DocsPage>
  );
}