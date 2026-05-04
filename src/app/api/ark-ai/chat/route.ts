import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/ark-ai/encryption";
import { checkRateLimit } from "@/lib/ark-ai/rate-limit";
import { searchBoats, searchSchedules, searchBlogs, buildRagContext } from "@/lib/ark-ai/rag";
import { buildSystemPrompt } from "@/lib/ark-ai/system-prompt";
import { checkDailyBudget, logUsage } from "@/lib/ark-ai/cost-guard";
import { getArkAiProfile, formatProfileSummary } from "@/lib/ark-ai/profile";
import { isBotUa } from "@/lib/analytics/botFilter";

type Msg = { role: "user" | "assistant"; content: string };
type Usage = { inputTokens: number; outputTokens: number };
type OnUsage = (usage: Usage) => void;

async function getAiConfig() {
  const config = await prisma.aiConfig.findUnique({ where: { id: "default" } });
  return {
    provider: config?.provider || "anthropic",
    apiKey: config?.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted) : (process.env.ANTHROPIC_API_KEY || ""),
    model: config?.model || "claude-haiku-4-5-20251001",
    maxTokens: config?.maxTokens || 4096,
    rateLimit: config?.rateLimit || 20,
    temperature: config?.temperature || 0.7,
    extra: config?.systemPromptExtra || "",
    enabled: config?.enabled ?? true,
    dailyBudgetUsd: config?.dailyBudgetUsd ?? 5,
  };
}

function streamAnthropic(config: ReturnType<typeof getAiConfig> extends Promise<infer T> ? T : never, systemPrompt: string, messages: Msg[], onUsage?: OnUsage) {
  const client = new Anthropic({ apiKey: config.apiKey });
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let inputTokens = 0;
      let outputTokens = 0;
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
          } else if (event.type === "message_start") {
            inputTokens = event.message.usage?.input_tokens ?? 0;
            outputTokens = event.message.usage?.output_tokens ?? 0;
          } else if (event.type === "message_delta") {
            outputTokens = event.usage?.output_tokens ?? outputTokens;
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
        if (onUsage && (inputTokens > 0 || outputTokens > 0)) {
          onUsage({ inputTokens, outputTokens });
        }
      }
    },
  });
}

function streamOpenAI(config: ReturnType<typeof getAiConfig> extends Promise<infer T> ? T : never, systemPrompt: string, messages: Msg[], baseURL?: string, onUsage?: OnUsage) {
  const client = new OpenAI({ apiKey: config.apiKey, ...(baseURL ? { baseURL } : {}) });
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let inputTokens = 0;
      let outputTokens = 0;
      try {
        const stream = await client.chat.completions.create({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          stream: true,
          stream_options: { include_usage: true },
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
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens ?? 0;
            outputTokens = chunk.usage.completion_tokens ?? 0;
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
        if (onUsage && (inputTokens > 0 || outputTokens > 0)) {
          onUsage({ inputTokens, outputTokens });
        }
      }
    },
  });
}

function streamGoogle(config: ReturnType<typeof getAiConfig> extends Promise<infer T> ? T : never, systemPrompt: string, messages: Msg[], onUsage?: OnUsage) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let inputTokens = 0;
      let outputTokens = 0;
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
              if (data.usageMetadata) {
                inputTokens = data.usageMetadata.promptTokenCount ?? inputTokens;
                outputTokens = data.usageMetadata.candidatesTokenCount ?? outputTokens;
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
        if (onUsage && (inputTokens > 0 || outputTokens > 0)) {
          onUsage({ inputTokens, outputTokens });
        }
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
  const sessionId: string | null = typeof body.sessionId === "string" ? body.sessionId : null;
  const deviceId: string | null = typeof body.deviceId === "string" ? body.deviceId : null;
  const path: string = typeof body.path === "string" ? body.path : "/";

  // Bot filter — block automated traffic before it consumes any budget.
  // Real users have legitimate UAs; bots/crawlers/headless are filtered out.
  const ua = req.headers.get("user-agent");
  if (isBotUa(ua)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await getAiConfig();

  // Gate order: enabled → budget → apiKey → rate limit.
  // Budget runs before apiKey so a budget-exhausted scenario surfaces clearly even
  // if the API key happens to be unreadable (e.g. ENCRYPTION_KEY mismatch on preview).
  if (!config.enabled) {
    return Response.json(
      { error: "Ark AI is currently unavailable. Please contact us via LINE/WhatsApp." },
      { status: 503 },
    );
  }

  const budget = await checkDailyBudget(config.dailyBudgetUsd);
  if (!budget.allowed) {
    // Record analytics event so we can alert on repeated budget hits.
    if (sessionId && deviceId) {
      prisma.analyticsEvent.create({
        data: {
          sessionId, visitorId: deviceId, type: "ARK_AI_BUDGET_BLOCKED", path, lang,
          properties: { usedUsd: budget.usedUsd, budgetUsd: budget.budgetUsd } as never,
        },
      }).catch(err => console.error("[ark-ai] track BUDGET_BLOCKED failed:", err));
    }
    return Response.json(
      {
        error: "Daily AI budget reached. Please try again tomorrow or contact us directly.",
        usedUsd: budget.usedUsd,
        budgetUsd: budget.budgetUsd,
      },
      { status: 429 },
    );
  }

  if (!config.apiKey) {
    return Response.json({ error: "AI not configured. Set API key in backoffice settings." }, { status: 503 });
  }

  const { allowed } = checkRateLimit(ip, config.rateLimit);
  if (!allowed) {
    return Response.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";

  // Behavior profile (cached, cross-device merged via email).
  // Only injected for warm visitors (totalActivity ≥ 5) — cold start gets generic responses.
  let behaviorProfile = "";
  let personalized = false;
  if (deviceId) {
    try {
      const profile = await getArkAiProfile(deviceId);
      behaviorProfile = await formatProfileSummary(profile, lang);
      personalized = behaviorProfile.length > 0;
    } catch (err) {
      // Profile build failure must never break chat — fall back to generic.
      console.error("[ark-ai] profile build failed:", err);
    }
  }

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
    behaviorProfile,
    extra: config.extra,
  });

  // Track ARK_AI_PERSONALIZED when we actually injected a profile boost (fire-and-forget).
  if (personalized && sessionId && deviceId) {
    prisma.analyticsEvent.create({
      data: {
        sessionId, visitorId: deviceId, type: "ARK_AI_PERSONALIZED", path, lang,
      },
    }).catch(err => console.error("[ark-ai] track PERSONALIZED failed:", err));
  }

  const onUsage: OnUsage = (usage) => {
    logUsage({
      sessionId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      model: config.model,
    }).catch(err => console.error("[ark-ai] logUsage failed:", err));
  };

  let readable: ReadableStream;
  switch (config.provider) {
    case "openai":
      readable = streamOpenAI(config, systemPrompt, messages, undefined, onUsage);
      break;
    case "openrouter":
      readable = streamOpenAI(config, systemPrompt, messages, "https://openrouter.ai/api/v1", onUsage);
      break;
    case "google":
      readable = streamGoogle(config, systemPrompt, messages, onUsage);
      break;
    default:
      readable = streamAnthropic(config, systemPrompt, messages, onUsage);
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
