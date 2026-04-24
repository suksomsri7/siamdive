import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
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

function streamAnthropic(config: ReturnType<typeof getAiConfig> extends Promise<infer T> ? T : never, systemPrompt: string, messages: Msg[]) {
  const client = new Anthropic({ apiKey: config.apiKey });
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.messages.stream({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });
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
}

function streamOpenAI(config: ReturnType<typeof getAiConfig> extends Promise<infer T> ? T : never, systemPrompt: string, messages: Msg[]) {
  const client = new OpenAI({ apiKey: config.apiKey });
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.chat.completions.create({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          ],
        });
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
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
}

function streamGoogle(config: ReturnType<typeof getAiConfig> extends Promise<infer T> ? T : never, systemPrompt: string, messages: Msg[]) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;
        const contents = messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
              maxOutputTokens: config.maxTokens,
              temperature: config.temperature,
            },
          }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `Google API error ${resp.status}`);
        }
        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch {}
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

  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";

  const [boats, schedules, blogs] = await Promise.all([
    searchBoats(lang),
    searchSchedules(lang),
    searchBlogs(lang, 20),
  ]);

  const ragContext = buildRagContext(boats, schedules, blogs, lastUserMsg);
  const systemPrompt = buildSystemPrompt({
    lang,
    ragContext,
    pageContext,
    recentlyViewed,
    extra: config.extra,
  });

  let readable: ReadableStream;
  switch (config.provider) {
    case "openai":
      readable = streamOpenAI(config, systemPrompt, messages);
      break;
    case "google":
      readable = streamGoogle(config, systemPrompt, messages);
      break;
    default:
      readable = streamAnthropic(config, systemPrompt, messages);
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
