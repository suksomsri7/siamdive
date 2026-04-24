import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/ark-ai/encryption";
import { checkRateLimit } from "@/lib/ark-ai/rate-limit";
import { searchBoats, searchSchedules, searchBlogs, buildRagContext } from "@/lib/ark-ai/rag";
import { buildSystemPrompt } from "@/lib/ark-ai/system-prompt";

type Msg = { role: "user" | "assistant"; content: string };

async function getAiConfig() {
  const config = await prisma.aiConfig.findUnique({ where: { id: "default" } });
  return {
    provider: config?.provider || "anthropic",
    apiKey: config?.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted) : (process.env.ANTHROPIC_API_KEY || ""),
    model: config?.model || "claude-haiku-4-5-20251001",
    maxTokens: config?.maxTokens || 1024,
    rateLimit: config?.rateLimit || 20,
    temperature: config?.temperature || 0.7,
    extra: config?.systemPromptExtra || "",
  };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const body = await req.json().catch(() => null);
  if (!body?.messages?.length) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const messages: Msg[] = body.messages.slice(-10);
  const lang: string = body.lang || "en";
  const pageContext: string | undefined = body.pageContext;
  const recentlyViewed: string | undefined = body.recentlyViewed;

  const config = await getAiConfig();
  if (!config.apiKey) {
    return Response.json({ error: "AI not configured. Set API key in backoffice settings." }, { status: 503 });
  }

  const { allowed } = checkRateLimit(ip, config.rateLimit);
  if (!allowed) {
    return Response.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  const [boats, schedules, blogs] = await Promise.all([
    searchBoats(lang),
    searchSchedules(lang),
    searchBlogs(lang, 20),
  ]);

  const ragContext = buildRagContext(boats, schedules, blogs);
  const systemPrompt = buildSystemPrompt({
    lang,
    ragContext,
    pageContext,
    recentlyViewed,
    extra: config.extra,
  });

  const client = new Anthropic({ apiKey: config.apiKey });

  const stream = await client.messages.stream({
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
