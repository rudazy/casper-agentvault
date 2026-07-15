# Judge playbook — Casper AgentVault

Step-by-step testing instructions for the deployed MVP. No marketing.

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
4. Testnet CSPR balance ≥ **15 CSPR** (each contract call reserves ~5 CSPR payment).
   - Faucet: https://testnet.cspr.live/faucet
   - Guide: https://casperagent.xyz/docs/faucet

---

## Package hashes (casper-test)

| Contract | Package hash | Explorer |
|----------|--------------|----------|
| **Escrow** | `hash-75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb` | [cspr.live](https://testnet.cspr.live/contract-package/75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb) |
| **Attestation** | `hash-25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95` | [cspr.live](https://testnet.cspr.live/contract-package/25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95) |

Canonical file: `contracts/agentvault-core/resources/casper-test-contracts.toml`  
Sample transactions: [`docs/TESTNET.md`](./TESTNET.md)

---

## Test path A — Live dashboard (recommended)

### 1. Open and connect

1. Open https://casperagent.xyz
2. Click **Connect Wallet**
3. Approve connection in Casper Wallet
4. Confirm your public key appears in the UI

**Pass:** Wallet connected; no infinite spinner.

### 2. Portfolio Guardian (Finance) — RPC path

1. Open the **Guardian** tab
2. Run **Scan positions** (or equivalent scan action)
3. Confirm a live CSPR balance (or clear empty-balance message) returns

**Pass:** RPC read succeeds without a wallet signature (or with connect-only).  
**On-chain:** No required transaction for scan.

### 3. RWA Oracle (Compliance) — Attestation contract

1. Open the **RWA** tab
2. Publish an attestation (data hash + initial score as prompted)
3. Approve the transaction in Casper Wallet
4. Wait for success feedback and copy the **transaction hash**
5. Open `https://testnet.cspr.live/transaction/<TX_HASH>` and confirm finalized success
6. Optionally run **Verify** / reputation update if shown; approve and record the second hash

**Pass:** `Attestation` package call finalizes; explorer shows success.  
**Entry points:** `init`, `update_reputation`

### 4. Agent Marketplace (Commerce) — Escrow contract

1. Open the **Marketplace** tab
2. Post a job (recipient + amount as prompted)
3. Approve the transaction in Casper Wallet
4. Copy the **transaction hash** and verify on testnet.cspr.live
5. If available, run **verify_and_release** as owner and record that hash

**Pass:** `Escrow` package call finalizes.  
**Entry points:** `init`, `verify_and_release`

### 5. Agent reasoning (optional)

1. Trigger an action that shows agent recommendation / reasoning text
2. Confirm the UI shows a structured recommendation before or with the on-chain step

**Pass:** Coordinator returns a non-empty recommendation payload (LLM optional; mock path is acceptable).

---

## Test path B — Docs-only smoke (no wallet)

1. https://casperagent.xyz/docs — introduction loads
2. https://casperagent.xyz/docs/getting-started — steps present
3. https://testnet.cspr.live/contract-package/75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb — Escrow package exists
4. https://testnet.cspr.live/contract-package/25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95 — Attestation package exists

**Pass:** Site and package pages load without 404.

---

## Local clone (optional for reviewers)

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
| Tx rejected / insufficient funds | Faucet ≥ 15 CSPR; fee/payment ~5 CSPR per call |
| Wrong network | Wallet must be `casper-test`, not mainnet |
| Explorer 404 on package | Confirm hash matches `casper-test-contracts.toml` |
| Site down | Open https://casperagent.xyz ; if broken, open an issue with timestamp |

---

## What to record on the BUIDL page

1. Both package hashes (table above)
2. At least two sample testnet transaction hashes with one-line descriptions:
   - Attestation `init` (RWA publish)
   - Escrow `init` (Marketplace post job)
3. Link to this playbook: `docs/JUDGE_PLAYBOOK.md`
