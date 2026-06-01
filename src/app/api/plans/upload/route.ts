import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const BUNNY_KEY = process.env.BUNNY_STORAGE_KEY || process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "siamdive-com";
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "siamdive-cdn.b-cdn.net";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const deviceId = form.get("deviceId") as string | null;

    if (!file || !deviceId) {
      return NextResponse.json({ error: "file and deviceId required" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }

    // Allowlist images + video only. The extension is derived from the
    // (server-trusted) MIME type — never from the client filename — so a
    // crafted name like "a.jpg/../evil" can't inject path segments into the
    // storage key, and non-media (HTML/SVG/scripts) can't land on the CDN.
    const MIME_EXT: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/heic": "heic",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm",
    };
    const ext = MIME_EXT[file.type];
    if (!ext) {
      return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const name = `plan-media/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

    if (!BUNNY_KEY) {
      return NextResponse.json({ error: "storage not configured" }, { status: 500 });
    }

    const res = await fetch(
      `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${name}`,
      {
        method: "PUT",
        headers: { AccessKey: BUNNY_KEY, "Content-Type": "application/octet-stream" },
        body: new Uint8Array(bytes),
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
