import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

type AuthOk =
  | { ok: true; source: "session" }
  | { ok: true; source: "apiKey"; permissions: string[] };
type AuthFail = { ok: false; response: NextResponse };
export type AuthResult = AuthOk | AuthFail;

export const BOAT_TYPE_PERM: Record<string, string> = {
  DAYTRIP: "daytrip",
  SNORKELING: "snorkeling",
  LAND_TOUR: "land-tour",
  LIVEABOARD: "liveaboard",
  DIVE_RESORT: "dive-resort",
  DIVE_CENTER: "dive-center",
  FREEDIVE: "freedive",
  SCUBA_COURSES: "scuba-courses",
  FREEDIVE_COURSES: "freedive-courses",
  SCUBA_INSTRUCTOR: "scuba-instructor",
  FREEDIVE_INSTRUCTOR: "freedive-instructor",
};

export function hasPermission(perms: string[], required: string): boolean {
  return perms.some((p) => {
    if (p === "*") return true;
    if (p === required) return true;
    if (p.endsWith(".*")) return required.startsWith(p.slice(0, -1));
    return false;
  });
}

/** Returns true when the auth result allows a given permission */
export function canDo(auth: AuthOk, permission: string): boolean {
  if (auth.source === "session") return true;
  return hasPermission(auth.permissions, permission);
}

export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  // 1. API Key (X-API-Key header or Authorization: Bearer sk_...)
  const raw =
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (raw?.startsWith("sk_")) {
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    const record = await prisma.apiKey.findFirst({ where: { keyHash: hash } });

    if (!record || !record.active) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
      };
    }
    if (record.expiresAt && record.expiresAt < new Date()) {
      return {
        ok: false,
        response: NextResponse.json({ error: "API key expired" }, { status: 401 }),
      };
    }

    // Fire-and-forget: update lastUsedAt
    prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return { ok: true, source: "apiKey", permissions: record.permissions };
  }

  // 2. NextAuth session cookie (backoffice browser requests)
  const session = await getServerSession(authOptions);
  if (session) return { ok: true, source: "session" };

  return {
    ok: false,
    response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
  };
}
