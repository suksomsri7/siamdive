import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordDeletedSignatures, type SigKind } from "@/lib/ark-ai/deleted-sigs";
import { buildTripSignature, type TripFingerprint } from "@/lib/ark-ai/plan-signature";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/plans/[id]?deviceId=xxx — full plan detail (trips + members + media + checklist + notes)
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  const shortId = req.nextUrl.searchParams.get("shortId");

  try {
    const plan = await prisma.userPlan.findFirst({
      where: shortId ? { shortId: id } : { id },
      include: {
        user: { select: { email: true, name: true, deviceId: true } },
        members: { orderBy: { joinedAt: "asc" } },
        media: { orderBy: { createdAt: "desc" }, take: 50 },
        checklists: { orderBy: { sortOrder: "asc" } },
        notes: { orderBy: { createdAt: "desc" } },
        _count: { select: { chatMessages: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }

    // Determine access level
    let role: "OWNER" | "EDITOR" | "VIEWER" = "VIEWER";
    if (deviceId && plan.user.deviceId === deviceId) {
      role = "OWNER";
    } else if (deviceId) {
      const user = await prisma.planUser.findUnique({ where: { deviceId } });
      if (user?.email) {
        const membership = plan.members.find((m) => m.email === user.email);
        if (membership) role = membership.role as "EDITOR" | "VIEWER";
      }
    }

    return NextResponse.json({
      id: plan.id,
      shortId: plan.shortId,
      name: plan.name,
      coverUrl: plan.coverUrl,
      status: plan.status,
      trips: plan.trips,
      role,
      owner: { email: plan.user.email, name: plan.user.name },
      members: plan.members.map((m) => ({
        id: m.id, email: m.email, name: m.name, avatarUrl: m.avatarUrl,
        role: m.role, certLevel: m.certLevel, joinedAt: m.joinedAt.toISOString(),
      })),
      media: plan.media.map((m) => ({
        id: m.id, url: m.url, thumbUrl: m.thumbUrl, type: m.type,
        uploadedBy: m.uploadedBy, caption: m.caption, createdAt: m.createdAt.toISOString(),
      })),
      checklists: plan.checklists.map((c) => ({
        id: c.id, category: c.category, item: c.item, assignedTo: c.assignedTo,
        checked: c.checked, checkedBy: c.checkedBy, sortOrder: c.sortOrder,
      })),
      notes: plan.notes.map((n) => ({
        id: n.id, tripIndex: n.tripIndex, content: n.content,
        authorEmail: n.authorEmail, createdAt: n.createdAt.toISOString(),
      })),
      chatCount: plan._count.chatMessages,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PATCH /api/plans/[id] — update plan
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { deviceId, name, trips, coverUrl, status } = body as {
      deviceId: string;
      name?: string;
      trips?: unknown[];
      coverUrl?: string | null;
      status?: string;
    };

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const existing = await prisma.userPlan.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      // Check if user is an editor member
      if (user.email) {
        const membership = await prisma.planMember.findFirst({
          where: { planId: id, email: user.email, role: "EDITOR" },
        });
        if (!membership) {
          return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
      }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (trips !== undefined) data.trips = trips as never;
    if (coverUrl !== undefined) data.coverUrl = coverUrl;
    if (status !== undefined) data.status = status;

    const plan = await prisma.userPlan.update({ where: { id }, data });

    return NextResponse.json({
      id: plan.id, shortId: plan.shortId, name: plan.name,
      coverUrl: plan.coverUrl, status: plan.status, trips: plan.trips,
      createdAt: plan.createdAt.toISOString(), updatedAt: plan.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/plans/[id]?deviceId=xxx
// Owner → delete the whole plan (existing behavior).
// Member → leave the plan: remove their own PlanMember row only. The plan
// stays alive for everyone else. Either way the caller's MyPlan list will
// no longer surface this plan.
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const existing = await prisma.userPlan.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      // Not an owner of this plan — check if the user is a member and let
      // them leave instead of erroring out. Keep the 404 if they're not a
      // member either (stale local copy, never had access).
      if (user.email) {
        const membership = await prisma.planMember.findUnique({
          where: { planId_email: { planId: id, email: user.email } },
        });
        if (membership) {
          await prisma.planMember.delete({ where: { id: membership.id } });
          await prisma.planActivity.create({
            data: {
              planId: id,
              action: "MEMBER_LEFT",
              actorEmail: user.email,
              detail: { via: "delete_from_myplan" },
            },
          }).catch(() => {});
          return NextResponse.json({ ok: true, left: true });
        }
      }
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }

    // Stash signatures so a same-trip rebuild — whether through chat slot
    // extraction (slot kind) or staged-pick "+" / Build flow (trip kind) —
    // can prompt the user before silently recreating what they just removed.
    // Track both kinds for ALL plans, not just ARK_AI: a USER plan deleted
    // because the user changed their mind shouldn't reappear via the fast
    // path either.
    const sigsToStash: Array<{ kind: SigKind; sig: string }> = [];
    if (existing.planSignature) {
      sigsToStash.push({ kind: "slot", sig: existing.planSignature });
    }
    const tripList = Array.isArray(existing.trips) ? (existing.trips as Array<Record<string, unknown>>) : [];
    const fingerprints: TripFingerprint[] = tripList
      .filter((t): t is Record<string, unknown> => t != null && typeof t === "object")
      .map((t) => {
        const schedule = t.schedule as Record<string, unknown> | undefined;
        return {
          boatId: typeof t.boatId === "string" ? t.boatId : "",
          scheduleId:
            schedule && typeof schedule.scheduleId === "string" ? schedule.scheduleId : null,
        };
      });
    const tripSig = buildTripSignature(fingerprints);
    if (tripSig) sigsToStash.push({ kind: "trip", sig: tripSig });

    if (sigsToStash.length > 0) {
      await recordDeletedSignatures(user.id, sigsToStash, existing.name).catch((err) => {
        console.error("[plans/delete] recordDeletedSignatures failed:", err);
      });
    }

    await prisma.userPlan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
