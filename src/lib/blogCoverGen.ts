// Shared blog cover generation:
//   prompt + model → fal.ai image → Bunny upload → BlogImage row
//   → (optional) attach to Blog.covers/imageIds
//
// Lifted out of /api/blog-images/generate/route.ts so the cron publisher can
// reuse the exact same watermarking + OG pipeline without an HTTP hop.

import { writeFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { fal } from "@fal-ai/client";
import { prisma } from "@/lib/prisma";
import {
  MODELS, getModel, generateImage, generateOgImage, type AspectRatio,
} from "@/app/api/blog-images/generate/models";

export { MODELS, type AspectRatio };

const BUNNY_STORAGE_KEY  = process.env.BUNNY_STORAGE_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "siamdive-com";
const BUNNY_ACCOUNT_KEY  = process.env.BUNNY_ACCOUNT_KEY;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "siamdive-cdn.b-cdn.net";
const ORIGINALS_DIR = join(process.cwd(), "public", "uploads", "originals");
const PROCESSED_DIR = join(process.cwd(), "public", "uploads", "processed");

const FAL_KEY = process.env.FAL_KEY;
if (FAL_KEY) fal.config({ credentials: FAL_KEY });

export const VALID_ASPECTS = new Set<AspectRatio>([
  "21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16", "9:21",
]);

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

async function applyWatermark(baseBuf: Buffer): Promise<Buffer> {
  const branding = await prisma.siteBranding.findUnique({ where: { id: "default" } });
  if (!branding?.watermarkEnabled || !branding.defaultWatermarkId) return baseBuf;
  const wm = await prisma.watermark.findUnique({ where: { id: branding.defaultWatermarkId } });
  if (!wm?.url) return baseBuf;

  const wmRes = await fetch(`https://${BUNNY_CDN_HOSTNAME}${wm.url}`);
  if (!wmRes.ok) return baseBuf;
  const wmBuf = Buffer.from(await wmRes.arrayBuffer());

  const baseMeta = await sharp(baseBuf).metadata();
  const baseW = baseMeta.width ?? 1200;
  const scalePct = Math.max(1, Math.min(100, branding.watermarkScale || 15));
  const targetWmW = Math.max(16, Math.round((baseW * scalePct) / 100));

  const opacity = Math.max(0, Math.min(100, branding.watermarkOpacity ?? 60)) / 100;
  const wmResized = await sharp(wmBuf)
    .resize({ width: targetWmW, withoutEnlargement: false })
    .ensureAlpha()
    .composite([{
      input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
      raw: { width: 1, height: 1, channels: 4 },
      tile: true,
      blend: "dest-in",
    }])
    .toBuffer();

  const gravityMap: Record<string, string> = {
    "top-left": "northwest", "top-right": "northeast",
    "bottom-left": "southwest", "bottom-right": "southeast",
    "center": "center",
  };
  const gravity = gravityMap[branding.watermarkPosition] ?? "southeast";

  return await sharp(baseBuf)
    .composite([{ input: wmResized, gravity: gravity as "northwest" | "northeast" | "southwest" | "southeast" | "center" }])
    .toBuffer();
}

// Midjourney-specific flags degrade non-MJ prompts when left in as literal text.
export function stripMjFlags(prompt: string): string {
  return prompt
    .replace(/--no\s+[^-]+?(?=--|$)/gi, "")
    .replace(/--\w+(\s+[\w:.-]+)?/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*,\s*,+/g, ",")
    .trim()
    .replace(/[,\s]+$/, "");
}

export type GenerateBlogCoverOptions = {
  prompt: string;
  modelId?: string;
  aspectRatio?: AspectRatio;
  blogId?: string;
  attachToBlog?: boolean;
};

export type GenerateBlogCoverResult = {
  id: string;
  originalUrl: string;
  coverUrl: string;
  ogUrl: string;
  width: number;
  height: number;
  attachedToBlog: boolean;
  model: string;
};

export async function generateBlogCover(opts: GenerateBlogCoverOptions): Promise<GenerateBlogCoverResult> {
  if (!FAL_KEY) throw new Error("FAL_KEY not configured");
  if (!opts.prompt) throw new Error("prompt required");

  const aspectRatio: AspectRatio = opts.aspectRatio && VALID_ASPECTS.has(opts.aspectRatio) ? opts.aspectRatio : "16:9";
  const model = getModel(opts.modelId);
  const cleanPrompt = stripMjFlags(opts.prompt);
  const attachToBlog = opts.attachToBlog !== false;

  // 1) Generate via selected model
  const imageUrl = await generateImage(model, cleanPrompt, aspectRatio);

  // 2) Download
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Download failed: ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const meta = await sharp(buf).metadata();

  // 3) BlogImage row (shell)
  const blogImage = await prisma.blogImage.create({
    data: { originalUrl: "", coverUrl: "", ogUrl: "", width: meta.width ?? 0, height: meta.height ?? 0 },
  });

  // 4) Save original
  const originalFilename = `${blogImage.id}.jpg`;
  await saveFile(`/uploads/originals/${originalFilename}`, buf);
  const originalUrl = `/uploads/originals/${originalFilename}`;

  // 5) Cover (1200w WebP) with watermark
  const rW = meta.width ?? 1200;
  const rH = meta.height ?? 675;
  const aspect = rW / rH;
  const coverFilename = `${blogImage.id}-cover.webp`;
  const coverRawBuf = await sharp(buf)
    .resize(1200, Math.round(1200 / aspect / 2) * 2, { fit: "cover", position: "centre" })
    .toBuffer();
  const coverWithWm = await applyWatermark(coverRawBuf);
  const coverBuf = await sharp(coverWithWm).webp({ quality: 85 }).toBuffer();
  await saveFile(`/uploads/processed/${coverFilename}`, coverBuf);

  // 6) OG (1200×630 JPG). Prefer a second-pass 1920×1008 generation when the
  // model supports it, so the crop-down has zero height loss.
  let ogSourceBuf = buf;
  try {
    const ogUrlFal = await generateOgImage(model, cleanPrompt);
    if (ogUrlFal) {
      const ogRes = await fetch(ogUrlFal);
      if (ogRes.ok) ogSourceBuf = Buffer.from(await ogRes.arrayBuffer());
    }
  } catch {}
  const ogFilename = `${blogImage.id}-og.jpg`;
  const ogRawBuf = await sharp(ogSourceBuf)
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .toBuffer();
  const ogWithWm = await applyWatermark(ogRawBuf);
  const ogBuf = await sharp(ogWithWm).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  await saveFile(`/uploads/processed/${ogFilename}`, ogBuf);

  const coverUrl = `/uploads/processed/${coverFilename}`;
  const ogUrl = `/uploads/processed/${ogFilename}`;

  const updated = await prisma.blogImage.update({
    where: { id: blogImage.id },
    data: { originalUrl, coverUrl, ogUrl },
  });

  if (opts.blogId && attachToBlog) {
    const blog = await prisma.blog.findUnique({ where: { id: opts.blogId } });
    if (blog) {
      await prisma.blog.update({
        where: { id: opts.blogId },
        data: {
          covers: [...blog.covers, coverUrl],
          imageIds: [...blog.imageIds, blogImage.id],
        },
      });
    }
  }

  return {
    id: updated.id,
    originalUrl,
    coverUrl,
    ogUrl,
    width: updated.width,
    height: updated.height,
    attachedToBlog: Boolean(opts.blogId && attachToBlog),
    model: model.id,
  };
}
