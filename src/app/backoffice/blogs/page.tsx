"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ImageEditorField from "@/components/PhotoEditor/ImageEditorField";
import PhotoEditorComp from "@/components/PhotoEditor";
import { buildMjPrompt } from "@/lib/mjPrompt";

const STATUSES = ["ทั้งหมด", "DRAFT", "APPROVED", "PUBLISHED"];
const STATUS_LABEL: Record<string, string> = {
  ทั้งหมด: "ทั้งหมด",
  DRAFT: "Draft",
  APPROVED: "Approved",
  PUBLISHED: "เผยแพร่",
};
const LANGS_ALL = ["ทั้งหมด", "en", "th", "cn", "de", "fr", "ru", "ko", "ja"];

type LangKey = "en" | "th" | "cn" | "de" | "fr" | "ru" | "ko" | "ja";
const LANG_LABELS: Record<LangKey, string> = {
  en: "EN", th: "TH", cn: "中文",
  de: "DE", fr: "FR", ru: "RU", ko: "한국어", ja: "日本語",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Translation = { lang: string; title: string; slug: string; excerpt: string; content: string; keywords: string[]; ogTitle: string; ogDescription: string; ogImage: string };
type VideoItem = { url: string; name: string };
type BlogStatusUpper = "DRAFT" | "APPROVED" | "PUBLISHED";
type BlogStatusLower = "draft" | "approved" | "published";
// Lean shape returned by GET /api/blogs (list endpoint). Heavy translation
// fields (content/excerpt/keywords/og*) and videos are NOT included — fetch
// the full row via GET /api/blogs/[id] when opening the edit panel.
type BlogListRow = {
  id: string; status: BlogStatusUpper; covers: string[];
  translations: { lang: string; title: string; slug: string }[];
  createdAt: string; updatedAt: string;
};
type BlogRow = {
  id: string; status: BlogStatusUpper; covers: string[]; imageIds?: string[]; mjPrompt?: string;
  translations: Translation[]; videos: VideoItem[];
  createdAt: string; updatedAt: string;
};
const ALL_LANGS: LangKey[] = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];
const EMPTY_LANG = { title: "", slug: "", excerpt: "", content: "", keywords: [] as string[], ogTitle: "", ogDescription: "", ogImage: "" };

type LangData = typeof EMPTY_LANG;
type FormState = {
  status: BlogStatusLower; covers: string[]; imageIds: string[]; videos: VideoItem[]; mjPrompt: string;
} & Record<LangKey, LangData>;

const EMPTY_FORM: FormState = {
  status: "draft", covers: [], imageIds: [], videos: [], mjPrompt: "",
  en: { ...EMPTY_LANG }, th: { ...EMPTY_LANG }, cn: { ...EMPTY_LANG },
  de: { ...EMPTY_LANG }, fr: { ...EMPTY_LANG }, ru: { ...EMPTY_LANG },
  ko: { ...EMPTY_LANG }, ja: { ...EMPTY_LANG },
};

// ── Tag Input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const add = () => { const v = input.trim(); if (v && !tags.includes(v)) onChange([...tags, v]); setInput(""); };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, background: "#161616", border: "1px solid #222", borderRadius: 7, padding: "6px 10px", minHeight: 40, alignItems: "center" }}>
      {tags.map((t) => (
        <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, background: "#1e3a5f", color: "#60a5fa", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>
          {t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
        </span>
      ))}
      <input value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={tags.length === 0 ? (placeholder ?? "พิมพ์แล้วกด Enter...") : ""}
        style={{ flex: 1, minWidth: 120, background: "transparent", border: "none", outline: "none", color: "#ccc", fontSize: 13, padding: "2px 0" }} />
    </div>
  );
}

