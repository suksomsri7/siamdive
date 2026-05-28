import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/countries?lang=&withServiceAreas=1&withBoats=1
 *
 * Public list of ACTIVE countries.
 *
 * Params:
 *  - lang             → translation language (default "en")
 *  - withServiceAreas → if "1", drop countries that have zero ServiceArea rows
 *  - withBoats        → if "1", drop countries with zero PUBLISHED boats whose
 *                       service-area belongs to this country (strictest filter
 *                       — what the search UI wants so empty chips never appear)
 *
 * The two filters compose: passing both means "country must have ≥1 area AND
 * ≥1 published boat in that country".
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "en";
  const withServiceAreas = searchParams.get("withServiceAreas") === "1";
  const withBoats = searchParams.get("withBoats") === "1";

  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (withBoats) {
    // At least one ServiceArea linked to a PUBLISHED Boat in this country.
    where.serviceAreas = {
      some: {
        boats: { some: { boat: { status: "PUBLISHED" } } },
      },
    };
  } else if (withServiceAreas) {
    where.serviceAreas = { some: {} };
  }

  const countries = await prisma.country.findMany({
    where,
    include: { translations: { select: { lang: true, name: true } } },
    orderBy: [{ order: "asc" }, { code: "asc" }],
  });

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];

  const result = countries.map(c => ({
    id: c.id,
    code: c.code,
    flag: c.flag,
    name: pick(c.translations)?.name || c.code,
  }));

  return NextResponse.json(result);
}
