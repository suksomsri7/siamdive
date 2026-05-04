// Cost calculator for Ark AI usage tracking.
// Prices are USD per 1M tokens. Update when providers publish new tiers.
//
// Sources (last reviewed 2026-05-04):
//   Anthropic:   https://www.anthropic.com/pricing
//   OpenAI:      https://openai.com/api/pricing
//   Google:      https://ai.google.dev/pricing
//   OpenRouter:  per-model on https://openrouter.ai/models (we use Anthropic-passthrough rates here as a proxy)

type Pricing = { inputPerMTok: number; outputPerMTok: number };

const PRICING: Record<string, Pricing> = {
  // Anthropic Claude 4.x
  "claude-haiku-4-5":            { inputPerMTok: 1,  outputPerMTok: 5 },
  "claude-haiku-4-5-20251001":   { inputPerMTok: 1,  outputPerMTok: 5 },
  "claude-sonnet-4-6":           { inputPerMTok: 3,  outputPerMTok: 15 },
  "claude-opus-4-7":             { inputPerMTok: 15, outputPerMTok: 75 },

  // OpenAI
  "gpt-4o-mini":                 { inputPerMTok: 0.15, outputPerMTok: 0.6 },
  "gpt-4o":                      { inputPerMTok: 2.5,  outputPerMTok: 10 },
  "gpt-4.1-mini":                { inputPerMTok: 0.4,  outputPerMTok: 1.6 },
  "gpt-4.1":                     { inputPerMTok: 2,    outputPerMTok: 8 },

  // Google Gemini
  "gemini-2.0-flash":            { inputPerMTok: 0.1,  outputPerMTok: 0.4 },
  "gemini-2.5-flash":            { inputPerMTok: 0.3,  outputPerMTok: 2.5 },
  "gemini-2.5-pro":              { inputPerMTok: 1.25, outputPerMTok: 10 },
};

// Conservative fallback when an unknown model is used — assume Sonnet-class pricing
// so we over-estimate rather than under-budget.
const FALLBACK: Pricing = { inputPerMTok: 3, outputPerMTok: 15 };

export function getPricing(model: string): Pricing {
  if (PRICING[model]) return PRICING[model];
  // Loose match: e.g. "anthropic/claude-haiku-4-5" via OpenRouter
  const match = Object.keys(PRICING).find(k => model.includes(k));
  return match ? PRICING[match] : FALLBACK;
}

export function calcCostUsd(opts: { inputTokens: number; outputTokens: number; model: string }): number {
  const { inputPerMTok, outputPerMTok } = getPricing(opts.model);
  const inUsd  = (opts.inputTokens  / 1_000_000) * inputPerMTok;
  const outUsd = (opts.outputTokens / 1_000_000) * outputPerMTok;
  // Round to 6 decimals — single calls can be sub-cent.
  return Math.round((inUsd + outUsd) * 1e6) / 1e6;
}
