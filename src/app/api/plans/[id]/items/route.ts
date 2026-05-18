import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PlanItemType } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const VALID_TYPES: PlanItemType[] = ["FLIGHT", "HOTEL", "BOAT", "ACTIVITY", "TRANSFER", "NOTE"];
const VALID_SOURCES = ["USER_INPUT", "AI_SUGGEST", "DB_SCHEDULE"];

// GET /api/plans/[id]/items — list all PlanItem rows for a plan, ordered by startAt
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const items = await prisma.planItem.findMany({
      where: { planId: id },
      orderBy: [{ startAt: "asc" }, { order: "asc" }],
    });
    return NextResponse.json({
      items: items.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        location: i.location,
        startAt: i.startAt.toISOString(),
        endAt: i.endAt?.toISOString() ?? null,
        externalUrl: i.externalUrl,
        bookingRef: i.bookingRef,
        cost: i.cost,
        currency: i.currency,
        source: i.source,
        scheduleId: i.scheduleId,
        notes: i.notes,
        order: i.order,
        searchQuery: i.searchQuery,
        alternatives: i.alternatives,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// POST /api/plans/[id]/items — create a PlanItem
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const {
      type,
      title,
      location,
      startAt,
      endAt,
      externalUrl,
      bookingRef,
      cost,
      currency,
      source,
      scheduleId,
      notes,
      searchQuery,
      alternatives,
    } = body as {
      type: PlanItemType;
      title: string;
      location?: string;
      startAt: string;
      endAt?: string;
      externalUrl?: string;
      bookingRef?: string;
      cost?: number;
      currency?: string;
      source?: string;
      scheduleId?: string;
      notes?: string;
      searchQuery?: unknown;
      alternatives?: unknown;
    };

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }
    if (!title || !startAt) {
      return NextResponse.json({ error: "title_and_startAt_required" }, { status: 400 });
    }
    if (source && !VALID_SOURCES.includes(source)) {
      return NextResponse.json({ error: "invalid_source" }, { status: 400 });
    }

    const planExists = await prisma.userPlan.findUnique({ where: { id }, select: { id: true } });
    if (!planExists) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }

    const maxOrder = await prisma.planItem.aggregate({
      where: { planId: id },
      _max: { order: true },
    });

    const created = await prisma.planItem.create({
      data: {
        planId: id,
        type,
        title,
        location: location ?? null,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        externalUrl: externalUrl ?? null,
        bookingRef: bookingRef ?? null,
        cost: cost ?? null,
        currency: currency ?? "THB",
        source: source ?? "USER_INPUT",
        scheduleId: scheduleId ?? null,
        notes: notes ?? null,
        order: (maxOrder._max.order ?? -1) + 1,
        searchQuery: (searchQuery as never) ?? undefined,
        alternatives: (alternatives as never) ?? undefined,
      },
    });

    return NextResponse.json({
      id: created.id,
      type: created.type,
      title: created.title,
      startAt: created.startAt.toISOString(),
      order: created.order,
    });
  } catch (err) {
    console.error("[plan items POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
