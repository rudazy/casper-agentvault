const { writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { PrivateKey, KeyAlgorithm } = require("casper-js-sdk");

const keyPath = join(__dirname, "..", "..", "contracts", "agentvault-core", "secret_key.pem");
const key = PrivateKey.generate(KeyAlgorithm.ED25519);
writeFileSync(keyPath, key.toPem());
console.log("secret_key.pem written to contracts/agentvault-core/");
console.log("public_key:", key.publicKey.toHex());
console.log("Fund at https://testnet.cspr.live/tools/faucet then run deploy-odra-contracts.cjs");