import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "aggregator.walrus.space" },
      { protocol: "https", hostname: "aggregator.walrus-testnet.walrus.space" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
