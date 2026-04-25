import { prisma } from "@/lib/prisma";

type Lang = string;

const pick = <T extends { lang: string }>(arr: T[], lang: Lang) =>
  arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];

export type RagPackage = {
  title: string;
  excerpt: string;
};

export type RagBoat = {
  id: string;
  name: string;
  type: string;
  title: string;
  slug: string;
  excerpt: string;
  details: string;
  cover: string | null;
  area: string;
  minPrice: number;
  capacity: number | null;
  packages: RagPackage[];
};

export type RagSchedulePackage = {
  title: string;
  excerpt: string;
  tiers: { tier: string; price: number }[];
  isFull: boolean;
  seats: number | null;
};

export type RagSchedule = {
  id: string;
  boatId: string;
  boatTitle: string;
  boatSlug: string;
  departureDate: string | null;
  returnDate: string | null;
  status: string;
  minPrice: number;
  area: string;
  packages: RagSchedulePackage[];
};

export type RagBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string | null;
  keywords: string[];
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function searchBoats(lang: Lang, types?: string[]): Promise<RagBoat[]> {
  const boats = await prisma.boat.findMany({
    where: {
      status: "PUBLISHED",
      ...(types?.length ? { type: { in: types as any } } : {}),
    },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true, content: true } },
      priceTiers: { select: { regularPrice: true, salePrice: true } },
      serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
      packages: {
        where: { status: "PUBLISHED" as any },
        include: {
          translations: { select: { lang: true, title: true, excerpt: true } },
        },
      },
    },
    take: 50,
  });

  return boats.map(b => {
    const t = pick(b.translations, lang);
    const area = b.serviceAreas[0]?.serviceArea
      ? pick(b.serviceAreas[0].serviceArea.translations, lang)
      : null;
    const prices = b.priceTiers.map(p => p.salePrice ?? p.regularPrice).filter(p => p > 0);
    const pkgs = b.packages.map(p => {
      const pt = pick(p.translations, lang);
      return { title: pt?.title || "", excerpt: pt?.excerpt || "" };
    }).filter(p => p.title);
    return {
      id: b.id,
      name: b.name,
      type: b.type,
      title: t?.title || b.name,
      slug: t?.slug || b.id,
      excerpt: t?.excerpt || "",
      details: stripHtml(t?.content || "").slice(0, 500),
      cover: b.covers[0] || null,
      area: area?.name || "",
      minPrice: prices.length ? Math.min(...prices) : 0,
      capacity: b.capacity,
      packages: pkgs,
    };
  });
}

export async function searchSchedules(lang: Lang, opts?: { boatIds?: string[]; fromDate?: Date; toDate?: Date }): Promise<RagSchedule[]> {
  const now = new Date();
  const where: Record<string, unknown> = {
    status: { in: ["OPEN", "FULL"] },
    departureDate: { gte: opts?.fromDate || now },
    boat: { status: "PUBLISHED" },
  };
  if (opts?.toDate) {
    (where.departureDate as Record<string, unknown>).lt = opts.toDate;
  }
  if (opts?.boatIds?.length) {
    where.boatId = { in: opts.boatIds };
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: {
      boat: {
        include: {
          translations: { select: { lang: true, title: true, slug: true } },
          serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
        },
      },
      packages: {
        include: {
          package: {
            include: {
              translations: { select: { lang: true, title: true, excerpt: true } },
              priceTiers: { select: { tier: true, regularPrice: true, salePrice: true } },
            },
          },
          priceTiers: { select: { tier: true, regularPrice: true, salePrice: true } },
        },
      },
    },
    orderBy: { departureDate: "asc" },
    take: 30,
  });

  return schedules.map(s => {
    const bt = pick(s.boat.translations, lang);
    const area = s.boat.serviceAreas[0]?.serviceArea
      ? pick(s.boat.serviceAreas[0].serviceArea.translations, lang)
      : null;
    const allPrices = s.packages.flatMap(sp => {
      const overrides = sp.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
      const defaults = sp.package.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
      return overrides.length ? overrides : defaults;
    });
    const pkgs: RagSchedulePackage[] = s.packages.map(sp => {
      const pt = pick(sp.package.translations, lang);
      const tiers = (sp.priceTiers.length ? sp.priceTiers : sp.package.priceTiers).map(t => ({
        tier: t.tier,
        price: t.salePrice ?? t.regularPrice,
      })).filter(t => t.price > 0);
      return {
        title: pt?.title || sp.package.name,
        excerpt: pt?.excerpt || "",
        tiers,
        isFull: sp.isFull,
        seats: sp.availableSeats,
      };
    });
    return {
      id: s.id,
      boatId: s.boat.id,
      boatTitle: bt?.title || s.boat.name,
      boatSlug: bt?.slug || s.boat.id,
      departureDate: s.departureDate?.toISOString().slice(0, 10) || null,
      returnDate: s.returnDate?.toISOString().slice(0, 10) || null,
      status: s.status,
      minPrice: allPrices.length ? Math.min(...allPrices) : 0,
      area: area?.name || "",
      packages: pkgs,
    };
  });
}

