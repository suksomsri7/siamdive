import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // v1 pages are proxied under www.siamdive.com (v2 rewrites) during the
  // transition — absolute asset URLs keep their JS/CSS loading from THIS
  // deployment instead of 404ing against v2's /_next.
  assetPrefix: process.env.NODE_ENV === "production" ? "https://siamdive.vercel.app" : undefined,
  allowedDevOrigins: ["srv1403873.hstgr.cloud", "siamdive.suksomsri.cloud"],
  devIndicators: false,
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: [],
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
  },
  images: {
    loader: "custom",
    loaderFile: "./bunnyLoader.ts",
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
