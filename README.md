# Casper AgentVault

<p align="center">
  <img src="docs/assets/og-image.jpg" alt="Casper AgentVault dashboard" width="100%" />
</p>

<p align="center">
  <strong>The unified smart wallet for agentic DeFi and RWA on Casper Network.</strong><br />
  One wallet. Three autonomous modules.
</p>

<p align="center">
  <a href="https://casperagent.xyz">casperagent.xyz</a>
</p>

<p align="center">
  <img src="docs/assets/icon.png" alt="AgentVault" width="64" height="64" />
</p>

## Overview

| Module | Purpose |
|--------|---------|
| **Portfolio Guardian** | Yield optimization and risk monitoring |
| **RWA Oracle** | Compliance attestations for real-world assets |
| **Agent Marketplace** | Escrow-powered hiring with on-chain reputation |

## How It Works

```mermaid
flowchart LR
  W[Casper Wallet] --> A[Module Action]
  A --> C[Agent Coordinator]
  C --> M[Module Agent]
  M --> S[Escrow + Attestation]
  S --> F[Feedback]
```

## Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Casper Network, Odra |
| Wallet | CSPR.click, Casper Wallet |
| Settlement | Escrow and Attestation contracts on casper-test |

## Documentation

In-app documentation is available at [casperagent.xyz/docs](https://casperagent.xyz/docs):

- Getting Started
- Wallet & Faucet
- Architecture
- Portfolio Guardian, RWA Oracle, Agent Marketplace
- Smart Contracts

## Contracts

| Contract | Entry points |
|----------|--------------|
| Escrow | `init`, `verify_and_release` |
| Attestation | `init`, `update_reputation` |

Deployed package hashes for casper-test are in `contracts/agentvault-core/resources/casper-test-contracts.toml`.

## License

MIT