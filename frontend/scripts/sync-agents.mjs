import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const agentsDist = join(frontendRoot, "..", "agents", "dist");
const targetDir = join(frontendRoot, "lib", "agents", "runtime", "dist");

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(agentsDist, targetDir, { recursive: true });

console.log("Synced agents dist to frontend/lib/agents/runtime/dist");