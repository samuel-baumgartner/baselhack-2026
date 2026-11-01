import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  async headers() {
    return ["/mcp", "/widget.js", "/widget.css", "/merchants/:path*"].map(source => ({
      source,
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Expose-Headers", value: "Mcp-Session-Id" },
      ],
    }));
  },
};
export default config;