// ── Midjourney Prompt ────────────────────────────────────────────────────────
// Legacy inline prompt builder — kept commented for reference.
// Use `buildMjPrompt` from `@/lib/mjPrompt` instead (NatGeo v2).
/* function _legacyBuildMjPrompt(title: string, excerpt: string): string {
  const src = `${title} ${excerpt}`.toLowerCase();

  type SceneMatch = { test: RegExp; scene: string; lens: "macro" | "wide" };
  const scenes: SceneMatch[] = [
    // Macro / small creatures
    { test: /nudibranch|sea slug|ทากทะเล/, scene: `extreme macro close-up of a vibrant Chromodoris nudibranch with electric blue body and orange rhinophores crawling across a purple sponge, translucent cerata catching the light, spiral egg ribbon nearby, miniature alien world`, lens: "macro" },
    { test: /seahorse|ม้าน้ำ/, scene: `a tiny pygmy seahorse clinging to a red gorgonian fan coral, perfectly camouflaged with matching bumpy texture, one eye visible staring at the camera, extreme detail`, lens: "macro" },
    { test: /octopus|หมึก/, scene: `a blue-ringed octopus displaying iridescent warning rings across its body, tentacles gripping a coral rock, intelligent eye in sharp focus, dark reef background`, lens: "macro" },
    { test: /frogfish|กบ/, scene: `a hairy frogfish sitting motionless on a sponge-covered rock, textured skin blending with surroundings, gaping mouth slightly open, bizarre and alien appearance`, lens: "macro" },
    { test: /cuttlefish|หมึกกระดอง/, scene: `a pharaoh cuttlefish hovering mid-water displaying rapid color-changing chromatophores across its body, hypnotic pulsing pattern, tentacles poised, W-shaped pupil in focus`, lens: "macro" },
    { test: /shrimp|กุ้ง|cleaner/, scene: `a translucent cleaner shrimp perched on a giant moray eel's head, delicate antennae spread wide, symbiotic relationship captured in intimate detail`, lens: "macro" },
    { test: /jellyfish|แมงกะพรุน/, scene: `a luminous moon jellyfish drifting through dark blue water, translucent bell pulsing with bioluminescent edges, trailing tentacles like silk ribbons, ethereal and otherworldly`, lens: "wide" },
    // Large pelagics
    { test: /manta/, scene: `a giant oceanic manta ray gliding directly toward the viewer, wingspan filling the frame, a tiny diver silhouette below for scale, plankton-rich blue water`, lens: "wide" },
    { test: /whale shark|ฉลามวาฬ/, scene: `a massive whale shark swimming alongside a diver, distinctive spotted pattern on its skin, dappled sunlight from above, the sheer scale dwarfing the human`, lens: "wide" },
    { test: /shark|ฉลาม/, scene: `a reef shark patrolling a vibrant coral wall, confident eye contact with the camera, other sharks visible in the deep blue background, powerful and graceful`, lens: "wide" },
    { test: /turtle|เต่า/, scene: `a hawksbill sea turtle gliding over a colorful coral garden, ancient wise eyes looking at the camera, sunlight filtering through the surface above, graceful and serene`, lens: "wide" },
    { test: /dolphin|โลมา/, scene: `a pod of spinner dolphins spiraling through crystal-clear water with shafts of sunlight, playful energy, bubbles trailing behind, joyful underwater ballet`, lens: "wide" },
    { test: /whale(?! shark)|วาฬ/, scene: `a humpback whale and calf suspended in deep blue water, the mother's enormous eye gazing at the viewer, calf tucked close, sense of maternal tenderness and immense scale`, lens: "wide" },
    // Dive sites & environments
    { test: /wreck|shipwreck|htms|sunken|เรือจม/, scene: `a scuba diver exploring a barnacle-encrusted shipwreck, shafts of light piercing through rusted hull openings, schools of fish swirling around corroded metal structures`, lens: "wide" },
    { test: /cave|cavern|cenote|ถ้ำ/, scene: `a diver with a torch illuminating a vast underwater cave, light beam cutting through dark blue water revealing ancient rock formations, sense of exploration into the unknown`, lens: "wide" },
    { test: /night div|ดำน้ำกลางคืน/, scene: `a diver's torch revealing a vibrant underwater world at night, bioluminescent particles floating in dark water, a colorful nudibranch in sharp focus, mysterious atmosphere`, lens: "macro" },
    { test: /deep|pinnacle|wall div|hin daeng|hin muang|หินแดง|หินม่วง/, scene: `a diver descending along a dramatic vertical wall covered in purple and red soft corals, the wall fading into the deep blue abyss below, tiny bubbles trailing upward`, lens: "wide" },
    { test: /coral|reef|ปะการัง|anemone/, scene: `an expansive healthy coral reef teeming with tropical fish, hard and soft corals in vibrant oranges pinks and purples, a diver hovering in perfect buoyancy`, lens: "wide" },
    // Knowledge & technique
    { test: /nitrox|trimix|rebreather|equipment|gear|อุปกรณ์/, scene: `close-up portrait of a technical diver underwater checking dive instruments, mask reflecting the blue ocean, bubbles streaming upward, focused and professional`, lens: "wide" },
    { test: /safe|safety|buoyancy|ปลอดภัย|ลอยตัว|ascent|emergency/, scene: `a scuba diver in perfect horizontal trim hovering motionless above a pristine reef, demonstrating textbook buoyancy, hand near BCD dump valve, signaling OK to buddy, controlled exhale bubbles rising`, lens: "wide" },
    { test: /photo|camera|ถ่ายภาพ|ถ่ายรูป/, scene: `an underwater photographer aiming a camera housing with dual strobes at a tiny colorful subject on the reef, focused concentration, blue water background with sun rays`, lens: "wide" },
    { test: /conservation|eco|อนุรักษ์|protect|restore/, scene: `a marine biologist carefully transplanting coral fragments onto a restoration frame underwater, new growth visible on older transplants, hopeful scene of ocean recovery`, lens: "wide" },
    { test: /training|certification|course|เรียน|คอร์ส/, scene: `an instructor demonstrating mask clearing to a student diver in crystal-clear shallow water, supportive hand gesture, bubbles and sunlight, safe learning environment`, lens: "wide" },
    // Boat & travel
    { test: /liveaboard|boat|safari|เรือ|ลิเวอะบอร์ด/, scene: `aerial view of a traditional wooden dive boat anchored over crystal-clear turquoise water, a coral reef visible beneath the surface, dramatic tropical clouds at golden hour`, lens: "wide" },
    { test: /freediv|apnea|ฟรีไดฟ์/, scene: `a freediver in a streamlined descent along a rope, single breath, monofin silhouette against a cathedral of light from the surface, deep blue gradient`, lens: "wide" },
    // Location
    { test: /island|koh |similan|surin|phi phi|lanta|tao|chang|racha|sail rock|chumphon|เกาะ/, scene: `breathtaking tropical island with dramatic limestone karsts, crystal-clear turquoise water revealing a coral reef below the surface, a lone dive boat anchored nearby, lush green vegetation`, lens: "wide" },
  ];

  const match = scenes.find(s => s.test.test(src));
  const scene = match?.scene ?? `${title.replace(/guide|tips|explained|complete|ultimate|\d{4}|[:&|–—,]/gi, "").replace(/\s+/g, " ").trim()}, underwater scene with marine life, clear tropical water, a scuba diver in the background`;
  const lens = match?.lens ?? "wide";
  const lensDesc = lens === "macro"
    ? `Nikkor 105mm f/2.8 macro lens, available light with single subtle strobe, shallow depth of field`
    : `Nikkor 14-30mm f/4 wide-angle lens, natural underwater sunlight, available light only`;

  return `RAW underwater photograph of ${scene}, shot on Nikon Z9 with Nauticam housing and ${lensDesc}, sharp focus on subject, documentary wildlife photography, National Geographic style, candid moment, unedited RAW file, photojournalism, no text no watermark --style raw --s 50 --v 7 --no illustration, painting, render, cgi, cartoon, drawing, anime, 3d, hdr, oversaturated`;
} */

