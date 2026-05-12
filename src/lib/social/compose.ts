// Server-side image composition using sharp.
// Renders a SocialImageTemplate-style layout onto a base image and uploads
// the result to Bunny CDN (or local filesystem in dev).
//
// Layout JSON shape:
//   {
//     backgroundFit: "cover" | "contain",
//     texts: [{ content, x, y, width, height, fontSize, fill, fontFamily, fontWeight, align, shadow }],
//     watermark: { enabled, position, opacity, scale }
//   }
//
// Coordinates are in absolute output-pixel space (top-left origin).

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const BUNNY_STORAGE_KEY  = process.env.BUNNY_STORAGE_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "siamdive-com";
const BUNNY_ACCOUNT_KEY  = process.env.BUNNY_ACCOUNT_KEY;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "siamdive-cdn.b-cdn.net";
const PROCESSED_DIR = join(process.cwd(), "public", "uploads", "processed");

export type TextBlock = {
  content: string;
  x: number; y: number;
  width: number; height?: number;
  fontSize: number;
  fontWeight?: number | "normal" | "bold";
  fontFamily?: string;
  fill?: string;
  align?: "left" | "center" | "right";
  shadow?: boolean;
  lineHeight?: number;
};

export type WatermarkSpec = {
  enabled?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  opacity?: number; // 0-100
  scale?: number; // % of base width
};

export type GradientSpec = {
  enabled?: boolean;
  color?: string; // hex e.g. "#000000"
  opacity?: number; // 0-100, opacity at the bottom edge
  height?: number; // % of canvas height covered (band starts at bottom)
};

