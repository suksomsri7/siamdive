// Run with: bun test src/lib/ark-ai/cost.test.ts
import { test, expect } from "bun:test";
import { calcCostUsd, getPricing } from "./cost";

test("Anthropic Haiku 4.5 — 1M in / 1M out = $1 + $5 = $6", () => {
  const cost = calcCostUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000, model: "claude-haiku-4-5-20251001" });
  expect(cost).toBeCloseTo(6, 6);
});

test("Anthropic Sonnet 4.6 — 100k in / 50k out = $0.30 + $0.75 = $1.05", () => {
  const cost = calcCostUsd({ inputTokens: 100_000, outputTokens: 50_000, model: "claude-sonnet-4-6" });
  expect(cost).toBeCloseTo(1.05, 6);
});

test("OpenAI gpt-4o-mini — 1M in / 1M out = $0.15 + $0.60 = $0.75", () => {
  const cost = calcCostUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000, model: "gpt-4o-mini" });
  expect(cost).toBeCloseTo(0.75, 6);
});

test("Gemini 2.0 Flash — 1M in / 1M out = $0.10 + $0.40 = $0.50", () => {
  const cost = calcCostUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000, model: "gemini-2.0-flash" });
  expect(cost).toBeCloseTo(0.5, 6);
});

test("OpenRouter prefix loose-match — anthropic/claude-haiku-4-5 = Haiku rates", () => {
  const cost = calcCostUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000, model: "anthropic/claude-haiku-4-5" });
  expect(cost).toBeCloseTo(6, 6);
});

test("Unknown model falls back to Sonnet rates ($3 + $15 per 1M = $18)", () => {
  const cost = calcCostUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000, model: "made-up-model-xyz" });
  expect(cost).toBeCloseTo(18, 6);
});

test("Zero tokens = $0", () => {
  expect(calcCostUsd({ inputTokens: 0, outputTokens: 0, model: "claude-haiku-4-5-20251001" })).toBe(0);
});

test("getPricing returns fallback for unknown model", () => {
  expect(getPricing("totally-unknown")).toEqual({ inputPerMTok: 3, outputPerMTok: 15 });
});

test("Sub-cent calls round to 6 decimals (no precision loss)", () => {
  const cost = calcCostUsd({ inputTokens: 100, outputTokens: 50, model: "claude-haiku-4-5-20251001" });
  // 100/1M * 1 + 50/1M * 5 = 0.0001 + 0.00025 = 0.00035
  expect(cost).toBeCloseTo(0.00035, 6);
});
