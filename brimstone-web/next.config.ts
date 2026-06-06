import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: true,
  // Pin tracing root to this directory — avoids warning from parent Expo lockfile
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
