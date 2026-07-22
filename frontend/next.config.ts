import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["langchain", "@langchain/openai", "@langchain/core"],
  // Include Odra WASM in serverless traces so /api/casper/deploy can install on casper-test.
  outputFileTracingIncludes: {
    "/api/casper/deploy": ["./wasm/**/*", "./public/wasm/**/*"],
    "/api/casper/deploy/**/*": ["./wasm/**/*", "./public/wasm/**/*"],
    "/api/casper/actions": ["./wasm/**/*", "./public/wasm/**/*"],
    "/api/casper/actions/**/*": ["./wasm/**/*", "./public/wasm/**/*"],
    "/api/casper/vault-deposit": [
      "./wasm/**/*",
      "./public/wasm/**/*",
    ],
    "/api/casper/vault-deposit/**/*": [
      "./wasm/**/*",
      "./public/wasm/**/*",
    ],
  },
};

export default nextConfig;