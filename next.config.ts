import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["srv1403873.hstgr.cloud", "siamdive.suksomsri.cloud"],
  devIndicators: false,
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: [],
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "https://siamdive-cdn.b-cdn.net/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
