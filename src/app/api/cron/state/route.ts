import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

/**
 * GET/PATCH /api/cron/state
 *
 * Admin-controlled kill switches and state for the generator + publisher
 * crons. Uses normal admin auth (session / API key) — not the cron secret —
 * because this is how humans pause or resume the pipeline.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const state = await prisma.cronState.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
  return NextResponse.json(state);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.autoPublishEnabled === "boolean") data.autoPublishEnabled = body.autoPublishEnabled;
  if (typeof body.generatorEnabled === "boolean") data.generatorEnabled = body.generatorEnabled;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid flags provided" }, { status: 400 });
  }

  const state = await prisma.cronState.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  await prisma.cronAuditLog.create({
    data: {
      event: "state.updated",
      detail: JSON.stringify(data),
    },
  });

  return NextResponse.json(state);
}
