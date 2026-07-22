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

### Vault (Session Vault / agent session keys)

| Field | Value |
|-------|--------|
| Status | Live on casper-test |
| Package hash | `hash-a0217981457fc2e54a7e947f8d054fad0b2d8e61e4e20773cdea862035b3825e` |
| Explorer | https://testnet.cspr.live/contract-package/a0217981457fc2e54a7e947f8d054fad0b2d8e61e4e20773cdea862035b3825e |
| Entry points | `init`, `deposit`, `withdraw`, `authorize_agent`, `agent_transfer`, `revoke_agent`, `get_policy`, `vault_balance`, `get_owner` |
| Install tx | `4ab84e9ee5532100fc90a840660eef93597470b27ae26efeb97a512eb66783ec` |

---

## Sample testnet transactions

Paste real hashes after a full dashboard dry run. Use the success panel (Copy hash / Open explorer) or Casper Wallet activity, then open:

`https://testnet.cspr.live/transaction/<TX_HASH>`

| # | Description | Contract / entry point | Transaction hash | Explorer |
|---|-------------|------------------------|------------------|----------|
| 1 | RWA publish — create attestation | Attestation.`publish` | `9029353b247f6d75823adb8f0430fefcd8fc12843a8b51cea8d740d7fe19bed3` | [cspr.live](https://testnet.cspr.live/transaction/9029353b247f6d75823adb8f0430fefcd8fc12843a8b51cea8d740d7fe19bed3) |
| 2 | Marketplace — post job | Escrow.`post_job` | `d59481844495bd0c55c9042f6fc2896c7c6e74f7da7caae6e7c3b0f5322d9826` | [cspr.live](https://testnet.cspr.live/transaction/d59481844495bd0c55c9042f6fc2896c7c6e74f7da7caae6e7c3b0f5322d9826) |
| 3 | Session Vault — package install | Vault install | `4ab84e9ee5532100fc90a840660eef93597470b27ae26efeb97a512eb66783ec` | [cspr.live](https://testnet.cspr.live/transaction/4ab84e9ee5532100fc90a840660eef93597470b27ae26efeb97a512eb66783ec) |
| 4 | Session Vault — authorize agent | Vault.`authorize_agent` | `f8a03591a5952fceda7c60fcaf168d60caed64ef4f300e706acdfe47d0afb3dd` | [cspr.live](https://testnet.cspr.live/transaction/f8a03591a5952fceda7c60fcaf168d60caed64ef4f300e706acdfe47d0afb3dd) |
| 5 | Session Vault — revoke agent | Vault.`revoke_agent` | `d48a1b27aa5ba9f4e0f5dad63ddb72f568ec572a104bce6c9e41b9a83a1ef092` | [cspr.live](https://testnet.cspr.live/transaction/d48a1b27aa5ba9f4e0f5dad63ddb72f568ec572a104bce6c9e41b9a83a1ef092) |

Canonical JSON capture: [`docs/demo-dry-run-hashes.json`](./demo-dry-run-hashes.json) (2026-07-22).

### How to capture hashes

1. Open https://casperagent.xyz with a funded testnet wallet.
2. RWA tab → publish attestation → copy tx hash from success UI.
3. Marketplace tab → post job → copy tx hash.
4. Session Vault tab → authorize agent → revoke agent → copy both hashes.
5. Replace every `_TODO: paste hash_` above and commit the updated `docs/TESTNET.md`.

### Deployment summary (for external listings)

```text
Network: casper-test
Live MVP: https://casperagent.xyz
Demo playbook: https://github.com/rudazy/casper-agentvault/blob/main/docs/DEMO_PLAYBOOK.md

Package hashes:
- Escrow: hash-75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb
  https://testnet.cspr.live/contract-package/75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb
- Attestation: hash-25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95
  https://testnet.cspr.live/contract-package/25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95
- Vault: hash-a0217981457fc2e54a7e947f8d054fad0b2d8e61e4e20773cdea862035b3825e
  https://testnet.cspr.live/contract-package/a0217981457fc2e54a7e947f8d054fad0b2d8e61e4e20773cdea862035b3825e

Sample transactions:
- Attestation.publish: 9029353b247f6d75823adb8f0430fefcd8fc12843a8b51cea8d740d7fe19bed3
  https://testnet.cspr.live/transaction/9029353b247f6d75823adb8f0430fefcd8fc12843a8b51cea8d740d7fe19bed3
- Escrow.post_job: d59481844495bd0c55c9042f6fc2896c7c6e74f7da7caae6e7c3b0f5322d9826
  https://testnet.cspr.live/transaction/d59481844495bd0c55c9042f6fc2896c7c6e74f7da7caae6e7c3b0f5322d9826
- Vault.authorize_agent: f8a03591a5952fceda7c60fcaf168d60caed64ef4f300e706acdfe47d0afb3dd
  https://testnet.cspr.live/transaction/f8a03591a5952fceda7c60fcaf168d60caed64ef4f300e706acdfe47d0afb3dd
- Vault.revoke_agent: d48a1b27aa5ba9f4e0f5dad63ddb72f568ec572a104bce6c9e41b9a83a1ef092
  https://testnet.cspr.live/transaction/d48a1b27aa5ba9f4e0f5dad63ddb72f568ec572a104bce6c9e41b9a83a1ef092

Demo video: <YOUTUBE_OR_DRIVE_URL>
```

---

## Transaction cost note

| Operation | Payment reserve |
|-----------|-----------------|
| Application package call (dashboard) | **5 CSPR** (`DEFAULT_DEPLOY_COST`) |
| Fresh package install (deploy) | up to **500 CSPR** per install |
| Escrow + Attestation + Vault installs in one session | plan **1500 CSPR** free balance |

Fund via the [testnet faucet](https://testnet.cspr.live/faucet) before deploys or filming.
