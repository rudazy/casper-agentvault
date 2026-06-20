# AgentVault Agents

Multi-agent reasoning layer for Casper AgentVault. Routes module actions through specialized agents and returns structured recommendations for the frontend.

## Modules

| Agent | Actions |
|-------|---------|
| Portfolio Guardian | `guardian_scan`, `guardian_rebalance`, `guardian_risk_log` |
| RWA Oracle | `rwa_submit`, `rwa_verify`, `rwa_publish` |
| Marketplace | `market_browse`, `market_post_job`, `market_release` |

## Setup

```bash
npm install
cp .env.example .env   # optional OPENAI_API_KEY
npm run build
npm test
```

## CLI

```bash
npm start -- --action guardian_scan --public-key 01abc...
```

## API (via frontend)

The Next.js app exposes `POST /api/agents` which calls the coordinator directly.

```json
{
  "actionId": "rwa_verify",
  "publicKey": "01...",
  "payload": { "assetId": "RWA-1043", "dataHash": "abc123..." }
}
```