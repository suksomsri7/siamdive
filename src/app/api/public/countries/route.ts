import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "en";

  const countries = await prisma.country.findMany({
    where: { status: "ACTIVE" },
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