type ModelOption = { id: string; label: string; blurb: string; price: string };

function MidjourneyPrompt({ title, excerpt, savedPrompt, onPromptChange, onImageGenerated }: { title: string; excerpt: string; savedPrompt: string; onPromptChange: (p: string) => void; onImageGenerated?: (imgId: string, coverUrl: string, ogUrl: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("siamdive.genModel") ?? "";
  });

  useEffect(() => {
    fetch("/api/blog-images/generate").then((r) => r.json()).then((d) => {
      if (Array.isArray(d.models)) {
        setModels(d.models);
        if (!selectedModel && d.models[0]) setSelectedModel(d.models[0].id);
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedModel) localStorage.setItem("siamdive.genModel", selectedModel);
  }, [selectedModel]);

  if (!title.trim() && !savedPrompt) return null;

  const prompt = savedPrompt || buildMjPrompt(title, excerpt);
  const isEdited = !!savedPrompt;
  const currentModel = models.find((m) => m.id === selectedModel);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    onPromptChange(buildMjPrompt(title, excerpt));
  };

  const handleGenerate = async () => {
    setGenerating(true); setError(null);
    try {
      const res = await fetch("/api/blog-images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio: "16:9", model: selectedModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      onImageGenerated?.(data.id, data.coverUrl, data.ogUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleImportUrl = async () => {
    const url = importUrl.trim();
    if (!url) { setError("paste a Midjourney image URL"); return; }
    setImporting(true); setError(null);
    try {
      const res = await fetch("/api/blog-images/from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, modelLabel: "midjourney" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      onImageGenerated?.(data.id, data.coverUrl, data.ogUrl);
      setImportUrl("");
      setShowImport(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Midjourney Prompt</label>
          {isEdited
            ? <span style={{ fontSize: 9, color: "#10b981", fontWeight: 600 }}>saved</span>
            : <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 600 }}>auto-generated</span>
          }
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
            title={currentModel?.blurb ?? ""}
            style={{ fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 12, border: "1px solid #222", background: "#111", color: "#a78bfa", cursor: "pointer", maxWidth: 220 }}>
            {models.map((m) => (<option key={m.id} value={m.id}>{m.label} · {m.price}</option>))}
          </select>
          <button onClick={handleGenerate} disabled={generating || !selectedModel}
            title={currentModel ? `${currentModel.label} — ${currentModel.blurb}` : "เลือก model ก่อน"}
            style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 16, border: "none", cursor: generating ? "wait" : "pointer", background: generating ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.15)", color: "#a78bfa", opacity: generating ? 0.6 : 1, transition: "all 0.2s" }}>
            {generating ? "Generating…" : "✨ Generate Image"}
          </button>
          <button onClick={handleCopy}
            style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 16, border: "none", cursor: "pointer", background: copied ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.12)", color: copied ? "#10b981" : "#60a5fa", transition: "all 0.2s" }}>
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={handleRegenerate} disabled={!title.trim()}
            title="สร้าง prompt ใหม่จาก title/excerpt"
            style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 16, border: "none", cursor: "pointer", background: "rgba(245,158,11,0.12)", color: "#f59e0b", transition: "all 0.2s" }}>
            Re-generate
          </button>
          <button onClick={() => setShowImport((v) => !v)}
            title="วาง URL รูปจาก Midjourney → import ตรง"
            style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 16, border: "none", cursor: "pointer", background: showImport ? "rgba(236,72,153,0.22)" : "rgba(236,72,153,0.12)", color: "#f472b6", transition: "all 0.2s" }}>
            📥 MJ URL
          </button>
        </div>
      </div>
      {showImport && (
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)}
            onPaste={(e) => {
              const v = e.clipboardData.getData("text").trim();
              if (v) { setImportUrl(v); }
            }}
            placeholder="https://cdn.midjourney.com/..../0_0.png"
            disabled={importing}
            style={{ flex: 1, fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "1px solid #2a2a2a", background: "#0d0d0d", color: "#ddd", outline: "none" }} />
          <button onClick={handleImportUrl} disabled={importing || !importUrl.trim()}
            style={{ fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: "none", cursor: importing ? "wait" : "pointer", background: importing ? "rgba(236,72,153,0.08)" : "rgba(236,72,153,0.22)", color: "#f472b6", opacity: importing ? 0.6 : 1 }}>
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
      )}
      {error && <p style={{ fontSize: 10, color: "#ef4444", marginBottom: 4 }}>❌ {error}</p>}
      <textarea value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        rows={4}
        style={{ width: "100%", background: "#0d0d0d", border: "1px solid #222", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#999", lineHeight: 1.6, wordBreak: "break-word", resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
      <p style={{ fontSize: 10, color: "#2a2a2a", marginTop: 4 }}>แก้ไข prompt ได้ตรงนี้ · จะบันทึกพร้อมกับบทความ</p>
    </div>
  );
}

