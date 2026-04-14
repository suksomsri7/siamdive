import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["srv1403873.hstgr.cloud", "siamdive.suksomsri.cloud"],
  devIndicators: false,
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "**" },
    ],
  },
};

export default nextConfig;
