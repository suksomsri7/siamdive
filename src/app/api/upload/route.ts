import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { requireAuth, canDo } from "@/lib/apiAuth";

const BUNNY_STORAGE_KEY = process.env.BUNNY_STORAGE_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "siamdive-com";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "upload.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop() ?? "bin";
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  if (BUNNY_STORAGE_KEY) {
    // Upload to Bunny Storage (production)
    const res = await fetch(
      `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/uploads/${name}`,
      {
        method: "PUT",
        headers: { AccessKey: BUNNY_STORAGE_KEY, "Content-Type": "application/octet-stream" },
        body: buffer,
      }
    );
    if (!res.ok) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  } else {
    // Write to local filesystem (development)
    const uploadDir = join(process.cwd(), "public", "uploads");
    await writeFile(join(uploadDir, name), buffer);
  }

  return NextResponse.json({ url: `/uploads/${name}` });
}
