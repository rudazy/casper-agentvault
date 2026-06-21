import {
  DocsCallout,
  DocsCode,
  DocsList,
  DocsPage,
  DocsParagraph,
  DocsSection,
  DocsTable,
} from "@/components/docs/DocsProse";
import Link from "next/link";

export default function RwaDocsPage() {
  return (
    <DocsPage
      eyebrow="RWA Oracle"
      title="Compliance attestations for real-world assets"
      lead="Tokenized real-world assets need verifiable data — ownership records, jurisdiction, audit hashes. The RWA Oracle module packages that data into on-chain attestations with reputation scores judges can trace."
    >
      <DocsSection title="The story">
        <DocsParagraph>
          Regulated assets cannot rely on off-chain PDFs alone. Investors and
          protocols need a tamper-evident signal that asset metadata was reviewed
          and scored. AgentVault RWA Oracle closes that loop: submit asset
          identifiers, let the agent validate the submission, then publish an
          attestation on Casper that anyone can read.
        </DocsParagraph>
        <DocsParagraph>
          This is the compliance layer for agentic RWA markets — not a full legal
          framework, but the on-chain primitive that future verifiers, oracles, and
          policy engines can build on.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="Dashboard actions">
        <DocsTable
          headers={["Action", "Type", "Contract call"]}
          rows={[
            [
              "Submit asset data",
              "Agent mock",
              "Agent validates asset ID, data hash, and jurisdiction fields",
            ],
            [
              "Verify hash",
              "On-chain tx",
              "Attestation.update_reputation — bumps reputation score",
            ],
            [
              "Publish attestation",
              "On-chain tx",
              "Attestation.init — stores data_hash and initial_score on-chain",
            ],
          ]}
        />
      </DocsSection>

      <DocsSection title="On-chain attestation model">
        <DocsList
          items={[
            "issuer — the wallet that published the attestation",
            "data_hash — fingerprint of the underlying asset payload",
            "timestamp — block time at publication",
            "reputation_score — numeric trust signal, updatable via verify flow",
          ]}
        />
        <DocsParagraph>
          Contract entry points: <DocsCode>init(data_hash, initial_score)</DocsCode>{" "}
          and <DocsCode>update_reputation(new_score)</DocsCode>.
        </DocsParagraph>
      </DocsSection>

      <DocsCallout title="Demo tip" tone="gold">
        Fill in Asset ID and Data Hash on the RWA tab before publishing. The agent
        uses your inputs in its reasoning preview. Publish attestation creates a
        new on-chain record you can trace on testnet.cspr.live.
      </DocsCallout>
    </DocsPage>
  );
}