# Casper AgentVault

<p align="center">
  <img src="docs/assets/og-image.jpg" alt="Casper AgentVault dashboard" width="100%" />
</p>

<p align="center">
  <strong>Autonomous operating system for on-chain AI agents.</strong><br />
  One platform — Finance, Compliance, Commerce, and Session Vault on Casper.
</p>

<p align="center">
  <a href="https://casperagent.xyz">casperagent.xyz</a>
  ·
  <a href="https://casperagent.xyz/docs">Docs</a>
  ·
  <a href="docs/DEMO_PLAYBOOK.md">Demo playbook</a>
  ·
  <a href="docs/TESTNET.md">Testnet hashes</a>
</p>

<p align="center">
  <img src="docs/assets/icon.png" alt="AgentVault" width="64" height="64" />
</p>

[![CI](https://github.com/rudazy/casper-agentvault/actions/workflows/ci.yml/badge.svg)](https://github.com/rudazy/casper-agentvault/actions/workflows/ci.yml)
[![CodeQL](https://github.com/rudazy/casper-agentvault/actions/workflows/codeql.yml/badge.svg)](https://github.com/rudazy/casper-agentvault/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## What this is

AgentVault is a single operating system for autonomous agents on **Casper Network**:

| Application | Domain | On-chain surface |
|-------------|--------|------------------|
| **Portfolio Guardian** | Finance | Live CSPR balance via RPC; agent-guided monitoring |
| **RWA Oracle** | Compliance | **Attestation** package — `publish`, `update_reputation` (issuer-only) |
| **Agent Marketplace** | Commerce | **Escrow** package — `post_job`, `verify_and_release` |
| **Session Vault** | Agent Treasury | **Vault** package — deposit, authorize, agent transfer, revoke |

Shared layers: Casper Wallet (CSPR.click), multi-agent coordinator, Odra smart contracts on **casper-test**.

## Live MVP

| Item | Value |
|------|--------|
| App | https://casperagent.xyz |
| Network | `casper-test` |
| Escrow package | `hash-75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb` |
| Attestation package | `hash-25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95` |
| Vault package | `hash-a0217981457fc2e54a7e947f8d054fad0b2d8e61e4e20773cdea862035b3825e` |
| Explorer (Escrow) | [testnet.cspr.live](https://testnet.cspr.live/contract-package/75e9a98ffc98b9e7661a40f7a2ce0dfb382c1dd156bc3781c8b187310e5809cb) |
| Explorer (Attestation) | [testnet.cspr.live](https://testnet.cspr.live/contract-package/25825b6d3e456ecc37eb77a15eecd8369dbfdf33c55aaf744f1a0007fe37db95) |
| Explorer (Vault) | [testnet.cspr.live](https://testnet.cspr.live/contract-package/a0217981457fc2e54a7e947f8d054fad0b2d8e61e4e20773cdea862035b3825e) |

Full package + sample transaction table: **[docs/TESTNET.md](docs/TESTNET.md)**  
End-to-end walkthrough: **[docs/DEMO_PLAYBOOK.md](docs/DEMO_PLAYBOOK.md)**

## Roadmap

| Horizon | Focus |
|---------|--------|
| **Now** | Production-quality testnet MVP: Escrow, Attestation, Session Vault; casperagent.xyz dashboard; documented package hashes and sample transactions |
| **Next** | Harden session-key policies; improve agent coordinator recommendations; optional server-side LLM reasoning; operator runbooks for package upgrades |
| **Later** | Mainnet package freeze; production RPC (CSPR.cloud) with fallbacks; agent-to-service payments (MCP / x402 exploration); expanded DeFi and RWA workflows |

Operator note: package **install** payment is up to **500 CSPR** per contract. Application package **calls** reserve **5 CSPR** each.

## How it works

```mermaid
flowchart LR
  W[Casper Wallet] --> A[Module Action]
  A --> C[Agent Coordinator]
  C --> M[Module Agent]
  M --> S[Escrow + Attestation + Vault]
  S --> F[Feedback]
```

1. User connects Casper Wallet on casper-test.
2. Dashboard action is routed through the agent coordinator.
3. Domain agent returns a structured recommendation (mode: mock / rpc / transaction) before signing.
4. Transaction modes build a contract package call; user signs in wallet.
5. Settlement is visible on testnet.cspr.live via the transaction hash (copy + explorer link in UI).

## Repository layout

```
casper-agentvault/
├── frontend/          # Next.js dashboard + in-app docs (Vercel)
├── agents/            # TypeScript multi-agent coordinator
├── contracts/
│   └── agentvault-core/   # Odra contracts (Escrow, Attestation, Session Vault)
├── docs/              # Assets, demo playbook, testnet reference
└── .github/           # CI, CodeQL, Dependabot, templates
```

## Stack

| Layer | Technology |
|-------|------------|
| App | Next.js, React, TypeScript, Tailwind |
| Agents | TypeScript, LangChain (optional LLM) |
| Contracts | Rust, Odra, Casper |
| Wallet | CSPR.click, Casper Wallet |
| Network | Casper testnet (`casper-test`) |

## Quick start (local)

### Prerequisites

- Node.js 20+
- npm
- (Optional) Rust nightly from `contracts/agentvault-core/rust-toolchain` for contract tests
- Casper Wallet for full e2e

### Agents

```bash
cd agents
npm ci
npm run build
npm test
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_CSPR_CLICK_APP_ID for your domain (localhost template works locally)
npm ci
npm run dev
```

Open http://localhost:3000.

Environment variables are documented in `frontend/.env.example`. Never commit secrets or `*.pem` keys.

### Contracts

```bash
cd contracts/agentvault-core
cargo test
```

Deployed package hashes for the public MVP:

```
contracts/agentvault-core/resources/casper-test-contracts.toml
```

## Documentation

| Resource | Link |
|----------|------|
| Product docs | https://casperagent.xyz/docs |
| Getting started | https://casperagent.xyz/docs/getting-started |
| Wallet & faucet | https://casperagent.xyz/docs/faucet |
| Architecture | https://casperagent.xyz/docs/architecture |
| Smart contracts | https://casperagent.xyz/docs/contracts |
| Session Vault | https://casperagent.xyz/docs/vault |
| Demo playbook | [docs/DEMO_PLAYBOOK.md](docs/DEMO_PLAYBOOK.md) |
| Testnet hashes & sample txs | [docs/TESTNET.md](docs/TESTNET.md) |

## Smart contracts

| Contract | Entry points | Role |
|----------|--------------|------|
| **Escrow** | `post_job`, `verify_and_release` | Marketplace job funding and owner-gated release |
| **Attestation** | `publish`, `update_reputation` | RWA data hash + issuer-only reputation updates |
| **Vault** | `deposit`, `authorize_agent`, `agent_transfer`, `revoke_agent` | Bounded agent session keys (spend cap, window, bitmask, expiry) |

Application package calls reserve **5 CSPR** payment (`DEFAULT_DEPLOY_COST`). Fresh **installs** reserve up to **500 CSPR** payment each. Use the [testnet faucet](https://testnet.cspr.live/faucet).

## Security

- Report vulnerabilities privately — see [SECURITY.md](./SECURITY.md)
- Dependabot + CodeQL workflows live under `.github/`
- No private keys in the public app path; users sign with Casper Wallet

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

[MIT](./LICENSE)

## Community

- Casper Developers Telegram: https://t.me/CSPRDevelopers
- Casper Network Discord: https://discord.com/invite/caspernetwork
