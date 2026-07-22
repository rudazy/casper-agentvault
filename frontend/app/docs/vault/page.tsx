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
      lead="Bounded agent spending authority on Casper. The package owner deposits CSPR and grants an agent key a spend cap, rolling window, action bitmask, and absolute expiry — without sharing the owner key."
    >
      <DocsSection title="Who owns a Vault package?">
        <DocsParagraph>
          Ownership is set once, at install time. When a wallet deploys (installs)
          the Vault package, <DocsCode>init</DocsCode> stores that wallet as{" "}
          <DocsCode>owner</DocsCode>. There is no separate claim step.
        </DocsParagraph>
        <DocsTable
          headers={["Role", "How you get it", "What you can do"]}
          rows={[
            [
              "Owner",
              "Wallet that signed the Vault install",
              "authorize_agent, revoke_agent, withdraw",
            ],
            [
              "Agent",
              "Owner calls authorize_agent for that public key",
              "agent_transfer under cap / window / expiry",
            ],
            [
              "Anyone",
              "Any funded testnet wallet",
              "deposit (payable), read get_owner / get_policy / vault_balance",
            ],
          ]}
        />
        <DocsParagraph>
          Connecting to casperagent.xyz does not grant ownership. Using the shared
          public package hash only works for owner-gated calls if your connected
          wallet is the installer of that package. Otherwise install your own Vault
          from the Session Vault tab (up to ~500 CSPR payment), then use that package.
        </DocsParagraph>
      </DocsSection>

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
            ["deposit", "Anyone (payable)", "Fund the vault balance (CSPR attached)"],
            ["withdraw", "Owner", "Withdraw unused CSPR"],
            ["authorize_agent", "Owner", "Grant or replace agent policy"],
            ["revoke_agent", "Owner", "Idempotent panic-button revoke"],
            ["agent_transfer", "Authorized agent", "Spend under policy checks"],
            ["get_policy / vault_balance / get_owner", "Anyone", "Read state"],
          ]}
        />
      </DocsSection>

      <DocsSection title="One-wallet demo path (any tester)">
        <DocsParagraph>
          You do not need a second key. On the dashboard Session Vault tab:
        </DocsParagraph>
        <DocsTable
          headers={["Step", "Action"]}
          rows={[
            ["1", "Connect Casper Wallet on casper-test (fund via faucet)"],
            [
              "2",
              "If authorize fails with Not owner: Deploy / Install Vault from this wallet, then use that package hash",
            ],
            [
              "3",
              "Authorize agent — agent defaults to your connected public key",
            ],
            [
              "4",
              "Deposit a small CSPR amount (payable proxy; keep ~100 CSPR free for payment)",
            ],
            ["5", "Agent spend — same wallet signs as the authorized agent"],
            ["6", "Revoke agent last (panic button)"],
          ]}
        />
        <DocsParagraph>
          Order matters: authorize → deposit → agent spend → revoke. Spending
          after revoke fails closed. Empty vault balance fails agent spend until
          deposit lands.
        </DocsParagraph>
      </DocsSection>

      <DocsCallout title="Shared MVP package vs your own install" tone="lime">
        The repo publishes a sample Vault package hash for verification on
        testnet.cspr.live. Owner-only calls on that package succeed only for the
        installer account. For a full interactive demo with your own wallet,
        install a Vault from the Session Vault tab. Install payment is up to{" "}
        <DocsCode>500 CSPR</DocsCode>. Escrow and Attestation remain the shared
        settlement path for Marketplace and RWA without per-user installs.
      </DocsCallout>
    </DocsPage>
  );
}
