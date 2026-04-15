import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { fal } from "@fal-ai/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";
import { MODELS, getModel, generateImage, generateOgImage, type AspectRatio } from "./models";

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

const VALID_ASPECTS = new Set<AspectRatio>(["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16", "9:21"]);

// Composite the default site watermark onto an image buffer, matching
// SiteBranding settings (position, scale %, opacity %). Returns the original
// buffer when watermarking is disabled or misconfigured.
async function applyWatermark(baseBuf: Buffer): Promise<Buffer> {
  const branding = await prisma.siteBranding.findUnique({ where: { id: "default" } });
  if (!branding?.watermarkEnabled || !branding.defaultWatermarkId) return baseBuf;
  const wm = await prisma.watermark.findUnique({ where: { id: branding.defaultWatermarkId } });
  if (!wm?.url) return baseBuf;

  // Fetch watermark PNG from Bunny CDN
  const wmRes = await fetch(`https://${BUNNY_CDN_HOSTNAME}${wm.url}`);
  if (!wmRes.ok) return baseBuf;
  const wmBuf = Buffer.from(await wmRes.arrayBuffer());

  const baseMeta = await sharp(baseBuf).metadata();
  const baseW = baseMeta.width ?? 1200;
  const scalePct = Math.max(1, Math.min(100, branding.watermarkScale || 15));
  const targetWmW = Math.max(16, Math.round((baseW * scalePct) / 100));

  // Resize watermark + apply opacity via dest-in alpha multiply
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

// Strip Midjourney-specific flags — they pollute non-MJ prompts as literal text
// Examples removed: --style raw, --s 50, --v 7, --ar 16:9, --no illustration, painting, ...
function stripMjFlags(prompt: string): string {
  return prompt
    .replace(/--no\s+[^-]+?(?=--|$)/gi, "") // --no <list>
    .replace(/--\w+(\s+[\w:.-]+)?/g, "")    // --style raw, --s 50, --v 7, --ar 16:9
    .replace(/\s{2,}/g, " ")
    .replace(/\s*,\s*,+/g, ",")
    .trim()
    .replace(/[,\s]+$/, "");
}

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
  const aspectRatio: AspectRatio = VALID_ASPECTS.has(body.aspectRatio) ? body.aspectRatio : "16:9";
  const blogId: string | undefined = body.blogId;
  const attachToBlog = body.attachToBlog !== false; // default true when blogId given
  const model = getModel(body.model);

  // Clean prompt (strip Midjourney params — they degrade all non-MJ models)
  const cleanPrompt = stripMjFlags(body.prompt);

  // ── 1) Generate via selected model ────────────────────────────────────────
  let imageUrl: string;
  try {
    imageUrl = await generateImage(model, cleanPrompt, aspectRatio);
  } catch (e) {
    return NextResponse.json({
      error: `Generate failed on model "${model.id}": ${e instanceof Error ? e.message : String(e)}`,
    }, { status: 502 });
  }

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
  const coverRawBuf = await sharp(buf)
    .resize(1200, Math.round(1200 / aspect / 2) * 2, { fit: "cover", position: "centre" })
    .toBuffer();
  const coverWithWm = await applyWatermark(coverRawBuf);
  const coverBuf = await sharp(coverWithWm).webp({ quality: 85 }).toBuffer();
  await saveFile(`/uploads/processed/${coverFilename}`, coverBuf);

  // OG: when the model supports exact dims, make a SECOND generation at
  // 1920×1008 (1.905:1 ≈ 1.91:1) → resize down to 1200×630 with zero crop
  // loss. Otherwise fall back to cropping the 16:9 cover source.
  let ogSourceBuf = buf;
  try {
    const ogUrlFal = await generateOgImage(model, cleanPrompt);
    if (ogUrlFal) {
      const ogRes = await fetch(ogUrlFal);
      if (ogRes.ok) ogSourceBuf = Buffer.from(await ogRes.arrayBuffer());
    }
  } catch {
    // Non-fatal — fall back to cropping the cover source
  }
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
    model: model.id,
  });
}

// GET /api/blog-images/generate — list available models for UI
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({
    models: MODELS.map((m) => ({ id: m.id, label: m.label, blurb: m.blurb, price: m.price })),
  });
}
