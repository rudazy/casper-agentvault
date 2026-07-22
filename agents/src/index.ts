import { fileURLToPath } from "url";
import { coordinator } from "./coordinator.js";
import { hasLlmProvider } from "./llm.js";
import type { AgentModule, ContractActionId } from "./types.js";

export { guardianAgent, GuardianAgent } from "./guardian-agent.js";
export { rwaAgent, RwaAgent } from "./rwa-agent.js";
export { marketplaceAgent, MarketplaceAgent } from "./marketplace-agent.js";
export { vaultAgent, VaultAgent } from "./vault-agent.js";
export { coordinator, AgentCoordinator } from "./coordinator.js";
export type {
  AgentHandler,
  AgentModule,
  AgentRecommendation,
  AgentRequest,
  AgentResult,
  ContractActionId,
} from "./types.js";

function parseArgs(argv: string[]): {
  module?: AgentModule;
  actionId?: ContractActionId;
  publicKey?: string;
} {
  const result: {
    module?: AgentModule;
    actionId?: ContractActionId;
    publicKey?: string;
  } = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--module" && argv[i + 1]) {
      result.module = argv[i + 1] as AgentModule;
      i += 1;
    } else if (arg === "--action" && argv[i + 1]) {
      result.actionId = argv[i + 1] as ContractActionId;
      i += 1;
    } else if (arg === "--public-key" && argv[i + 1]) {
      result.publicKey = argv[i + 1];
      i += 1;
    }
  }

  return result;
}

async function main(): Promise<void> {
  const { module, actionId, publicKey } = parseArgs(process.argv.slice(2));

  if (!actionId) {
    console.error(
      "Usage: npm start -- --action guardian_scan [--module guardian] [--public-key <hex>]",
    );
    process.exit(1);
  }

  const resolvedModule = module ?? coordinator.resolveModule(actionId);
  if (!resolvedModule) {
    console.error(`Could not resolve module for action: ${actionId}`);
    process.exit(1);
  }

  const resolvedAction = actionId;

  const result = await coordinator.dispatch({
    module: resolvedModule,
    actionId: resolvedAction,
    publicKey,
    payload: {},
  });

  console.log(
    JSON.stringify(
      {
        llmEnabled: hasLlmProvider(),
        ...result,
      },
      null,
      2,
    ),
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}