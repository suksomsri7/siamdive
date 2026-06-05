import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = req.nextUrl.searchParams.get("lang") || "en";

  const schedule = await prisma.schedule.findUnique({
    where: { id },
    select: {
      id: true,
      departureDate: true,
      returnDate: true,
      status: true,
      logistics: true,
      translations: {
        where: { lang: { in: [lang, "en"] } },
        select: { lang: true, title: true, excerpt: true, content: true, route: true, included: true, excluded: true, details: true },
      },
      boat: {
        select: {
          translations: {
            where: { lang: { in: [lang, "en"] } },
            select: { lang: true, title: true, excerpt: true, content: true },
          },
        },
      },
    },
  });

  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || null;

  const schedTr = pick(schedule.translations);
  const boatTr = pick(schedule.boat.translations);

  return NextResponse.json({
    id: schedule.id,
    boat: boatTr ? { title: boatTr.title, excerpt: boatTr.excerpt, content: boatTr.content } : null,
    schedule: schedTr ? { title: schedTr.title, excerpt: schedTr.excerpt, content: schedTr.content, route: schedTr.route, included: schedTr.included ?? [], excluded: schedTr.excluded ?? [], details: schedTr.details ?? {}, logistics: schedule.logistics ?? {} } : null,
  });
}
