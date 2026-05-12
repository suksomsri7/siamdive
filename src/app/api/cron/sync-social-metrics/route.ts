import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cronAuth";
import { prisma } from "@/lib/prisma";
import { getUpdate, getUpdateInteractions } from "@/lib/social/buffer";
import { decrypt } from "@/lib/ark-ai/encryption";

export const runtime = "nodejs";
export const maxDuration = 60;

// Polls Buffer for the latest stats on every SocialPost that
//   (a) was created in the last 30 days, and
//   (b) has a bufferUpdateId.
// Promotes QUEUED → POSTED when Buffer reports `sent`. Records metrics.
// Designed to be hit by a RemoteTrigger 1×/day.
export async function POST(req: NextRequest) {
  const guard = requireCronSecret(req);
  if (guard) return guard;

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const posts = await prisma.socialPost.findMany({
    where: {
      bufferUpdateId: { not: null },
      status: { in: ["QUEUED", "POSTED"] },
      createdAt: { gte: cutoff },
    },
    include: { account: true },
    take: 200,
  });

  let synced = 0;
  let promoted = 0;
  const errors: { id: string; error: string }[] = [];

  for (const post of posts) {
    if (!post.account || !post.bufferUpdateId) continue;
    const token = decrypt(post.account.accessToken);
    if (!token) continue;

    try {
      const u = await getUpdate(token, post.bufferUpdateId);
      const data: Record<string, unknown> = { lastSyncedAt: new Date() };

      if (u.status === "sent" && post.status === "QUEUED") {
        data.status = "POSTED";
        data.postedAt = u.sent_at ? new Date(u.sent_at * 1000) : new Date();
        promoted++;
      }
      if (u.service_link && !post.externalUrl) data.externalUrl = u.service_link;
      if (u.statistics) {
        if (typeof u.statistics.likes === "number") data.likes = u.statistics.likes;
        if (typeof u.statistics.comments === "number") data.comments = u.statistics.comments;
        if (typeof u.statistics.shares === "number") data.shares = u.statistics.shares;
        if (typeof u.statistics.reach === "number") data.reach = u.statistics.reach;
      }
      if (post.status === "POSTED") {
        // fetch deeper interactions for richer metrics
        try {
          const i = await getUpdateInteractions(token, post.bufferUpdateId);
          if (i.statistics) {
            if (typeof i.statistics.likes === "number") data.likes = i.statistics.likes;
            if (typeof i.statistics.comments === "number") data.comments = i.statistics.comments;
            if (typeof i.statistics.shares === "number") data.shares = i.statistics.shares;
            if (typeof i.statistics.reach === "number") data.reach = i.statistics.reach;
          }
        } catch { /* non-fatal */ }
      }

      await prisma.socialPost.update({ where: { id: post.id }, data });
      synced++;
    } catch (err) {
      errors.push({ id: post.id, error: err instanceof Error ? err.message : "unknown" });
    }
  }

  return NextResponse.json({
    checked: posts.length,
    synced,
    promoted,
    errors: errors.slice(0, 10),
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
