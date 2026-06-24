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
import Link from "next/link";

const CASPER_WALLET_URL = "https://www.casperwallet.io/";
const FAUCET_URL = "https://testnet.cspr.live/faucet";

export default function FaucetPage() {
  return (
    <DocsPage
      eyebrow="Wallet & Faucet"
      title="Create a wallet and fund it on casper-test"
      lead="Every on-chain AgentVault action requires a signed transaction paid in CSPR. This guide walks you through creating a Casper testnet wallet, requesting faucet funds, and connecting to the dashboard."
    >
      <DocsSection title="Requirements">
        <DocsParagraph>
          AgentVault connects through CSPR.click using the Casper Wallet browser
          extension. You need a casper-test account with enough CSPR to cover
          transaction fees.
        </DocsParagraph>
      </DocsSection>

      <DocsSection title="Set up Casper Wallet">
        <DocsSteps
          steps={[
            {
              title: "Install Casper Wallet",
              body: (
                <p>
                  Download the official extension from{" "}
                  <DocsLink href={CASPER_WALLET_URL} external>
                    casperwallet.io
                  </DocsLink>
                  . It is available for Chrome, Brave, and other Chromium
                  browsers.
                </p>
              ),
            },
            {
              title: "Create a new account",
              body: (
                <>
                  <p>
                    Open the extension and choose{" "}
                    <strong className="text-[#e0e0e0]">Create new wallet</strong>.
                  </p>
                  <DocsList
                    items={[
                      "Set a strong vault password — this encrypts your keys locally",
                      "Write down the recovery phrase offline — never share it or store it in chat",
                      "Confirm the phrase to finish setup",
                    ]}
                  />
                </>
              ),
            },
            {
              title: "Switch to testnet",
              body: (
                <p>
                  In Casper Wallet settings, set the network to{" "}
                  <DocsCode>casper-test</DocsCode>. AgentVault contract calls
                  target this chain. Using mainnet will cause transactions to fail.
                </p>
              ),
            },
            {
              title: "Copy your public key",
              body: (
                <p>
                  Open account details and copy the public key (starts with{" "}
                  <DocsCode>01</DocsCode> or <DocsCode>02</DocsCode> hex). You
                  will need this for the faucet request.
                </p>
              ),
            },
            {
              title: "Request testnet CSPR from the faucet",
              body: (
                <>
                  <p>
                    Visit the official faucet at{" "}
                    <DocsLink href={FAUCET_URL} external>
                      testnet.cspr.live/faucet
                    </DocsLink>
                    .
                  </p>
                  <DocsList
                    items={[
                      "Paste your public key into the faucet form",
                      "Complete any captcha or verification step",
                      "Submit and wait for confirmation",
                      "Keep at least 20 CSPR on hand — each contract call reserves up to 5 CSPR for payment",
                    ]}
                  />
                </>
              ),
            },
            {
              title: "Connect on AgentVault",
              body: (
                <>
                  <p>
                    Open the{" "}
                    <Link
                      href="/"
                      className="text-[#c8f135] underline underline-offset-4"
                    >
                      dashboard
                    </Link>{" "}
                    and click <strong className="text-[#e0e0e0]">Connect Wallet</strong>.
                    Approve the connection in Casper Wallet when prompted.
                  </p>
                  <p>
                    Go to the Guardian tab and run{" "}
                    <strong className="text-[#e0e0e0]">Scan positions</strong>. A
                    live CSPR balance confirms your faucet transfer landed.
                  </p>
                </>
              ),
            },
          ]}
        />
      </DocsSection>

      <DocsSection title="Troubleshooting">
        <DocsCallout title="Invalid transaction" tone="amber">
          If wallet actions fail with an invalid transaction error, confirm you
          are on <DocsCode>casper-test</DocsCode> and that your balance covers
          the 5 CSPR payment reserved per contract call.
        </DocsCallout>
        <DocsCallout title="Faucet rate limits" tone="gold">
          Public faucets limit requests per key per day. If a request fails, wait
          and retry, or create a fresh testnet account.
        </DocsCallout>
        <DocsCallout title="Connection issues" tone="lime">
          If the wallet does not connect, confirm Casper Wallet is installed,
          unlocked, and set to casper-test. Refresh the page and try again.
        </DocsCallout>
      </DocsSection>

      <DocsSection title="You are ready">
        <DocsParagraph>
          With a funded wallet connected, explore each application in the docs —{" "}
          <DocsLink href="/docs/guardian">Guardian</DocsLink>,{" "}
          <DocsLink href="/docs/rwa">RWA Oracle</DocsLink>, and{" "}
          <DocsLink href="/docs/marketplace">Marketplace</DocsLink> — then run
          the same actions live on the dashboard.
        </DocsParagraph>
      </DocsSection>
    </DocsPage>
  );
}