"use client";

// Lean photo editor for social posts.
// Uses an HTML canvas preview (no Konva to keep bundle small) and ships the
// edit JSON to /api/social/image/compose which renders the final image via
// sharp on the server.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SOCIAL_PRESETS, PRESET_GROUPS, type SocialPreset } from "@/lib/social/presets";

type TextBlock = {
  id: string;
  content: string;
  x: number; y: number;
  width: number;
  fontSize: number;
  fontWeight: number;
  fill: string;
  align: "left" | "center" | "right";
  shadow: boolean;
};

type WatermarkPos = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

// Map arbitrary W:H to the closest aspect supported by /api/blog-images/generate.
const SUPPORTED_ASPECTS: Array<{ id: string; ratio: number }> = [
  { id: "21:9", ratio: 21 / 9 },
  { id: "16:9", ratio: 16 / 9 },
  { id: "3:2",  ratio: 3 / 2 },
  { id: "4:3",  ratio: 4 / 3 },
  { id: "1:1",  ratio: 1 },
  { id: "3:4",  ratio: 3 / 4 },
  { id: "2:3",  ratio: 2 / 3 },
  { id: "9:16", ratio: 9 / 16 },
  { id: "9:21", ratio: 9 / 21 },
];
function closestAspect(w: number, h: number): string {
  const r = w / h;
  let best = SUPPORTED_ASPECTS[0];
  let bestDiff = Infinity;
  for (const a of SUPPORTED_ASPECTS) {
    const d = Math.abs(a.ratio - r);
    if (d < bestDiff) { bestDiff = d; best = a; }
  }
  return best.id;
}

type Template = {
  id: string;
  name: string;
  width: number;
  height: number;
  layout: {
    texts?: Omit<TextBlock, "id">[];
    watermark?: { enabled: boolean; position: string; opacity: number; scale: number };
    gradient?: { enabled: boolean; color?: string; opacity?: number; height?: number };
    backgroundFit?: "cover" | "contain";
  };
  thumbnailUrl: string;
  isSystem: boolean;
};

const COLORS = ["#ffffff", "#000000", "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9"];

