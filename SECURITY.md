# Security Policy

## Supported versions

| Version / branch | Supported |
|------------------|-----------|
| `main` (production deployment) | Yes |
| Feature branches | Best effort only |

## Reporting a vulnerability

Do **not** open a public GitHub issue for security problems.

Report privately via one of:

1. **GitHub Security Advisories** — [Report a vulnerability](https://github.com/rudazy/casper-agentvault/security/advisories/new) on this repository
2. **Contact email** — the address listed on the BUIDL / repository owner profile for this project

Include:

- Description of the issue and impact
- Steps to reproduce (PoC if available)
- Affected component (`frontend/`, `contracts/`, `agents/`, deployment)
- Whether the issue is already public

## Response expectations

- Acknowledgement within **72 hours** when possible
- Status update within **7 days**
- Coordinated disclosure preferred; please allow time to patch before public write-ups

## Scope notes

### In scope

- Smart contract logic in `contracts/agentvault-core` (Escrow, Attestation, Vault)
- Frontend API routes under `frontend/app/api`
- Secret exposure, auth bypass, injection, privilege escalation
- Dependency vulnerabilities with High or Critical severity in production paths

### Out of scope

- Issues that require physical access to a developer machine
- Social engineering
- Denial of service against public RPC providers or third-party faucets
- Vulnerabilities in third-party wallets (Casper Wallet, CSPR.click) without a project-specific exploit path
- Testnet fund loss from user operational error

## Production security practices

- Secrets only via environment variables (see `frontend/.env.example`); never commit `.env` or `*.pem`
- Dependabot and CodeQL enabled on `main`
- High and Critical alerts fixed before release
- Contract package calls require wallet signatures; no server-side private keys in the public app path

## Testnet disclaimer

Casper **testnet** funds and contracts are for demonstration and evaluation. Do not send mainnet assets to testnet addresses or package hashes listed in this repository.
