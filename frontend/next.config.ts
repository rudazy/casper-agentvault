import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ["@make-software/csprclick-ui"],
  serverExternalPackages: ["langchain", "@langchain/openai", "@langchain/core"],
};

export default nextConfig;