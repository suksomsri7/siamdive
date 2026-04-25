import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const BUNNY_STORAGE_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "siamdive-com";
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "siamdive-cdn.b-cdn.net";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const deviceId = form.get("deviceId") as string | null;

    if (!file || !deviceId) {
      return NextResponse.json({ error: "file and deviceId required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const name = `plan-media/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

    if (!BUNNY_STORAGE_KEY) {
      return NextResponse.json({ error: "storage not configured" }, { status: 500 });
    }

    const res = await fetch(
      `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${name}`,
      {
        method: "PUT",
        headers: { AccessKey: BUNNY_STORAGE_KEY, "Content-Type": "application/octet-stream" },
        body: buffer,
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "upload_failed" }, { status: 500 });
    }

    const url = `https://${BUNNY_CDN_HOSTNAME}/${name}`;
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
