# Demo playbook — Casper AgentVault

Step-by-step walkthrough of the live MVP. No marketing copy.

**Live app:** https://casperagent.xyz  
**Docs:** https://casperagent.xyz/docs  
**Network:** `casper-test`  
**Repo:** https://github.com/rudazy/casper-agentvault

Estimated time: **10–15 minutes**.

---

## Prerequisites

1. Chromium browser (Chrome / Brave / Edge).
2. [Casper Wallet](https://www.casperwallet.io/) extension installed.
3. Wallet network set to **Testnet** / `casper-test`.
4. Testnet CSPR balance ≥ **20 CSPR** for application calls (~5 CSPR payment each).
5. For **new package installs** only: up to **500 CSPR** payment per install (Vault-only), or **1500 CSPR** if installing Escrow + Attestation + Vault in one session.
   - Faucet: https://testnet.cspr.live/faucet
   - Guide: https://casperagent.xyz/docs/faucet

---

## Package hashes (casper-test)

| Contract | Package hash | Explorer |
|----------|--------------|----------|
| **Escrow** | `hash-75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb` | [cspr.live](https://testnet.cspr.live/contract-package/75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb) |
| **Attestation** | `hash-25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95` | [cspr.live](https://testnet.cspr.live/contract-package/25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95) |
| **Vault** | `hash-a0217981457fc2e54a7e947f8d054fad0b2d8e61e4e20773cdea862035b3825e` | [cspr.live](https://testnet.cspr.live/contract-package/a0217981457fc2e54a7e947f8d054fad0b2d8e61e4e20773cdea862035b3825e) |

Canonical file: `contracts/agentvault-core/resources/casper-test-contracts.toml`  
Sample transactions: [`docs/TESTNET.md`](./TESTNET.md)

---

## Path A — Live dashboard (recommended)

### 1. Open and connect

1. Open https://casperagent.xyz
2. Click **Connect Wallet**
3. Approve connection in Casper Wallet
4. Confirm your public key appears in the UI

**Pass:** Wallet connected; no infinite spinner.

### 2. Portfolio Guardian (Finance) — RPC path

1. Open the **Guardian** tab
2. Run **Scan positions**
3. Confirm a live CSPR balance (or clear empty-balance message) returns

**Pass:** RPC read succeeds without a wallet signature (or with connect-only).  
**On-chain:** No required transaction for scan.

### 3. RWA Oracle (Compliance) — Attestation contract

1. Open the **RWA** tab
2. Publish an attestation (data hash + score as prompted)
3. Approve the transaction in Casper Wallet
4. Wait for success feedback; use **Copy hash** and **Open explorer**
5. Optionally run reputation update if shown; record that hash

**Pass:** `Attestation` package call finalizes; explorer shows success.  
**Entry points:** `publish`, `update_reputation` (issuer-only)

### 4. Agent Marketplace (Commerce) — Escrow contract

1. Open the **Marketplace** tab
2. Post a job (title + amount as prompted)
3. Approve the transaction in Casper Wallet
4. Copy the transaction hash and open explorer
5. Optionally run **verify_and_release** as owner and record that hash

**Pass:** `Escrow` package call finalizes.  
**Entry points:** `post_job`, `verify_and_release`

### 5. Session Vault (Agent Treasury) — Vault contract

**How ownership works:** the wallet that **installs** the Vault package is the **owner**. Owner-only calls (`authorize_agent`, `revoke_agent`, `withdraw`) fail with User error: 1 (Not owner) for every other wallet. Connecting to the site alone does not make you owner.

**Single-wallet path** (any tester with their own install, or the package owner):

1. Open the **Session Vault** tab
2. If you are not the owner of the configured package: **Deploy / Install Vault** from this wallet (~500 CSPR payment), then sync / set the new package hash so the app targets *your* package
3. Agent defaults to your connected public key (one-wallet demo — no second key)
4. **Authorize agent** (owner grants spend cap to that key)
5. **Deposit** positive CSPR (payable; vault must hold funds before spend)
6. **Agent spend** (same wallet signs as agent — error 2 = not authorized / revoked; error 7 = empty vault)
7. **Revoke agent** last
8. Record transaction hashes

**Pass:** `authorize_agent` succeeds; optionally `deposit` + `agent_transfer` then `revoke_agent`.  

**Shared package hash in the repo** is for explorer verification and owner demos. Other wallets should install their own Vault for a full interactive path.

### 6. Agent reasoning

1. Trigger any on-chain action
2. Confirm the feedback panel shows **Agent recommendation** (summary, reasoning, confidence, next steps) before or during signing

**Pass:** Coordinator returns a non-empty recommendation payload (LLM optional; rules-engine path is acceptable).

---

## Path B — Docs-only smoke (no wallet)

1. https://casperagent.xyz/docs — introduction loads
2. https://casperagent.xyz/docs/getting-started — steps present
3. Escrow package page on testnet.cspr.live (hash above)
4. Attestation package page on testnet.cspr.live (hash above)

**Pass:** Site and package pages load without 404.

---

## Local clone (optional)

```bash
git clone https://github.com/rudazy/casper-agentvault.git
cd casper-agentvault/agents && npm ci && npm run build && npm test
cd ../frontend && cp .env.example .env.local && npm ci && npm run dev
```

Contract unit tests:

```bash
cd contracts/agentvault-core && cargo test
```

---

## Failure triage

| Symptom | Check |
|---------|--------|
| Wallet will not connect | Casper Wallet unlocked; network = testnet; app domain registered in CSPR.click |
| Tx rejected / insufficient funds | Faucet balance; ~5 CSPR per call; install payment up to 500 CSPR |
| Wrong network | Wallet must be `casper-test`, not mainnet |
| Explorer 404 on package | Confirm hash matches `casper-test-contracts.toml` |
| Site down | Open https://casperagent.xyz ; open an issue with timestamp |

---

## What to record when documenting a deployment

1. Package hashes (Escrow + Attestation; Vault when deployed)
2. Sample testnet transaction hashes with one-line descriptions:
   - Attestation `publish`
   - Escrow `post_job`
   - Optional: Vault `authorize_agent` / `revoke_agent`
3. Link to this playbook: `docs/DEMO_PLAYBOOK.md`
