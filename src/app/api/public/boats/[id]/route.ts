import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public read-only endpoint: returns boat info + packages for the user-facing
// InfoModal. No auth required — only PUBLISHED rows are exposed.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const boat = await prisma.boat.findUnique({
    where: { id },
    include: {
      translations: true,
      priceTiers:   true,
      videos:       { orderBy: { order: "asc" } },
      options:      { orderBy: { order: "asc" }, include: { translations: true } },
      serviceAreas: { include: { serviceArea: { include: { translations: true } } } },
      company:      { include: { translations: true } },
      divePackages: { orderBy: { order: "asc" } },
      mealPlans:    { orderBy: { order: "asc" } },
      packages: {
        orderBy: { createdAt: "asc" },
        include: {
          translations:  true,
          priceTiers:    true,
          seasonPeriods: { orderBy: { startDate: "asc" } },
        },
      },
      schedules: {
        where: { status: { in: ["OPEN", "FULL"] } },
        orderBy: { departureDate: "asc" },
        include: {
          translations: true,
          packages:     { include: { priceTiers: true } },
        },
      },
    },
  });

  if (!boat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(boat);
}
