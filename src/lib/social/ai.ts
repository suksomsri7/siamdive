// AI helpers for social posts — caption + hashtags
// Reuses the existing AiConfig singleton (provider/model/key). Supports
// anthropic, openai, and openrouter — same pattern as Ark AI chat.
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/ark-ai/encryption";

type ProviderConfig = {
  provider: "anthropic" | "openai" | "openrouter";
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
};

async function getProvider(): Promise<ProviderConfig | null> {
  const cfg = await prisma.socialAiConfig.findUnique({ where: { id: "default" } });
  if (cfg && !cfg.enabled) throw new Error("Social AI is disabled in /backoffice/social/settings");
  const provider = (cfg?.provider as ProviderConfig["provider"]) || "anthropic";
  const apiKey = cfg?.apiKeyEncrypted
    ? decrypt(cfg.apiKeyEncrypted)
    : (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "");
  if (!apiKey) return null;
  return {
    provider,
    apiKey,
    model: cfg?.model || (provider === "anthropic" ? "claude-haiku-4-5-20251001" : "openai/gpt-4o-mini"),
    maxTokens: cfg?.maxTokens || 800,
    temperature: cfg?.temperature ?? 0.7,
  };
}

async function generate(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const cfg = await getProvider();
  if (!cfg) throw new Error("AI not configured");

  if (cfg.provider === "anthropic") {
    const client = new Anthropic({ apiKey: cfg.apiKey });
    const res = await client.messages.create({
      model: cfg.model,
      max_tokens: maxTokens,
      temperature: cfg.temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("\n")
      .trim();
  }

  // openai or openrouter — OpenAI SDK with optional baseURL
  const baseURL = cfg.provider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined;
  const client = new OpenAI({ apiKey: cfg.apiKey, ...(baseURL ? { baseURL } : {}) });
  const res = await client.chat.completions.create({
    model: cfg.model,
    max_tokens: maxTokens,
    temperature: cfg.temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return (res.choices[0]?.message?.content ?? "").trim();
}

export type CaptionTone = "invite" | "story" | "question";

const TONE_PROMPTS: Record<CaptionTone, { th: string; en: string }> = {
  invite: {
    th: "เขียนแคปชั่นชวนเที่ยวให้คนคลิกอ่านบทความ น้ำเสียงสนุกอบอุ่น อ่านง่าย ไม่ขายของ เปิด-ปิด emoji 1-2 ตัว",
    en: "Write an inviting caption that makes readers want to click the article. Warm, friendly tone. 1-2 tasteful emojis, not salesy.",
  },
  story: {
    th: "เขียนแคปชั่นเล่าเรื่องแบบมีฮุก เปิดด้วยภาพ/บรรยากาศ 1 ประโยค แล้วชวนไปอ่านต่อ ใช้น้ำเสียงเป็นกันเอง",
    en: "Write a story-style caption opening with one scene-setting line, then a hook to read more. Natural, conversational.",
  },
  question: {
    th: "เริ่มด้วยคำถามชวนคิด 1 ประโยคเพื่อให้คน comment แล้วโยงเข้าบทความ น้ำเสียงเฟรนด์ลี ไม่เหมือนโฆษณา",
    en: "Open with a thought-provoking question to drive comments, then bridge to the article. Friendly, never ad-like.",
  },
};

export async function generateCaption(opts: {
  title: string;
  excerpt: string;
  language: "th" | "en";
  tone: CaptionTone;
  url?: string;
}): Promise<string> {
  const langLabel = opts.language === "th" ? "ภาษาไทย" : "English";
  const toneInstr = TONE_PROMPTS[opts.tone][opts.language];
  const sys = `คุณคือผู้ช่วยเขียนแคปชั่น Facebook สำหรับเว็บไซต์ท่องเที่ยวดำน้ำ SiamDive.

กฎ:
- เขียน${langLabel}เท่านั้น
- ความยาว 2-4 บรรทัด (รวมแล้วไม่เกิน 280 ตัวอักษร)
- ห้ามใส่ hashtag (จะมีระบบสร้างให้ต่างหาก)
- ห้ามใส่ URL
- ห้ามใส่ "อ่านต่อที่..." หรือ "คลิก link ใต้โพส"
- เลี่ยงน้ำเสียงโฆษณา/sale

งาน: ${toneInstr}`;

  const user = `Article title: ${opts.title}

Excerpt: ${opts.excerpt || "(no excerpt)"}

Write the caption now. Output only the caption text, nothing else.`;

  const text = await generate(sys, user, 400);
  return text || opts.title;
}

export async function generateHashtags(opts: {
  title: string;
  excerpt: string;
  language: "th" | "en";
  category?: string | null;
  count?: number;
}): Promise<string[]> {
  const count = Math.max(5, Math.min(15, opts.count ?? 10));
  const sys = `You are a hashtag generator for a Thai scuba-diving travel site (SiamDive).
Generate ${count} hashtags total: mix of Thai (#คำไทย) and English (#englishWord) — prefer 60% English, 40% Thai.
Mix general (diving, travel, thailand) with specific (location, marine life, type of trip).
Output ONLY a JSON array of strings, each starting with #. No prose, no markdown.
Example: ["#scubadiving","#thailand","#similan","#ดำน้ำ","#ทะเลอันดามัน"]`;

  const user = `Title: ${opts.title}
Excerpt: ${opts.excerpt || "(none)"}
Category: ${opts.category || "general"}
Language of caption: ${opts.language}

Return ${count} hashtags as JSON array.`;

  const text = await generate(sys, user, 500);
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]) as unknown[];
    return arr
      .filter((s): s is string => typeof s === "string")
      .map(s => s.trim())
      .filter(s => s.startsWith("#") && s.length > 1)
      .slice(0, count);
  } catch {
    return [];
  }
}
