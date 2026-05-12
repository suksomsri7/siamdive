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

type Template = {
  id: string;
  name: string;
  width: number;
  height: number;
  layout: {
    texts?: Omit<TextBlock, "id">[];
    watermark?: { enabled: boolean; position: string; opacity: number; scale: number };
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
  onSave,
  onClose,
}: {
  initialImageUrl: string;
  blogId: string;
  blogTitle: string;
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

  const [texts, setTexts] = useState<TextBlock[]>([{
    id: "t1",
    content: blogTitle,
    x: 60, y: 60,
    width: 900,
    fontSize: 64,
    fontWeight: 800,
    fill: "#ffffff",
    align: "left",
    shadow: true,
  }]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>("t1");

  const [wmEnabled, setWmEnabled] = useState(true);
  const [wmPosition, setWmPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right" | "center">("bottom-right");
  const [wmOpacity, setWmOpacity] = useState(60);
  const [wmScale, setWmScale] = useState(15);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Load templates
  useEffect(() => {
    fetch("/api/social/templates", { credentials: "include" })
      .then(r => r.json())
      .then(d => setTemplates(d.templates || []))
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

  // Draw on canvas
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = W;
    c.height = H;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    if (backgroundUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // cover fit
        const r = Math.max(W / img.width, H / img.height);
        const dw = img.width * r;
        const dh = img.height * r;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        drawTexts(ctx);
      };
      img.onerror = () => drawTexts(ctx);
      img.src = backgroundUrl;
    } else {
      drawTexts(ctx);
    }

    function drawTexts(ctx: CanvasRenderingContext2D) {
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
        // wrap
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
      }
    }
  }, [W, H, backgroundUrl, texts]);

  function updateSelected(patch: Partial<TextBlock>) {
    if (!selectedTextId) return;
    setTexts(texts.map(t => t.id === selectedTextId ? { ...t, ...patch } : t));
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
      setWmPosition(tpl.layout.watermark.position as "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center");
      setWmOpacity(tpl.layout.watermark.opacity);
      setWmScale(tpl.layout.watermark.scale);
    }
  }

  async function regenerateBg(aspectRatio: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/blog-images/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId, aspectRatio, attachToBlog: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "regen failed");
      // The endpoint returns originalUrl + coverUrl. Use originalUrl (uncropped)
      setBackgroundUrl(data.originalUrl || data.coverUrl);
      setToast({ type: "ok", msg: "สร้างรูปใหม่แล้ว" });
    } catch (err) {
      setToast({ type: "err", msg: err instanceof Error ? err.message : "regen failed" });
    } finally {
      setSaving(false);
    }
  }

  async function compose() {
    setSaving(true);
    try {
      const layout = {
        backgroundFit: "cover" as const,
        texts: texts.map(({ id: _id, ...rest }) => rest),
        watermark: { enabled: wmEnabled, position: wmPosition, opacity: wmOpacity, scale: wmScale },
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <button onClick={() => regenerateBg("1:1")} disabled={saving} style={btnStyle}>🎨 1:1</button>
              <button onClick={() => regenerateBg("16:9")} disabled={saving} style={btnStyle}>🎨 16:9</button>
              <button onClick={() => regenerateBg("9:16")} disabled={saving} style={btnStyle}>🎨 9:16</button>
              <label style={{ ...btnStyle, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                📁 Upload
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // upload via existing /api/upload
                  const fd = new FormData();
                  fd.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
                  const data = await res.json();
                  if (data.url) setBackgroundUrl(data.url);
                }} />
              </label>
            </div>
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
        <div ref={previewBoxRef} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#000" }}>
          <div style={{ transform: `scale(${previewScale})`, transformOrigin: "center" }}>
            <canvas ref={canvasRef} style={{ background: "#000", display: "block", boxShadow: "0 0 0 1px #333" }} />
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

const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" };
const inputStyle: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#e5e5e5", border: "1px solid #333", borderRadius: 4, padding: "5px 8px", fontSize: 12, outline: "none" };
const btnStyle: React.CSSProperties = { background: "#111", border: "1px solid #222", color: "#ccc", borderRadius: 4, padding: "8px 6px", fontSize: 11, cursor: "pointer" };
const miniBtn: React.CSSProperties = { background: "transparent", border: "1px solid #333", color: "#ccc", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer" };
const valStyle: React.CSSProperties = { fontSize: 10, color: "#666", minWidth: 36, textAlign: "right" };
