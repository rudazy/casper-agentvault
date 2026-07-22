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
      lead="AgentVault deploys Odra contract packages to Casper testnet: Escrow for job funding, Attestation for RWA reputation, and Vault for bounded agent session keys."
    >
      <DocsSection title="Deployed packages">
        <DocsParagraph>
          Package hashes are configured for the deployment environment. The
          dashboard normalizes the <DocsCode>hash-</DocsCode> prefix automatically.
          Canonical source:{" "}
          <DocsCode>contracts/agentvault-core/resources/casper-test-contracts.toml</DocsCode>.
        </DocsParagraph>
        <DocsTable
          headers={["Contract", "Configuration", "Entry points"]}
          rows={[
            [
              "Escrow",
              "NEXT_PUBLIC_ESCROW_PACKAGE_HASH",
              "init, post_job, verify_and_release",
            ],
            [
              "Attestation",
              "NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH",
              "init, publish, update_reputation, get_reputation",
            ],
            [
              "Vault",
              "NEXT_PUBLIC_VAULT_PACKAGE_HASH",
              "init, deposit, withdraw, authorize_agent, revoke_agent, agent_transfer",
            ],
          ]}
        />
      </DocsSection>

      <DocsSection title="Escrow module">
        <DocsParagraph>
          Manages job-scoped payment state. <DocsCode>post_job</DocsCode> stores
          recipient and amount for marketplace listings.{" "}
          <DocsCode>verify_and_release</DocsCode> is owner-gated and flips the
          verified flag before completing payout.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="Attestation module">
        <DocsParagraph>
          Records compliance metadata for RWA workflows.{" "}
          <DocsCode>publish</DocsCode> captures issuer, data_hash, block
          timestamp, and initial_score.{" "}
          <DocsCode>update_reputation</DocsCode> is issuer-only — non-issuer
          callers revert with <DocsCode>NotIssuer</DocsCode>.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="Vault module">
        <DocsParagraph>
          Session-key treasury. Owner deposits CSPR and authorizes agent
          accounts with spend cap, period window, action bitmask, and expiry.
          Agents call <DocsCode>agent_transfer</DocsCode> under those checks;
          owner can revoke immediately.
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
        Every on-chain dashboard action returns a transaction hash on success
        with a copy button and testnet.cspr.live explorer link. Record those
        hashes in <DocsCode>docs/TESTNET.md</DocsCode> when documenting a
        deployment.
      </DocsCallout>
    </DocsPage>
  );
}
