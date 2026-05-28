import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/service-areas?lang=&countryCode=&countryId=
 *
 * Public list of service areas for the search filter dropdown.
 *
 * Params:
 *  - lang        → pick translation language (default "en")
 *  - countryCode → optional; restrict to a single Country.code (TH/MV/EG/…)
 *  - countryId   → optional; restrict to a single Country.id (alternative to countryCode)
 *
 * The response now always includes `countryId` and `countryCode` so callers
 * can group/filter client-side without an extra round-trip.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "en";
  const countryCode = searchParams.get("countryCode")?.toUpperCase() || null;
  const countryId = searchParams.get("countryId") || null;

  const areas = await prisma.serviceArea.findMany({
    where: countryId
      ? { countryId }
      : countryCode
        ? { country: { code: countryCode } }
        : {},
    include: {
      translations: { select: { lang: true, name: true } },
      country: { select: { id: true, code: true } },
    },
    orderBy: { id: "asc" },
  });

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];

  const result = areas.map(a => ({
    id:          a.id,
    name:        pick(a.translations)?.name || "(unnamed)",
    countryId:   a.country?.id ?? null,
    countryCode: a.country?.code ?? null,
  }));

  return NextResponse.json(result);
}
