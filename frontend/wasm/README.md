# Contract WASM (shipped for testnet installs)

These files are the Odra build artifacts used by `/api/casper/deploy` to install
packages on **casper-test** from the live app (including Vercel).

| File | Contract |
|------|----------|
| `Escrow.wasm` | Marketplace escrow |
| `Attestation.wasm` | RWA attestation |
| `Vault.wasm` | Session Vault |

Rebuild from monorepo root when contracts change:

```powershell
cd contracts/agentvault-core
./scripts/build-windows.ps1
Copy-Item wasm/*.wasm ../../frontend/wasm/ -Force
```

Do not put private keys here.
