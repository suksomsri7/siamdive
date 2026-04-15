import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { fal } from "@fal-ai/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

const BUNNY_STORAGE_KEY = process.env.BUNNY_STORAGE_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "siamdive-com";
const BUNNY_ACCOUNT_KEY = process.env.BUNNY_ACCOUNT_KEY;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "siamdive-cdn.b-cdn.net";
const ORIGINALS_DIR = join(process.cwd(), "public", "uploads", "originals");
const PROCESSED_DIR = join(process.cwd(), "public", "uploads", "processed");

const FAL_KEY = process.env.FAL_KEY;

if (FAL_KEY) fal.config({ credentials: FAL_KEY });

async function saveFile(path: string, buf: Buffer) {
  if (BUNNY_STORAGE_KEY) {
    const res = await fetch(`https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}${path}`, {
      method: "PUT",
      headers: { AccessKey: BUNNY_STORAGE_KEY, "Content-Type": "application/octet-stream" },
      body: buf,
    });
    if (!res.ok) throw new Error(`Bunny upload failed: ${res.status}`);
    if (BUNNY_ACCOUNT_KEY) {
      await fetch(`https://api.bunny.net/purge?url=https://${BUNNY_CDN_HOSTNAME}${path}`, {
        method: "POST",
        headers: { AccessKey: BUNNY_ACCOUNT_KEY },
      }).catch(() => {});
    }
  } else {
    const dir = path.includes("/originals/") ? ORIGINALS_DIR : PROCESSED_DIR;
    const filename = path.split("/").pop()!;
    await writeFile(join(dir, filename), buf);
  }
}

// Map aspect-ratio label → Flux 1.1 Pro `image_size` enum
const ASPECT_MAP: Record<string, string> = {
  "16:9": "landscape_16_9",
  "4:3": "landscape_4_3",
  "1:1": "square_hd",
  "3:4": "portrait_4_3",
  "9:16": "portrait_16_9",
};

// POST /api/blog-images/generate
// body: { prompt: string, aspectRatio?: "16:9"|"1:1"|..., blogId?: string, attachToBlog?: boolean }
// → Flux 1.1 Pro → Bunny → create BlogImage row → optionally append to Blog.covers/imageIds
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "upload.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!FAL_KEY) return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body?.prompt || typeof body.prompt !== "string") {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }
  const aspectRatio = body.aspectRatio ?? "16:9";
  const imageSize = ASPECT_MAP[aspectRatio] ?? "landscape_16_9";
  const blogId: string | undefined = body.blogId;
  const attachToBlog = body.attachToBlog !== false; // default true when blogId given

  // ── 1) Generate via Flux 1.1 Pro ──────────────────────────────────────────
  const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
    input: {
      prompt: body.prompt,
      image_size: imageSize as "landscape_16_9" | "landscape_4_3" | "square_hd" | "portrait_4_3" | "portrait_16_9",
      num_images: 1,
      enable_safety_checker: true,
    },
    logs: false,
  });

  const imageUrl = (result.data as { images?: Array<{ url: string }> })?.images?.[0]?.url;
  if (!imageUrl) return NextResponse.json({ error: "Flux returned no image", raw: result.data }, { status: 502 });

  // ── 2) Download generated image ───────────────────────────────────────────
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return NextResponse.json({ error: `Download failed: ${imgRes.status}` }, { status: 502 });
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const meta = await sharp(buf).metadata();

  // ── 3) Create BlogImage row ───────────────────────────────────────────────
  const blogImage = await prisma.blogImage.create({
    data: { originalUrl: "", coverUrl: "", ogUrl: "", width: meta.width ?? 0, height: meta.height ?? 0 },
  });

  // ── 4) Save original to Bunny ────────────────────────────────────────────
  const originalFilename = `${blogImage.id}.jpg`;
  await saveFile(`/uploads/originals/${originalFilename}`, buf);
  const originalUrl = `/uploads/originals/${originalFilename}`;

  // ── 5) Auto-generate Cover (1200w WebP) + OG (1200x630 JPG) so it's usable without PhotoEditor ─
  const rW = meta.width ?? 1200;
  const rH = meta.height ?? 675;
  const aspect = rW / rH;

  const coverFilename = `${blogImage.id}-cover.webp`;
  const coverBuf = await sharp(buf)
    .resize(1200, Math.round(1200 / aspect / 2) * 2, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();
  await saveFile(`/uploads/processed/${coverFilename}`, coverBuf);

  const ogFilename = `${blogImage.id}-og.jpg`;
  const ogBuf = await sharp(buf)
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
  await saveFile(`/uploads/processed/${ogFilename}`, ogBuf);

  const coverUrl = `/uploads/processed/${coverFilename}`;
  const ogUrl = `/uploads/processed/${ogFilename}`;

  const updated = await prisma.blogImage.update({
    where: { id: blogImage.id },
    data: { originalUrl, coverUrl, ogUrl, editJson: JSON.stringify({ generated: "flux-pro-v1.1", prompt: body.prompt, aspectRatio }) },
  });

  // ── 6) Attach to Blog.covers / imageIds if blogId provided ────────────────
  if (blogId && attachToBlog) {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (blog) {
      await prisma.blog.update({
        where: { id: blogId },
        data: {
          covers: [...blog.covers, coverUrl],
          imageIds: [...blog.imageIds, blogImage.id],
        },
      });
    }
  }

  return NextResponse.json({
    id: updated.id,
    originalUrl,
    coverUrl,
    ogUrl,
    width: updated.width,
    height: updated.height,
    attachedToBlog: Boolean(blogId && attachToBlog),
  });
}
