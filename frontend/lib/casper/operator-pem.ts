import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { KeyAlgorithm, PrivateKey } from "casper-js-sdk";

/**
 * Normalize a PEM private key from env vars.
 *
 * Vercel / dashboard secrets often mangle PEMs:
 * - literal `\n` instead of newlines
 * - headers and base64 collapsed onto one line with spaces
 * - surrounding quotes
 *
 * The casper-js-sdk DER decoder surfaces that as:
 *   Failed to decode tag of "seq" at: (shallow)
 */
export function normalizePem(raw: string): string {
  let text = raw.trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }

  // Expand common escaped newlines from JSON/env dashboards.
  text = text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  if (!/-----BEGIN [^-]+-----/.test(text)) {
    return text;
  }

  // Rebuild if the body lost line breaks (spaces, single line, etc.).
  const match = text.match(
    /-----BEGIN ([^-]+)-----\s*([\s\S]*?)\s*-----END ([^-]+)-----/,
  );
  if (!match) {
    return text;
  }

  const beginLabel = match[1].trim();
  const endLabel = match[3].trim();
  const body = match[2].replace(/\s+/g, "");
  if (!body) {
    return text;
  }

  const lines = body.match(/.{1,64}/g) ?? [body];
  return (
    `-----BEGIN ${beginLabel}-----\n` +
    `${lines.join("\n")}\n` +
    `-----END ${endLabel}-----`
  );
}

export type OperatorKeyLoadResult =
  | { ok: true; key: PrivateKey; source: "env" | "file" }
  | { ok: false; reason: "missing" | "invalid"; detail: string };

/**
 * Load the Vault operator key used to sign payable deposit sessions.
 * Prefer CASPER_VAULT_OPERATOR_PEM; fall back to local gitignored secret_key.pem.
 */
export function loadOperatorPrivateKey(): OperatorKeyLoadResult {
  const envRaw = process.env.CASPER_VAULT_OPERATOR_PEM;
  if (envRaw && envRaw.includes("PRIVATE KEY")) {
    const pem = normalizePem(envRaw);
    try {
      const alg = pem.includes("EC PRIVATE KEY")
        ? KeyAlgorithm.SECP256K1
        : KeyAlgorithm.ED25519;
      return { ok: true, key: PrivateKey.fromPem(pem, alg), source: "env" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        reason: "invalid",
        detail:
          "CASPER_VAULT_OPERATOR_PEM is set but cannot be parsed as a private key " +
          `(${msg}). In Vercel, paste the full PEM including BEGIN/END lines. ` +
          "Use real newlines, or a single line with literal \\n between lines. " +
          "Do not wrap in quotes. Must be the same key that installed the Vault package.",
      };
    }
  }

  const candidates = [
    join(process.cwd(), "..", "contracts", "agentvault-core", "secret_key.pem"),
    join(process.cwd(), "contracts", "agentvault-core", "secret_key.pem"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const pem = normalizePem(readFileSync(path, "utf8"));
    try {
      const alg = pem.includes("EC PRIVATE KEY")
        ? KeyAlgorithm.SECP256K1
        : KeyAlgorithm.ED25519;
      return { ok: true, key: PrivateKey.fromPem(pem, alg), source: "file" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        reason: "invalid",
        detail: `Local secret_key.pem is unreadable: ${msg}`,
      };
    }
  }

  return {
    ok: false,
    reason: "missing",
    detail:
      "Server operator key not configured. Set CASPER_VAULT_OPERATOR_PEM " +
      "(same key that owns the Vault package) for wallet-friendly deposits. " +
      "Large session deposits cannot be signed via CSPR.click (413).",
  };
}
