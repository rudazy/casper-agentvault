# Contributing to Casper AgentVault

Thanks for helping improve AgentVault. This document covers how to work on the repo safely without breaking the live demo.

## Repository layout

| Path | Purpose |
|------|---------|
| `frontend/` | Next.js app (dashboard + docs) deployed to https://casperagent.xyz |
| `agents/` | Multi-agent coordinator and domain agents (TypeScript) |
| `contracts/agentvault-core/` | Odra / Rust smart contracts (Escrow, Attestation, Vault) |
| `docs/` | Assets, demo playbook, testnet reference |

## Prerequisites

- Node.js 20+
- npm
- Rust toolchain (for contracts; see `contracts/agentvault-core/rust-toolchain`)
- Casper Wallet (for end-to-end testnet testing)

## Local setup

```bash
# Agents package
cd agents
npm install
npm run build
npm test

# Frontend
cd ../frontend
cp .env.example .env.local
# Edit .env.local: CSPR.click app id, optional OPENAI_API_KEY
npm install
npm run dev
```

Open http://localhost:3000.

## Contracts

```bash
cd contracts/agentvault-core
cargo test
```

Windows WASM build (optional):

```powershell
./scripts/build-windows.ps1
```

Do **not** redeploy testnet packages and overwrite hashes in `resources/casper-test-contracts.toml` unless the live site and docs are updated in the same change.

## Coding standards

- TypeScript: strict types, no `any` for public APIs
- Rust: prefer checked arithmetic and checks-effects-interactions on fund movement
- No secrets in source, logs, or error responses
- Keep `main` deployable; prefer small PRs over long-lived broken branches

## Pull requests

1. Branch from `main`
2. Keep the live MVP path working (dashboard + Escrow + Attestation)
3. Include tests for contract or agent logic changes
4. Update README / `docs/TESTNET.md` / `docs/DEMO_PLAYBOOK.md` if package hashes or demo steps change
5. Fill out the PR template

## Issues

Use issue templates for bugs and features. Security issues: follow [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the MIT License.
