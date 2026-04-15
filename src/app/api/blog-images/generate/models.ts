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
  extract?: (data: unknown) => string | null; // override if output shape differs
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

export const MODELS: ModelAdapter[] = [
  {
    id: "nano-banana-pro",
    endpoint: "fal-ai/nano-banana-pro",
    label: "Nano Banana Pro (Google)",
    blurb: "Google SOTA — realism + typography. แนะนำสำหรับ NatGeo",
    price: "$0.08",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => ({
      prompt,
      aspect_ratio: ar,
      num_images: 1,
    }),
  },
  {
    id: "flux-2-pro",
    endpoint: "fal-ai/flux-2-pro",
    label: "FLUX.2 Pro",
    blurb: "Flux รุ่น 2 — quality สูงสุดของ Flux",
    price: "$0.06",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => ({
      prompt,
      aspect_ratio: ar,
      num_images: 1,
    }),
  },
  {
    id: "flux-1.1-ultra-raw",
    endpoint: "fal-ai/flux-pro/v1.1-ultra",
    label: "FLUX 1.1 Ultra (raw)",
    blurb: "Flux 1.1 photorealistic raw mode (ตัวเดิม)",
    price: "$0.06",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => ({
      prompt,
      aspect_ratio: ar,
      num_images: 1,
      raw: true,
      safety_tolerance: "2",
      enable_safety_checker: true,
    }),
  },
  {
    id: "seedream-4",
    endpoint: "fal-ai/bytedance/seedream/v4/text-to-image",
    label: "Seedream 4.0 (ByteDance)",
    blurb: "Photoreal + detail — cost-effective",
    price: "$0.03",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => {
      const { width, height } = toWH(ar, 2048);
      return {
        prompt,
        image_size: { width, height },
        num_images: 1,
        enable_safety_checker: true,
      };
    },
  },
  {
    id: "gpt-image-1",
    endpoint: "fal-ai/gpt-image-1/text-to-image/byok",
    label: "GPT Image 1 (OpenAI)",
    blurb: "Prompt adherence แกร่ง — ต้องใช้ OpenAI BYOK key (ยังไม่ได้ตั้ง)",
    price: "$0.08",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => ({
      prompt,
      image_size: toImageSizeEnum(ar),
      num_images: 1,
    }),
  },
  {
    id: "ideogram-v3",
    endpoint: "fal-ai/ideogram/v3",
    label: "Ideogram V3",
    blurb: "Photoreal + complex prompt understanding",
    price: "$0.08",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => ({
      prompt,
      aspect_ratio: ar,
      rendering_speed: "QUALITY",
      num_images: 1,
    }),
  },
  {
    id: "recraft-v3",
    endpoint: "fal-ai/recraft/v3/text-to-image",
    label: "Recraft V3",
    blurb: "Production-quality, style consistency",
    price: "$0.04",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => {
      const { width, height } = toWH(ar, 1536);
      return {
        prompt,
        image_size: { width, height },
        style: "realistic_image",
      };
    },
  },
  {
    id: "imagen4-ultra",
    endpoint: "fal-ai/imagen4/preview/ultra",
    label: "Imagen 4 Ultra (Google)",
    blurb: "Google Imagen รุ่นคุณภาพสูงสุด",
    price: "$0.06",
    defaultAspect: "16:9",
    buildInput: (prompt, ar) => ({
      prompt,
      aspect_ratio: ar,
      num_images: 1,
    }),
  },
];

export function getModel(id: string | undefined): ModelAdapter {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

export async function generateImage(model: ModelAdapter, prompt: string, aspectRatio: AspectRatio): Promise<string> {
  const input = model.buildInput(prompt, aspectRatio);
  const result = await fal.subscribe(model.endpoint, { input, logs: false });
  const extract = model.extract ?? defaultExtract;
  const url = extract(result.data);
  if (!url) throw new Error(`Model ${model.id} returned no image — raw: ${JSON.stringify(result.data).slice(0, 200)}`);
  return url;
}
