import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  distDir: "dist/next",
  devIndicators: false,
  serverExternalPackages: ["pg", "pg-boss", "@openai/codex-sdk"],
};
export default config;
