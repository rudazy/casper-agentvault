# Casper Agentic Buildathon — final-round readiness checklist

Last audit: **2026-07-15**  
Repo: https://github.com/rudazy/casper-agentvault  
Live: https://casperagent.xyz

Legend: **[DONE]** already true · **[LOCAL]** fixed in working tree (needs your commit + push) · **[YOU]** GitHub/UI/BUIDL only

---

## GitHub repository

| Requirement | Status | Action |
|-------------|--------|--------|
| Public repo | **[DONE]** | Visibility is public |
| Proper naming | **[DONE]** | `casper-agentvault` is clear and on-brand |
| Website in About | **[DONE]** | `https://casperagent.xyz/` |
| Description in About | **[YOU]** | Settings → General → Description: `Autonomous OS for on-chain AI agents on Casper — Finance, Compliance, Commerce (Escrow + Attestation on casper-test).` |
| Topics | **[YOU]** | Add: `casper-blockchain`, `casper-network`, `buildathon`, `casper`, `odra`, `ai-agents`, `nextjs`, `smart-contracts` |
| Comprehensive README | **[LOCAL]** | Expanded `README.md` |
| Community standards | **[LOCAL]** | `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue/PR templates |
| Community health page | **[YOU]** | After push: open https://github.com/rudazy/casper-agentvault/community and confirm checklist greens |
| CodeQL | **[LOCAL]** | `.github/workflows/codeql.yml` — after push, enable Code scanning if prompted under Settings → Code security |
| Dependabot alerts | **[YOU]** | Settings → Code security → enable **Dependabot alerts**, **Dependabot security updates**, **Dependabot version updates** (config file is local: `.github/dependabot.yml`) |
| CI | **[LOCAL]** | `.github/workflows/ci.yml` (agents + frontend + contracts) |
| Fix High+ security alerts | **[YOU]** | After enabling Dependabot/CodeQL: Security tab → fix or dismiss High/Critical only after review |

### GitHub UI steps (do these after you push)

1. **About**
   - Description (see table)
   - Website: `https://casperagent.xyz`
   - Topics listed above
2. **Settings → Code security and analysis**
   - Dependabot alerts: Enable
   - Dependabot security updates: Enable
   - Code scanning (CodeQL): Enable / default setup **or** rely on the committed workflow
   - Secret scanning: Enable if available on your plan
3. **Actions**
   - Ensure Actions are allowed for the repo
   - Open Actions tab → confirm CI + CodeQL runs on `main`
4. **Community**
   - https://github.com/rudazy/casper-agentvault/community

---

## Application

| Requirement | Status | Action |
|-------------|--------|--------|
| MVP on Casper Testnet | **[DONE]** | Escrow + Attestation package hashes live; app at casperagent.xyz |
| Intuitive UI / demo / playbook | **[LOCAL]** | `docs/DEMO_PLAYBOOK.md` (step-by-step, no marketing) |
| Package hashes on BUIDL page | **[YOU]** | Copy from `docs/TESTNET.md` |
| Sample Testnet transactions on BUIDL page | **[YOU]** | Run dashboard once; paste hashes into `docs/TESTNET.md` + BUIDL page |

### Capture sample txs (10 min)

1. Fund wallet via https://testnet.cspr.live/faucet
2. https://casperagent.xyz → connect → RWA publish → copy tx
3. Marketplace post job → copy tx
4. Fill table in `docs/TESTNET.md`
5. Paste same block on DoraHacks BUIDL page

---

## Keep functional while polishing

- Prefer committing **buildathon docs/CI/community** separately from unfinished Vault work if Vault is not deployed.
- Local uncommitted Vault slice must not break production until hashes + UI are ready.
- Do not redeploy Escrow/Attestation and overwrite hashes mid-review without updating site + docs in the same release.

---

## Suggested git commit (you run this)

Per project policy, AI does not commit or push. From repo root, after review:

```powershell
# Option A — buildathon readiness only (recommended if Vault not ready)
git add LICENSE SECURITY.md CONTRIBUTING.md CODE_OF_CONDUCT.md README.md
git add .github docs/DEMO_PLAYBOOK.md docs/TESTNET.md docs/BUILDATHON_CHECKLIST.md
git status
git commit -m "Add community standards, CI/CodeQL/Dependabot, and demo playbook"
git push origin main
```

Then complete the **[YOU]** rows above.

---

## Community links (optional but recommended)

- Telegram: https://t.me/CSPRDevelopers
- Discord: https://discord.com/invite/caspernetwork
