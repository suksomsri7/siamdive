import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

const BUNNY_STORAGE_KEY = process.env.BUNNY_STORAGE_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "siamdive-com";
const ORIGINALS_DIR = join(process.cwd(), "public", "uploads", "originals");
const PROCESSED_DIR = join(process.cwd(), "public", "uploads", "processed");

async function saveFile(path: string, buf: Buffer) {
  if (BUNNY_STORAGE_KEY) {
    const res = await fetch(`https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}${path}`, {
      method: "PUT",
      headers: { AccessKey: BUNNY_STORAGE_KEY, "Content-Type": "application/octet-stream" },
      body: buf,
    });
    if (!res.ok) throw new Error(`Bunny upload failed: ${res.status}`);
  } else {
    const dir = path.includes("/originals/") ? ORIGINALS_DIR : PROCESSED_DIR;
    const filename = path.split("/").pop()!;
    await writeFile(join(dir, filename), buf);
  }
}

async function deleteFile(url: string) {
  if (!url) return;
  const cleanUrl = url.split("?")[0]; // strip ?v= cache-buster
  if (BUNNY_STORAGE_KEY) {
    await fetch(`https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}${cleanUrl}`, {
      method: "DELETE",
      headers: { AccessKey: BUNNY_STORAGE_KEY },
    }).catch(() => {});
  } else {
    const filename = cleanUrl.split("/").pop();
    if (!filename) return;
    const dir = cleanUrl.includes("/originals/") ? "originals" : "processed";
    try { await unlink(join(process.cwd(), "public", "uploads", dir, filename)); } catch {}
  }
}

// POST /api/blog-images
//
// Two modes:
// 1) UPLOAD ORIGINAL — multipart with field `original`
//    → saves the raw file, returns { id, originalUrl, width, height }
// 2) SAVE EDIT — multipart with fields `id`, `rendered`, `editJson`
//    → resizes the rendered PNG into Cover (1200x800 WebP) + OG (1200x630 JPG)
//    → updates the BlogImage row with the new urls + editJson
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "upload.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const original = form.get("original") as File | null;
  const rendered = form.get("rendered") as File | null;
  const id = form.get("id") as string | null;
  const editJson = (form.get("editJson") as string | null) ?? "{}";

  // ── Mode 1: upload original ────────────────────────────────────────────────
  if (original && !rendered) {
    const buf = Buffer.from(await original.arrayBuffer());
    const meta = await sharp(buf).metadata();

    const newId = (await prisma.blogImage.create({
      data: { originalUrl: "", coverUrl: "", ogUrl: "", width: meta.width ?? 0, height: meta.height ?? 0 },
    })).id;

    const ext = (original.name.split(".").pop() ?? "jpg").toLowerCase();
    const filename = `${newId}.${ext}`;
    await saveFile(`/uploads/originals/${filename}`, buf);

    const originalUrl = `/uploads/originals/${filename}`;
    const updated = await prisma.blogImage.update({
      where: { id: newId },
      data: { originalUrl },
    });

    return NextResponse.json(updated);
  }

  // ── Mode 2: save edit (rendered cover image from canvas) ──────────────────
  if (rendered && id) {
    const blogImage = await prisma.blogImage.findUnique({ where: { id } });
    if (!blogImage) return NextResponse.json({ error: "BlogImage not found" }, { status: 404 });

    const renderedBuf = Buffer.from(await rendered.arrayBuffer());

    // Read rendered canvas dimensions — editor exports at exact aspect user chose
    const renderedMeta = await sharp(renderedBuf).metadata();
    const rW = renderedMeta.width ?? 1200;
    const rH = renderedMeta.height ?? 675;
    const renderedAspect = rW / rH;

    // Cover: save at exact rendered dimensions (no crop loss).
    // Editor canvas matches the aspect ratio of the field where it was opened.
    const coverFilename = `${id}-cover.webp`;
    const coverBuf = await sharp(renderedBuf)
      .resize(1200, Math.round(1200 / renderedAspect / 2) * 2, { fit: "cover", position: "centre" })
      .webp({ quality: 85 })
      .toBuffer();
    await saveFile(`/uploads/processed/${coverFilename}`, coverBuf);

    // OG: 1200x630 JPG q90 (Facebook/Twitter standard).
    // If editor was already at 1200×630, this is a no-op resize.
    // If at 16:9, ~6% center-crop top/bottom (acceptable for social previews).
    const ogFilename = `${id}-og.jpg`;
    const ogBuf = await sharp(renderedBuf)
      .resize(1200, 630, { fit: "cover", position: "centre" })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
    await saveFile(`/uploads/processed/${ogFilename}`, ogBuf);

    const cacheBust = `?v=${Date.now()}`;
    const coverUrl = `/uploads/processed/${coverFilename}${cacheBust}`;
    const ogUrl = `/uploads/processed/${ogFilename}${cacheBust}`;

    const updated = await prisma.blogImage.update({
      where: { id },
      data: { coverUrl, ogUrl, editJson },
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Provide either `original` (mode 1) or `id`+`rendered` (mode 2)" }, { status: 400 });
}

// GET /api/blog-images?id=xxx OR ?coverUrl=xxx — fetch by id or by coverUrl (for re-edit)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  const coverUrl = req.nextUrl.searchParams.get("coverUrl");

  if (id) {
    const img = await prisma.blogImage.findUnique({ where: { id } });
    if (!img) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(img);
  }

  if (coverUrl) {
    // Find by coverUrl — strip ?v= cache-buster, match by startsWith on the base path
    const basePath = coverUrl.split("?")[0];
    const img = await prisma.blogImage.findFirst({
      where: { coverUrl: { startsWith: basePath } },
      orderBy: { createdAt: "desc" },
    });
    if (!img) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(img);
  }

  return NextResponse.json({ error: "id or coverUrl required" }, { status: 400 });
}

// DELETE /api/blog-images?id=xxx OR ?coverUrl=xxx — delete BlogImage row + all 3 files
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  const coverUrl = req.nextUrl.searchParams.get("coverUrl");

  let img;
  if (id) {
    img = await prisma.blogImage.findUnique({ where: { id } });
  } else if (coverUrl) {
    const basePath = coverUrl.split("?")[0];
    img = await prisma.blogImage.findFirst({ where: { coverUrl: { startsWith: basePath } }, orderBy: { createdAt: "desc" } });
  } else {
    return NextResponse.json({ error: "id or coverUrl required" }, { status: 400 });
  }
  if (!img) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete files (best-effort)
  await Promise.all([deleteFile(img.originalUrl), deleteFile(img.coverUrl), deleteFile(img.ogUrl)]);

  await prisma.blogImage.delete({ where: { id: img.id } });
  return NextResponse.json({ ok: true });
}
