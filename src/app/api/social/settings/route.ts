import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/ark-ai/encryption";

const ALLOWED_PROVIDERS = ["anthropic", "openai", "openrouter"] as const;
type Provider = (typeof ALLOWED_PROVIDERS)[number];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const cfg = await prisma.socialAiConfig.findUnique({ where: { id: "default" } });
  // never return raw key — only whether one is set + a short prefix
  const decrypted = cfg?.apiKeyEncrypted ? decrypt(cfg.apiKeyEncrypted) : "";
  return NextResponse.json({
    provider: cfg?.provider ?? "anthropic",
    model: cfg?.model ?? "claude-haiku-4-5-20251001",
    maxTokens: cfg?.maxTokens ?? 800,
    temperature: cfg?.temperature ?? 0.7,
    enabled: cfg?.enabled ?? true,
    hasKey: decrypted.length > 0,
    keyPrefix: decrypted ? `${decrypted.slice(0, 7)}…${decrypted.slice(-4)}` : "",
    updatedAt: cfg?.updatedAt ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({})) as {
    provider?: string;
    apiKey?: string; // plain — encrypted before saving
    model?: string;
    maxTokens?: number;
    temperature?: number;
    enabled?: boolean;
  };

  const data: Record<string, unknown> = {};
  if (body.provider && (ALLOWED_PROVIDERS as readonly string[]).includes(body.provider)) {
    data.provider = body.provider as Provider;
  }
  if (typeof body.apiKey === "string") {
    // empty string clears the key
    data.apiKeyEncrypted = body.apiKey.length > 0 ? encrypt(body.apiKey) : "";
  }
  if (body.model !== undefined) data.model = body.model;
  if (body.maxTokens !== undefined) data.maxTokens = Math.max(100, Math.min(4096, body.maxTokens));
  if (body.temperature !== undefined) data.temperature = Math.max(0, Math.min(2, body.temperature));
  if (body.enabled !== undefined) data.enabled = body.enabled;

  await prisma.socialAiConfig.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
