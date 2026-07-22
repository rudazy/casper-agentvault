"use client";

import { ModuleActionBar } from "@/components/dashboard/ModuleActionBar";
import { TransactionFeedback } from "@/components/dashboard/TransactionFeedback";
import {
  ActivityTimeline,
  formatActivityTime,
  FormField,
  PanelCard,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/shared";
import type { TabAction, TabPanelProps } from "@/components/dashboard/types";
import type { useContractDeploy } from "@/hooks/useContractDeploy";
import { useState } from "react";

type ContractDeploy = ReturnType<typeof useContractDeploy>;

const ACTIONS: TabAction[] = [
  { id: "vault_deposit", label: "Deposit", hint: "Fund vault with CSPR" },
  {
    id: "vault_authorize",
    label: "Authorize agent",
    hint: "Bounded session key",
    primary: true,
  },
  { id: "vault_transfer", label: "Agent spend", hint: "Policy-gated transfer" },
  { id: "vault_revoke", label: "Revoke", hint: "Panic-button revoke" },
];

const POLICY_FEATURES = [
  {
    title: "Spend cap",
    detail: "Hard ceiling per rolling time window (motes)",
  },
  {
    title: "Action bitmask",
    detail: "Bit 0 = transfer; higher bits reserved",
  },
  {
    title: "Session expiry",
    detail: "Absolute block-time deadline; expired keys fail closed",
  },
  {
    title: "Idempotent revoke",
    detail: "Owner panic button never fails on double revoke",
  },
];

export function VaultTab({
  accent,
  connected,
  publicKey,
  runAction,
  feedback,
  busyAction,
  clearFeedback,
  recentActivity,
  deploy,
}: TabPanelProps & { deploy?: ContractDeploy }) {
  // Casper min native transfer is 2.5 CSPR — fund path uses purse transfer.
  const [depositAmount, setDepositAmount] = useState("3");
  // null = follow connected wallet (one-wallet demo); string = user override
  const [agentPublicKeyOverride, setAgentPublicKeyOverride] = useState<string | null>(null);
  const [spendCapCspr, setSpendCapCspr] = useState("10");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [transferAmount, setTransferAmount] = useState("1");
  const [recipientPublicKey, setRecipientPublicKey] = useState("");
  const [formError, setFormError] = useState("");

  const agentPublicKey = agentPublicKeyOverride ?? publicKey ?? "";

  const tabActivity = recentActivity
    .filter((e) => e.actionId.startsWith("vault_"))
    .slice(0, 4)
    .map((e) => ({
      label: e.label,
      message: e.message,
      status: e.status,
      time: formatActivityTime(e.timestamp),
    }));

  const deployBusy = deploy?.busyContract != null;
  const anyBusy = busyAction !== null || deployBusy;
  const configuredVault = (deploy?.configuredHashes.vault ?? "").trim();
  const vaultLive = configuredVault.length > 0;
  const vaultOnAccount = Boolean(deploy?.deployerHashes.vault);
  const vaultWasmReady = deploy?.wasmAvailable?.Vault === true;
  const canSyncVault =
    Boolean(deploy?.deployerHashes.escrow) &&
    Boolean(deploy?.deployerHashes.attestation) &&
    vaultOnAccount;
  const packageStatValue = vaultLive ? "Live" : vaultOnAccount ? "Ready" : "Unset";
  const packageStatSub = vaultLive
    ? "configured package"
    : vaultOnAccount
      ? "hash on account"
      : "set package hash";
  const vaultExplorer = vaultLive
    ? `https://testnet.cspr.live/contract-package/${configuredVault.replace(/^hash-/, "")}`
    : null;

  const handleAuthorize = async () => {
    // Single-wallet / any-judge path: always authorize the connected account as agent.
    const agent = (publicKey ?? agentPublicKey).trim();
    if (!agent || agent.length < 16) {
      setFormError("Connect a wallet (agent defaults to the connected public key).");
      return;
    }
    if (!(Number(spendCapCspr) > 0)) {
      setFormError("Spend cap must be a positive CSPR amount.");
      return;
    }
    setAgentPublicKeyOverride(agent);
    setFormError("");
    await runAction("vault_authorize", {
      agentPublicKey: agent,
      spendCapCspr,
      expiresInDays,
      periodMs: 86_400_000,
      allowedActions: 1,
    });
  };

  const handleDeposit = async () => {
    if (!(Number(depositAmount) > 0)) {
      setFormError("Deposit amount must be positive CSPR.");
      return;
    }
    setFormError("");
    await runAction("vault_deposit", { depositAmountCspr: depositAmount });
  };

  const handleTransfer = async () => {
    if (!(Number(transferAmount) > 0)) {
      setFormError("Transfer amount must be positive.");
      return;
    }
    setFormError("");
    // Caller must be the authorized agent — use connected wallet (self-authorize path).
    await runAction("vault_transfer", {
      transferAmountCspr: transferAmount,
      recipientPublicKey: recipientPublicKey.trim() || publicKey,
    });
  };

  const handleRevoke = async () => {
    const agent = (publicKey ?? agentPublicKey).trim();
    if (!agent || agent.length < 16) {
      setFormError("Connect a wallet to revoke (revokes the connected key's policy).");
      return;
    }
    setAgentPublicKeyOverride(agent);
    setFormError("");
    await runAction("vault_revoke", { agentPublicKey: agent });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-sans text-2xl font-semibold tracking-wide sm:text-4xl">
          Session Vault
        </h2>
        <p className="mt-2 font-mono text-sm text-[#888] sm:text-lg">
          Bounded agent spending authority — cap, window, bitmask, expiry
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
        <StatCard label="Primitive" value="Vault" accent={accent} subtext="session keys" />
        <StatCard label="Window" value="24h" accent={accent} subtext="default period" />
        <StatCard label="Action bit" value="0x1" accent={accent} subtext="transfer" />
        <StatCard
          label="Package"
          value={packageStatValue}
          accent={accent}
          subtext={packageStatSub}
        />
      </div>

      {deploy ? (
        <PanelCard
          title={vaultLive ? "Vault package (live on casper-test)" : "Vault package setup"}
          subtitle={
            vaultLive
              ? "Package hash is configured. Authorize / revoke below. You can still install a new Vault instance from this wallet if WASM is available (~500 CSPR)."
              : "Install Vault.wasm to casper-test from this wallet, then sync package hashes."
          }
        >
          {deploy.feedback.status !== "idle" ? (
            <div className="mb-4">
              <TransactionFeedback
                feedback={deploy.feedback}
                onDismiss={deploy.clearFeedback}
              />
            </div>
          ) : null}

          {vaultLive ? (
            <div className="mb-4 space-y-2">
              <p className="font-mono text-[10px] leading-relaxed text-[#888]">
                Configured package: {configuredVault}
              </p>
              {vaultExplorer ? (
                <a
                  href={vaultExplorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-mono text-[10px] uppercase tracking-wider text-[#c8f135] transition hover:opacity-80"
                >
                  Open package on explorer
                </a>
              ) : null}
              <p className="font-mono text-[10px] leading-relaxed text-[#f5c842]/90">
                Owner-only entry points (authorize / revoke / withdraw) require the
                wallet that installed this package. If you see User error: 1, either
                switch to that wallet or use Install new Vault with the connected
                wallet (~500 CSPR), then set the new package hash.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!connected || deployBusy || !vaultWasmReady}
              onClick={() => void deploy.runDeploy("Vault")}
              className="rounded px-4 py-2 font-sans text-xs font-medium text-[#0a0a0a] disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {deploy.busyContract === "Vault"
                ? "Deploying..."
                : vaultLive
                  ? "Install new Vault"
                  : "Deploy Vault"}
            </button>
            <button
              type="button"
              disabled={!connected || deployBusy || !canSyncVault}
              onClick={() => void deploy.runSync()}
              className="rounded border border-white/15 px-4 py-2 font-sans text-xs text-[#ddd] transition hover:bg-white/5 disabled:opacity-50"
            >
              {deploy.busyContract === "sync" ? "Syncing..." : "Sync package hashes"}
            </button>
          </div>

          {!vaultWasmReady ? (
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-[#e23636]/90">
              Vault.wasm not found on this host yet. After the next deploy that includes
              frontend/wasm/Vault.wasm, install from the dashboard works on testnet for real
              (up to ~500 CSPR payment).
            </p>
          ) : (
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-[#666]">
              WASM ready. Deploy submits a real casper-test install (~500 CSPR max payment).
              Fund the wallet first. Demo path without re-install: authorize + revoke against
              the configured package.
            </p>
          )}

          {deploy.deployerHashes.vault ? (
            <p className="mt-2 font-mono text-[10px] text-[#888]">
              Account Vault named key: {deploy.deployerHashes.vault.slice(0, 18)}...
            </p>
          ) : null}
        </PanelCard>
      ) : null}

      <PanelCard
        title="How ownership works"
        subtitle="Installer wallet = owner. Connecting alone does not grant ownership."
      >
        <p className="mb-3 font-mono text-[10px] leading-relaxed text-[#999]">
          The wallet that deploys this Vault package is permanently owner of that
          package. Owner-only: authorize, revoke, withdraw. Agent spend must be signed
          by a key the owner authorized (defaults to your connected key for a one-wallet
          demo). Shared public package hash is owned by its installer — other wallets
          should use Install new Vault first.
        </p>
        <ol className="list-decimal space-y-1.5 pl-4 font-mono text-[10px] leading-relaxed text-[#999]">
          <li>
            If authorize fails with Not owner (User error: 1):{" "}
            <span className="text-[#ddd]">Install new Vault</span> from this wallet,
            then sync / use that package hash.
          </li>
          <li>
            <span className="text-[#ddd]">Authorize agent</span> — uses your connected
            key as the agent (no second wallet required).
          </li>
          <li>
            <span className="text-[#ddd]">Deposit</span> (owner/operator path — avoids
            CSPR.click 413 on large session WASM). Then Agent spend.
          </li>
          <li>
            <span className="text-[#ddd]">Agent spend</span> — same wallet (error 7 =
            empty vault; error 2 = not authorized / already revoked).
          </li>
          <li>
            <span className="text-[#ddd]">Revoke agent</span> — last step in a demo.
          </li>
        </ol>
        <p className="mt-3 font-mono text-[10px] text-[#666]">
          Full write-up: /docs/vault and docs/DEMO_PLAYBOOK.md
        </p>
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        <PanelCard
          title="Policy controls"
          subtitle="Authorize, fund, spend, revoke"
          className="lg:col-span-3"
        >
          <div className="space-y-4">
            <FormField
              label="Agent public key"
              id="vault-agent-key"
              value={agentPublicKey}
              onChange={setAgentPublicKeyOverride}
              placeholder="Connected wallet hex (default for single-wallet demo)"
              hint="Must match the wallet that will sign Agent spend. Defaults to your connected key for the standard demo."
              disabled={anyBusy}
            />
            {publicKey ? (
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => setAgentPublicKeyOverride(publicKey)}
                className="font-mono text-[10px] uppercase tracking-wider text-[#c8f135] transition hover:opacity-80 disabled:opacity-50"
              >
                Use connected wallet as agent
              </button>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Spend cap (CSPR / window)"
                id="vault-cap"
                value={spendCapCspr}
                onChange={setSpendCapCspr}
                placeholder="10"
                disabled={anyBusy}
              />
              <FormField
                label="Expires in (days)"
                id="vault-expiry"
                value={expiresInDays}
                onChange={setExpiresInDays}
                placeholder="7"
                disabled={anyBusy}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Deposit amount (CSPR)"
                id="vault-deposit"
                value={depositAmount}
                onChange={setDepositAmount}
                placeholder="5"
                disabled={anyBusy}
              />
              <FormField
                label="Agent transfer (CSPR)"
                id="vault-transfer"
                value={transferAmount}
                onChange={setTransferAmount}
                placeholder="1"
                disabled={anyBusy}
              />
            </div>
            <FormField
              label="Transfer recipient (optional)"
              id="vault-recipient"
              value={recipientPublicKey}
              onChange={setRecipientPublicKey}
              placeholder="Defaults to connected wallet"
              disabled={anyBusy}
            />
            {formError ? (
              <p className="font-mono text-[10px] text-[#e23636]">{formError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => void handleDeposit()}
                disabled={!connected || anyBusy}
                className="rounded border border-white/15 px-4 py-2 font-sans text-xs text-[#ddd] transition hover:bg-white/5 disabled:opacity-50"
              >
                {busyAction === "vault_deposit" ? "Depositing..." : "Deposit"}
              </button>
              <button
                type="button"
                onClick={() => void handleAuthorize()}
                disabled={!connected || anyBusy}
                className="rounded px-4 py-2 font-sans text-xs font-medium text-[#0a0a0a] disabled:opacity-50"
                style={{ backgroundColor: accent }}
              >
                {busyAction === "vault_authorize" ? "Authorizing..." : "Authorize agent"}
              </button>
              <button
                type="button"
                onClick={() => void handleTransfer()}
                disabled={!connected || anyBusy}
                className="rounded border border-white/15 px-4 py-2 font-sans text-xs text-[#ddd] transition hover:bg-white/5 disabled:opacity-50"
              >
                {busyAction === "vault_transfer" ? "Spending..." : "Agent spend"}
              </button>
              <button
                type="button"
                onClick={() => void handleRevoke()}
                disabled={!connected || anyBusy}
                className="rounded border border-[#e23636]/40 px-4 py-2 font-sans text-xs text-[#f0a0a0] transition hover:bg-[#e23636]/10 disabled:opacity-50"
              >
                {busyAction === "vault_revoke" ? "Revoking..." : "Revoke agent"}
              </button>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Why session keys"
          subtitle="Agentic DeFi without full key exposure"
          className="lg:col-span-2"
        >
          <ul className="space-y-3">
            {POLICY_FEATURES.map((item) => (
              <li
                key={item.title}
                className="rounded border border-white/8 bg-black/35 px-3 py-2.5"
              >
                <p className="font-sans text-xs font-medium text-[#ddd]">{item.title}</p>
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-[#777]">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2">
            <StatusBadge label="owner-gated" tone="active" />
            <StatusBadge label="fail-closed" tone="warn" />
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Activity" subtitle="Vault pipeline events">
        <ActivityTimeline
          entries={tabActivity}
          accent={accent}
          emptyLabel="No vault actions yet. Deploy Vault, deposit, then authorize an agent key."
        />
      </PanelCard>

      <ModuleActionBar
        actions={ACTIONS}
        accent={accent}
        connected={connected}
        runAction={async (id) => {
          if (id === "vault_authorize") return handleAuthorize();
          if (id === "vault_deposit") return handleDeposit();
          if (id === "vault_transfer") return handleTransfer();
          if (id === "vault_revoke") return handleRevoke();
        }}
        feedback={feedback}
        busyAction={busyAction}
        clearFeedback={clearFeedback}
        description="Session-key vault: deposit, authorize, agent spend, revoke — all settled on casper-test."
      />
    </div>
  );
}
