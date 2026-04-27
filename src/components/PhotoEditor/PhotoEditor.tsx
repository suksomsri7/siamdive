"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Stage, Layer, Image as KonvaImage, Group, Rect, Text, Transformer } from "react-konva";
import useImage from "use-image";
import Konva from "konva";
import "konva/lib/filters/Brightness";
import "konva/lib/filters/Contrast";
import "konva/lib/filters/HSL";
import "konva/lib/filters/Blur";
import "konva/lib/filters/Enhance";
import "konva/lib/filters/Sepia";
import "konva/lib/filters/Grayscale";
import "konva/lib/filters/Invert";

// ── Types ─────────────────────────────────────────────────────────────────────
type AspectRatio = "3:2" | "1:1" | "16:9" | "free";
type WatermarkPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "custom";
type FontFamily = "var(--font-prompt)" | "var(--font-inter)" | "var(--font-geist)" | "var(--font-osage)";

export type EditJson = {
  crop: { x: number; y: number; width: number; height: number };
  watermark: {
    enabled: boolean;
    watermarkId: string;  // ID of selected Watermark (logo)
    x: number;
    y: number;
    scale: number;
    opacity: number;
    rotation: number;
  };
  texts: TextLayer[];
  adjust?: AdjustState;
};

export type AdjustState = {
  brightness: number;   // -1 to 1
  contrast: number;     // -100 to 100
  saturation: number;   // -2 to 10 (HSL)
  hue: number;          // -180 to 180 (HSL)
  luminance: number;    // -2 to 2 (HSL)
  blur: number;         // 0 to 40
  enhance: number;      // -1 to 1 (sharpen-ish)
  sepia: boolean;
  grayscale: boolean;
  invert: boolean;
};

const DEFAULT_ADJUST: AdjustState = {
  brightness: 0, contrast: 0, saturation: 0, hue: 0, luminance: 0,
  blur: 0, enhance: 0, sepia: false, grayscale: false, invert: false,
};

export type TextLayer = {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontStyle: "normal" | "bold" | "italic" | "italic bold";
  align: "left" | "center" | "right";
  rotation: number;
};

type WatermarkRow = { id: string; name: string; url: string; order: number };
type Branding = {
  watermarkUrl: string;
  defaultWatermarkId: string;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  watermarkPosition: string;
  watermarkScale: number;
  watermarks: WatermarkRow[];
};

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: "var(--font-prompt)", label: "Prompt (ภาษาไทย)" },
  { value: "var(--font-inter)", label: "Inter" },
  { value: "var(--font-geist)", label: "Geist" },
  { value: "var(--font-osage)", label: "Noto Sans Osage" },
];