export type ComposeLayout = {
  backgroundFit?: "cover" | "contain";
  texts?: TextBlock[];
  watermark?: WatermarkSpec;
  gradient?: GradientSpec;
};

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
        method: "POST", headers: { AccessKey: BUNNY_ACCOUNT_KEY },
      }).catch(() => {});
    }
  } else {
    const filename = path.split("/").pop()!;
    await writeFile(join(PROCESSED_DIR, filename), buf);
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Wrap text into lines by approximate character width — sharp's SVG text doesn't
// support automatic wrapping, so we precompute lines.
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function renderGradientSvg(width: number, height: number, g: GradientSpec): string {
  const color = (g.color ?? "#000000").replace(/[^#0-9a-fA-F]/g, "") || "#000000";
  const opacity = Math.max(0, Math.min(100, g.opacity ?? 80)) / 100;
  const heightPct = Math.max(1, Math.min(100, g.height ?? 50));
  const bandH = Math.round((height * heightPct) / 100);
  const y0 = height - bandH;
  // y1=100%/y2=0% within the rect → opaque at bottom, transparent at top.
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="100%" x2="0" y2="0%">
        <stop offset="0%" stop-color="${color}" stop-opacity="${opacity}"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${y0}" width="${width}" height="${bandH}" fill="url(#g)"/>
  </svg>`;
}

function renderTextSvg(width: number, height: number, blocks: TextBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (!b.content) continue;
    const fontSize = Math.max(8, b.fontSize);
    // ~0.55 width-to-font ratio for Latin; for Thai ~0.65. Use 0.6 as middle.
    const approxCharWidth = fontSize * 0.6;
    const maxChars = Math.max(8, Math.floor(b.width / approxCharWidth));
    const lines = wrapText(b.content, maxChars);
    const lineHeight = (b.lineHeight ?? 1.2) * fontSize;
    const anchorX = b.align === "center" ? b.x + b.width / 2 : b.align === "right" ? b.x + b.width : b.x;
    const textAnchor = b.align === "center" ? "middle" : b.align === "right" ? "end" : "start";
    const fill = b.fill ?? "#ffffff";
    const fontWeight = b.fontWeight ?? 700;
    const fontFamily = b.fontFamily ?? "Prompt, Inter, Arial, sans-serif";
    const shadow = b.shadow !== false
      ? `paint-order="stroke" stroke="rgba(0,0,0,0.55)" stroke-width="${Math.max(2, fontSize / 12)}" stroke-linejoin="round"`
      : "";

    lines.forEach((line, i) => {
      const y = b.y + fontSize + i * lineHeight;
      parts.push(
        `<text x="${anchorX}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${escapeXml(fontFamily)}" fill="${fill}" text-anchor="${textAnchor}" ${shadow}>${escapeXml(line)}</text>`
      );
    });
  }
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
}

async function fetchToBuffer(url: string): Promise<Buffer> {
  if (url.startsWith("/uploads/")) url = `https://${BUNNY_CDN_HOSTNAME}${url}`;
  if (url.startsWith("data:")) {
    const m = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) throw new Error("invalid data url");
    return Buffer.from(m[2], "base64");
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch image failed ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function applyWatermark(baseBuf: Buffer, spec: WatermarkSpec): Promise<Buffer> {
  if (!spec.enabled) return baseBuf;
  const branding = await prisma.siteBranding.findUnique({ where: { id: "default" } });
  if (!branding?.defaultWatermarkId) return baseBuf;
  const wm = await prisma.watermark.findUnique({ where: { id: branding.defaultWatermarkId } });
  if (!wm?.url) return baseBuf;

  const wmRes = await fetch(`https://${BUNNY_CDN_HOSTNAME}${wm.url}`);
  if (!wmRes.ok) return baseBuf;
  const wmBuf = Buffer.from(await wmRes.arrayBuffer());

  const baseMeta = await sharp(baseBuf).metadata();
  const baseW = baseMeta.width ?? 1200;
  const scalePct = Math.max(1, Math.min(100, spec.scale ?? branding.watermarkScale ?? 15));
  const targetWmW = Math.max(16, Math.round((baseW * scalePct) / 100));
  const opacity = Math.max(0, Math.min(100, spec.opacity ?? branding.watermarkOpacity ?? 60)) / 100;

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

  const gravityMap: Record<string, "northwest" | "northeast" | "southwest" | "southeast" | "center"> = {
    "top-left": "northwest", "top-right": "northeast",
    "bottom-left": "southwest", "bottom-right": "southeast",
    "center": "center",
  };
  const gravity = gravityMap[spec.position ?? branding.watermarkPosition ?? "bottom-right"] ?? "southeast";
  return sharp(baseBuf).composite([{ input: wmResized, gravity }]).toBuffer();
}

export type ComposeOptions = {
  backgroundUrl: string;
  width: number;
  height: number;
  layout: ComposeLayout;
};

export type ComposeResult = {
  url: string; // /uploads/processed/...
  cdnUrl: string; // https://...b-cdn.net/...
  width: number;
  height: number;
};

export async function composeSocialImage(opts: ComposeOptions): Promise<ComposeResult> {
  if (!opts.backgroundUrl) throw new Error("backgroundUrl required");
  if (opts.width < 200 || opts.height < 200) throw new Error("dimensions too small");
  if (opts.width > 4096 || opts.height > 4096) throw new Error("dimensions too large");

  const bgBuf = await fetchToBuffer(opts.backgroundUrl);
  const fit = opts.layout.backgroundFit === "contain" ? "contain" : "cover";
  const resized = await sharp(bgBuf)
    .resize(opts.width, opts.height, { fit, position: "centre", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .toBuffer();

  let composed = resized;

  // Bottom-up gradient — composite a translucent SVG band over the resized bg
  // before drawing text, so the gradient darkens the bg only.
  const grad = opts.layout.gradient;
  if (grad?.enabled && (grad.height ?? 0) > 0 && (grad.opacity ?? 0) > 0) {
    const gradSvg = renderGradientSvg(opts.width, opts.height, grad);
    composed = await sharp(composed)
      .composite([{ input: Buffer.from(gradSvg), top: 0, left: 0 }])
      .toBuffer();
  }

  // Apply text overlay via SVG composite
  const texts = opts.layout.texts ?? [];
  if (texts.length > 0) {
    const svg = renderTextSvg(opts.width, opts.height, texts);
    composed = await sharp(composed)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .toBuffer();
  }

  if (opts.layout.watermark?.enabled) {
    composed = await applyWatermark(composed, opts.layout.watermark);
  }

  // Always output JPEG for smaller file size (FB CDN re-encodes anyway)
  const final = await sharp(composed).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const id = randomBytes(8).toString("hex");
  const path = `/uploads/processed/social-${id}.jpg`;
  await saveFile(path, final);

  return {
    url: path,
    cdnUrl: `https://${BUNNY_CDN_HOSTNAME}${path}`,
    width: opts.width,
    height: opts.height,
  };
}
