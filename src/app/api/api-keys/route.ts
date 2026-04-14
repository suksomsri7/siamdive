import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { requireAuth, canDo } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "api-keys.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, keyPrefix: true, permissions: true,
      active: true, lastUsedAt: true, expiresAt: true, createdAt: true,
    },
  });
  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "api-keys.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, permissions, expiresAt } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  // Generate: sk_ + 32 random hex chars
  const raw  = crypto.randomBytes(24).toString("hex");
  const key  = `sk_${raw}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = key.slice(0, 12); // "sk_" + 9 chars

  const record = await prisma.apiKey.create({
    data: {
      name: name.trim(),
      keyHash: hash,
      keyPrefix: prefix,
      permissions: Array.isArray(permissions) ? permissions : [],
      active: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    select: {
      id: true, name: true, keyPrefix: true, permissions: true,
      active: true, lastUsedAt: true, expiresAt: true, createdAt: true,
    },
  });

  // Return full key ONCE — not stored in DB
  return NextResponse.json({ ...record, key }, { status: 201 });
}
