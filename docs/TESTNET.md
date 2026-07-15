# Casper testnet deployment reference

Network name: **`casper-test`**  
Default RPC: `https://node.testnet.casper.network/rpc`  
Explorer: https://testnet.cspr.live  
Live app: https://casperagent.xyz

Source of truth for package hashes:

```
contracts/agentvault-core/resources/casper-test-contracts.toml
```

Last recorded update in TOML: **2026-06-21**.

---

## Contract package hashes

### Escrow (Commerce / Marketplace)

| Field | Value |
|-------|--------|
| Name | Escrow |
| Package hash | `hash-75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb` |
| Explorer | https://testnet.cspr.live/contract-package/75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb |
| Entry points | `init`, `verify_and_release` |
| Purpose | Job-scoped escrow: store recipient + amount; owner releases after verification |

### Attestation (Compliance / RWA)

| Field | Value |
|-------|--------|
| Name | Attestation |
| Package hash | `hash-25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95` |
| Explorer | https://testnet.cspr.live/contract-package/25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95 |
| Entry points | `init`, `update_reputation` |
| Purpose | Store RWA data hash + issuer + reputation score; issuer-only score updates |

### Vault (agent session keys) — not required for current MVP judge path

| Field | Value |
|-------|--------|
| Status | Implemented in source (`contracts/agentvault-core/src/vault.rs`); package hash not deployed to shared testnet config yet |
| Package hash | _(empty until deploy)_ |
| Entry points | `init`, `deposit`, `authorize_agent`, `agent_transfer`, `revoke_agent` |

Do not mark Vault as live on the BUIDL page until a package hash is published here and in the TOML.

---

## Sample testnet transactions

Paste real hashes after running the judge path once. Use the dashboard success panel or Casper Wallet activity, then open:

`https://testnet.cspr.live/transaction/<TX_HASH>`

| # | Description | Contract / entry point | Transaction hash | Explorer |
|---|-------------|------------------------|------------------|----------|
| 1 | Deploy / install Escrow package (ops) | Escrow install | _TODO: paste hash_ | — |
| 2 | Deploy / install Attestation package (ops) | Attestation install | _TODO: paste hash_ | — |
| 3 | RWA publish — create attestation | Attestation.`init` | _TODO: paste hash_ | — |
| 4 | RWA verify — update reputation | Attestation.`update_reputation` | _TODO: paste hash_ | — |
| 5 | Marketplace — post job (fund escrow) | Escrow.`init` | _TODO: paste hash_ | — |
| 6 | Marketplace — release escrow | Escrow.`verify_and_release` | _TODO: paste hash_ | — |

### How to capture hashes (owner)

1. Open https://casperagent.xyz with a funded testnet wallet.
2. RWA tab → publish attestation → copy tx hash from success UI.
3. Marketplace tab → post job → copy tx hash.
4. Optionally complete verify/release paths.
5. Replace every `_TODO: paste hash_` above and paste the same table on the DoraHacks BUIDL page.
6. Commit the updated `docs/TESTNET.md` so the repo stays the source of truth.

### Copy-paste block for DoraHacks BUIDL page

```text
Network: casper-test
Live MVP: https://casperagent.xyz
Judge playbook: https://github.com/rudazy/casper-agentvault/blob/main/docs/JUDGE_PLAYBOOK.md

Package hashes:
- Escrow: hash-75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb
  https://testnet.cspr.live/contract-package/75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb
- Attestation: hash-25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95
  https://testnet.cspr.live/contract-package/25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95

Sample transactions:
- Attestation.init (RWA publish): <TX_HASH> — https://testnet.cspr.live/transaction/<TX_HASH>
- Escrow.init (Marketplace post job): <TX_HASH> — https://testnet.cspr.live/transaction/<TX_HASH>
```

---

## Transaction cost note

Contract package calls in the app reserve **5_000_000_000 motes (5 CSPR)** payment per call (`DEFAULT_DEPLOY_COST`). Plan faucet funding accordingly.
