import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const BUNNY_STORAGE_KEY = process.env.BUNNY_STORAGE_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "siamdive-com";
const BUNNY_ACCOUNT_KEY = process.env.BUNNY_ACCOUNT_KEY;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "siamdive-cdn.b-cdn.net";

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
    const filename = path.split("/").pop()!;
    await writeFile(join(UPLOADS_DIR, filename), buf);
  }
}

async function deleteFile(url: string) {
  if (!url) return;
  const cleanUrl = url.split("?")[0];
  if (BUNNY_STORAGE_KEY) {
    await fetch(`https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}${cleanUrl}`, {
      method: "DELETE",
      headers: { AccessKey: BUNNY_STORAGE_KEY },
    }).catch(() => {});
  } else {
    const filename = cleanUrl.split("/").pop();
    if (!filename) return;
    try { await unlink(join(UPLOADS_DIR, filename)); } catch {}
  }
}

// GET /api/watermarks — list all watermarks
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const watermarks = await prisma.watermark.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(watermarks);
}

// POST /api/watermarks — upload + create new watermark
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "upload.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const name = (form.get("name") as string | null) ?? "";

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const filename = `wm-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const path = `/uploads/${filename}`;
  await saveFile(path, buf);

  const count = await prisma.watermark.count();
  const watermark = await prisma.watermark.create({
    data: {
      name: name || `Watermark ${count + 1}`,
      url: path,
      order: count,
    },
  });

  return NextResponse.json(watermark, { status: 201 });
}

// PUT /api/watermarks?id=xxx — update name
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();
  const updated = await prisma.watermark.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });
  return NextResponse.json(updated);
}

// DELETE /api/watermarks?id=xxx
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const wm = await prisma.watermark.findUnique({ where: { id } });
  if (!wm) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete file (best-effort)
  await deleteFile(wm.url);

  // Clear default if this was the default
  await prisma.siteBranding.updateMany({
    where: { defaultWatermarkId: id },
    data: { defaultWatermarkId: "" },
  });

  await prisma.watermark.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
