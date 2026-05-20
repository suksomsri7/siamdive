import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

type Ctx = { params: Promise<{ token: string }> };

// POST /api/plans/share/[token]/copy — recipient forks the plan into a new
// UserPlan owned by themselves. Trips JSON is deep-copied as-is. The link's
// role is irrelevant for copy — anyone with the link can fork. Email +
// optional name are required so we can attach the new plan to a PlanUser.
export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  try {
    const { name, email } = (await req.json()) as { name?: string; email?: string };
    if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });
    const normalized = email.toLowerCase().trim();

    const row = await prisma.planShareToken.findUnique({
      where: { token },
      include: { plan: true },
    });
    if (!row) return NextResponse.json({ error: "token_not_found" }, { status: 404 });

    // Find or create the recipient's PlanUser. PlanUser is keyed by deviceId
    // (one row per browser), but we use email as the cross-device identity.
    // If no record matches the email, mint a fresh deviceId so the copy lands
    // somewhere — the user can then claim it from any device by entering the
    // same email.
    let user = await prisma.planUser.findFirst({ where: { email: normalized } });
    if (!user) {
      user = await prisma.planUser.create({
        data: {
          email: normalized,
          name: name || null,
          deviceId: `copy-${randomBytes(12).toString("hex")}`,
        },
      });
    }

    const newPlan = await prisma.userPlan.create({
      data: {
        userId:   user.id,
        name:     row.plan.name,
        coverUrl: row.plan.coverUrl,
        trips:    row.plan.trips as object,
        source:   row.plan.source,
        status:   "PLANNING",
      },
    });

    return NextResponse.json({ shortId: newPlan.shortId });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
