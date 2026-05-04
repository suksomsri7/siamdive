import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isComplete, type Slots } from "@/lib/ark-ai/slots";

// Phase 2 — Resume endpoint. ChatPanel calls this on open to hydrate the
// SlotTrackerChips with whatever slots were extracted in earlier turns.
// Returns null when the device has no active session yet (cold start).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  if (!deviceId) {
    return Response.json({ error: "deviceId required" }, { status: 400 });
  }
  const session = await prisma.aiPlanSession.findFirst({
    where: { deviceId, status: "active", expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
    select: { id: true, slots: true, lastActiveAt: true, expiresAt: true },
  });
  if (!session) return Response.json({ session: null });
  const slots = (session.slots && typeof session.slots === "object" ? session.slots : {}) as Slots;
  return Response.json({
    session: {
      id: session.id,
      slots,
      complete: isComplete(slots),
      lastActiveAt: session.lastActiveAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    },
  });
}

// Clear individual slot fields when the user taps the ✕ on a chip. Without
// server-side clear the AI keeps seeing the stale value in the system prompt
// and won't re-extract from new messages.
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const deviceId: string | undefined = body?.deviceId;
  const clearFields: string[] = Array.isArray(body?.clear) ? body.clear : [];
  if (!deviceId || !clearFields.length) {
    return Response.json({ error: "deviceId + clear[] required" }, { status: 400 });
  }
  const session = await prisma.aiPlanSession.findFirst({
    where: { deviceId, status: "active", expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
  });
  if (!session) return Response.json({ session: null });
  const slots = (session.slots && typeof session.slots === "object" ? session.slots : {}) as Record<string, unknown>;
  let changed = false;
  for (const f of clearFields) {
    if (f in slots) { delete slots[f]; changed = true; }
  }
  if (!changed) {
    return Response.json({ session: { id: session.id, slots, complete: isComplete(slots as Slots) } });
  }
  await prisma.aiPlanSession.update({
    where: { id: session.id },
    data: { slots: slots as never, lastActiveAt: new Date() },
  });
  return Response.json({ session: { id: session.id, slots, complete: isComplete(slots as Slots) } });
}

// Allow the user to wipe their slot history (Phase 7 PDPA opt-out).
// Marks status=abandoned so the cleanup cron sweeps it.
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  if (!deviceId) {
    return Response.json({ error: "deviceId required" }, { status: 400 });
  }
  await prisma.aiPlanSession
    .updateMany({
      where: { deviceId, status: "active" },
      data: { status: "abandoned", lastActiveAt: new Date() },
    })
    .catch(err => console.error("[ark-ai] AiPlanSession DELETE failed:", err));
  return Response.json({ ok: true });
}