export default function ShareImageEditor({
  initialImageUrl,
  blogId,
  blogTitle,
  blogExcerpt,
  onSave,
  onClose,
}: {
  initialImageUrl: string;
  blogId: string;
  blogTitle: string;
  blogExcerpt?: string;
  onSave: (url: string) => void;
  onClose: () => void;
}) {
  const [backgroundUrl, setBackgroundUrl] = useState(initialImageUrl);
  const [presetId, setPresetId] = useState("fb-link");
  const preset: SocialPreset = useMemo(
    () => SOCIAL_PRESETS.find(p => p.id === presetId) || SOCIAL_PRESETS[0],
    [presetId]
  );
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);
  const [useCustom, setUseCustom] = useState(false);
  const W = useCustom ? customW : preset.width;
  const H = useCustom ? customH : preset.height;

  // Two-line title default: yellow extra-bold headline + white regular subtitle.
  // The subtitle picks up blogExcerpt (first sentence) if available, else blank.
  const [texts, setTexts] = useState<TextBlock[]>(() => [
    {
      id: "t1",
      content: blogTitle,
      x: 60, y: 60,
      width: 900,
      fontSize: 72,
      fontWeight: 900,
      fill: "#fbbf24",
      align: "left",
      shadow: true,
    },
    {
      id: "t2",
      content: firstSentence(blogExcerpt || ""),
      x: 60, y: 60 + 72 * 1.2 * 1 + 16,
      width: 900,
      fontSize: 36,
      fontWeight: 400,
      fill: "#ffffff",
      align: "left",
      shadow: true,
    },
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>("t1");

  // bgIsClean = bg has no baked watermark (true for fresh ✨ generate or upload).
  // We seed it from the URL: /uploads/processed/ → baked; /uploads/originals/ or external → clean.
  const bgLooksClean = !initialImageUrl.includes("/uploads/processed/");
  const [bgIsClean, setBgIsClean] = useState(bgLooksClean);
  const [wmEnabled, setWmEnabled] = useState(bgLooksClean);
  const [wmPosition, setWmPosition] = useState<WatermarkPos>("bottom-right");
  const [wmOpacity, setWmOpacity] = useState(60);
  const [wmScale, setWmScale] = useState(15);
  const [wmImageUrl, setWmImageUrl] = useState<string>("");

  // Bottom-up gradient overlay (e.g. dark fade for readable white text).
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColor, setGradientColor] = useState<string>("#000000");
  const [gradientOpacity, setGradientOpacity] = useState(80);
  const [gradientHeight, setGradientHeight] = useState(50);

  const [mjPrompt, setMjPrompt] = useState<string>("");
  const [generating, setGenerating] = useState<string>("");
  const [models, setModels] = useState<Array<{ id: string; label: string; price: string; blurb: string }>>([]);
  const [modelId, setModelId] = useState<string>("nano-banana-pro");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  // Bounding box per text block in canvas coords — populated during render, used for hit-testing.
  const boundsRef = useRef<Map<string, { x: number; y: number; w: number; h: number }>>(new Map());
  // Active drag: which text + offset between cursor and block top-left at mousedown.
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  // Cached HTMLImageElements keyed by URL — avoids reload on every redraw while dragging.
  const imgCacheRef = useRef<Map<string, HTMLImageElement | null>>(new Map());

  // Load templates
  useEffect(() => {
    fetch("/api/social/templates", { credentials: "include" })
      .then(r => r.json())
      .then(d => setTemplates(d.templates || []))
      .catch(() => {});
  }, []);

  // Load blog mjPrompt — needed for ✨ Generate button (fal.ai requires a prompt)
  useEffect(() => {
    fetch(`/api/blogs/${blogId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.mjPrompt) setMjPrompt(d.mjPrompt); })
      .catch(() => {});
  }, [blogId]);

  // Load available fal.ai models
  useEffect(() => {
    fetch("/api/blog-images/generate", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.models) setModels(d.models); })
      .catch(() => {});
  }, []);

  // Load site branding — for watermark URL + default position/opacity/scale.
  useEffect(() => {
    fetch("/api/site-branding", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const list: Array<{ id: string; url: string }> = d.watermarks || [];
        const def = list.find(w => w.id === d.defaultWatermarkId) || list[0];
        if (def?.url) setWmImageUrl(def.url);
        if (typeof d.watermarkOpacity === "number") setWmOpacity(d.watermarkOpacity);
        if (typeof d.watermarkScale === "number") setWmScale(d.watermarkScale);
        if (typeof d.watermarkPosition === "string") setWmPosition(d.watermarkPosition as WatermarkPos);
      })
      .catch(() => {});
  }, []);

  // Compute preview scale to fit available space
  useEffect(() => {
    function resize() {
      if (!previewBoxRef.current) return;
      const box = previewBoxRef.current.getBoundingClientRect();
      const padding = 40;
      const sx = (box.width - padding) / W;
      const sy = (box.height - padding) / H;
      setPreviewScale(Math.min(sx, sy, 1));
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [W, H]);

  // Draw on canvas (bg → texts → watermark)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = W;
    c.height = H;

    let cancelled = false;
    const cachedLoad = async (url: string) => {
      const cache = imgCacheRef.current;
      if (cache.has(url)) return cache.get(url) ?? null;
      const img = await loadImage(url);
      cache.set(url, img);
      return img;
    };
    const render = async () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      if (backgroundUrl) {
        const bg = await cachedLoad(backgroundUrl);
        if (cancelled) return;
        if (bg) {
          const r = Math.max(W / bg.width, H / bg.height);
          const dw = bg.width * r;
          const dh = bg.height * r;
          ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
        }
      }

      // Bottom-up gradient overlay — drawn under the text so it darkens the bg
      // without dimming the title.
      if (gradientEnabled && gradientHeight > 0 && gradientOpacity > 0) {
        const bandH = Math.max(1, Math.round((H * gradientHeight) / 100));
        const y0 = H - bandH;
        const g = ctx.createLinearGradient(0, H, 0, y0);
        g.addColorStop(0, hexToRgba(gradientColor, gradientOpacity / 100));
        g.addColorStop(1, hexToRgba(gradientColor, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, y0, W, bandH);
      }

      drawTexts(ctx);

      if (wmEnabled && wmImageUrl) {
        const wm = await cachedLoad(wmImageUrl);
        if (cancelled || !wm) return;
        const targetW = Math.max(16, Math.round((W * wmScale) / 100));
        const targetH = (wm.height / wm.width) * targetW;
        const pad = Math.round(W * 0.025);
        let x = 0, y = 0;
        switch (wmPosition) {
          case "top-left":     x = pad; y = pad; break;
          case "top-right":    x = W - targetW - pad; y = pad; break;
          case "bottom-left":  x = pad; y = H - targetH - pad; break;
          case "bottom-right": x = W - targetW - pad; y = H - targetH - pad; break;
          case "center":       x = (W - targetW) / 2; y = (H - targetH) / 2; break;
        }
        ctx.globalAlpha = Math.max(0, Math.min(100, wmOpacity)) / 100;
        ctx.drawImage(wm, x, y, targetW, targetH);
        ctx.globalAlpha = 1;
      }
    };
    render();
    return () => { cancelled = true; };

    function drawTexts(ctx: CanvasRenderingContext2D) {
      boundsRef.current.clear();
      for (const t of texts) {
        ctx.font = `${t.fontWeight} ${t.fontSize}px Prompt, Inter, Arial, sans-serif`;
        ctx.fillStyle = t.fill;
        ctx.textAlign = t.align === "center" ? "center" : t.align === "right" ? "right" : "left";
        ctx.textBaseline = "top";
        if (t.shadow) {
          ctx.shadowColor = "rgba(0,0,0,0.55)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
        } else {
          ctx.shadowColor = "transparent";
        }
        const ax = t.align === "center" ? t.x + t.width / 2 : t.align === "right" ? t.x + t.width : t.x;
        const words = t.content.split(/\s+/);
        const lines: string[] = [];
        let cur = "";
        for (const w of words) {
          const test = cur ? `${cur} ${w}` : w;
          if (ctx.measureText(test).width <= t.width) cur = test;
          else { if (cur) lines.push(cur); cur = w; }
        }
        if (cur) lines.push(cur);
        lines.forEach((line, i) => {
          ctx.fillText(line, ax, t.y + i * t.fontSize * 1.2);
        });
        ctx.shadowColor = "transparent";

        // Record bounding box for hit-testing (use the block's full width/height,
        // not just measured text — so even empty space is grabbable).
        const lh = t.fontSize * 1.2;
        const blockH = Math.max(lh, lines.length * lh);
        boundsRef.current.set(t.id, { x: t.x, y: t.y, w: t.width, h: blockH });

        // Selection outline (dashed) — drawn on top so it's visible while editing.
        if (t.id === selectedTextId) {
          ctx.save();
          ctx.strokeStyle = "rgba(147,197,253,0.9)";
          ctx.lineWidth = Math.max(2, t.fontSize / 18);
          ctx.setLineDash([Math.max(8, t.fontSize / 6), Math.max(6, t.fontSize / 8)]);
          ctx.strokeRect(t.x, t.y, t.width, blockH);
          ctx.restore();
        }
      }
    }
  }, [W, H, backgroundUrl, texts, selectedTextId, wmEnabled, wmImageUrl, wmPosition, wmOpacity, wmScale, gradientEnabled, gradientColor, gradientOpacity, gradientHeight]);

  function updateSelected(patch: Partial<TextBlock>) {
    if (!selectedTextId) return;
    setTexts(texts.map(t => t.id === selectedTextId ? { ...t, ...patch } : t));
  }

  // Convert pointer event → canvas coords (account for previewScale CSS transform).
  function eventToCanvas(e: { clientX: number; clientY: number }) {
    const c = canvasRef.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    // rect is the *scaled* size, so dividing the offset by previewScale gives canvas-space.
    const x = (e.clientX - rect.left) / previewScale;
    const y = (e.clientY - rect.top) / previewScale;
    return { x, y };
  }
  function hitTest(x: number, y: number): string | null {
    // Iterate in reverse — last-drawn text wins (z-order top).
    for (let i = texts.length - 1; i >= 0; i--) {
      const b = boundsRef.current.get(texts[i].id);
      if (!b) continue;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return texts[i].id;
    }
    return null;
  }
  function onCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = eventToCanvas(e);
    if (!p) return;
    const hit = hitTest(p.x, p.y);
    if (!hit) { setSelectedTextId(null); return; }
    setSelectedTextId(hit);
    const t = texts.find(tx => tx.id === hit);
    if (!t) return;
    dragRef.current = { id: hit, dx: p.x - t.x, dy: p.y - t.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const p = eventToCanvas(e);
    if (!p) return;
    const nx = Math.round(p.x - drag.dx);
    const ny = Math.round(p.y - drag.dy);
    setTexts(prev => prev.map(t => t.id === drag.id ? { ...t, x: nx, y: ny } : t));
  }
  function onCanvasPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (dragRef.current) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    }
    dragRef.current = null;
  }
  function addText() {
    const id = `t${Date.now()}`;
    const newText: TextBlock = {
      id, content: "Text", x: 60, y: H / 2,
      width: W - 120, fontSize: 48, fontWeight: 700,
      fill: "#ffffff", align: "left", shadow: true,
    };
    setTexts([...texts, newText]);
    setSelectedTextId(id);
  }
  function removeSelected() {
    if (!selectedTextId) return;
    setTexts(texts.filter(t => t.id !== selectedTextId));
    setSelectedTextId(null);
  }

  function applyTemplate(tpl: Template) {
    // Try matching dims
    const presetMatch = SOCIAL_PRESETS.find(p => p.width === tpl.width && p.height === tpl.height);
    if (presetMatch) { setPresetId(presetMatch.id); setUseCustom(false); }
    else { setCustomW(tpl.width); setCustomH(tpl.height); setUseCustom(true); }
    if (tpl.layout.texts) {
      setTexts(tpl.layout.texts.map((t, i) => ({ ...t, id: `t${Date.now()}-${i}` })));
      setSelectedTextId(null);
    }
    if (tpl.layout.watermark) {
      setWmEnabled(tpl.layout.watermark.enabled);
      setWmPosition(tpl.layout.watermark.position as WatermarkPos);
      setWmOpacity(tpl.layout.watermark.opacity);
      setWmScale(tpl.layout.watermark.scale);
    }
    const g = tpl.layout.gradient;
    if (g) {
      setGradientEnabled(!!g.enabled);
      if (g.color) setGradientColor(g.color);
      if (typeof g.opacity === "number") setGradientOpacity(g.opacity);
      if (typeof g.height === "number") setGradientHeight(g.height);
    }
  }

  async function generateFromMjPrompt() {
    if (!mjPrompt) {
      setToast({ type: "err", msg: "blog ยังไม่มี MJ prompt — แก้ในหน้า blog editor ก่อน" });
      return;
    }
    const aspectRatio = closestAspect(W, H);
    setGenerating(aspectRatio);
    try {
      const res = await fetch("/api/blog-images/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: mjPrompt, aspectRatio, model: modelId, attachToBlog: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "regen failed");
      setBackgroundUrl(data.originalUrl || data.coverUrl);
      setBgIsClean(true);
      setWmEnabled(true);
      setToast({ type: "ok", msg: `สร้างแล้ว: ${aspectRatio} · ${modelId}` });
    } catch (err) {
      setToast({ type: "err", msg: err instanceof Error ? err.message : "regen failed" });
    } finally {
      setGenerating("");
    }
  }

  async function compose() {
    setSaving(true);
    try {
      const layout = {
        backgroundFit: "cover" as const,
        texts: texts.map(({ id: _id, ...rest }) => rest),
        watermark: { enabled: wmEnabled, position: wmPosition, opacity: wmOpacity, scale: wmScale },
        gradient: gradientEnabled
          ? { enabled: true, color: gradientColor, opacity: gradientOpacity, height: gradientHeight }
          : { enabled: false },
      };
      const res = await fetch("/api/social/image/compose", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backgroundUrl,
          width: W,
          height: H,
          layout,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "compose failed");

      // Optionally save as template
      if (saveAsTemplate && templateName.trim()) {
        await fetch("/api/social/templates", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: templateName.trim(),
            width: W, height: H,
            layout,
            thumbnailUrl: data.cdnUrl || data.url,
          }),
        });
      }

      onSave(data.cdnUrl || data.url);
    } catch (err) {
      setToast({ type: "err", msg: err instanceof Error ? err.message : "compose failed" });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const selected = texts.find(t => t.id === selectedTextId);

  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "#0a0a0a", color: "#e5e5e5", zIndex: 2000, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid #222" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #333", color: "#ccc", borderRadius: 4, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>← Cancel</button>
          <h3 style={{ fontSize: 13, margin: 0, fontWeight: 700 }}>✏️ Edit Image</h3>
        </div>
        <button
          onClick={compose}
          disabled={saving}
          style={{ background: "#1877f2", color: "#fff", border: "none", borderRadius: 6, padding: "7px 18px", fontWeight: 800, fontSize: 13, cursor: saving ? "wait" : "pointer" }}
        >
          {saving ? "..." : "Save & use"}
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* Sidebar */}
        <aside style={{ width: 280, borderRight: "1px solid #222", overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Preset */}
          <div>
            <label style={labelStyle}>ขนาด</label>
            <select value={useCustom ? "custom" : presetId} onChange={e => {
              if (e.target.value === "custom") setUseCustom(true);
              else { setUseCustom(false); setPresetId(e.target.value); }
            }} style={inputStyle}>
              {PRESET_GROUPS.map(group => {
                const items = SOCIAL_PRESETS.filter(p => p.group === group.id);
                if (items.length === 0) return null;
                return (
                  <optgroup key={group.id} label={`${group.icon} ${group.label}`}>
                    {items.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </optgroup>
                );
              })}
              <option value="custom">⚙️ Custom dimensions...</option>
            </select>
            {useCustom && (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input type="number" value={customW} onChange={e => setCustomW(Math.max(200, Math.min(4096, Number(e.target.value) || 0)))} style={inputStyle} placeholder="W" />
                <input type="number" value={customH} onChange={e => setCustomH(Math.max(200, Math.min(4096, Number(e.target.value) || 0)))} style={inputStyle} placeholder="H" />
              </div>
            )}
          </div>

          {/* Background source */}
          <div>
            <label style={labelStyle}>พื้นหลัง</label>

            {/* Model picker */}
            <select
              value={modelId}
              onChange={e => setModelId(e.target.value)}
              style={{ ...inputStyle, marginBottom: 6 }}
              title="เลือก fal.ai model ที่จะใช้สร้างภาพ"
            >
              {models.length === 0
                ? <option value={modelId}>{modelId} (loading...)</option>
                : models.map(m => (
                  <option key={m.id} value={m.id}>{m.label} · {m.price}</option>
                ))}
            </select>

            <button
              onClick={generateFromMjPrompt}
              disabled={!!generating || !mjPrompt}
              title={mjPrompt ? `ใช้ MJ prompt ของ blog สร้างด้วย ${modelId} @ ${closestAspect(W, H)}` : "blog ยังไม่มี MJ prompt"}
              style={{
                ...btnStyle,
                width: "100%",
                padding: "10px 8px",
                background: mjPrompt ? "#1f2937" : "#111",
                color: mjPrompt ? "#93c5fd" : "#555",
                borderColor: mjPrompt ? "#374151" : "#222",
                cursor: mjPrompt && !generating ? "pointer" : "not-allowed",
                fontWeight: 700,
              }}
            >
              {generating ? `กำลังสร้าง ${generating}...` : `✨ สร้างจาก MJ prompt`}
            </button>
            <div style={{ fontSize: 10, color: "#777", marginTop: 4, lineHeight: 1.4 }}>
              จะส่ง aspect <b style={{ color: "#93c5fd" }}>{closestAspect(W, H)}</b> (canvas {W}×{H}) ไป fal.ai →
              ภาพถูก crop เป็น cover ให้พอดี canvas อีกที
            </div>

            <label style={{ ...btnStyle, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginTop: 8, padding: "8px 6px" }}>
              📁 Upload รูปจากเครื่อง
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
                const data = await res.json();
                if (data.url) {
                  setBackgroundUrl(data.url);
                  setBgIsClean(true);
                  setWmEnabled(true);
                }
              }} />
            </label>
            {!mjPrompt && (
              <div style={{ fontSize: 10, color: "#666", marginTop: 6, lineHeight: 1.4 }}>
                blog นี้ยังไม่มี MJ prompt — เพิ่มในหน้า blog editor เพื่อใช้ ✨ generate
              </div>
            )}
          </div>

          {/* Templates */}
          {templates.length > 0 && (
            <div>
              <label style={labelStyle}>Template</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {templates.slice(0, 6).map(tpl => (
                  <button key={tpl.id} onClick={() => applyTemplate(tpl)} style={{ ...btnStyle, fontSize: 10, padding: "6px 4px", lineHeight: 1.2 }}>
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text layers */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={labelStyle}>Text</label>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={addText} style={miniBtn}>+ Add</button>
                {selectedTextId && <button onClick={removeSelected} style={{ ...miniBtn, color: "#ef4444" }}>🗑️</button>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
              {texts.map(t => (
                <button key={t.id} onClick={() => setSelectedTextId(t.id)} style={{
                  textAlign: "left", padding: "6px 10px", background: selectedTextId === t.id ? "#1f2937" : "#111", border: "1px solid #222", borderRadius: 4, color: "#ccc", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {t.content.slice(0, 30) || "(empty)"}
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div style={{ border: "1px solid #222", borderRadius: 6, padding: 10 }}>
              <textarea
                value={selected.content}
                onChange={e => updateSelected({ content: e.target.value })}
                rows={3}
                style={{ ...inputStyle, marginBottom: 8, fontFamily: "var(--font-prompt), sans-serif" }}
              />
              <Row label="Size">
                <input type="range" min={16} max={200} value={selected.fontSize} onChange={e => updateSelected({ fontSize: Number(e.target.value) })} style={{ width: "100%" }} />
                <span style={valStyle}>{selected.fontSize}px</span>
              </Row>
              <Row label="Weight">
                <select value={selected.fontWeight} onChange={e => updateSelected({ fontWeight: Number(e.target.value) })} style={inputStyle}>
                  <option value={400}>Regular</option>
                  <option value={600}>Semibold</option>
                  <option value={700}>Bold</option>
                  <option value={800}>Extra-bold</option>
                  <option value={900}>Black</option>
                </select>
              </Row>
              <Row label="Color">
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => updateSelected({ fill: c })} style={{ width: 22, height: 22, borderRadius: 4, border: selected.fill === c ? "2px solid #93c5fd" : "1px solid #333", background: c, cursor: "pointer" }} />
                  ))}
                </div>
              </Row>
              <Row label="Align">
                <div style={{ display: "flex", gap: 4 }}>
                  {(["left", "center", "right"] as const).map(a => (
                    <button key={a} onClick={() => updateSelected({ align: a })} style={{ ...miniBtn, background: selected.align === a ? "#1f2937" : "transparent" }}>{a}</button>
                  ))}
                </div>
              </Row>
              <Row label="X / Y">
                <input type="number" value={selected.x} onChange={e => updateSelected({ x: Number(e.target.value) || 0 })} style={inputStyle} />
                <input type="number" value={selected.y} onChange={e => updateSelected({ y: Number(e.target.value) || 0 })} style={inputStyle} />
              </Row>
              <Row label="Width">
                <input type="number" value={selected.width} onChange={e => updateSelected({ width: Number(e.target.value) || 100 })} style={inputStyle} />
              </Row>
              <Row label="Shadow">
                <input type="checkbox" checked={selected.shadow} onChange={e => updateSelected({ shadow: e.target.checked })} />
              </Row>
            </div>
          )}

          {/* Watermark */}
          <div style={{ border: "1px solid #222", borderRadius: 6, padding: 10 }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={wmEnabled} onChange={e => setWmEnabled(e.target.checked)} />
              Watermark
            </label>
            {!bgIsClean && (
              <div style={{ fontSize: 10, color: "#f59e0b", lineHeight: 1.4, marginBottom: 6 }}>
                ⚠️ ภาพปัจจุบันมี watermark ฝังในรูปแล้ว — เปิด overlay จะซ้อน 2 อัน
                กด ✨ generate หรือ upload รูปใหม่เพื่อใช้ overlay
              </div>
            )}
            {wmEnabled && (
              <>
                <Row label="Position">
                  <select value={wmPosition} onChange={e => setWmPosition(e.target.value as "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center")} style={inputStyle}>
                    <option value="top-left">Top-Left</option>
                    <option value="top-right">Top-Right</option>
                    <option value="bottom-left">Bottom-Left</option>
                    <option value="bottom-right">Bottom-Right</option>
                    <option value="center">Center</option>
                  </select>
                </Row>
                <Row label="Opacity">
                  <input type="range" min={0} max={100} value={wmOpacity} onChange={e => setWmOpacity(Number(e.target.value))} style={{ width: "100%" }} />
                  <span style={valStyle}>{wmOpacity}%</span>
                </Row>
                <Row label="Scale">
                  <input type="range" min={5} max={40} value={wmScale} onChange={e => setWmScale(Number(e.target.value))} style={{ width: "100%" }} />
                  <span style={valStyle}>{wmScale}%</span>
                </Row>
              </>
            )}
          </div>

          {/* Gradient overlay (bottom → top fade) */}
          <div style={{ border: "1px solid #222", borderRadius: 6, padding: 10 }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={gradientEnabled} onChange={e => setGradientEnabled(e.target.checked)} />
              Gradient ล่าง→บน
            </label>
            {gradientEnabled && (
              <>
                <Row label="สี">
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {["#000000", "#0f172a", "#1e3a8a", "#7c2d12", "#0f4c3a", "#4c0519"].map(c => (
                      <button key={c} onClick={() => setGradientColor(c)} style={{ width: 22, height: 22, borderRadius: 4, border: gradientColor === c ? "2px solid #93c5fd" : "1px solid #333", background: c, cursor: "pointer" }} />
                    ))}
                    <input type="color" value={gradientColor} onChange={e => setGradientColor(e.target.value)} style={{ width: 26, height: 22, border: "1px solid #333", borderRadius: 4, background: "transparent", padding: 0, cursor: "pointer" }} />
                  </div>
                </Row>
                <Row label="Opacity">
                  <input type="range" min={0} max={100} value={gradientOpacity} onChange={e => setGradientOpacity(Number(e.target.value))} style={{ width: "100%" }} />
                  <span style={valStyle}>{gradientOpacity}%</span>
                </Row>
                <Row label="Height">
                  <input type="range" min={10} max={100} value={gradientHeight} onChange={e => setGradientHeight(Number(e.target.value))} style={{ width: "100%" }} />
                  <span style={valStyle}>{gradientHeight}%</span>
                </Row>
              </>
            )}
          </div>

          {/* Save as template */}
          <div style={{ border: "1px solid #222", borderRadius: 6, padding: 10 }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={saveAsTemplate} onChange={e => setSaveAsTemplate(e.target.checked)} />
              บันทึกเป็น template
            </label>
            {saveAsTemplate && (
              <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="ชื่อ template" style={{ ...inputStyle, marginTop: 6 }} />
            )}
          </div>
        </aside>

        {/* Preview */}
        <div ref={previewBoxRef} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#000" }}>
          <div style={{ transform: `scale(${previewScale})`, transformOrigin: "center" }}>
            <canvas
              ref={canvasRef}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerCancel={onCanvasPointerUp}
              style={{
                background: "#000",
                display: "block",
                boxShadow: "0 0 0 1px #333",
                cursor: selectedTextId ? "move" : "default",
                touchAction: "none",
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 8, textAlign: "center" }}>
            คลิกข้อความเพื่อเลือก · ลากเพื่อย้ายตำแหน่ง
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: toast.type === "ok" ? "#10b981" : "#dc2626", color: "#fff", padding: "10px 18px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
          {toast.msg}
        </div>
      )}
    </div>,
    document.body
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 11 }}>
      <span style={{ width: 56, color: "#888" }}>{label}</span>
      <div style={{ flex: 1, display: "flex", gap: 4, alignItems: "center" }}>{children}</div>
    </div>
  );
}

function firstSentence(s: string): string {
  if (!s) return "";
  const m = s.match(/[^.!?。！？]+[.!?。！？]?/);
  return (m?.[0] ?? s).trim().slice(0, 120);
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    // No crossOrigin: canvas becomes tainted but we never call toDataURL (compose runs server-side),
    // so display works even if Bunny CDN doesn't return CORS headers.
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" };
const inputStyle: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#e5e5e5", border: "1px solid #333", borderRadius: 4, padding: "5px 8px", fontSize: 12, outline: "none" };
const btnStyle: React.CSSProperties = { background: "#111", border: "1px solid #222", color: "#ccc", borderRadius: 4, padding: "8px 6px", fontSize: 11, cursor: "pointer" };
const miniBtn: React.CSSProperties = { background: "transparent", border: "1px solid #333", color: "#ccc", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer" };
const valStyle: React.CSSProperties = { fontSize: 10, color: "#666", minWidth: 36, textAlign: "right" };
