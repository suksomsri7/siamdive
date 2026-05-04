import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { encrypt, decrypt } from "@/lib/ark-ai/encryption";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

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
    enabled: config.enabled,
    dailyBudgetUsd: config.dailyBudgetUsd,
    costAlertEmail: config.costAlertEmail || "",
    costAlertThreshold: config.costAlertThreshold,
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
  if (body.enabled !== undefined) data.enabled = !!body.enabled;
  if (body.dailyBudgetUsd !== undefined) data.dailyBudgetUsd = Number(body.dailyBudgetUsd);
  if (body.costAlertEmail !== undefined) data.costAlertEmail = body.costAlertEmail || null;
  if (body.costAlertThreshold !== undefined) data.costAlertThreshold = Number(body.costAlertThreshold);

  const config = await prisma.aiConfig.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, model: config.model });
}

async function testAnthropic(apiKey: string, model: string) {
  const client = new Anthropic({ apiKey });
  const resp = await client.messages.create({
    model,
    max_tokens: 32,
    messages: [{ role: "user", content: "Say OK" }],
  });
  const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
  return { ok: true, response: text, model: resp.model };
}

async function testOpenAI(apiKey: string, model: string, baseURL?: string) {
  const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  const resp = await client.chat.completions.create({
    model,
    max_tokens: 32,
    messages: [{ role: "user", content: "Say OK" }],
  });
  const text = resp.choices[0]?.message?.content || "";
  return { ok: true, response: text, model: resp.model };
}

async function testGoogle(apiKey: string, model: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Say OK" }] }],
      generationConfig: { maxOutputTokens: 32 },
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { ok: true, response: text, model };
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response!;

  const config = await prisma.aiConfig.findUnique({ where: { id: "default" } });
  const apiKey = config?.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted) : "";
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "No API key configured" }, { status: 400 });
  }

  const provider = config?.provider || "anthropic";
  const model = config?.model || "claude-haiku-4-5-20251001";

  try {
    let result;
    switch (provider) {
      case "openai":
        result = await testOpenAI(apiKey, model);
        break;
      case "openrouter":
        result = await testOpenAI(apiKey, model, "https://openrouter.ai/api/v1");
        break;
      case "google":
        result = await testGoogle(apiKey, model);
        break;
      default:
        result = await testAnthropic(apiKey, model);
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
