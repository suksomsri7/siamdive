// Model registry for image generation via fal.ai.
// Each adapter translates our normalized input ({prompt, aspectRatio})
// into the model-specific params, calls fal.subscribe, and returns the
// generated image URL.
//
// Add a new model by adding one entry. If a model's output shape differs,
// add custom extraction logic in the adapter's `extract`.

import { fal } from "@fal-ai/client";

export type AspectRatio = "16:9" | "4:3" | "3:2" | "1:1" | "2:3" | "3:4" | "9:16" | "21:9" | "9:21";

export type ModelAdapter = {
  id: string;           // slug used in API body `model` field
  endpoint: string;     // fal endpoint path
  label: string;        // UI label
  blurb: string;        // short description
  price: string;        // e.g. "$0.06"
  defaultAspect: AspectRatio;
  buildInput: (prompt: string, aspectRatio: AspectRatio) => Record<string, unknown>;
  extract?: (data: unknown) => string | null;
};

// Most fal image models return { images: [{ url }] } — default extractor
function defaultExtract(data: unknown): string | null {
  const d = data as { images?: Array<{ url?: string }> };
  return d?.images?.[0]?.url ?? null;
}

// Aspect-ratio mapping helpers (various model APIs)
function toImageSizeEnum(ar: AspectRatio): string {
  const map: Record<AspectRatio, string> = {
    "16:9": "landscape_16_9", "4:3": "landscape_4_3", "3:2": "landscape_4_3",
    "1:1": "square_hd", "2:3": "portrait_4_3", "3:4": "portrait_4_3",
    "9:16": "portrait_16_9", "21:9": "landscape_16_9", "9:21": "portrait_16_9",
  };
  return map[ar];
}

function toWH(ar: AspectRatio, long = 1536): { width: number; height: number } {
  const ratios: Record<AspectRatio, [number, number]> = {
    "16:9": [16, 9], "4:3": [4, 3], "3:2": [3, 2], "1:1": [1, 1],
    "2:3": [2, 3], "3:4": [3, 4], "9:16": [9, 16], "21:9": [21, 9], "9:21": [9, 21],
  };
  const [a, b] = ratios[ar];
  if (a >= b) return { width: long, height: Math.round((long * b) / a / 8) * 8 };
  return { width: Math.round((long * a) / b / 8) * 8, height: long };
}

// Simple {prompt, aspect_ratio} adapter — works for most fal models
const withAspect = (prompt: string, ar: AspectRatio) => ({ prompt, aspect_ratio: ar, num_images: 1 });

// {prompt, image_size: {w,h}} adapter — for models that need explicit dimensions
const withWH = (long = 1536) => (prompt: string, ar: AspectRatio) => ({
  prompt, image_size: toWH(ar, long), num_images: 1,
});

// {prompt, image_size: enum} adapter
const withImageSizeEnum = (prompt: string, ar: AspectRatio) => ({
  prompt, image_size: toImageSizeEnum(ar), num_images: 1,
});