const COLORS = ["#ffffff", "#000000", "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

// Output canvas dimensions — width fixed at 1200, height computed from aspectRatio
const DEFAULT_ASPECT = 16 / 9; // 1.78 — matches frontend blog list display
const CANVAS_W = 1200;

type Tab = "crop" | "adjust" | "watermark" | "text";

// ── Main editor ───────────────────────────────────────────────────────────────
export default function PhotoEditor({
  imageUrl,
  imageId,
  initialEdit,
  onSave,
  onClose,
  aspectRatio,
}: {
  imageUrl: string;
  imageId: string;
  initialEdit?: EditJson;
  onSave: (result: { coverUrl: string; ogUrl: string; editJson: string }) => void;
  onClose: () => void;
  aspectRatio?: number;
}) {
  // Canvas height computed from aspect ratio (round to even pixel)
  const aspect = aspectRatio ?? DEFAULT_ASPECT;
  const CANVAS_H = Math.round(CANVAS_W / aspect / 2) * 2;
  const [tab, setTab] = useState<Tab>("crop");
  const [saving, setSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);
  const sourceImageRef = useRef<Konva.Image>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [adjust, setAdjust] = useState<AdjustState>(DEFAULT_ADJUST);

  // Load source image + branding
  // NOTE: don't pass crossOrigin for same-origin URLs — Next.js doesn't return CORS headers
  // for static /uploads files, so passing "anonymous" would cause the image to fail loading
  const [sourceImage] = useImage(imageUrl);
  const [branding, setBranding] = useState<Branding | null>(null);

  // Edit state
  const [imageScale, setImageScale] = useState(1);
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
  const [watermark, setWatermark] = useState({
    enabled: false,
    watermarkId: "",
    x: CANVAS_W * 0.5,
    y: CANVAS_H * 0.5,
    scale: 0.15,
    opacity: 0.6,
    rotation: 0,
  });
  const [texts, setTexts] = useState<TextLayer[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Resolve watermark URL from selected ID
  const selectedWatermarkUrl = branding?.watermarks?.find(w => w.id === watermark.watermarkId)?.url ?? "";
  const [watermarkImg] = useImage(selectedWatermarkUrl);

  // Load branding settings
  useEffect(() => {
    fetch("/api/site-branding").then(r => r.json()).then((b: Branding) => {
      setBranding(b);
      setWatermark(w => ({
        ...w,
        // Only set defaults if not re-editing (watermarkId is still empty)
        ...(w.watermarkId ? {} : {
          enabled: b.watermarkEnabled,
          watermarkId: b.defaultWatermarkId ?? "",
          opacity: b.watermarkOpacity / 100,
          scale: b.watermarkScale / 100,
          // Position will be computed once watermark image loads (see effect below)
        }),
      }));
    });
  }, []);

  // Position watermark based on branding preset + actual image dimensions.
  // Runs when watermark image loads or scale/position setting changes.
  const wmPositionedRef = useRef(false);
  useEffect(() => {
    if (!watermarkImg || !branding) return;
    // Only auto-position once (on first load), not on every drag
    if (wmPositionedRef.current) return;
    wmPositionedRef.current = true;

    const wmW = watermarkImg.width * watermark.scale;
    const wmH = watermarkImg.height * watermark.scale;
    const pad = 24; // margin from canvas edge

    // Compute position so the watermark edge sits `pad` pixels from the canvas edge
    const posMap: Record<string, { x: number; y: number }> = {
      "top-left":     { x: wmW / 2 + pad,              y: wmH / 2 + pad },
      "top-right":    { x: CANVAS_W - wmW / 2 - pad,   y: wmH / 2 + pad },
      "bottom-left":  { x: wmW / 2 + pad,              y: CANVAS_H - wmH / 2 - pad },
      "bottom-right": { x: CANVAS_W - wmW / 2 - pad,   y: CANVAS_H - wmH / 2 - pad },
      "center":       { x: CANVAS_W / 2,                y: CANVAS_H / 2 },
    };
    const pos = posMap[branding.watermarkPosition] ?? posMap["bottom-right"];
    setWatermark(w => ({ ...w, x: pos.x, y: pos.y }));
  }, [watermarkImg, branding, watermark.scale, CANVAS_H]);

  // Apply initial edit if re-editing
  useEffect(() => {
    if (initialEdit) {
      wmPositionedRef.current = true; // skip auto-positioning, use saved coords
      setWatermark(initialEdit.watermark);
      setTexts(initialEdit.texts);
      if (initialEdit.adjust) setAdjust(initialEdit.adjust);
    }
  }, [initialEdit]);

  // Apply Konva filters whenever image loads or adjust state changes
  useEffect(() => {
    const node = sourceImageRef.current;
    if (!node || !sourceImage) return;

    // cache() must be called before filters work
    node.cache();

    const activeFilters: any[] = [];
    if (adjust.brightness !== 0) activeFilters.push(Konva.Filters.Brighten);
    if (adjust.contrast !== 0) activeFilters.push(Konva.Filters.Contrast);
    if (adjust.saturation !== 0 || adjust.hue !== 0 || adjust.luminance !== 0) activeFilters.push(Konva.Filters.HSL);
    if (adjust.blur > 0) activeFilters.push(Konva.Filters.Blur);
    if (adjust.enhance !== 0) activeFilters.push(Konva.Filters.Enhance);
    if (adjust.sepia) activeFilters.push(Konva.Filters.Sepia);
    if (adjust.grayscale) activeFilters.push(Konva.Filters.Grayscale);
    if (adjust.invert) activeFilters.push(Konva.Filters.Invert);

    node.filters(activeFilters);
    node.brightness(adjust.brightness);
    node.contrast(adjust.contrast);
    node.saturation(adjust.saturation);
    node.hue(adjust.hue);
    node.luminance(adjust.luminance);
    node.blurRadius(adjust.blur);
    node.enhance(adjust.enhance);

    node.getLayer()?.batchDraw();
  }, [sourceImage, adjust, imageScale, imagePos]);

  // Fit source image into canvas (initial)
  useEffect(() => {
    if (sourceImage && imageScale === 1 && imagePos.x === 0 && imagePos.y === 0) {
      const sw = sourceImage.width;
      const sh = sourceImage.height;
      // Scale to "cover" the canvas
      const scale = Math.max(CANVAS_W / sw, CANVAS_H / sh);
      const w = sw * scale;
      const h = sh * scale;
      setImageScale(scale);
      setImagePos({ x: (CANVAS_W - w) / 2, y: (CANVAS_H - h) / 2 });
    }
  }, [sourceImage]);

  // Responsive stage sizing using ResizeObserver — fires whenever the canvas
  // container changes size (window resize, sidebar appear/hide, layout shift,
  // first paint). More reliable than window.resize alone, which doesn't fire
  // when the container appears or its parent flex layout settles.
  //
  // Allows scaling up to 2.5× so on large desktops the editor uses real estate
  // instead of being capped at the 1200×CANVAS_H source resolution.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      // Skip if container has not been laid out yet — observer will fire again
      if (rect.width < 50 || rect.height < 50) return;
      const padding = 64; // generous breathing room — canvas doesn't crowd the sidebar
      const availW = rect.width - padding;
      const availH = rect.height - padding;
      const scaleByW = availW / CANVAS_W;
      const scaleByH = availH / CANVAS_H;
      // Cap at 1.6× — bigger than the old 1× cap but doesn't dominate the layout.
      // Source image is still the full-resolution upload so upscaling stays sharp.
      const scale = Math.max(0.2, Math.min(scaleByW, scaleByH, 1.6));
      setStageSize({ width: Math.floor(CANVAS_W * scale), height: Math.floor(CANVAS_H * scale) });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [aspect]);

  // Image-load diagnostics — surface a clear error if the source image URL
  // fails to load (404, CORS, blocked). Without this the user just sees a
  // blank editor and has no idea why.
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  useEffect(() => {
    if (!imageUrl) return;
    setImageLoadError(null);
    const probe = new window.Image();
    probe.onload = () => setImageLoadError(null);
    probe.onerror = () => setImageLoadError(`โหลดรูปไม่ได้: ${imageUrl}`);
    probe.src = imageUrl;
  }, [imageUrl]);

  const displayScale = stageSize.width / CANVAS_W || 1;

  // ── Save handler ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!stageRef.current) {
      alert("Canvas ยังไม่พร้อม");
      return;
    }
    if (!sourceImage) {
      alert("ภาพยังโหลดไม่เสร็จ");
      return;
    }
    setSaving(true);
    try {
      // Deselect any text + force redraw
      setSelectedTextId(null);
      stageRef.current.draw();
      await new Promise(r => setTimeout(r, 50));

      // Render at full 1200x800 resolution
      // Use JPEG quality 0.92 — much smaller than PNG (2-5 MB → 200-400 KB)
      // Server will re-encode to WebP/JPG anyway, so lossless PNG is wasted
      let dataUrl: string;
      try {
        dataUrl = stageRef.current.toDataURL({
          mimeType: "image/jpeg",
          quality: 0.92,
          pixelRatio: 1 / displayScale,
        });
      } catch (canvasErr: any) {
        console.error("toDataURL failed:", canvasErr);
        if (canvasErr?.name === "SecurityError" || String(canvasErr).includes("tainted")) {
          throw new Error("Canvas ถูก tainted (CORS) — ลอง refresh หน้าแล้วเปิดใหม่");
        }
        throw new Error("Render canvas ล้มเหลว: " + (canvasErr?.message ?? canvasErr));
      }

      const blob = await (await fetch(dataUrl)).blob();

      const editJson: EditJson = {
        crop: { x: imagePos.x, y: imagePos.y, width: (sourceImage?.width ?? 0) * imageScale, height: (sourceImage?.height ?? 0) * imageScale },
        watermark,
        texts,
        adjust,
      };

      const fd = new FormData();
      fd.append("id", imageId);
      fd.append("rendered", blob, "rendered.jpg");
      fd.append("editJson", JSON.stringify(editJson));

      const res = await fetch("/api/blog-images", { method: "POST", body: fd });
      if (!res.ok) {
        const errText = await res.text();
        console.error("API error response:", res.status, errText);
        throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`);
      }
      const result = await res.json();
      console.log("Save success:", result);
      onSave({ coverUrl: result.coverUrl, ogUrl: result.ogUrl, editJson: JSON.stringify(editJson) });
    } catch (e: any) {
      console.error("Save failed:", e);
      alert("บันทึกล้มเหลว: " + (e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }, [imageId, imagePos, imageScale, sourceImage, displayScale, watermark, texts, adjust, onSave]);

  // ── Add text ────────────────────────────────────────────────────────────────
  const addText = () => {
    const newText: TextLayer = {
      id: `t-${Date.now()}`,
      content: "ข้อความใหม่",
      x: CANVAS_W / 2 - 100,
      y: CANVAS_H / 2 - 30,
      fontSize: 60,
      fontFamily: "var(--font-prompt)",
      fill: "#ffffff",
      fontStyle: "bold",
      align: "center",
      rotation: 0,
    };
    setTexts([...texts, newText]);
    setSelectedTextId(newText.id);
    setTab("text");
  };

  const updateText = (id: string, patch: Partial<TextLayer>) => {
    setTexts(texts.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const deleteText = (id: string) => {
    setTexts(texts.filter(t => t.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  const selectedText = texts.find(t => t.id === selectedTextId);

  // Block body scroll while editor is open — prevents background page from
  // scrolling when user wheels over the canvas.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── UI ──────────────────────────────────────────────────────────────────────
  // Render via Portal directly into <body> so the fixed-position modal escapes
  // any ancestor with `transform`, `filter`, or `perspective` set — those CSS
  // properties create a containing block that breaks `position: fixed`, which
  // is why the editor was rendering inside a small column instead of full-screen.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 9999,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid #1a1a1a", background: "#0a0a0a",
      }}>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "#888", fontSize: 24, cursor: "pointer", padding: 0, lineHeight: 1,
        }}>×</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>แก้ไขภาพ</div>
          {/* Sidebar collapse toggle — desktop only, gives canvas full width */}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? "แสดง panel" : "ซ่อน panel (canvas เต็มจอ)"}
            style={{
              background: sidebarCollapsed ? "#1e3a5f" : "#161616",
              border: `1px solid ${sidebarCollapsed ? "#3b82f6" : "#222"}`,
              color: sidebarCollapsed ? "#60a5fa" : "#666",
              fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 4, cursor: "pointer",
            }}
          >
            {sidebarCollapsed ? "▶ Panel" : "◀ ซ่อน Panel"}
          </button>
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          background: "#3b82f6", border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
          padding: "8px 18px", borderRadius: 6, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1,
        }}>
          {saving ? "..." : "บันทึก"}
        </button>
      </div>

      {/* Body — responsive flex (column on mobile, row on desktop) */}
      <div className="pe-body" style={{
        flex: 1, display: "flex", overflow: "hidden",
      }}>
        {/* Canvas area */}
        <div ref={containerRef} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#0a0a0a", overflow: "hidden", position: "relative",
          minHeight: 320, // safety net so the canvas region always has measurable height
          backgroundImage: "linear-gradient(45deg, #161616 25%, transparent 25%), linear-gradient(-45deg, #161616 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #161616 75%), linear-gradient(-45deg, transparent 75%, #161616 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
        }}>
          {/* Size badge — bottom left, shows export canvas dimensions */}
          {stageSize.width > 0 && (
            <div style={{
              position: "absolute", bottom: 8, left: 8, zIndex: 5,
              fontSize: 10, fontWeight: 700, color: "#444",
              background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 3,
              fontFamily: "monospace", letterSpacing: "0.05em",
            }}>
              {CANVAS_W}×{CANVAS_H}
            </div>
          )}
          {/* Loading / error overlays — shown when source image is not yet ready */}
          {!sourceImage && !imageLoadError && (
            <div style={{ color: "#666", fontSize: 13, fontWeight: 600 }}>กำลังโหลดรูป...</div>
          )}
          {imageLoadError && (
            <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, textAlign: "center", padding: 16, maxWidth: 500 }}>
              ⚠ {imageLoadError}
              <div style={{ fontSize: 11, color: "#888", marginTop: 8, fontWeight: 400 }}>
                ลองปิด editor แล้วอัปโหลดใหม่ — ถ้ายังไม่ได้แจ้ง dev
              </div>
            </div>
          )}
          {stageSize.width > 0 && sourceImage && (
            <div style={{
              position: "relative",
              width: stageSize.width,
              height: stageSize.height,
              boxShadow: "0 0 0 2px #3b82f6, 0 0 40px rgba(0,0,0,0.8)",
              borderRadius: 2,
              overflow: "hidden",
              background: "#000",
            }}>
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              scale={{ x: displayScale, y: displayScale }}
            >
              <Layer>
                {/* Background image */}
                <KonvaImage
                  ref={sourceImageRef}
                  image={sourceImage}
                  x={imagePos.x}
                  y={imagePos.y}
                  width={sourceImage.width * imageScale}
                  height={sourceImage.height * imageScale}
                  draggable={tab === "crop"}
                  onDragEnd={(e) => setImagePos({ x: e.target.x(), y: e.target.y() })}
                />

                {/* Watermark — position is clamped at render time so it never overflows */}
                {watermark.enabled && watermarkImg && (() => {
                  const wmW = watermarkImg.width * watermark.scale;
                  const wmH = watermarkImg.height * watermark.scale;
                  const pad = 24;
                  const clampX = Math.max(wmW / 2 + pad, Math.min(CANVAS_W - wmW / 2 - pad, watermark.x));
                  const clampY = Math.max(wmH / 2 + pad, Math.min(CANVAS_H - wmH / 2 - pad, watermark.y));
                  return (
                    <KonvaImage
                      name="watermark"
                      image={watermarkImg}
                      x={clampX}
                      y={clampY}
                      width={wmW}
                      height={wmH}
                      offsetX={wmW / 2}
                      offsetY={wmH / 2}
                      opacity={watermark.opacity}
                      rotation={watermark.rotation}
                      draggable={tab === "watermark"}
                      onDragEnd={(e) => {
                        const x = Math.max(wmW / 2 + pad, Math.min(CANVAS_W - wmW / 2 - pad, e.target.x()));
                        const y = Math.max(wmH / 2 + pad, Math.min(CANVAS_H - wmH / 2 - pad, e.target.y()));
                        setWatermark({ ...watermark, x, y });
                      }}
                    />
                  );
                })()}

                {/* Text layers */}
                {texts.map(t => (
                  <Text
                    key={t.id}
                    text={t.content}
                    x={t.x}
                    y={t.y}
                    fontSize={t.fontSize}
                    fontFamily={t.fontFamily.replace("var(--font-", "").replace(")", "")}
                    fill={t.fill}
                    fontStyle={t.fontStyle}
                    align={t.align}
                    rotation={t.rotation}
                    draggable={tab === "text"}
                    onClick={() => { setSelectedTextId(t.id); setTab("text"); }}
                    onTap={() => { setSelectedTextId(t.id); setTab("text"); }}
                    onDragEnd={(e) => updateText(t.id, { x: e.target.x(), y: e.target.y() })}
                  />
                ))}
              </Layer>
            </Stage>
            </div>
          )}
        </div>

        {/* Controls panel */}
        <div className="pe-controls" style={{
          background: "#0d0d0d", borderLeft: "1px solid #1a1a1a",
          display: sidebarCollapsed ? "none" : "flex", flexDirection: "column",
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a" }}>
            {([["crop", "ครอป"], ["adjust", "ปรับแต่ง"], ["watermark", "Watermark"], ["text", "ข้อความ"]] as [Tab, string][]).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                flex: 1, padding: "12px 8px", background: "none", border: "none",
                color: tab === k ? "#60a5fa" : "#555", fontSize: 12, fontWeight: 700, cursor: "pointer",
                borderBottom: tab === k ? "2px solid #3b82f6" : "2px solid transparent",
              }}>{l}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {tab === "crop" && <CropPanel imageScale={imageScale} setImageScale={setImageScale}
              setImagePos={setImagePos} sourceImage={sourceImage} canvasH={CANVAS_H} />}
            {tab === "adjust" && <AdjustPanel adjust={adjust} setAdjust={setAdjust} />}
            {tab === "watermark" && <WatermarkPanel watermark={watermark} setWatermark={setWatermark}
              watermarks={branding?.watermarks ?? []} />}
            {tab === "text" && <TextPanel texts={texts} selectedText={selectedText}
              addText={addText} updateText={updateText} deleteText={deleteText} setSelectedTextId={setSelectedTextId} />}
          </div>
        </div>
      </div>

      {/* Responsive CSS */}
      <style jsx>{`
        @media (max-width: 768px) {
          :global(.pe-body) {
            flex-direction: column !important;
          }
          :global(.pe-controls) {
            border-left: none !important;
            border-top: 1px solid #1a1a1a;
            max-height: 50vh;
            min-height: 280px;
          }
        }
        @media (min-width: 769px) {
          :global(.pe-controls) {
            width: 300px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}

// ── Sub-panels ────────────────────────────────────────────────────────────────
function CropPanel({ imageScale, setImageScale, setImagePos, sourceImage, canvasH }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: "#444", fontWeight: 700, marginBottom: 6 }}>ZOOM</div>
        <input type="range" min="0.1" max="3" step="0.05" value={imageScale}
          onChange={(e) => setImageScale(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#3b82f6" }} />
        <div style={{ fontSize: 11, color: "#666", textAlign: "right" }}>{Math.round(imageScale * 100)}%</div>
      </div>
      <button onClick={() => {
        if (!sourceImage) return;
        const scale = Math.max(CANVAS_W / sourceImage.width, canvasH / sourceImage.height);
        setImageScale(scale);
        setImagePos({ x: (CANVAS_W - sourceImage.width * scale) / 2, y: (canvasH - sourceImage.height * scale) / 2 });
      }} style={{
        background: "#161616", border: "1px solid #222", color: "#888", fontSize: 12, fontWeight: 600,
        padding: "9px 14px", borderRadius: 6, cursor: "pointer",
      }}>รีเซ็ตเป็น Cover ทั้งภาพ</button>
      <div style={{ fontSize: 11, color: "#444", lineHeight: 1.6 }}>
        💡 ลากภาพในเฟรมเพื่อปรับตำแหน่ง<br/>
        💡 ใช้ slider ซูมเข้า/ออก
      </div>
    </div>
  );
}

function AdjustPanel({ adjust, setAdjust }: { adjust: AdjustState; setAdjust: (a: AdjustState) => void }) {
  const update = (patch: Partial<AdjustState>) => setAdjust({ ...adjust, ...patch });
  const toggleBtn = (label: string, key: "sepia" | "grayscale" | "invert") => (
    <button onClick={() => update({ [key]: !adjust[key] } as any)} style={{
      flex: 1, padding: "8px 6px",
      background: adjust[key] ? "#1e3a5f" : "#161616",
      border: `1px solid ${adjust[key] ? "#3b82f6" : "#222"}`,
      color: adjust[key] ? "#60a5fa" : "#666",
      fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 4,
    }}>{label}</button>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Slider label="ความสว่าง" value={adjust.brightness * 100} min={-100} max={100} step={2}
        onChange={(v) => update({ brightness: v / 100 })} suffix="%" />
      <Slider label="คอนทราสต์" value={adjust.contrast} min={-100} max={100} step={2}
        onChange={(v) => update({ contrast: v })} suffix="" />
      <Slider label="ความอิ่มสี" value={adjust.saturation * 50} min={-100} max={500} step={5}
        onChange={(v) => update({ saturation: v / 50 })} suffix="" />
      <Slider label="โทนสี (HUE)" value={adjust.hue} min={-180} max={180} step={2}
        onChange={(v) => update({ hue: v })} suffix="°" />
      <Slider label="ความสว่างสี (LUM)" value={adjust.luminance * 50} min={-100} max={100} step={2}
        onChange={(v) => update({ luminance: v / 50 })} suffix="" />
      <Slider label="ความเบลอ" value={adjust.blur} min={0} max={40} step={1}
        onChange={(v) => update({ blur: v })} suffix="px" />
      <Slider label="ความคมชัด" value={adjust.enhance * 100} min={-100} max={100} step={2}
        onChange={(v) => update({ enhance: v / 100 })} suffix="%" />

      <div>
        <div style={{ fontSize: 11, color: "#444", fontWeight: 700, marginBottom: 6 }}>เอฟเฟกต์</div>
        <div style={{ display: "flex", gap: 4 }}>
          {toggleBtn("ซีเปีย", "sepia")}
          {toggleBtn("ขาวดำ", "grayscale")}
          {toggleBtn("กลับสี", "invert")}
        </div>
      </div>

      <button onClick={() => setAdjust(DEFAULT_ADJUST)} style={{
        background: "#161616", border: "1px solid #222", color: "#888", fontSize: 12, fontWeight: 600,
        padding: "9px 14px", borderRadius: 6, cursor: "pointer",
      }}>รีเซ็ตทั้งหมด</button>

      <div style={{ fontSize: 11, color: "#444", lineHeight: 1.6 }}>
        💡 ปรับสี/แสง/ความคมแบบ real-time<br/>
        💡 ค่าจะถูกบันทึกตอน save ภาพ
      </div>
    </div>
  );
}

function WatermarkPanel({ watermark, setWatermark, watermarks }: {
  watermark: any;
  setWatermark: (w: any) => void;
  watermarks: WatermarkRow[];
}) {
  if (!watermarks || watermarks.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>
        ยังไม่มี logo ในระบบ<br/>
        ไปที่ <strong style={{ color: "#888" }}>Settings → Branding & Watermark</strong> เพื่ออัปโหลด
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Watermark picker — choose which logo to use */}
      <div>
        <div style={{ fontSize: 11, color: "#444", fontWeight: 700, marginBottom: 6 }}>เลือก LOGO</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 6 }}>
          {watermarks.map(wm => {
            const selected = watermark.watermarkId === wm.id;
            return (
              <button key={wm.id}
                onClick={() => setWatermark({ ...watermark, watermarkId: wm.id })}
                style={{
                  background: "#0a0a0a", border: `2px solid ${selected ? "#3b82f6" : "#1a1a1a"}`,
                  borderRadius: 6, padding: 6, cursor: "pointer",
                  display: "flex", flexDirection: "column", gap: 4, alignItems: "center",
                }}>
                <div style={{
                  width: "100%", aspectRatio: "1", background: "#000", borderRadius: 3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundImage: "linear-gradient(45deg, #161616 25%, transparent 25%), linear-gradient(-45deg, #161616 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #161616 75%), linear-gradient(-45deg, transparent 75%, #161616 75%)",
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={wm.url} alt={wm.name} style={{ maxWidth: "75%", maxHeight: "75%", objectFit: "contain" }} />
                </div>
                <span style={{
                  fontSize: 9, color: selected ? "#60a5fa" : "#666", fontWeight: 600,
                  width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center",
                }}>{wm.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={() => setWatermark({ ...watermark, enabled: !watermark.enabled })} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#161616", border: "1px solid #222", padding: "10px 12px", borderRadius: 6, cursor: "pointer",
      }}>
        <span style={{ fontSize: 12, color: "#bbb", fontWeight: 600 }}>เปิดใช้ Watermark</span>
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700,
          background: watermark.enabled ? "rgba(16,185,129,0.15)" : "#1a1a1a",
          color: watermark.enabled ? "#10b981" : "#444",
        }}>{watermark.enabled ? "ON" : "OFF"}</span>
      </button>
      <Slider label="ความโปร่งใส" value={watermark.opacity * 100} min={10} max={100} step={5}
        onChange={(v) => setWatermark({ ...watermark, opacity: v / 100 })} suffix="%" />
      <Slider label="ขนาด" value={watermark.scale * 100} min={5} max={100} step={1}
        onChange={(v) => setWatermark({ ...watermark, scale: v / 100 })} suffix="%" />
      <Slider label="หมุน" value={watermark.rotation} min={-180} max={180} step={5}
        onChange={(v) => setWatermark({ ...watermark, rotation: v })} suffix="°" />
      <div style={{ fontSize: 11, color: "#444", lineHeight: 1.6 }}>
        💡 ลาก logo เพื่อย้ายตำแหน่ง<br/>
        💡 ขยายได้สูงสุด 100% (เต็มความกว้างภาพ)
      </div>
    </div>
  );
}

function TextPanel({ texts, selectedText, addText, updateText, deleteText, setSelectedTextId }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <button onClick={addText} style={{
        background: "#1e3a5f", border: "none", color: "#60a5fa", fontSize: 12, fontWeight: 700,
        padding: "10px 14px", borderRadius: 6, cursor: "pointer",
      }}>+ เพิ่มข้อความ</button>

      {/* Layers list */}
      {texts.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#444", fontWeight: 700, marginBottom: 6 }}>LAYERS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {texts.map((t: TextLayer) => (
              <div key={t.id} onClick={() => setSelectedTextId(t.id)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 5, cursor: "pointer",
                background: selectedText?.id === t.id ? "#1e3a5f" : "#161616",
                border: `1px solid ${selectedText?.id === t.id ? "#3b82f6" : "#222"}`,
              }}>
                <span style={{ flex: 1, fontSize: 12, color: "#bbb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.content}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteText(t.id); }} style={{
                  background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 14, padding: 0,
                }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected text editor */}
      {selectedText && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 12, borderTop: "1px solid #1a1a1a" }}>
          <div>
            <div style={{ fontSize: 11, color: "#444", fontWeight: 700, marginBottom: 6 }}>ข้อความ</div>
            <textarea value={selectedText.content} onChange={(e) => updateText(selectedText.id, { content: e.target.value })}
              rows={2} style={{ width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 5, color: "#ddd", fontSize: 12, padding: "8px 10px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#444", fontWeight: 700, marginBottom: 6 }}>FONT</div>
            <select value={selectedText.fontFamily} onChange={(e) => updateText(selectedText.id, { fontFamily: e.target.value as FontFamily })}
              style={{ width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 5, color: "#ddd", fontSize: 12, padding: "8px 10px", outline: "none", boxSizing: "border-box" }}>
              {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <Slider label="ขนาด" value={selectedText.fontSize} min={20} max={300} step={2}
            onChange={(v) => updateText(selectedText.id, { fontSize: v })} suffix="px" />
          <div>
            <div style={{ fontSize: 11, color: "#444", fontWeight: 700, marginBottom: 6 }}>สี</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => updateText(selectedText.id, { fill: c })} style={{
                  width: 28, height: 28, borderRadius: 4, border: selectedText.fill === c ? "2px solid #3b82f6" : "1px solid #222",
                  background: c, cursor: "pointer", padding: 0,
                }} />
              ))}
              <input type="color" value={selectedText.fill} onChange={(e) => updateText(selectedText.id, { fill: e.target.value })}
                style={{ width: 28, height: 28, borderRadius: 4, border: "1px solid #222", padding: 0, background: "none", cursor: "pointer" }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#444", fontWeight: 700, marginBottom: 6 }}>STYLE</div>
            <div style={{ display: "flex", gap: 4 }}>
              {(["normal", "bold", "italic", "italic bold"] as const).map(s => (
                <button key={s} onClick={() => updateText(selectedText.id, { fontStyle: s })} style={{
                  flex: 1, padding: "6px 0", background: selectedText.fontStyle === s ? "#1e3a5f" : "#161616",
                  border: "1px solid #222", color: selectedText.fontStyle === s ? "#60a5fa" : "#666",
                  fontSize: 11, fontWeight: 600, cursor: "pointer", borderRadius: 4,
                }}>{s === "normal" ? "ปกติ" : s === "bold" ? "หนา" : s === "italic" ? "เอียง" : "หนาเอียง"}</button>
              ))}
            </div>
          </div>
          <Slider label="หมุน" value={selectedText.rotation} min={-180} max={180} step={5}
            onChange={(v) => updateText(selectedText.id, { rotation: v })} suffix="°" />
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, suffix }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#444", fontWeight: 700 }}>{label.toUpperCase()}</span>
        <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{Math.round(value)}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#3b82f6" }} />
    </div>
  );
}
