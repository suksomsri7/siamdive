import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cronAuth";

// Sprint 3 B5 — Auto-improve cron.
// Scans PLANNING UserPlans and writes PlanNotification rows when something
// worth surfacing is detected. Three checks per run:
//   1. NEAR_FULL — a chosen schedule's availableSeats is ≤5 OR status=FULL
//   2. NEW_BLOG  — a blog tagged with the plan's serviceArea was published
//                  in the last 7 days (max 1 per plan per cron run)
//   3. DATE_REMINDER — primary trip leaves in 7-3-1 days (one each)
//
// Idempotent: each notification is keyed (planId, type, scheduleId/blogId)
// so re-runs in the same window don't duplicate.
//
// Runs daily via VPS crontab. Scoped to active plans only — cleanup-ai-data
// already drops stale anonymous plans, so we won't waste work on dead rows.

type PlanTripSchedule = {
  scheduleId?: string;
  departureDate?: string;
  title?: string;
};
type PlanTrip = {
  boatId?: string;
  title?: string;
  schedule?: PlanTripSchedule;
  type?: string;
};

const NEAR_FULL_THRESHOLD = 5;
const REMINDER_DAYS = [7, 3, 1] as const;
const NEW_BLOG_DAYS = 7;

export async function POST(req: NextRequest) {
  const authError = requireCronSecret(req);
  if (authError) return authError;

  const now = new Date();
  const newBlogCutoff = new Date(now.getTime() - NEW_BLOG_DAYS * 86_400_000);

  const plans = await prisma.userPlan.findMany({
    where: {
      status: "PLANNING",
      // Only plans created in last 90 days — older PLANNING rows are likely
      // abandoned. Cleanup cron already prunes anonymous AI plans.
      createdAt: { gt: new Date(now.getTime() - 90 * 86_400_000) },
    },
    select: { id: true, trips: true, createdAt: true },
  });

  const stats = {
    plansScanned: plans.length,
    nearFullCreated: 0,
    newBlogCreated: 0,
    dateReminderCreated: 0,
    skippedDuplicate: 0,
    errors: 0 as number,
  };

  for (const plan of plans) {
    try {
      const trips = (Array.isArray(plan.trips) ? plan.trips : []) as PlanTrip[];
      if (trips.length === 0) continue;

      const scheduleIds = trips
        .map(t => t.schedule?.scheduleId)
        .filter((x): x is string => typeof x === "string" && x.length > 0);
      const boatIds = trips
        .map(t => t.boatId)
        .filter((x): x is string => typeof x === "string" && x.length > 0);

      // ── Existing notifications keyed for dedupe ────────────────────────
      const existing = await prisma.planNotification.findMany({
        where: { planId: plan.id, dismissedAt: null },
        select: { type: true, scheduleId: true, blogId: true, payload: true },
      });
      const hasNearFull = (sid: string) =>
        existing.some(n => n.type === "NEAR_FULL" && n.scheduleId === sid);
      const hasReminder = (sid: string, daysOut: number) =>
        existing.some(n => {
          if (n.type !== "DATE_REMINDER" || n.scheduleId !== sid) return false;
          const p = (n.payload || {}) as { daysOut?: number };
          return p.daysOut === daysOut;
        });
      const hasNewBlog = existing.some(n => n.type === "NEW_BLOG");

      // ── 1. NEAR_FULL check ─────────────────────────────────────────────
      if (scheduleIds.length > 0) {
        const liveSchedules = await prisma.schedule.findMany({
          where: { id: { in: scheduleIds } },
          select: { id: true, availableSeats: true, status: true, departureDate: true },
        });
        for (const s of liveSchedules) {
          const seatsKnown = typeof s.availableSeats === "number";
          const isFull = s.status === "FULL";
          const isLow = seatsKnown && (s.availableSeats as number) <= NEAR_FULL_THRESHOLD && (s.availableSeats as number) >= 0;
          if (!isFull && !isLow) continue;
          if (hasNearFull(s.id)) {
            stats.skippedDuplicate++;
            continue;
          }
          await prisma.planNotification.create({
            data: {
              planId: plan.id,
              type: "NEAR_FULL",
              scheduleId: s.id,
              title: isFull ? "ทริปเต็มแล้ว" : "ที่นั่งเหลือน้อย",
              body: isFull
                ? "ทริปที่คุณเลือกขายหมดแล้ว ติดต่อ SiamDive เพื่อหาวันใกล้เคียง"
                : `เหลือเพียง ${s.availableSeats} ที่ — รีบ confirm ก่อนเต็ม`,
              payload: {
                seats: s.availableSeats,
                status: s.status,
                departureDate: s.departureDate?.toISOString() ?? null,
              } as never,
            },
          });
          stats.nearFullCreated++;
        }

        // ── 3. DATE_REMINDER (per schedule) ──────────────────────────────
        for (const s of liveSchedules) {
          if (!s.departureDate) continue;
          const daysOut = Math.round(
            (s.departureDate.getTime() - now.getTime()) / 86_400_000,
          );
          for (const d of REMINDER_DAYS) {
            if (daysOut !== d) continue;
            if (hasReminder(s.id, d)) {
              stats.skippedDuplicate++;
              continue;
            }
            await prisma.planNotification.create({
              data: {
                planId: plan.id,
                type: "DATE_REMINDER",
                scheduleId: s.id,
                title: d === 1 ? "ทริปออกพรุ่งนี้!" : `เหลืออีก ${d} วันก่อนทริป`,
                body: d === 1
                  ? "เช็คอุปกรณ์ ของฝาก เอกสารใบเซอร์ — ทริปออกพรุ่งนี้แล้ว"
                  : `เริ่มแพ็คของได้แล้ว — ทริปออกอีก ${d} วัน`,
                payload: {
                  daysOut: d,
                  departureDate: s.departureDate.toISOString(),
                } as never,
              },
            });
            stats.dateReminderCreated++;
          }
        }
      }

      // ── 2. NEW_BLOG check ────────────────────────────────────────────
      // Skip if plan already has an active NEW_BLOG notification — we don't
      // want to spam the user with one banner per blog per day.
      if (!hasNewBlog && boatIds.length > 0) {
        // Pull serviceAreaIds for the plan's boats.
        const boatAreas = await prisma.boatServiceArea.findMany({
          where: { boatId: { in: boatIds } },
          select: { serviceAreaId: true },
        });
        const planAreaIds = Array.from(new Set(boatAreas.map(b => b.serviceAreaId)));
        if (planAreaIds.length > 0) {
          const newBlog = await prisma.blog.findFirst({
            where: {
              status: "PUBLISHED",
              serviceAreaIds: { hasSome: planAreaIds },
              updatedAt: { gt: newBlogCutoff },
            },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              translations: { select: { lang: true, title: true, slug: true } },
            },
          });
          if (newBlog && newBlog.translations.length > 0) {
            const t = newBlog.translations.find(x => x.lang === "th") ?? newBlog.translations[0];
            await prisma.planNotification.create({
              data: {
                planId: plan.id,
                type: "NEW_BLOG",
                blogId: newBlog.id,
                title: "บทความใหม่ที่น่าสนใจ",
                body: t.title,
                payload: { slug: t.slug, lang: t.lang } as never,
              },
            });
            stats.newBlogCreated++;
          }
        }
      }
    } catch (err) {
      console.error("[plan-improve] plan", plan.id, "failed:", err);
      stats.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...stats });
}
