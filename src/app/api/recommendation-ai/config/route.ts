import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { encrypt, decrypt } from "@/lib/ark-ai/encryption";
import OpenAI from "openai";

const TABLE = "default";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response!;

  let config = await prisma.recommendationAiConfig.findUnique({ where: { id: TABLE } });
  if (!config) {
    config = await prisma.recommendationAiConfig.create({ data: { id: TABLE } });
  }

  return NextResponse.json({
    provider: config.provider,
    hasApiKey: !!config.apiKeyEncrypted,
    apiKeyPreview: config.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted).slice(0, 12) + "..." : "",
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    minActivity: config.minActivity,
    cacheTTLDays: config.cacheTTLDays,
    cooldownMinutes: config.cooldownMinutes,
    abTestEnabled: config.abTestEnabled,
    enabled: config.enabled,
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
  if (body.temperature !== undefined) data.temperature = Number(body.temperature);
  if (body.minActivity !== undefined) data.minActivity = Number(body.minActivity);
  if (body.cacheTTLDays !== undefined) data.cacheTTLDays = Number(body.cacheTTLDays);
  if (body.cooldownMinutes !== undefined) data.cooldownMinutes = Number(body.cooldownMinutes);
  if (body.abTestEnabled !== undefined) data.abTestEnabled = Boolean(body.abTestEnabled);
  if (body.enabled !== undefined) data.enabled = Boolean(body.enabled);

  const config = await prisma.recommendationAiConfig.upsert({
    where: { id: TABLE },
    create: { id: TABLE, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, model: config.model, enabled: config.enabled });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response!;

  const config = await prisma.recommendationAiConfig.findUnique({ where: { id: TABLE } });
  const apiKey = config?.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted) : "";
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "No API key configured" }, { status: 400 });
  }

  const provider = config?.provider || "openrouter";
  const model = config?.model || "deepseek/deepseek-chat-v3-0324";

  try {
    let baseURL: string | undefined;
    if (provider === "openrouter") baseURL = "https://openrouter.ai/api/v1";

    const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    const resp = await client.chat.completions.create({
      model,
      max_tokens: 32,
      messages: [{ role: "user", content: "Say OK" }],
    });
    const text = resp.choices[0]?.message?.content || "";
    return NextResponse.json({ ok: true, response: text, model: resp.model });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
