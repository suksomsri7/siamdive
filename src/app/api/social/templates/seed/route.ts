import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

// Seeds 5 system templates. Idempotent — runs only when no system templates
// exist. Admin can call this once after deployment.
const SYSTEM_TEMPLATES = [
  {
    name: "FB Plain photo",
    width: 1200, height: 630,
    layout: {
      backgroundFit: "cover",
      texts: [],
      watermark: { enabled: true, position: "bottom-right", opacity: 60, scale: 15 },
    },
    order: 0,
  },
  {
    name: "FB Bottom title bar",
    width: 1200, height: 630,
    layout: {
      backgroundFit: "cover",
      texts: [{
        content: "Title goes here", x: 60, y: 460,
        width: 1080, fontSize: 56, fontWeight: 800,
        fill: "#ffffff", align: "left", shadow: true,
      }],
      watermark: { enabled: true, position: "bottom-right", opacity: 60, scale: 12 },
    },
    order: 1,
  },
  {
    name: "IG Centered title (square)",
    width: 1080, height: 1080,
    layout: {
      backgroundFit: "cover",
      texts: [{
        content: "Title goes here", x: 80, y: 420,
        width: 920, fontSize: 80, fontWeight: 900,
        fill: "#ffffff", align: "center", shadow: true,
      }],
      watermark: { enabled: true, position: "bottom-right", opacity: 60, scale: 15 },
    },
    order: 2,
  },
  {
    name: "IG Story top title",
    width: 1080, height: 1920,
    layout: {
      backgroundFit: "cover",
      texts: [{
        content: "Title goes here", x: 80, y: 200,
        width: 920, fontSize: 90, fontWeight: 900,
        fill: "#ffffff", align: "left", shadow: true,
      }],
      watermark: { enabled: true, position: "bottom-right", opacity: 60, scale: 15 },
    },
    order: 3,
  },
  {
    name: "Quote card",
    width: 1080, height: 1080,
    layout: {
      backgroundFit: "cover",
      texts: [{
        content: "\"Quote text here\"", x: 100, y: 380,
        width: 880, fontSize: 56, fontWeight: 700,
        fill: "#ffffff", align: "center", shadow: true,
      }],
      watermark: { enabled: true, position: "bottom-right", opacity: 70, scale: 15 },
    },
    order: 4,
  },
];

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const existing = await prisma.socialImageTemplate.count({ where: { isSystem: true } });
  if (existing > 0) return NextResponse.json({ seeded: 0, note: `${existing} system templates already exist` });
  const created = await prisma.$transaction(
    SYSTEM_TEMPLATES.map(t => prisma.socialImageTemplate.create({ data: { ...t, isSystem: true } }))
  );
  return NextResponse.json({ seeded: created.length });
}
