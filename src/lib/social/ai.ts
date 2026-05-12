// AI helpers for social posts — caption + hashtags
// Reuses the existing AiConfig singleton (Anthropic API key).
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/ark-ai/encryption";

async function getAnthropicClient(): Promise<{ client: Anthropic; model: string } | null> {
  const cfg = await prisma.aiConfig.findUnique({ where: { id: "default" } });
  const key = cfg?.apiKeyEncrypted ? decrypt(cfg.apiKeyEncrypted) : (process.env.ANTHROPIC_API_KEY || "");
  if (!key) return null;
  return {
    client: new Anthropic({ apiKey: key }),
    model: cfg?.model || "claude-haiku-4-5-20251001",
  };
}

export type CaptionTone = "invite" | "story" | "question";

const TONE_PROMPTS: Record<CaptionTone, { th: string; en: string }> = {
  invite: {
    th: "เขียนแคปชั่นชวนเที่ยวให้คนคลิกอ่านบทความ น้ำเสียงสนุกอบอุ่น อ่านง่าย ไม่ขายของเปิด-ปิด emoji 1-2 ตัว",
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
  const conn = await getAnthropicClient();
  if (!conn) throw new Error("AI not configured (set ANTHROPIC_API_KEY or AiConfig)");

  const langLabel = opts.language === "th" ? "ภาษาไทย" : "English";
  const toneInstr = TONE_PROMPTS[opts.tone][opts.language];
  const sys = `คุณคือผู้ช่วยเขียนแคปชั่น Facebook สำหรับเว็บไซต์ท่องเที่ยวดำน้ำ SiamDive.\n\nกฎ:\n- เขียน${langLabel}เท่านั้น\n- ความยาว 2-4 บรรทัด (รวมแล้วไม่เกิน 280 ตัวอักษร)\n- ห้ามใส่ hashtag (จะมีระบบสร้างให้ต่างหาก)\n- ห้ามใส่ URL\n- ห้ามใส่ "อ่านต่อที่..." หรือ "คลิก link ใต้โพส" \n- เลี่ยงน้ำเสียงโฆษณา/sale\n\nงาน: ${toneInstr}`;

  const user = `Article title: ${opts.title}\n\nExcerpt: ${opts.excerpt || "(no excerpt)"}\n\nWrite the caption now. Output only the caption text, nothing else.`;

  const res = await conn.client.messages.create({
    model: conn.model,
    max_tokens: 400,
    system: sys,
    messages: [{ role: "user", content: user }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("\n")
    .trim();

  return text || opts.title;
}

export async function generateHashtags(opts: {
  title: string;
  excerpt: string;
  language: "th" | "en";
  category?: string | null;
  count?: number;
}): Promise<string[]> {
  const conn = await getAnthropicClient();
  if (!conn) throw new Error("AI not configured");

  const count = Math.max(5, Math.min(15, opts.count ?? 10));
  const sys = `You are a hashtag generator for a Thai scuba-diving travel site (SiamDive).
Generate ${count} hashtags total: mix of Thai (#คำไทย) and English (#englishWord) — prefer 60% English, 40% Thai.
Mix general (diving, travel, thailand) with specific (location, marine life, type of trip).
Output ONLY a JSON array of strings, each starting with #. No prose, no markdown.
Example: ["#scubadiving","#thailand","#similan","#ดำน้ำ","#ทะเลอันดามัน"]`;

  const user = `Title: ${opts.title}\nExcerpt: ${opts.excerpt || "(none)"}\nCategory: ${opts.category || "general"}\nLanguage of caption: ${opts.language}\n\nReturn ${count} hashtags as JSON array.`;

  const res = await conn.client.messages.create({
    model: conn.model,
    max_tokens: 500,
    system: sys,
    messages: [{ role: "user", content: user }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("")
    .trim();

  // try to extract JSON array
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
