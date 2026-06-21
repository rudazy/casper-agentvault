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
          Package hashes are configured for the deployment environment. The
          dashboard normalizes the <DocsCode>hash-</DocsCode> prefix automatically.
        </DocsParagraph>
        <DocsTable
          headers={["Contract", "Configuration", "Entry points"]}
          rows={[
            [
              "Escrow",
              "Escrow package hash",
              "init, verify_and_release",
            ],
            [
              "Attestation",
              "Attestation package hash",
              "init, update_reputation",
            ],
          ]}
        />
      </DocsSection>

      <DocsSection title="Escrow module">
        <DocsParagraph>
          Manages job-scoped payment state. On init, the caller becomes owner and
          stores recipient plus amount. verify_and_release is owner-gated and flips
          the verified flag before completing payout.
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
          Wallets need sufficient testnet balance for multiple actions.
        </DocsParagraph>
      </DocsSection>

      <DocsCallout title="Trace transactions" tone="lime">
        Every on-chain dashboard action returns a transaction hash on success.
        Paste it into testnet.cspr.live to verify settlement on the network.
      </DocsCallout>
    </DocsPage>
  );
}