import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node CLI helpers (not part of the Next app bundle)
    "scripts/**",
    "wasm/**",
    "public/wasm/**",
    // Built agent package copied into the app
    "lib/agents/runtime/**",
  ]),
  {
    rules: {
      // Async data loads and one-shot connect setup legitimately set state from effects.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
