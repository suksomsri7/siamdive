import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

// POST /api/plans/share/[token]/join — recipient joins the original plan as
// a member. Role is dictated by the token (VIEWER or EDITOR) so the client
// can't escalate. Upserts on (planId, email) so a user clicking a fresh
// link with a higher role gets bumped up rather than duplicated.
//
// We also bind the joiner's deviceId to a PlanUser row keyed by that email,
// so when they later open MyPlan the deviceId → PlanUser → memberships
// chain resolves and they actually see the shared plan in their list.
export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  try {
    const { name, email, deviceId } = (await req.json()) as {
      name?: string; email?: string; deviceId?: string;
    };
    if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });
    const normalized = email.toLowerCase().trim();

    const row = await prisma.planShareToken.findUnique({
      where: { token },
      include: { plan: { select: { id: true, shortId: true, userId: true } } },
    });
    if (!row) return NextResponse.json({ error: "token_not_found" }, { status: 404 });

    // Don't add the owner as their own member — that would create a duplicate
    // record (the owner is implicit on UserPlan.userId). Lookup the owner's
    // email and short-circuit if it matches.
    const owner = await prisma.planUser.findUnique({
      where: { id: row.plan.userId },
      select: { email: true },
    });
    if (owner?.email && owner.email.toLowerCase() === normalized) {
      return NextResponse.json({ shortId: row.plan.shortId, alreadyOwner: true });
    }

    // Bind this browser (deviceId) to the joiner's PlanUser so that the next
    // time they open MyPlan and we query plans by deviceId, the member-of
    // join finds this plan via PlanUser.email → PlanMember.email.
    if (deviceId) {
      const existing = await prisma.planUser.findUnique({ where: { deviceId } });
      if (existing) {
        // Only patch email/name when those slots were empty — never clobber
        // an existing identity, in case the user is multi-tenanting a
        // browser. The lookup below still works because PlanMember.email
        // matches the typed value either way.
        await prisma.planUser.update({
          where: { id: existing.id },
          data: {
            email: existing.email ?? normalized,
            name:  existing.name  ?? (name || null),
          },
        });
      } else {
        await prisma.planUser.create({
          data: { deviceId, email: normalized, name: name || null },
        });
      }
    }

    await prisma.planMember.upsert({
      where: { planId_email: { planId: row.plan.id, email: normalized } },
      update: { name: name || undefined, role: row.role },
      create: { planId: row.plan.id, email: normalized, name: name || null, role: row.role },
    });

    await prisma.planActivity.create({
      data: {
        planId: row.plan.id,
        action: "MEMBER_JOINED_VIA_LINK",
        actorEmail: normalized,
        detail: { role: row.role, via: "share_token" },
      },
    }).catch(() => {});

    return NextResponse.json({ shortId: row.plan.shortId, role: row.role });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
