import type { MetadataRoute } from "next";

const BASE = "https://siamdive.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/backoffice", "/backoffice/", "/api/", "/uploads/originals/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
