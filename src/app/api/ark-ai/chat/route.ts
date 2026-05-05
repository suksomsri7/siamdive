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
import { detectMedicalConcern, buildMedicalRedirect } from "@/lib/ark-ai/safety";
import { applyToolCall, formatSlotsForPrompt, isComplete, UPDATE_SLOTS_TOOL, type Slots } from "@/lib/ark-ai/slots";
import { extractDateHint } from "@/lib/ark-ai/date-hint";

type Msg = { role: "user" | "assistant"; content: string };
type Usage = { inputTokens: number; outputTokens: number };
type OnUsage = (usage: Usage) => void;
type SlotUpdate = { slots: Slots; changed: string[]; complete: boolean };
// Callback invoked after the model finishes a tool_use block. Returns a
// SlotUpdate payload to forward to the client, or null if the tool call did
// not change anything (so we don't bloat the SSE stream).
type OnToolCall = (name: string, input: unknown) => SlotUpdate | null;

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

function streamAnthropic(
  config: ReturnType<typeof getAiConfig> extends Promise<infer T> ? T : never,
  systemPrompt: string,
  messages: Msg[],
  opts: { onUsage?: OnUsage; tools?: Anthropic.Messages.Tool[]; onToolCall?: OnToolCall } = {},
) {
  const client = new Anthropic({ apiKey: config.apiKey });
  const encoder = new TextEncoder();
  const { onUsage, tools, onToolCall } = opts;

  return new ReadableStream({
    async start(controller) {
      let inputTokens = 0;
      let outputTokens = 0;
      let textEmitted = false;
      // Track in-flight tool_use blocks. The Anthropic stream emits tool input
      // as a sequence of input_json_delta events between content_block_start
      // (type=tool_use) and content_block_stop. We accumulate per index.
      const toolBlocks = new Map<number, { id: string; name: string; jsonAcc: string }>();
      const finalizedTools: { id: string; name: string; input: unknown }[] = [];
      try {
        const stream = await client.messages.stream({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          ...(tools && tools.length ? { tools } : {}),
        });
        for await (const event of stream) {
          if (event.type === "content_block_start") {
            const block = event.content_block;
            if (block.type === "tool_use") {
              toolBlocks.set(event.index, { id: block.id, name: block.name, jsonAcc: "" });
            }
          } else if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
              textEmitted = true;
            } else if (event.delta.type === "input_json_delta") {
              const t = toolBlocks.get(event.index);
              if (t) t.jsonAcc += event.delta.partial_json;
            }
          } else if (event.type === "content_block_stop") {
            const t = toolBlocks.get(event.index);
            if (t) {
              let parsed: unknown = {};
              try {
                parsed = t.jsonAcc.trim() ? JSON.parse(t.jsonAcc) : {};
              } catch (err) {
                console.error("[ark-ai] tool input parse failed:", err, t.jsonAcc);
              }
              if (onToolCall) {
                const update = onToolCall(t.name, parsed);
                if (update) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ slotUpdate: update })}\n\n`));
                }
              }
              finalizedTools.push({ id: t.id, name: t.name, input: parsed });
              toolBlocks.delete(event.index);
            }
          } else if (event.type === "message_start") {
            inputTokens = event.message.usage?.input_tokens ?? 0;
            outputTokens = event.message.usage?.output_tokens ?? 0;
          } else if (event.type === "message_delta") {
            outputTokens = event.usage?.output_tokens ?? outputTokens;
          }
        }

        // Round-trip: if model called tools but emitted no text, send tool
        // results back so it can produce its real recommendation reply.
        if (finalizedTools.length > 0 && !textEmitted) {
          const continuation = await client.messages.stream({
            model: config.model,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            system: systemPrompt,
            messages: [
              ...messages.map(m => ({ role: m.role, content: m.content })),
              {
                role: "assistant" as const,
                content: finalizedTools.map(t => ({
                  type: "tool_use" as const,
                  id: t.id,
                  name: t.name,
                  input: (t.input as Record<string, unknown>) || {},
                })),
              },
              {
                role: "user" as const,
                content: finalizedTools.map(t => ({
                  type: "tool_result" as const,
                  tool_use_id: t.id,
                  content: JSON.stringify({ ok: true }),
                })),
              },
            ],
            // No tools on continuation — already extracted what we needed.
          });
          for await (const event of continuation) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            } else if (event.type === "message_start") {
              inputTokens += event.message.usage?.input_tokens ?? 0;
            } else if (event.type === "message_delta") {
              outputTokens += event.usage?.output_tokens ?? 0;
            }
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

// Tool callback factory. Closes over the running session's slot state so each
// successive update_slots call merges against the latest. Returns:
//   - onToolCall: passed into streamAnthropic; mutates `current`, persists to
//     AiPlanSession (fire-and-forget), fires ARK_AI_SLOT_FILLED, and returns
//     the SlotUpdate payload for SSE forwarding (or null when nothing changed).
function makeSlotHandler(opts: {
  deviceId: string | null;
  sessionId: string | null;
  path: string;
  lang: string;
  initialSlots: Slots;
}): { onToolCall: OnToolCall; getCurrent: () => Slots } {
  let current: Slots = { ...opts.initialSlots };
  const { deviceId, sessionId, path, lang } = opts;
  return {
    getCurrent: () => current,
    onToolCall: (name, input) => {
      if (name !== "update_slots") return null;
      const { merged, changed } = applyToolCall(current, input);
      if (!changed.length) return null;
      current = merged;
      if (deviceId) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        // deviceId is NOT a unique key — getArkAiProfile() (Phase 1.5) may
        // already have created a row for behavior caching. Find-then-update
        // mirrors that pattern so we don't fork into multiple rows per device.
        (async () => {
          const existing = await prisma.aiPlanSession.findFirst({
            where: { deviceId, status: "active", expiresAt: { gt: now } },
            orderBy: { lastActiveAt: "desc" },
            select: { id: true },
          });
          if (existing) {
            await prisma.aiPlanSession.update({
              where: { id: existing.id },
              data: { slots: merged as never, lastActiveAt: now, expiresAt, status: "active" },
            });
          } else {
            await prisma.aiPlanSession.create({
              data: { deviceId, slots: merged as never, status: "active", lastActiveAt: now, expiresAt },
            });
          }
        })().catch(err => console.error("[ark-ai] AiPlanSession write failed:", err));
        if (sessionId) {
          for (const field of changed) {
            prisma.analyticsEvent
              .create({
                data: {
                  sessionId, visitorId: deviceId, type: "ARK_AI_SLOT_FILLED", path, lang,
                  properties: { slotName: field, value: (merged as Record<string, unknown>)[field] } as never,
                },
              })
              .catch(err => console.error("[ark-ai] track SLOT_FILLED failed:", err));
          }
        }
      }
      return { slots: merged, changed: changed as string[], complete: isComplete(merged) };
    },
  };
}

function streamOpenAI(
  config: ReturnType<typeof getAiConfig> extends Promise<infer T> ? T : never,
  systemPrompt: string,
  messages: Msg[],
  baseURL?: string,
  opts: { onUsage?: OnUsage; tools?: Anthropic.Messages.Tool[]; onToolCall?: OnToolCall } = {},
) {
  const client = new OpenAI({ apiKey: config.apiKey, ...(baseURL ? { baseURL } : {}) });
  const encoder = new TextEncoder();
  const { onUsage, tools, onToolCall } = opts;

  // OpenAI / OpenRouter use a different tool spec shape than Anthropic.
  // Convert on the fly so callers pass one shared definition.
  const openaiTools = tools?.map(t => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      // Anthropic's input_schema is the same JSON Schema object OpenAI calls
      // `parameters` — pass through verbatim.
      parameters: t.input_schema as Record<string, unknown>,
    },
  }));

  return new ReadableStream({
    async start(controller) {
      let inputTokens = 0;
      let outputTokens = 0;
      let textEmitted = false;
      // Track partial tool_call arguments by index across delta chunks.
      const pendingTools = new Map<number, { id: string; name: string; argsAcc: string }>();
      // Snapshot of finalized tool calls in order, used for the round-trip
      // continuation so the model can produce its real text reply.
      const finalizedTools: { id: string; name: string; arguments: string }[] = [];
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
          ...(openaiTools && openaiTools.length ? { tools: openaiTools, tool_choice: "auto" as const } : {}),
        });
        for await (const chunk of stream) {
          const choice = chunk.choices[0];
          const text = choice?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            textEmitted = true;
          }
          // Tool-call deltas: each delta carries `tool_calls[]` with an index;
          // `function.name` + `id` arrive on the first chunk, `function.arguments`
          // streams in chunks. Accumulate per-index and finalize on stop.
          const toolDeltas = choice?.delta?.tool_calls;
          if (toolDeltas) {
            for (const td of toolDeltas) {
              const idx = td.index ?? 0;
              let entry = pendingTools.get(idx);
              if (!entry) {
                entry = { id: td.id || `call_${idx}`, name: td.function?.name || "", argsAcc: "" };
                pendingTools.set(idx, entry);
              }
              if (td.id) entry.id = td.id;
              if (td.function?.name) entry.name = td.function.name;
              if (td.function?.arguments) entry.argsAcc += td.function.arguments;
            }
          }
          if (choice?.finish_reason === "tool_calls" && onToolCall) {
            for (const entry of pendingTools.values()) {
              try {
                const parsed = entry.argsAcc.trim() ? JSON.parse(entry.argsAcc) : {};
                const update = onToolCall(entry.name, parsed);
                if (update) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ slotUpdate: update })}\n\n`));
                }
              } catch (err) {
                console.error("[ark-ai] OpenAI tool input parse failed:", err, entry.argsAcc);
              }
              finalizedTools.push({ id: entry.id, name: entry.name, arguments: entry.argsAcc || "{}" });
            }
            pendingTools.clear();
          }
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens ?? 0;
            outputTokens = chunk.usage.completion_tokens ?? 0;
          }
        }

        // Round-trip: if model called tools but didn't emit text, send the
        // tool results back so it produces its real recommendation reply.
        // Without this, the user sees only an empty bubble (or the client
        // fallback) when a turn was pure slot extraction.
        if (finalizedTools.length > 0 && !textEmitted) {
          const followUp = await client.chat.completions.create({
            model: config.model,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            stream: true,
            stream_options: { include_usage: true },
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
              {
                role: "assistant",
                content: null,
                tool_calls: finalizedTools.map(t => ({
                  id: t.id,
                  type: "function" as const,
                  function: { name: t.name, arguments: t.arguments },
                })),
              },
              ...finalizedTools.map(t => ({
                role: "tool" as const,
                tool_call_id: t.id,
                content: JSON.stringify({ ok: true }),
              })),
            ],
            // No tools on the continuation — model already called what it needed.
          });
          for await (const chunk of followUp) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
            if (chunk.usage) {
              // Add continuation usage to the totals so cost guard stays accurate.
              inputTokens += chunk.usage.prompt_tokens ?? 0;
              outputTokens += chunk.usage.completion_tokens ?? 0;
            }
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

  // Pre-flight medical concern check.
  // We cannot legally/ethically give diving medical advice. Detect known
  // contraindications in the user's last message and short-circuit to a
  // doctor-referral response. Saves API budget and avoids hallucinated advice.
  const lastUserText = [...messages].reverse().find(m => m.role === "user")?.content || "";
  const medical = detectMedicalConcern(lastUserText);
  if (medical) {
    const responseText = buildMedicalRedirect(medical, lang);
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ text: responseText })}\n\n`));
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
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

  // Phase 2 — load active slot-extraction session so the model knows what's
  // already been collected and skips redundant tool calls.
  let initialSlots: Slots = {};
  if (deviceId) {
    try {
      const sess = await prisma.aiPlanSession.findFirst({
        where: { deviceId, status: "active", expiresAt: { gt: new Date() } },
        orderBy: { lastActiveAt: "desc" },
        select: { slots: true },
      });
      if (sess?.slots && typeof sess.slots === "object") {
        initialSlots = sess.slots as Slots;
      }
    } catch (err) {
      // Session load must never break chat — fall back to empty slots.
      console.error("[ark-ai] AiPlanSession load failed:", err);
    }
  }

  // When the user has already given dates, narrow the schedule window so the
  // AI only sees (and recommends) boats that actually run in that period.
  // Without this filter the model happily pitches a boat whose next departure
  // is months away from the requested date, then the picker shows no rows.
  //
  // Slot extraction runs as a tool call DURING the chat stream, so on the
  // first turn the persisted slots are still empty when we build RAG. Fall
  // back to a regex hint over the user's last message so first-turn
  // recommendations already respect the date intent.
  //
  // ALSO override the persisted slot when the user's NEW turn names a
  // different date — otherwise turn 1 "ภูเก็ต 23 พ.ค." sticks and turn 2
  // "เดือนหน้า มิย" still narrows by the old May 23 window. Latest typed
  // intent wins; the slot-extraction tool call later in this stream can
  // refine if the regex was too greedy.
  const SCHEDULE_WINDOW_DAYS = 3;
  let effectiveSlots: Slots = initialSlots;
  const dateHint = extractDateHint(lastUserMsg);
  if (dateHint) {
    effectiveSlots = { ...effectiveSlots, dates: dateHint };
  }
  let scheduleFromDate: Date | undefined;
  let scheduleToDate: Date | undefined;
  if (effectiveSlots.dates?.from) {
    const fromMs = Date.parse(effectiveSlots.dates.from + "T00:00:00Z");
    const toMs = Date.parse((effectiveSlots.dates.to || effectiveSlots.dates.from) + "T23:59:59Z");
    if (!Number.isNaN(fromMs) && !Number.isNaN(toMs)) {
      scheduleFromDate = new Date(fromMs - SCHEDULE_WINDOW_DAYS * 86_400_000);
      scheduleToDate = new Date(toMs + SCHEDULE_WINDOW_DAYS * 86_400_000);
    }
  }

  const [boatsAll, schedules, blogs] = await Promise.all([
    searchBoats(lang),
    searchSchedules(lang, scheduleFromDate || scheduleToDate ? { fromDate: scheduleFromDate, toDate: scheduleToDate } : undefined),
    searchBlogs(lang, 20),
  ]);

  // If we narrowed the schedule window, hard-restrict the boat list to only
  // boats with a schedule in that window — no fallback to the full catalog,
  // because the catalog includes boats whose next departure is months away
  // and the AI would happily pitch them as if they ran on the user's date.
  // Only OPEN schedules count as "available" — searchSchedules returns
  // both OPEN and FULL (so the AI can warn about full dates), but we
  // shouldn't recommend a boat whose only matching departure is already
  // sold out.
  const isBookable = (s: typeof schedules[number]) => s.status === "OPEN";
  let noTripsInWindow = false;
  let widenedBoats: typeof boatsAll = [];
  let widenedSchedules: typeof schedules = [];
  if (scheduleFromDate) {
    const matching = new Set(schedules.filter(isBookable).map(s => s.boatId));
    const filtered = boatsAll.filter(b => matching.has(b.id));
    if (filtered.length === 0) {
      noTripsInWindow = true;
      // Pull a wider ±14 day net so the AI can suggest alternative dates
      // (with their real departure dates) without inventing them.
      const WIDE_DAYS = 14;
      const wideFrom = new Date(scheduleFromDate.getTime() - (WIDE_DAYS - SCHEDULE_WINDOW_DAYS) * 86_400_000);
      const wideTo = new Date(scheduleToDate!.getTime() + (WIDE_DAYS - SCHEDULE_WINDOW_DAYS) * 86_400_000);
      widenedSchedules = await searchSchedules(lang, { fromDate: wideFrom, toDate: wideTo });
      const wideMatching = new Set(widenedSchedules.filter(isBookable).map(s => s.boatId));
      widenedBoats = boatsAll.filter(b => wideMatching.has(b.id));
    }
  }
  const boats = scheduleFromDate
    ? (noTripsInWindow ? widenedBoats : boatsAll.filter(b => new Set(schedules.filter(isBookable).map(s => s.boatId)).has(b.id)))
    : boatsAll;
  // When we widened, the schedules list passed to RAG must reflect the
  // widened set so the AI can quote real alternative dates.
  const ragSchedules = noTripsInWindow ? widenedSchedules : schedules;

  let ragContext: string;
  if (noTripsInWindow && effectiveSlots.dates?.from) {
    const reqLabel = effectiveSlots.dates.label || effectiveSlots.dates.from;
    // Don't even hand the model a "## Available Trips/Boats" section in this
    // case. Show only an alternatives list grouped by boat with real
    // departure dates so the model can't pitch a $$TRIP$$ card as if it ran
    // on the user's date. The model is told (in the alert + Output Rules)
    // to NOT emit $$TRIP$$ here — text-only with alt dates.
    const altBoats = boats.slice(0, 6);
    const altLines = altBoats.map(b => {
      const datesForBoat = ragSchedules
        .filter(s => s.boatId === b.id && s.status === "OPEN")
        .map(s => s.departureDate)
        .filter(Boolean)
        .slice(0, 5)
        .join(", ");
      return `- ${b.title} (${b.area}) — boatSlug: "${b.slug}" — available departures: ${datesForBoat || "(check direct)"}`;
    }).join("\n");

    ragContext =
      `## ⚠️ DATE UNAVAILABLE — STRICT MODE (READ FIRST, OVERRIDES RULE 7)\n` +
      `The user asked for **${reqLabel}** but NO boats run within ±${SCHEDULE_WINDOW_DAYS} days of that date.\n` +
      `**RULE 7 ($$TRIP$$ cards) IS SUSPENDED for this turn.** Do NOT emit any $$TRIP$$ marker.\n` +
      `Instead, reply in plain text only:\n` +
      `1. First sentence: apologize that ${reqLabel} has no trips in the requested region.\n` +
      `2. List the closest 2–4 alternative DEPARTURE DATES from the table below as bullet points (boat name + the real date — do NOT use ${reqLabel}).\n` +
      `3. End with: "อยากเลื่อนวันมาเป็นวันไหนดีครับ?" (or the same question in the user's language).\n` +
      `Do NOT say "มีทริปวันที่ ${reqLabel}" / "there are trips on ${reqLabel}". Do NOT emit $$ASK$$ buttons.\n\n` +
      `## Alternative Departures (NEAR the requested date — NOT ON it)\n${altLines || "(no alternatives within ±14 days)"}\n`;
  } else {
    ragContext = buildRagContext(boats, ragSchedules, blogs, lastUserMsg);
  }

  // Category-first hard guard. The system prompt asks the AI to query type
  // before recommending, but LLMs ignore soft rules under recommendation
  // pressure. If the user's message doesn't clearly imply a trip type AND
  // no category slot has been set, replace the RAG block with a strict-mode
  // instruction so $$TRIP$$ cards are suspended for this turn — same pattern
  // as the no-matching-dates branch above.
  const userHasCategoryHint = (() => {
    const m = lastUserMsg.toLowerCase();
    return /liveaboard|live-aboard|ค้างคืน|เรือนอน|day\s*trip|เดย์ทริป|day-trip|snorkel|สนอร์เกิล|ดำผิวน้ำ|land\s*tour|ทัวร์บก|land-tour/i.test(m);
  })();
  const pageImpliesCategory = !!(pageContext && /\/(boat|liveaboard|day-trip|daytrip|snorkel|land-tour)\//.test(pageContext));
  const haveCategorySlot = Array.isArray(effectiveSlots.categories) && effectiveSlots.categories.length > 0;
  const askCategoryFirst = !haveCategorySlot && !userHasCategoryHint && !pageImpliesCategory && !noTripsInWindow;
  if (askCategoryFirst) {
    ragContext =
      `## ⚠️ CATEGORY UNKNOWN — STRICT MODE (READ FIRST, OVERRIDES RULE 7)\n` +
      `The user is asking about diving but hasn't named a TRIP TYPE. Before showing any boat, you MUST ask which kind via $$ASK$$. **RULE 7 ($$TRIP$$ cards) IS SUSPENDED for this turn.** Do NOT emit any $$TRIP$$/$$COMPARE$$/$$PACKAGES$$ marker.\n\n` +
      `Reply rules:\n` +
      `1. One short opening line acknowledging the request (1 sentence).\n` +
      `2. ONE $$ASK$$ marker with EXACTLY these 4 options (preserve the value strings verbatim — they trigger the categories slot extractor on the next turn):\n` +
      `   - {"label":"Liveaboard (เรือค้างคืน 3-5 วัน)","value":"สนใจ liveaboard"}\n` +
      `   - {"label":"Day Trip ดำน้ำไป-กลับ","value":"สนใจ day trip ดำน้ำ"}\n` +
      `   - {"label":"Snorkeling เท่านั้น","value":"สนใจ snorkeling"}\n` +
      `   - {"label":"Land Tour เที่ยวบก","value":"สนใจ land tour"}\n` +
      `3. NOTHING else. No boat names, no recommendations, no other questions.\n\n` +
      `Do NOT call update_slots in this turn — the user hasn't answered yet.\n`;
  }

  const systemPrompt = buildSystemPrompt({
    lang,
    ragContext,
    pageContext,
    recentlyViewed,
    behaviorProfile,
    currentSlots: formatSlotsForPrompt(initialSlots),
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

  // Phase 2 — slot extraction works on Anthropic, OpenAI, and OpenRouter
  // (Google still text-only — tool use shape would need a separate adapter).
  const provider = config.provider || "anthropic";
  const supportsSlots = provider === "anthropic" || provider === "openai" || provider === "openrouter";
  const slotHandler = supportsSlots
    ? makeSlotHandler({ deviceId, sessionId, path, lang, initialSlots })
    : null;
  const toolOpts = slotHandler
    ? { tools: [UPDATE_SLOTS_TOOL as unknown as Anthropic.Messages.Tool], onToolCall: slotHandler.onToolCall }
    : {};

  let readable: ReadableStream;
  switch (provider) {
    case "openai":
      readable = streamOpenAI(config, systemPrompt, messages, undefined, { onUsage, ...toolOpts });
      break;
    case "openrouter":
      readable = streamOpenAI(config, systemPrompt, messages, "https://openrouter.ai/api/v1", { onUsage, ...toolOpts });
      break;
    case "google":
      readable = streamGoogle(config, systemPrompt, messages, onUsage);
      break;
    default:
      readable = streamAnthropic(config, systemPrompt, messages, { onUsage, ...toolOpts });
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
