import { prisma } from "@/lib/prisma";

type Lang = string;

const pick = <T extends { lang: string }>(arr: T[], lang: Lang) =>
  arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];

export type RagBoat = {
  id: string;
  name: string;
  type: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string | null;
  area: string;
  minPrice: number;
  capacity: number | null;
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
};

export type RagBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string | null;
  keywords: string[];
};

export async function searchBoats(lang: Lang, types?: string[]): Promise<RagBoat[]> {
  const boats = await prisma.boat.findMany({
    where: {
      status: "PUBLISHED",
      ...(types?.length ? { type: { in: types as any } } : {}),
    },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
      priceTiers: { select: { regularPrice: true, salePrice: true } },
      serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
    },
    take: 50,
  });

  return boats.map(b => {
    const t = pick(b.translations, lang);
    const area = b.serviceAreas[0]?.serviceArea
      ? pick(b.serviceAreas[0].serviceArea.translations, lang)
      : null;
    const prices = b.priceTiers.map(p => p.salePrice ?? p.regularPrice).filter(p => p > 0);
    return {
      id: b.id,
      name: b.name,
      type: b.type,
      title: t?.title || b.name,
      slug: t?.slug || b.id,
      excerpt: t?.excerpt || "",
      cover: b.covers[0] || null,
      area: area?.name || "",
      minPrice: prices.length ? Math.min(...prices) : 0,
      capacity: b.capacity,
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
          package: { include: { priceTiers: { select: { regularPrice: true, salePrice: true } } } },
          priceTiers: { select: { regularPrice: true, salePrice: true } },
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

export function buildRagContext(boats: RagBoat[], schedules: RagSchedule[], blogs: RagBlog[]): string {
  const parts: string[] = [];

  if (boats.length) {
    parts.push("## Available Trips/Boats\n" + boats.map(b =>
      `- [${b.type}] ${b.title} | Area: ${b.area} | Price from ฿${b.minPrice.toLocaleString()} | slug: ${b.slug} | id: ${b.id}`
    ).join("\n"));
  }

  if (schedules.length) {
    parts.push("## Upcoming Schedules\n" + schedules.map(s =>
      `- ${s.boatTitle} | ${s.departureDate || "TBD"}${s.returnDate ? ` → ${s.returnDate}` : ""} | ฿${s.minPrice.toLocaleString()} | ${s.status} | area: ${s.area}`
    ).join("\n"));
  }

  if (blogs.length) {
    parts.push("## Related Blog Articles\n" + blogs.map(b =>
      `- "${b.title}" | slug: ${b.slug} | id: ${b.id} | keywords: ${b.keywords.join(", ")}`
    ).join("\n"));
  }

  return parts.join("\n\n");
}