// ── Cover Gallery (uses reusable ImageEditorField) ────────────────────────────
function CoverGallery({ images, onChange, onImageSaved }: {
  images: string[];
  onChange: (urls: string[]) => void;
  onImageSaved?: (result: { coverUrl: string; ogUrl: string; index: number }) => void;
}) {
  return (
    <ImageEditorField
      multi
      values={images}
      onChangeMulti={onChange}
      onImageSaved={onImageSaved}
      aspectRatio={16 / 9}
    />
  );
}

// ── OG Image Upload (uses Photo Editor with 1.91:1 aspect = Facebook/Twitter standard) ───
function OgImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  return <ImageEditorField value={value} onChange={onChange} aspectRatio={1200 / 630} hint="แนะนำ 1200×630px (1.91:1) — สำหรับ Facebook/Twitter share" />;
}

// ── Video Gallery ─────────────────────────────────────────────────────────────
function VideoGallery({ videos, onChange }: { videos: VideoItem[]; onChange: (v: VideoItem[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const upload = async (files: FileList | null) => {
    if (!files) return;
    const items: VideoItem[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) items.push({ url: data.url, name: file.name });
    }
    onChange([...videos, ...items]);
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
        {videos.map((v, i) => (
          <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #222", background: "#111" }}>
            <video src={v.url} muted style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
            <div style={{ padding: "6px 8px" }}>
              <p style={{ fontSize: 10, color: "#555", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</p>
            </div>
            <button onClick={() => onChange(videos.filter((_, j) => j !== i))}
              style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.8)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            {i === 0 && <span style={{ position: "absolute", top: 6, left: 6, fontSize: 9, fontWeight: 700, background: "#3b82f6", color: "#fff", padding: "2px 6px", borderRadius: 10 }}>MAIN</span>}
          </div>
        ))}
        <div onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
          style={{ borderRadius: 8, border: drag ? "2px dashed #3b82f6" : "2px dashed #333", background: "#111", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 4, aspectRatio: "16/9" }}>
          <span style={{ fontSize: 22, color: "#333" }}>+</span>
          <span style={{ fontSize: 10, color: "#2a2a2a", fontWeight: 600 }}>เพิ่มคลิป</span>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="video/*" multiple style={{ display: "none" }} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

// ── Rich Text Editor ──────────────────────────────────────────────────────────
type TBtn = { cmd: string; arg?: string; label: string; title: string } | "sep";
const TOOLBAR: TBtn[] = [
  { cmd: "bold", label: "B", title: "Bold" }, { cmd: "italic", label: "I", title: "Italic" },
  { cmd: "underline", label: "U", title: "Underline" }, { cmd: "strikeThrough", label: "S̶", title: "Strikethrough" },
  "sep",
  { cmd: "formatBlock", arg: "h1", label: "H1", title: "H1" }, { cmd: "formatBlock", arg: "h2", label: "H2", title: "H2" },
  { cmd: "formatBlock", arg: "h3", label: "H3", title: "H3" }, { cmd: "formatBlock", arg: "p", label: "¶", title: "Paragraph" },
  "sep",
  { cmd: "insertUnorderedList", label: "•—", title: "Bullet" }, { cmd: "insertOrderedList", label: "1.—", title: "Numbered" },
  "sep",
  { cmd: "justifyLeft", label: "⬅", title: "Left" }, { cmd: "justifyCenter", label: "☰", title: "Center" }, { cmd: "justifyRight", label: "➡", title: "Right" },
  "sep",
  { cmd: "formatBlock", arg: "blockquote", label: "❝", title: "Blockquote" },
  { cmd: "formatBlock", arg: "pre", label: "</>", title: "Code" },
  { cmd: "insertHorizontalRule", label: "—", title: "HR" },
  "sep",
  { cmd: "removeFormat", label: "Tx", title: "Clear" }, { cmd: "undo", label: "↩", title: "Undo" }, { cmd: "redo", label: "↪", title: "Redo" },
];

function RichEditor({ value, onChange, placeholder, minHeight = 300 }: { value: string; onChange: (h: string) => void; placeholder?: string; minHeight?: number }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtml = useRef("");
  const isLocal = useRef(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [editorState, setEditorState] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (isLocal.current) { isLocal.current = false; lastHtml.current = value; return; }
    if (value === lastHtml.current) return;
    editorRef.current.innerHTML = value;
    lastHtml.current = value;
  }, [value]);

  useEffect(() => {
    if (!fullscreen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [fullscreen]);

  const exec = useCallback((cmd: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg ?? undefined);
    const html = editorRef.current?.innerHTML ?? ""; lastHtml.current = html; isLocal.current = true; onChange(html);
  }, [onChange]);

  const handleInput = () => { const html = editorRef.current?.innerHTML ?? ""; lastHtml.current = html; isLocal.current = true; onChange(html); };

  // Upload original → open Photo Editor → insert processed image into rich text
  const insertImg = async (file: File) => {
    const fd = new FormData(); fd.append("original", file);
    const res = await fetch("/api/blog-images", { method: "POST", body: fd });
    const data = await res.json();
    if (data.id && data.originalUrl) {
      setEditorState({ id: data.id, url: data.originalUrl });
    }
  };

  const bs: React.CSSProperties = { padding: "5px 8px", borderRadius: 5, border: "none", background: "transparent", color: "#555", fontSize: 11, fontWeight: 700, cursor: "pointer", lineHeight: 1, whiteSpace: "nowrap" };

  const toolbar = (
    <div style={{ display: "flex", gap: 1, padding: "6px 8px", background: "#0d0d0d", borderBottom: "1px solid #1e1e1e", flexWrap: "wrap", alignItems: "center" }}>
      {TOOLBAR.map((b, i) => b === "sep"
        ? <div key={i} style={{ width: 1, height: 16, background: "#222", margin: "0 3px", alignSelf: "center" }} />
        : <button key={b.title} title={b.title} onMouseDown={(e) => { e.preventDefault(); exec(b.cmd, b.arg); }} style={bs}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#aaa")} onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}>{b.label}</button>
      )}
      <div style={{ width: 1, height: 16, background: "#222", margin: "0 3px", alignSelf: "center" }} />
      <button title="Link" onMouseDown={(e) => { e.preventDefault(); const u = prompt("URL:", "https://"); if (u) exec("createLink", u); }} style={bs}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#aaa")} onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}>🔗</button>
      <button title="Image" onMouseDown={(e) => { e.preventDefault(); imgInputRef.current?.click(); }} style={bs}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#aaa")} onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}>🖼</button>
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) insertImg(f); e.target.value = ""; }} />
      <div style={{ marginLeft: "auto" }}>
        <button title={fullscreen ? "ย่อ (Esc)" : "ขยาย"} onMouseDown={(e) => { e.preventDefault(); setFullscreen((v) => !v); }} style={{ ...bs, fontSize: 14 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#aaa")} onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}>{fullscreen ? "⊠" : "⛶"}</button>
      </div>
    </div>
  );

  const area = (
    <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput} data-placeholder={placeholder}
      style={{ minHeight: fullscreen ? 0 : minHeight, flex: fullscreen ? 1 : undefined, padding: "14px 16px", outline: "none", color: "#ccc", fontSize: 14, lineHeight: 1.75, background: "#161616", overflowY: "auto" }} />
  );

  const css = (
    <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#2a2a2a;pointer-events:none}
    [contenteditable] h1{font-size:1.6em;font-weight:900;margin:16px 0 8px;color:#e5e5e5}
    [contenteditable] h2{font-size:1.3em;font-weight:800;margin:14px 0 6px;color:#e5e5e5}
    [contenteditable] h3{font-size:1.1em;font-weight:700;margin:12px 0 4px;color:#e5e5e5}
    [contenteditable] p{margin:6px 0}[contenteditable] ul{padding-left:22px;list-style:disc;margin:6px 0}
    [contenteditable] ol{padding-left:22px;margin:6px 0}
    [contenteditable] blockquote{border-left:3px solid #3b82f6;padding:8px 14px;margin:10px 0;color:#888;font-style:italic;background:#111}
    [contenteditable] pre{background:#111;padding:12px;border-radius:6px;font-family:monospace;font-size:12px;color:#7dd3fc;overflow-x:auto;margin:8px 0}
    [contenteditable] a{color:#60a5fa;text-decoration:underline}[contenteditable] strong{font-weight:700}
    [contenteditable] em{font-style:italic}[contenteditable] img{max-width:100%;border-radius:6px;margin:8px 0;display:block}
    [contenteditable] hr{border:none;border-top:1px solid #222;margin:16px 0}`}</style>
  );

  const editorModal = editorState && (
    <PhotoEditorComp
      imageUrl={editorState.url}
      imageId={editorState.id}
      onSave={(result) => {
        editorRef.current?.focus();
        document.execCommand("insertImage", false, result.coverUrl);
        const html = editorRef.current?.innerHTML ?? ""; lastHtml.current = html; isLocal.current = true; onChange(html);
        setEditorState(null);
      }}
      onClose={() => setEditorState(null)}
    />
  );

  if (fullscreen) return (
    <>
      <div style={{ border: "1px solid #222", borderRadius: 8, height: minHeight, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "#2a2a2a" }}>กำลังแก้ไขแบบขยาย…</span>
      </div>
      <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
        {toolbar}{area}{css}
        <div style={{ padding: "10px 16px", borderTop: "1px solid #1e1e1e", background: "#0d0d0d", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setFullscreen(false)} style={{ fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 7, border: "1px solid #333", background: "transparent", color: "#666", cursor: "pointer" }}>⊠ ย่อกลับ (Esc)</button>
        </div>
      </div>
      {editorModal}
    </>
  );

  return (
    <div style={{ border: "1px solid #222", borderRadius: 8, overflow: "hidden" }}>
      {toolbar}{area}{css}
      {editorModal}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [langFilter, setLangFilter] = useState("ทั้งหมด");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<LangKey>("en");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugOverrides, setSlugOverrides] = useState<Set<LangKey>>(new Set());

  // Load blogs
  const loadBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blogs");
      setBlogs(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBlogs(); }, [loadBlogs]);

  const filtered = blogs.filter((b) => {
    const title = b.translations.find((t) => t.lang === "th")?.title ?? b.translations.find((t) => t.lang === "en")?.title ?? b.translations[0]?.title ?? "";
    return title.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter === "ทั้งหมด" || b.status === statusFilter) &&
      (langFilter === "ทั้งหมด" || b.translations.some((t) => t.lang === langFilter));
  });

  const setLangField = (lang: LangKey, field: string, value: string | string[]) =>
    setForm((f) => ({ ...f, [lang]: { ...f[lang], [field]: value } }));

  const cleanSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");

  const handleEnSlugChange = (val: string) => {
    const slug = cleanSlug(val);
    setForm((f) => {
      const next = { ...f, en: { ...f.en, slug } };
      for (const l of ALL_LANGS) {
        if (l !== "en" && !slugOverrides.has(l)) {
          next[l] = { ...next[l], slug };
        }
      }
      return next;
    });
  };

  const handleOtherSlugChange = (l: LangKey, val: string) => {
    const slug = cleanSlug(val);
    if (slug === form.en.slug) {
      setSlugOverrides((s) => { const n = new Set(s); n.delete(l); return n; });
    } else {
      setSlugOverrides((s) => new Set([...s, l]));
    }
    setLangField(l, "slug", slug);
  };

  const resetSlugToEn = (l: LangKey) => {
    setSlugOverrides((s) => { const n = new Set(s); n.delete(l); return n; });
    setLangField(l, "slug", form.en.slug);
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setSlugOverrides(new Set());
    setEditId(null); setActiveLang("en"); setPanelOpen(true);
  };

  const openEdit = async (row: BlogListRow) => {
    // List endpoint returns a lean projection — refetch the full row so we
    // have content/excerpt/keywords/og*/videos/imageIds for the edit form.
    const res = await fetch(`/api/blogs/${row.id}`);
    if (!res.ok) { alert("โหลดบทความไม่สำเร็จ"); return; }
    const b: BlogRow = await res.json();
    const langData = (l: LangKey): LangData => {
      const t = b.translations.find((x) => x.lang === l);
      return { title: t?.title ?? "", slug: t?.slug ?? "", excerpt: t?.excerpt ?? "", content: t?.content ?? "", keywords: t?.keywords ?? [], ogTitle: t?.ogTitle ?? "", ogDescription: t?.ogDescription ?? "", ogImage: t?.ogImage ?? "" };
    };
    const langs = Object.fromEntries(ALL_LANGS.map((l) => [l, langData(l)])) as Record<LangKey, LangData>;
    const enSlug = langs.en.slug;
    const overrides = new Set(ALL_LANGS.filter((l) => l !== "en" && langs[l].slug && langs[l].slug !== enSlug));
    setSlugOverrides(overrides);
    const statusLower = b.status.toLowerCase() as BlogStatusLower;
    setForm({ status: statusLower, covers: b.covers, imageIds: b.imageIds ?? [], videos: b.videos, mjPrompt: b.mjPrompt ?? "", ...langs });
    setEditId(b.id); setActiveLang("en"); setPanelOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // New blogs must be created in DRAFT — the API enforces this too.
      const submitStatus = editId ? form.status : "draft";
      const body = {
        status: submitStatus,
        covers: form.covers,
        imageIds: form.imageIds,
        videos: form.videos,
        mjPrompt: form.mjPrompt,
        translations: ALL_LANGS
          .filter((l) => form[l].title.trim())
          .map((l) => ({ lang: l, ...form[l] })),
      };
      const url = editId ? `/api/blogs/${editId}` : "/api/blogs";
      const method = editId ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setPanelOpen(false);
      await loadBlogs();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบบทความนี้?")) return;
    await fetch(`/api/blogs/${id}`, { method: "DELETE" });
    await loadBlogs();
  };

  const inputStyle: React.CSSProperties = { width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };

  return (
    <div style={{ padding: "clamp(16px, 4vw, 32px) clamp(16px, 4vw, 36px)", color: "#e5e5e5" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 3 }}>Blog / Articles</h1>
          <p style={{ fontSize: 12, color: "#333" }}>จัดการบทความและข่าวสาร</p>
        </div>
        <button onClick={openNew}
          style={{ background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          + เพิ่มบทความ
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <input type="text" placeholder="🔍  ค้นหาบทความ..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ background: "#111", border: "1px solid #222", borderRadius: 8, color: "#ccc", fontSize: 13, padding: "9px 14px", outline: "none", width: "100%", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#2a2a2a", marginRight: 2 }}>สถานะ:</span>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: statusFilter === s ? "#3b82f6" : "#181818", color: statusFilter === s ? "#fff" : "#444" }}>
              {STATUS_LABEL[s] ?? s}
            </button>
          ))}
          <span style={{ fontSize: 11, color: "#2a2a2a", marginLeft: 6, marginRight: 2 }}>ภาษา:</span>
          {LANGS_ALL.map((l) => (
            <button key={l} onClick={() => setLangFilter(l)}
              style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: langFilter === l ? "#3b82f6" : "#181818", color: langFilter === l ? "#fff" : "#444" }}>
              {l === "ทั้งหมด" ? "ทั้งหมด" : LANG_LABELS[l as LangKey]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as "touch" }}>
        <div style={{ background: "#0e0e0e", borderRadius: 10, border: "1px solid #1a1a1a", overflow: "hidden", minWidth: 460 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px", padding: "10px 16px", borderBottom: "1px solid #181818", fontSize: 10, fontWeight: 700, color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <span>บทความ</span><span>ภาษา</span><span>สถานะ</span><span style={{ textAlign: "right" }}>Action</span>
          </div>
          {loading ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "#2a2a2a", fontSize: 13 }}>กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "#2a2a2a", fontSize: 13 }}>ยังไม่มีบทความ — คลิก + เพิ่มบทความ</div>
          ) : filtered.map((b, i) => {
            const title = b.translations.find((t) => t.lang === "th")?.title ?? b.translations.find((t) => t.lang === "en")?.title ?? b.translations[0]?.title ?? "(ไม่มีชื่อ)";
            const date = new Date(b.updatedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
            return (
              <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px", padding: "12px 16px", borderBottom: i < filtered.length - 1 ? "1px solid #161616" : "none", alignItems: "center", fontSize: 13 }}>
                <div style={{ paddingRight: 12, overflow: "hidden" }}>
                  <p style={{ fontWeight: 500, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{title}</p>
                  <p style={{ fontSize: 10, color: "#2a2a2a" }}>{date}</p>
                </div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {b.translations.map((t) => (
                    <span key={t.lang} style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#1a1a1a", color: "#444" }}>{LANG_LABELS[t.lang as LangKey]}</span>
                  ))}
                </div>
                <span>
                  {(() => {
                    const styleByStatus: Record<BlogStatusUpper, { bg: string; color: string; label: string }> = {
                      DRAFT: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Draft" },
                      APPROVED: { bg: "rgba(59,130,246,0.12)", color: "#60a5fa", label: "Approved" },
                      PUBLISHED: { bg: "rgba(16,185,129,0.1)", color: "#10b981", label: "Live" },
                    };
                    const s = styleByStatus[b.status];
                    return (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    );
                  })()}
                </span>
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  <button onClick={() => openEdit(b)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid #222", background: "transparent", color: "#666", cursor: "pointer" }}>แก้ไข</button>
                  <button onClick={() => handleDelete(b.id)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", cursor: "pointer" }}>ลบ</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#222", marginTop: 12 }}>แสดง {filtered.length} / {blogs.length} บทความ</p>

      {/* ── Panel ── */}
      <>
        <div onClick={() => setPanelOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.7)", opacity: panelOpen ? 1 : 0, pointerEvents: panelOpen ? "auto" : "none", transition: "opacity 0.25s" }} />
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 61, width: "min(660px, 100vw)", background: "#0e0e0e", borderLeft: "1px solid #1a1a1a", transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)", transform: panelOpen ? "translateX(0)" : "translateX(100%)", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>{editId ? "แก้ไขบทความ" : "เพิ่มบทความใหม่"}</h2>
            <button onClick={() => setPanelOpen(false)} style={{ background: "none", border: "none", color: "#444", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>

            {/* Status */}
            {(() => {
              const statusStyles: Record<BlogStatusLower, { activeBg: string; activeColor: string; label: string }> = {
                draft: { activeBg: "rgba(245,158,11,0.12)", activeColor: "#f59e0b", label: "Draft" },
                approved: { activeBg: "rgba(59,130,246,0.15)", activeColor: "#60a5fa", label: "Approved" },
                published: { activeBg: "rgba(16,185,129,0.15)", activeColor: "#10b981", label: "เผยแพร่" },
              };
              // DRAFT→PUBLISHED must pass through APPROVED. Disable the direct
              // jump when we're looking at a draft.
              const canClick = (target: BlogStatusLower): boolean => {
                if (form.status === "published") return false; // PUBLISHED is terminal
                if (form.status === "draft" && target === "published") return false;
                return true;
              };
              return (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{ fontSize: 11, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>สถานะ</label>
                  {(["draft", "approved", "published"] as const).map((s) => {
                    const st = statusStyles[s];
                    const active = form.status === s;
                    const enabled = canClick(s);
                    return (
                      <button key={s}
                        disabled={!enabled}
                        onClick={() => enabled && setForm((f) => ({ ...f, status: s }))}
                        title={!enabled && s === "published" && form.status === "draft" ? "ต้อง Approve ก่อนถึงจะ Publish ได้" : undefined}
                        style={{ fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, border: "none", cursor: enabled ? "pointer" : "not-allowed", background: active ? st.activeBg : "#161616", color: active ? st.activeColor : enabled ? "#333" : "#222", opacity: enabled ? 1 : 0.5 }}>
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Midjourney Prompt */}
            <MidjourneyPrompt title={form.en.title} excerpt={form.en.excerpt} savedPrompt={form.mjPrompt}
              onPromptChange={(p) => setForm((f) => ({ ...f, mjPrompt: p }))}
              onImageGenerated={(imgId, coverUrl, ogUrl) => setForm((f) => {
                const next = { ...f, covers: [...f.covers, coverUrl], imageIds: [...f.imageIds, imgId] };
                // Populate OG image for every language that doesn't have one yet
                for (const l of ALL_LANGS) {
                  if (!next[l].ogImage) next[l] = { ...next[l], ogImage: ogUrl };
                }
                return next;
              })} />

            {/* Covers */}
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <label style={labelStyle}>Cover Images</label>
                <span style={{ fontSize: 10, color: "#6b7280" }}>แนะนำ 1200×800px (อัตราส่วน 3:2)</span>
              </div>
              <CoverGallery images={form.covers}
                onChange={(urls) => setForm((f) => ({ ...f, covers: urls }))}
                onImageSaved={({ ogUrl, index }) => {
                  if (index === 0) {
                    setForm((f) => {
                      const next = { ...f };
                      for (const l of ALL_LANGS) {
                        next[l] = { ...next[l], ogImage: ogUrl };
                      }
                      return next;
                    });
                  }
                }} />
            </div>

            {/* Lang tabs */}
            <div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
                {ALL_LANGS.map((l) => (
                  <button key={l} onClick={() => setActiveLang(l)}
                    style={{ padding: "6px 14px", borderRadius: 20, border: activeLang === l ? "none" : "1px solid #222", cursor: "pointer", fontSize: 12, fontWeight: 700, background: activeLang === l ? "#3b82f6" : "transparent", color: activeLang === l ? "#fff" : "#333", transition: "all 0.15s" }}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
              {ALL_LANGS.map((l) => (
                <div key={l} style={{ display: activeLang === l ? "flex" : "none", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Title ({LANG_LABELS[l]})</label>
                    <input type="text" value={form[l].title} onChange={(e) => setLangField(l, "title", e.target.value)}
                      placeholder={{ en: "Article title", th: "ชื่อบทความ", cn: "文章标题", de: "Artikeltitel", fr: "Titre de l'article", ru: "Заголовок", ko: "기사 제목", ja: "記事タイトル" }[l] ?? "Article title"} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Permalink</label>
                      {l !== "en" && (
                        slugOverrides.has(l)
                          ? <button onClick={() => resetSlugToEn(l)} style={{ fontSize: 10, color: "#60a5fa", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                              Reset เป็น EN slug
                            </button>
                          : <span style={{ fontSize: 10, color: "#2a2a2a", fontWeight: 600 }}>auto (ตาม EN)</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", background: "#161616", border: `1px solid ${l !== "en" && !slugOverrides.has(l) ? "#1a2a1a" : "#222"}`, borderRadius: 7, overflow: "hidden" }}>
                      <span style={{ padding: "9px 10px", fontSize: 12, color: "#2a2a2a", fontWeight: 600, borderRight: "1px solid #222", whiteSpace: "nowrap", flexShrink: 0 }}>/blog/</span>
                      {l === "en" ? (
                        <input type="text" value={form.en.slug}
                          onChange={(e) => handleEnSlugChange(e.target.value)}
                          placeholder="article-slug"
                          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#ccc", fontSize: 13, padding: "9px 12px" }} />
                      ) : (
                        <input type="text" value={form[l].slug}
                          onChange={(e) => handleOtherSlugChange(l, e.target.value)}
                          placeholder={form.en.slug || "article-slug"}
                          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: slugOverrides.has(l) ? "#ccc" : "#444", fontSize: 13, padding: "9px 12px" }} />
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Excerpt ({LANG_LABELS[l]})</label>
                    <textarea value={form[l].excerpt} onChange={(e) => setLangField(l, "excerpt", e.target.value)} rows={2}
                      placeholder={l === "th" ? "สรุปสั้นๆ..." : l === "cn" ? "简短描述..." : "Short summary..."}
                      style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Content ({LANG_LABELS[l]})</label>
                    <RichEditor value={form[l].content} onChange={(html) => setLangField(l, "content", html)}
                      placeholder={{ en: "Article content...", th: "เนื้อหาบทความ...", cn: "文章内容...", de: "Artikelinhalt...", fr: "Contenu de l'article...", ru: "Содержание...", ko: "기사 내용...", ja: "記事の内容..." }[l] ?? "Article content..."} minHeight={300} />
                  </div>
                  <div>
                    <label style={labelStyle}>Keywords / Hashtags ({LANG_LABELS[l]})</label>
                    <TagInput tags={form[l].keywords} onChange={(kw) => setLangField(l, "keywords", kw)}
                      placeholder="keyword หรือ #hashtag แล้วกด Enter..." />
                    <p style={{ fontSize: 10, color: "#2a2a2a", marginTop: 5 }}>กด Enter หรือ ,</p>
                  </div>

                  {/* OG / Social Share */}
                  <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      Open Graph — Social Share ({LANG_LABELS[l]})
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <label style={labelStyle}>OG Title <span style={{ color: "#333", fontWeight: 400 }}>(ปล่อยว่าง = ใช้ Title ด้านบน)</span></label>
                        <input type="text" value={form[l].ogTitle} onChange={(e) => setLangField(l, "ogTitle", e.target.value)}
                          placeholder={form[l].title || "SIAMDIVE — Dive Trips Thailand"}
                          style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>OG Description</label>
                        <textarea value={form[l].ogDescription} onChange={(e) => setLangField(l, "ogDescription", e.target.value)} rows={2}
                          placeholder="ทริปดำน้ำในประเทศไทย Daytrip และ Liveaboard..."
                          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                          <label style={labelStyle}>OG Image</label>
                          <span style={{ fontSize: 10, color: "#6b7280" }}>แนะนำ 1200×630px (อัตราส่วน 1.91:1)</span>
                        </div>
                        <OgImageUpload
                          value={form[l].ogImage}
                          onChange={(url) => setLangField(l, "ogImage", url)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid #1a1a1a", display: "flex", gap: 10, flexShrink: 0 }}>
            <button onClick={() => setPanelOpen(false)}
              style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #222", background: "transparent", color: "#555", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ยกเลิก
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: saving ? "#1e3a5f" : "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "กำลังบันทึก..." : "บันทึกบทความ"}
            </button>
          </div>
        </div>
      </>
    </div>
  );
}
