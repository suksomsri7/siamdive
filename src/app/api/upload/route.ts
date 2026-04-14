import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { requireAuth, canDo } from "@/lib/apiAuth";

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
  const uploadDir = join(process.cwd(), "public", "uploads");
  await writeFile(join(uploadDir, name), buffer);

  return NextResponse.json({ url: `/uploads/${name}` });
}
