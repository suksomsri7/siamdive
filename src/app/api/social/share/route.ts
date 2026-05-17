import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { createUpdate } from "@/lib/social/buffer";
import { decrypt } from "@/lib/ark-ai/encryption";

const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "siamdive-cdn.b-cdn.net";
const SITE_URL = process.env.NEXTAUTH_URL || "https://siamdive.com";

function absUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/uploads/")) return `https://${BUNNY_CDN_HOSTNAME}${path}`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({})) as {
    blogId?: string;
    accountId?: string;
    caption?: string;
    hashtags?: string[];
    imageUrl?: string;
    imageVariant?: string;
    scheduledAt?: string | null;
    postNow?: boolean;
    language?: "th" | "en";
  };
  if (!body.blogId || !body.caption) {
    return NextResponse.json({ error: "blogId + caption required" }, { status: 400 });
  }

  const blog = await prisma.blog.findUnique({
    where: { id: body.blogId },
    include: { translations: true },
  });
  if (!blog) return NextResponse.json({ error: "blog not found" }, { status: 404 });

  let lang = body.language;
  let account = body.accountId
    ? await prisma.socialAccount.findUnique({ where: { id: body.accountId } })
    : null;
  if (!account) {
    const candidates = await prisma.socialAccount.findMany({
      where: { active: true, ...(lang ? { language: lang } : {}) },
      orderBy: { createdAt: "asc" },
    });
    account = candidates[0] || null;
  }
  if (!account) return NextResponse.json({ error: "ยังไม่ได้เชื่อมต่อ Buffer — ไปที่ Accounts ใส่ token ก่อน" }, { status: 412 });
  lang = (lang ?? account.language) as "th" | "en";

  const trans = blog.translations.find(t => t.lang === lang) || blog.translations[0];
  if (!trans) return NextResponse.json({ error: "no blog translation" }, { status: 404 });

  const publicUrl = `${SITE_URL}/${lang}/blogs/${trans.slug}`;
  const imageUrl = body.imageUrl
    ? absUrl(body.imageUrl)
    : (trans.ogImage ? absUrl(trans.ogImage) : (blog.covers[0] ? absUrl(blog.covers[0]) : ""));

  const hashtagLine = (body.hashtags ?? []).filter(t => t && t.startsWith("#")).join(" ");
  const fullText = hashtagLine
    ? `${body.caption.trim()}\n\n${publicUrl}\n\n${hashtagLine}`
    : `${body.caption.trim()}\n\n${publicUrl}`;

  let scheduledAt: Date | null = null;
  if (body.scheduledAt) {
    const d = new Date(body.scheduledAt);
    if (!isNaN(d.getTime()) && d.getTime() > Date.now() - 60_000) scheduledAt = d;
  }

  const token = decrypt(account.accessToken);
  if (!token) return NextResponse.json({ error: "account token decrypt failed" }, { status: 500 });

  let bufferUpdateId: string | undefined;
  let bufferExternalUrl: string | undefined;
  try {
    const res = await createUpdate(token, {
      profileIds: [account.bufferProfileId],
      text: fullText,
      scheduledAt: scheduledAt ?? undefined,
      now: body.postNow === true,
      mediaUrl: imageUrl || undefined,
    });
    if (!res.success && !res.updates.length) throw new Error(res.message || "buffer rejected");
    bufferUpdateId = res.updates?.[0]?.id;
    bufferExternalUrl = res.updates?.[0]?.service_link;
  } catch (err) {
    await prisma.socialPost.create({
      data: {
        blogId: blog.id,
        accountId: account.id,
        language: lang,
        caption: body.caption,
        hashtags: body.hashtags ?? [],
        imageUrl: imageUrl || "",
        imageVariant: body.imageVariant ?? "og",
        scheduledAt,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "unknown",
      },
    });
    return NextResponse.json({ error: err instanceof Error ? err.message : "buffer failed" }, { status: 502 });
  }

  const post = await prisma.socialPost.create({
    data: {
      blogId: blog.id,
      accountId: account.id,
      language: lang,
      caption: body.caption,
      hashtags: body.hashtags ?? [],
      imageUrl: imageUrl || "",
      imageVariant: body.imageVariant ?? "og",
      scheduledAt,
      status: "QUEUED",
      bufferUpdateId: bufferUpdateId ?? null,
      externalUrl: bufferExternalUrl ?? null,
    },
  });

  return NextResponse.json({
    id: post.id,
    bufferUpdateId,
    scheduledAt,
    accountId: account.id,
    pageName: account.pageName,
    language: lang,
  });
}
