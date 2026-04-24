import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { encrypt, decrypt } from "@/lib/ark-ai/encryption";
import Anthropic from "@anthropic-ai/sdk";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response!;

  let config = await prisma.aiConfig.findUnique({ where: { id: "default" } });
  if (!config) {
    config = await prisma.aiConfig.create({ data: { id: "default" } });
  }

  return NextResponse.json({
    provider: config.provider,
    hasApiKey: !!config.apiKeyEncrypted,
    apiKeyPreview: config.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted).slice(0, 12) + "..." : "",
    model: config.model,
    maxTokens: config.maxTokens,
    rateLimit: config.rateLimit,
    temperature: config.temperature,
    systemPromptExtra: config.systemPromptExtra,
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response!;

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.provider !== undefined) data.provider = body.provider;
  if (body.apiKey !== undefined && body.apiKey !== "") data.apiKeyEncrypted = encrypt(body.apiKey);
  if (body.model !== undefined) data.model = body.model;
  if (body.maxTokens !== undefined) data.maxTokens = Number(body.maxTokens);
  if (body.rateLimit !== undefined) data.rateLimit = Number(body.rateLimit);
  if (body.temperature !== undefined) data.temperature = Number(body.temperature);
  if (body.systemPromptExtra !== undefined) data.systemPromptExtra = body.systemPromptExtra;

  const config = await prisma.aiConfig.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, model: config.model });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response!;

  const config = await prisma.aiConfig.findUnique({ where: { id: "default" } });
  const apiKey = config?.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted) : "";
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "No API key configured" }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: config?.model || "claude-haiku-4-5-20251001",
      max_tokens: 32,
      messages: [{ role: "user", content: "Say OK" }],
    });
    const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
    return NextResponse.json({ ok: true, response: text, model: resp.model });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
