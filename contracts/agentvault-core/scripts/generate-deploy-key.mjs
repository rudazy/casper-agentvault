import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Keys } from "casper-js-sdk";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const keyPath = join(root, "secret_key.pem");

const keyPair = Keys.Ed25519.new();
writeFileSync(keyPath, keyPair.exportSecretKeyFile());
console.log("secret_key.pem written");
console.log("public_key:", keyPair.publicKey.toHex());