import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image
  output: "standalone",
  // Keep dev overlay out of walkthrough screenshots
  devIndicators: false,
};

export default nextConfig;
