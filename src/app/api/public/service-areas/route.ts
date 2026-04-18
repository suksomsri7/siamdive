import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/service-areas?lang=en
 *
 * Public, unauthenticated list of service areas for the search filter dropdown.
 * Returns only areas that are referenced by at least one PUBLISHED boat — we
 * don't want empty locations littering the dropdown.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "en";

  const areas = await prisma.serviceArea.findMany({
    include: { translations: { select: { lang: true, name: true } } },
    orderBy: { id: "asc" },
  });

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];

  const result = areas.map(a => ({
    id:   a.id,
    name: pick(a.translations)?.name || "(unnamed)",
  }));

  return NextResponse.json(result);
}
