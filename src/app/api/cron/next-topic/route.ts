import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cronAuth";

const ROTATION = ["INSPIRATION", "LIFESTYLE", "GEAR", "GUIDE", "SAFETY", "EDUCATION"] as const;

/**
 * POST /api/cron/next-topic
 *
 * Atomically picks the next unused topic for the category currently pointed to
 * by CronState.categoryRotationIdx, marks it used, advances the rotation
 * counter, and returns the topic payload for the agent to write.
 *
 * Behaviour:
 *  - If the current category has no unused topic, the endpoint tries the next
 *    category in the rotation. After all six are exhausted it returns 204.
 *  - `generatorEnabled=false` in CronState short-circuits with 202.
 */
export async function POST(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;

  const state = await prisma.cronState.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  if (!state.generatorEnabled) {
    await prisma.cronAuditLog.create({
      data: { event: "generator.skipped", detail: "generatorEnabled=false" },
    });
    return NextResponse.json({ skipped: true, reason: "generator disabled" }, { status: 202 });
  }

  // Try each category starting from the current rotation index. Bump the
  // rotation regardless so the next run hits the next slot even if this run
  // had to fall through.
  for (let offset = 0; offset < ROTATION.length; offset++) {
    const catIdx = (state.categoryRotationIdx + offset) % ROTATION.length;
    const category = ROTATION[catIdx];

    const topic = await prisma.blogTopic.findFirst({
      where: { category: category as any, used: false },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    if (!topic) continue;

    // Mark the topic used and advance rotation in a single transaction so two
    // concurrent generator runs can't grab the same topic.
    const claimed = await prisma.$transaction(async (tx) => {
      const fresh = await tx.blogTopic.updateMany({
        where: { id: topic.id, used: false },
        data: { used: true, usedAt: new Date() },
      });
      if (fresh.count === 0) return null; // lost the race
      await tx.cronState.update({
        where: { id: "default" },
        data: {
          categoryRotationIdx: (catIdx + 1) % ROTATION.length,
          lastGeneratedAt: new Date(),
        },
      });
      return tx.blogTopic.findUnique({ where: { id: topic.id } });
    });

    if (!claimed) {
      // Another runner beat us to this topic — loop and try again.
      offset--; // retry the same category
      continue;
    }

    await prisma.cronAuditLog.create({
      data: {
        event: "generator.picked",
        topicId: claimed.id,
        category: category,
        detail: claimed.title.slice(0, 180),
      },
    });

    return NextResponse.json({
      topicId: claimed.id,
      category,
      title: claimed.title,
      keywords: claimed.keywords,
      note: claimed.note,
    });
  }

  await prisma.cronAuditLog.create({
    data: { event: "generator.empty", detail: "all categories exhausted" },
  });
  return NextResponse.json({ error: "No unused topics in any category" }, { status: 204 });
}

/**
 * PATCH /api/cron/next-topic
 * Links a topic to the blog that was generated from it.
 * Body: { topicId, blogId }
 */
export async function PATCH(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;

  const { topicId, blogId } = await req.json();
  if (!topicId || !blogId) {
    return NextResponse.json({ error: "topicId and blogId required" }, { status: 400 });
  }

  const updated = await prisma.blogTopic.update({
    where: { id: topicId },
    data: { blogId },
  });

  await prisma.cronAuditLog.create({
    data: {
      event: "generator.completed",
      topicId,
      blogId,
      category: updated.category,
    },
  });

  return NextResponse.json({ ok: true });
}

/**
 * GET /api/cron/next-topic
 * Diagnostic peek — shows what the next run would produce without claiming it.
 */
export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;

  const state = await prisma.cronState.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const pending = await Promise.all(
    ROTATION.map(async (cat) => {
      const unused = await prisma.blogTopic.count({ where: { category: cat as any, used: false } });
      const used = await prisma.blogTopic.count({ where: { category: cat as any, used: true } });
      return { category: cat, unused, used };
    }),
  );

  return NextResponse.json({
    rotationIdx: state.categoryRotationIdx,
    nextCategory: ROTATION[state.categoryRotationIdx],
    generatorEnabled: state.generatorEnabled,
    autoPublishEnabled: state.autoPublishEnabled,
    lastGeneratedAt: state.lastGeneratedAt,
    lastPublishedAt: state.lastPublishedAt,
    categories: pending,
  });
}
