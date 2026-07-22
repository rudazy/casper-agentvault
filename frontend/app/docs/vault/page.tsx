import {
  DocsCallout,
  DocsCode,
  DocsPage,
  DocsParagraph,
  DocsSection,
  DocsTable,
} from "@/components/docs/DocsProse";

export default function VaultDocsPage() {
  return (
    <DocsPage
      eyebrow="Agent Treasury"
      title="Session Vault"
      lead="Bounded agent spending authority on Casper. The owner deposits CSPR and grants agent keypairs a spend cap, rolling window, action bitmask, and absolute expiry — without sharing the owner key."
    >
      <DocsSection title="Why session keys">
        <DocsParagraph>
          Autonomous agents need to sign transactions. Handing them a funded
          owner key is unsafe. Session Vault keeps the treasury in a contract
          and only allows authorized agent accounts to spend within explicit
          policy limits.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="Policy model">
        <DocsTable
          headers={["Field", "Meaning"]}
          rows={[
            ["spend_cap", "Maximum motes the agent may spend in the current window"],
            ["period_ms", "Length of the rolling spend window in milliseconds"],
            ["allowed_actions", "Bitmask — bit 0 enables native transfer"],
            ["expires_at", "Absolute block time; sessions fail closed after this"],
            ["active", "False after revoke (mapping has no delete)"],
          ]}
        />
      </DocsSection>

      <DocsSection title="Entry points">
        <DocsTable
          headers={["Entry point", "Caller", "Purpose"]}
          rows={[
            ["deposit", "Anyone (payable)", "Fund the vault balance"],
            ["withdraw", "Owner", "Withdraw unused CSPR"],
            ["authorize_agent", "Owner", "Grant or replace agent policy"],
            ["revoke_agent", "Owner", "Idempotent panic-button revoke"],
            ["agent_transfer", "Authorized agent", "Spend under policy checks"],
            ["get_policy / vault_balance / get_owner", "Anyone", "Read state"],
          ]}
        />
      </DocsSection>

      <DocsSection title="Recommended demo path">
        <DocsParagraph>
          From the dashboard <DocsCode>Session Vault</DocsCode> tab: authorize an
          agent public key with a small spend cap, then revoke. That sequence
          shows bounded session keys without requiring a live deposit under
          time pressure. Copy transaction hashes into{" "}
          <DocsCode>docs/TESTNET.md</DocsCode> when you publish a deployment.
        </DocsParagraph>
      </DocsSection>

      <DocsCallout title="Deployment note" tone="lime">
        Publish the Vault package hash in the testnet TOML and environment
        before treating Session Vault as live. Install payment is up to{" "}
        <DocsCode>500 CSPR</DocsCode> per package. Escrow and Attestation remain
        the core settlement path when Vault is not yet configured.
      </DocsCallout>
    </DocsPage>
  );
}