export async function searchBlogs(lang: Lang, limit = 10): Promise<RagBlog[]> {
  const blogs = await prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true, keywords: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return blogs.map(b => {
    const t = pick(b.translations, lang);
    return {
      id: b.id,
      title: t?.title || "",
      slug: t?.slug || "",
      excerpt: t?.excerpt || "",
      cover: b.covers[0] || null,
      keywords: t?.keywords || [],
    };
  });
}

export async function getServiceAreas(lang: Lang) {
  const areas = await prisma.serviceArea.findMany({
    include: { translations: { select: { lang: true, name: true } } },
  });
  return areas.map(a => ({
    id: a.id,
    name: pick(a.translations, lang)?.name || "",
  }));
}

function scoreMatch(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0);
}

export function extractKeywords(query: string): string[] {
  const stop = new Set(["the","a","an","is","are","to","for","in","on","of","and","or","i","me","my","want","like","can","do","what","how","which","where","when","ไหม","ไหน","อะไร","ที่","ของ","และ","หรือ","ได้","มี","ไป","อยาก","ผม","ฉัน","ครับ","ค่ะ","คะ","นะ","จะ","ให้","กัน","เรา","คือ","ตอน"]);
  return query.toLowerCase().split(/[\s,;.!?]+/).filter(w => w.length > 1 && !stop.has(w));
}

export function buildRagContext(boats: RagBoat[], schedules: RagSchedule[], blogs: RagBlog[], query?: string): string {
  const parts: string[] = [];
  const kw = query ? extractKeywords(query) : [];

  const availableAreas = [...new Set(boats.map(b => b.area).filter(Boolean))];

  if (boats.length) {
    const scored = boats.map(b => ({
      b,
      score: kw.length ? scoreMatch(`${b.title} ${b.type} ${b.area} ${b.name} ${b.excerpt}`, kw) : 0,
    }));
    scored.sort((a, b) => b.score - a.score);

    parts.push(`## Available Trips/Boats — ONLY THESE EXIST (${scored.length} total)\n**Available areas: ${availableAreas.join(", ") || "none"}** — trips ONLY exist in these areas. If user asks for an area not listed here (e.g. Pattaya, Koh Tao, Koh Lipe), tell them we don't have trips there yet and suggest from available areas.\n\n` + scored.map(({ b, score }) => {
      let line = `- ${score > 0 ? "⭐ " : ""}[${b.type}] title: "${b.title}" | area: "${b.area}" | slug: "${b.slug}" | boatId: "${b.id}"${b.cover ? ` | cover: "${b.cover}"` : ""}${b.capacity ? ` | capacity: ${b.capacity}` : ""}`;
      if (b.excerpt) line += `\n  Summary: ${b.excerpt}`;
      if (b.details) line += `\n  Details: ${b.details}`;
      if (b.packages.length) line += `\n  Packages: ${b.packages.map(p => `${p.title}${p.excerpt ? ` (${p.excerpt})` : ""}`).join(" | ")}`;
      return line;
    }).join("\n\n"));
  }

  if (schedules.length) {
    const scored = schedules.map(s => ({
      s,
      score: kw.length ? scoreMatch(`${s.boatTitle} ${s.area}`, kw) : 0,
    }));
    scored.sort((a, b) => b.score - a.score);

    parts.push("## Upcoming Schedules\n" + scored.map(({ s, score }) => {
      let line = `- ${score > 0 ? "⭐ " : ""}boatTitle: "${s.boatTitle}" | date: ${s.departureDate || "TBD"}${s.returnDate ? ` → ${s.returnDate}` : ""} | status: ${s.status} | area: "${s.area}" | boatId: "${s.boatId}" | boatSlug: "${s.boatSlug}" | scheduleId: "${s.id}"`;
      if (s.packages.length) {
        line += `\n  Packages for this schedule:`;
        s.packages.forEach(p => {
          const tierInfo = p.tiers.map(t => `${t.tier}`).join(", ");
          line += `\n    • "${p.title}"${p.excerpt ? ` — ${p.excerpt}` : ""}${tierInfo ? ` [tiers: ${tierInfo}]` : ""}${p.isFull ? " ❌FULL" : ""}${p.seats != null ? ` (${p.seats} seats left)` : ""}`;
        });
      }
      return line;
    }).join("\n\n"));
  }

  if (blogs.length) {
    const scored = blogs.map(b => ({
      b,
      score: kw.length ? scoreMatch(`${b.title} ${b.excerpt} ${b.keywords.join(" ")}`, kw) : 0,
    }));
    scored.sort((a, b) => b.score - a.score);

    parts.push("## Related Blog Articles\nUse these exact values when recommending blogs:\n" + scored.map(({ b, score }) =>
      `- ${score > 0 ? "⭐ " : ""}title: "${b.title}" | slug: "${b.slug}" | blogId: "${b.id}"${b.cover ? ` | cover: "${b.cover}"` : ""} | excerpt: "${b.excerpt?.slice(0, 80) || ""}"${b.keywords.length ? ` | keywords: ${b.keywords.join(", ")}` : ""}`
    ).join("\n"));
  }

  if (kw.length) {
    parts.unshift("_Items marked with ⭐ are most relevant to the user's query. Prioritize these in your recommendations._\n");
  }

  return parts.join("\n\n");
}
