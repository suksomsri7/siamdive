import type { MetadataRoute } from "next";

const BASE = "https://siamdive.com";

// Aggressive AI/SEO crawlers that hammer the ~4k blog URLs nonstop but send no
// customers. Zero human sessions were recorded while these crawls drove the
// Supabase egress quota over its limit — block them outright. Google/Bing (and
// their AI surfaces that respect standard rules) remain allowed.
const BLOCKED_BOTS = [
  "GPTBot", "CCBot", "ClaudeBot", "anthropic-ai", "Bytespider", "PetalBot",
  "Amazonbot", "meta-externalagent", "FacebookBot", "Applebot-Extended",
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot", "serpstatbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/backoffice", "/backoffice/", "/api/", "/uploads/originals/"],
      },
      ...BLOCKED_BOTS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
