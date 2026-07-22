import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep casper/odra off the bundler — bundling breaks CLValue codecs ("Failed to decode tag of seq").
  serverExternalPackages: [
    "langchain",
    "@langchain/openai",
    "@langchain/core",
    "casper-js-sdk",
    "@casper-ecosystem/odra-js-client",
    "@ethersproject/bignumber",
  ],
  // Include Odra WASM in serverless traces so deposit/deploy APIs can read files on Vercel.
  outputFileTracingIncludes: {
    "/api/casper/deploy": ["./wasm/**/*", "./public/wasm/**/*"],
    "/api/casper/deploy/**/*": ["./wasm/**/*", "./public/wasm/**/*"],
    "/api/casper/actions": ["./wasm/**/*", "./public/wasm/**/*"],
    "/api/casper/actions/**/*": ["./wasm/**/*", "./public/wasm/**/*"],
    "/api/casper/vault-deposit": ["./wasm/**/*", "./public/wasm/**/*"],
    "/api/casper/vault-deposit/**/*": ["./wasm/**/*", "./public/wasm/**/*"],
  },
};

export default nextConfig;