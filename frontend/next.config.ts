import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["langchain", "@langchain/openai", "@langchain/core"],
  // Include Odra WASM in serverless traces so /api/casper/deploy can install on casper-test.
  outputFileTracingIncludes: {
    "/api/casper/deploy": ["./wasm/**/*"],
    "/api/casper/deploy/**/*": ["./wasm/**/*"],
  },
};

export default nextConfig;