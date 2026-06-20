# Casper AgentVault

The unified smart wallet for agentic DeFi and RWA on Casper Network.

One wallet. Three autonomous modules: Portfolio Guardian, RWA Compliance Oracle, and Agent Marketplace.

## Features

### Portfolio Guardian
Autonomous DeFi yield optimizer and risk sentinel. Scans live balances, simulates rebalances, and surfaces risk events with agent reasoning.

### RWA Compliance Oracle
AI-powered compliance pipeline for real-world assets. Submit asset data, verify hashes, and publish on-chain attestations with reputation scoring.

### Agent Marketplace
Escrow-powered marketplace for AI agents. Browse verified agents, post jobs with escrow, and release funds on completion.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Blockchain | Casper Network, Odra smart contracts |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Framer Motion |
| Wallet | CSPR.click (Casper + email login) |
| Agents | LangChain, OpenAI (optional), coordinator pattern |
| SDK | casper-js-sdk, CSPR.click types |

## Project Structure

```
casper-agentvault/
├── agents/          # Multi-agent reasoning backend
├── contracts/       # Odra smart contracts (escrow, attestation)
├── frontend/        # Next.js dashboard + wallet UI
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### 1. Agents backend

```bash
cd agents
npm install
npm run build
npm test
```

Optional: copy `.env.example` to `.env` and set `OPENAI_API_KEY` for LLM reasoning. Without it, agents use deterministic rule-based fallbacks.

### 2. Frontend dashboard

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev    # builds agents + syncs dist automatically
```

`predev` / `prebuild` compile agents and sync output to `frontend/lib/agents/runtime/dist` for the API route.

Open [http://localhost:3000](http://localhost:3000). Connect via Casper wallet or email through CSPR.click.

### 3. On-chain actions (after contract deploy)

Set in `frontend/.env.local`:

```
NEXT_PUBLIC_ESCROW_PACKAGE_HASH=hash-...
NEXT_PUBLIC_ATTESTATION_PACKAGE_HASH=hash-...
```

## Architecture

```
UI button click
    → POST /api/agents (coordinator + module agent reasoning)
    → buildAction (RPC / mock / contract transaction)
    → CSPR.click sign + send (for on-chain actions)
    → feedback panel (agent insight + TX hash)
```

## Contracts

Odra contracts in `contracts/agentvault-core/`:

- **Escrow** — `init`, `verify_and_release`
- **Attestation** — `init`, `update_reputation`

Build with Foundry/Odra toolchain (requires Rust + MSVC on Windows).

## License

MIT