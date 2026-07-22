import { describe, expect, it } from "vitest";
import { AgentCoordinator } from "./coordinator.js";
import { guardianAgent } from "./guardian-agent.js";
import { rwaAgent } from "./rwa-agent.js";
import { marketplaceAgent } from "./marketplace-agent.js";
import { vaultAgent } from "./vault-agent.js";

describe("AgentCoordinator", () => {
  const coord = new AgentCoordinator({
    guardian: guardianAgent,
    rwa: rwaAgent,
    marketplace: marketplaceAgent,
    vault: vaultAgent,
  });

  it("resolves module from action id", () => {
    expect(coord.resolveModule("guardian_scan")).toBe("guardian");
    expect(coord.resolveModule("rwa_publish")).toBe("rwa");
    expect(coord.resolveModule("market_post_job")).toBe("marketplace");
    expect(coord.resolveModule("vault_authorize")).toBe("vault");
  });

  it("dispatches guardian scan without LLM", async () => {
    const result = await coord.dispatch({
      module: "guardian",
      actionId: "guardian_scan",
      publicKey: "01abc",
    });

    expect(result.agent).toBe("Portfolio Guardian");
    expect(result.usedLlm).toBe(false);
    expect(result.recommendation.mode).toBe("rpc");
    expect(result.recommendation.contractAction).toBe("guardian_scan");
  });

  it("dispatches marketplace post job with transaction mode", async () => {
    const result = await coord.dispatchByAction("market_post_job");

    expect(result.module).toBe("marketplace");
    expect(result.recommendation.mode).toBe("transaction");
    expect(result.recommendation.preview).toContain("Escrow.post_job");
  });

  it("dispatches vault authorize with transaction mode", async () => {
    const result = await coord.dispatchByAction("vault_authorize");

    expect(result.module).toBe("vault");
    expect(result.agent).toBe("Session Vault Controller");
    expect(result.recommendation.mode).toBe("transaction");
    expect(result.recommendation.preview).toContain("authorize_agent");
  });

  it("rejects invalid module/action pairs", async () => {
    await expect(
      coord.dispatch({ module: "rwa", actionId: "guardian_scan" }),
    ).rejects.toThrow(/not valid/);
  });
});