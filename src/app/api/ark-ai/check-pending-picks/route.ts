import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTripSignature, type TripFingerprint } from "@/lib/ark-ai/plan-signature";
import { findRecentDeletion } from "@/lib/ark-ai/deleted-sigs";

// Pre-flight check for the fast path (staged picks → flushPicksToPlan).
// The chat panel calls this BEFORE creating a new plan from staged picks
// so we can short-circuit the two duplicate-plan scenarios that the slow
// path's slot-signature dedup doesn't cover:
//   1) The user already has a PLANNING plan whose trip set matches these
//      picks exactly — return reused so the client routes to it instead
//      of creating a competing plan.
//   2) The user just deleted a plan with the same trip set — return
//      recentlyDeleted so the client surfaces a confirm toast (with a
//      "Create new" CTA that retries with force: true).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const deviceId: string | undefined = body?.deviceId;
  if (!deviceId) {
    return Response.json({ error: "deviceId required" }, { status: 400 });
  }

  const rawPicks = Array.isArray(body?.picks) ? body.picks : [];
  const picks: TripFingerprint[] = rawPicks
    .map((p: unknown): TripFingerprint | null => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const boatId = typeof o.boatId === "string" ? o.boatId : "";
      const scheduleObj = o.schedule as Record<string, unknown> | undefined;
      const scheduleIdDirect = typeof o.scheduleId === "string" ? o.scheduleId : null;
      const scheduleIdNested =
        scheduleObj && typeof scheduleObj.scheduleId === "string"
          ? scheduleObj.scheduleId
          : null;
      if (!boatId) return null;
      return { boatId, scheduleId: scheduleIdDirect ?? scheduleIdNested };
    })
    .filter((p: TripFingerprint | null): p is TripFingerprint => p !== null);

  const tripSig = buildTripSignature(picks);
  if (!tripSig) {
    return Response.json({ ok: true });
  }

  const user = await prisma.planUser.findUnique({ where: { deviceId } });
  if (!user) {
    return Response.json({ ok: true });
  }

  // Recently-deleted match takes precedence over a live-plan match — the
  // user's most recent intent was to remove this trip, so confirm before
  // resurrecting it. They can still tap "Create new" on the toast.
  const deleted = findRecentDeletion(user.recentlyDeletedSigs, "trip", tripSig);
  if (deleted) {
    return Response.json({
      recentlyDeleted: true,
      name: deleted.name,
      deletedAt: deleted.at,
    });
  }

  return Response.json({ ok: true });
}