export const MODELS: ModelAdapter[] = [
  // ── Google ─────────────────────────────────────────────────────────────
  { id: "nano-banana-pro", endpoint: "fal-ai/nano-banana-pro",
    label: "Nano Banana Pro (Google)", price: "$0.15",
    blurb: "Google SOTA — realism + typography. แนะนำสำหรับ NatGeo ($0.30 @ 4K)",
    defaultAspect: "16:9", buildInput: withAspect },
  { id: "nano-banana-2", endpoint: "fal-ai/nano-banana-2",
    label: "Nano Banana 2 (Google)", price: "$0.08",
    blurb: "Google SOTA fast — $0.08 @1K (2K ×1.5, 4K ×2, 512px ×0.75)",
    defaultAspect: "16:9", buildInput: withAspect },
  { id: "nano-banana", endpoint: "fal-ai/nano-banana",
    label: "Nano Banana (Google)", price: "$0.04",
    blurb: "Google original Nano Banana",
    defaultAspect: "16:9", buildInput: withAspect },
  { id: "imagen4-ultra", endpoint: "fal-ai/imagen4/preview/ultra",
    label: "Imagen 4 Ultra (Google)", price: "$0.06",
    blurb: "Google Imagen รุ่นคุณภาพสูงสุด",
    defaultAspect: "16:9", buildInput: withAspect },
  { id: "imagen4", endpoint: "fal-ai/imagen4/preview",
    label: "Imagen 4 (Google)", price: "$0.04",
    blurb: "Google Imagen รุ่น standard",
    defaultAspect: "16:9", buildInput: withAspect },

  // ── FLUX family ────────────────────────────────────────────────────────
  { id: "flux-2-pro", endpoint: "fal-ai/flux-2-pro",
    label: "FLUX.2 Pro", price: "$0.045",
    blurb: "Flux รุ่น 2 — $0.03 first MP + $0.015/extra MP (1920×1080 = $0.045)",
    defaultAspect: "16:9", buildInput: withAspect },
  { id: "flux-1.1-ultra-raw", endpoint: "fal-ai/flux-pro/v1.1-ultra",
    label: "FLUX 1.1 Ultra (raw)", price: "$0.06",
    blurb: "Flux 1.1 photorealistic raw mode",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => ({ ...withAspect(prompt, ar), raw: true, safety_tolerance: "2", enable_safety_checker: true }) },
  { id: "flux-pro-v1.1", endpoint: "fal-ai/flux-pro/v1.1",
    label: "FLUX 1.1 Pro", price: "$0.04",
    blurb: "Flux 1.1 standard — improved composition",
    defaultAspect: "16:9", buildInput: withImageSizeEnum },
  { id: "flux-dev", endpoint: "fal-ai/flux/dev",
    label: "FLUX.1 [dev]", price: "$0.025",
    blurb: "Flux 12B — personal + commercial use",
    defaultAspect: "16:9", buildInput: withImageSizeEnum },
  { id: "flux-schnell", endpoint: "fal-ai/flux/schnell",
    label: "FLUX.1 [schnell]", price: "$0.003",
    blurb: "เร็วสุด — 1-4 steps, ถูกมาก",
    defaultAspect: "16:9", buildInput: withImageSizeEnum },
  { id: "flux-lora", endpoint: "fal-ai/flux-lora",
    label: "FLUX LoRA", price: "$0.025",
    blurb: "FLUX dev + LoRA support",
    defaultAspect: "16:9", buildInput: withImageSizeEnum },
  { id: "flux-krea-lora", endpoint: "fal-ai/flux-krea-lora/stream",
    label: "FLUX Krea LoRA", price: "$0.025",
    blurb: "Fast FLUX dev + Krea LoRA",
    defaultAspect: "16:9", buildInput: withImageSizeEnum },

  // ── ByteDance Seedream ────────────────────────────────────────────────
  { id: "seedream-v4", endpoint: "fal-ai/bytedance/seedream/v4/text-to-image",
    label: "Seedream 4.0 (ByteDance) ✓", price: "$0.03",
    blurb: "Photoreal + detail — cost-effective",
    defaultAspect: "16:9", buildInput: withWH(2048) },
  { id: "seedream-v5-lite", endpoint: "fal-ai/bytedance/seedream/v5/lite/text-to-image",
    label: "Seedream 5.0 Lite (ByteDance) ✓", price: "$0.035",
    blurb: "Seedream รุ่นใหม่สุด — flat $0.035 ทุกขนาดถึง 3K",
    defaultAspect: "16:9", buildInput: withWH(2048) },

  // ── Ideogram ──────────────────────────────────────────────────────────
  { id: "ideogram-v3", endpoint: "fal-ai/ideogram/v3",
    label: "Ideogram V3", price: "$0.08",
    blurb: "Photoreal + complex prompt understanding",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => ({ ...withAspect(prompt, ar), rendering_speed: "QUALITY" }) },

  // ── Recraft ───────────────────────────────────────────────────────────
  { id: "recraft-v4-pro", endpoint: "fal-ai/recraft/v4/pro/text-to-image",
    label: "Recraft V4 Pro ✓", price: "$0.08",
    blurb: "Production-quality, brand systems",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => ({ ...withWH(1536)(prompt, ar), style: "realistic_image" }) },
  { id: "recraft-v3", endpoint: "fal-ai/recraft/v3/text-to-image",
    label: "Recraft V3 ✓", price: "$0.04",
    blurb: "Production-quality, style consistency",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => ({ ...withWH(1536)(prompt, ar), style: "realistic_image" }) },

  // ── Alibaba / Baidu ───────────────────────────────────────────────────
  { id: "qwen-image", endpoint: "fal-ai/qwen-image",
    label: "Qwen Image (Alibaba)", price: "$0.03",
    blurb: "Alibaba — complex text rendering",
    defaultAspect: "16:9", buildInput: withImageSizeEnum },
  { id: "ernie-image-turbo", endpoint: "fal-ai/ernie-image/turbo",
    label: "ERNIE Image Turbo (Baidu)", price: "$0.02",
    blurb: "Baidu — fast, EN/CN/JP support",
    defaultAspect: "16:9", buildInput: withAspect },
  { id: "ernie-image", endpoint: "fal-ai/ernie-image",
    label: "ERNIE Image (Baidu)", price: "$0.04",
    blurb: "Baidu high-quality T2I",
    defaultAspect: "16:9", buildInput: withAspect },

  // ── WAN ───────────────────────────────────────────────────────────────
  { id: "wan-2.7-pro", endpoint: "fal-ai/wan/v2.7/pro/text-to-image",
    label: "WAN 2.7 Pro", price: "$0.05",
    blurb: "Enhanced detail + composition",
    defaultAspect: "16:9", buildInput: withAspect },
  { id: "wan-2.7", endpoint: "fal-ai/wan/v2.7/text-to-image",
    label: "WAN 2.7", price: "$0.03",
    blurb: "Advanced prompt understanding",
    defaultAspect: "16:9", buildInput: withAspect },

  // ── Others ────────────────────────────────────────────────────────────
  { id: "gpt-image-1.5", endpoint: "fal-ai/gpt-image-1.5/edit",
    label: "GPT Image 1.5 (OpenAI)", price: "$0.10",
    blurb: "OpenAI — high fidelity + strong prompt adherence",
    defaultAspect: "16:9", buildInput: withImageSizeEnum },
  { id: "grok-imagine", endpoint: "xai/grok-imagine-image/edit",
    label: "Grok Imagine (xAI)", price: "$0.06",
    blurb: "xAI Grok image generation",
    defaultAspect: "16:9", buildInput: withAspect },
  { id: "imagineart-1.5", endpoint: "imagineart/imagineart-1.5-preview/text-to-image",
    label: "ImagineArt 1.5", price: "$0.04",
    blurb: "Professional-grade visuals with readable text",
    defaultAspect: "16:9", buildInput: withAspect },
  { id: "bria-fibo", endpoint: "bria/fibo/generate",
    label: "BRIA FIBO", price: "$0.04",
    blurb: "SOTA open-source, commercial-safe licensed data",
    defaultAspect: "16:9", buildInput: withAspect },
];

// Default cover model when caller omits `model` (or sends an unknown id).
// Seedream 5.0 Lite — flat $0.035 photoreal, good for NatGeo-style covers.
const DEFAULT_MODEL_ID = "seedream-v5-lite";

export function getModel(id: string | undefined): ModelAdapter {
  return (
    MODELS.find((m) => m.id === id) ??
    MODELS.find((m) => m.id === DEFAULT_MODEL_ID) ??
    MODELS[0]
  );
}

export async function generateImage(model: ModelAdapter, prompt: string, aspectRatio: AspectRatio): Promise<string> {
  const input = model.buildInput(prompt, aspectRatio);
  const result = await fal.subscribe(model.endpoint, { input, logs: false });
  const extract = model.extract ?? defaultExtract;
  const url = extract(result.data);
  if (!url) throw new Error(`Model ${model.id} returned no image — raw: ${JSON.stringify(result.data).slice(0, 200)}`);
  return url;
}

