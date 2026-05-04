"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ImageEditorField from "@/components/PhotoEditor/ImageEditorField";

const ALL_LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"] as const;
type LangKey = typeof ALL_LANGS[number];
const LANG_LABELS: Record<LangKey, string> = { en: "EN", th: "TH", cn: "中文", de: "DE", fr: "FR", ru: "RU", ko: "한국어", ja: "日本語" };

type Translation = { lang: string; name: string };
type ServiceArea = { id: string; translations: Translation[] };
type LangForm = Record<LangKey, string>;

const inputStyle = { width: "100%", background: "#111", border: "1px solid #222", borderRadius: 6, padding: "7px 10px", color: "#ddd", fontSize: 13, outline: "none", boxSizing: "border-box" as const };
const labelStyle = { fontSize: 11, color: "#444", fontWeight: 600, marginBottom: 3, display: "block" as const };

function emptyLangForm(): LangForm {
  return Object.fromEntries(ALL_LANGS.map(l => [l, ""])) as LangForm;
}

type Tab = "service-areas" | "seo" | "branding" | "ai" | "rec-ai";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("service-areas");

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#ccc", marginBottom: 20 }}>Settings</h1>

      {/* Sub-menu tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #1a1a1a", marginBottom: 28 }}>
        {([["service-areas", "พื้นที่ให้บริการ"], ["seo", "SEO หน้าแรก"], ["branding", "Branding & Watermark"], ["ai", "Ark AI"], ["rec-ai", "Recommendation AI"]] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "none", color: tab === key ? "#e5e5e5" : "#333", borderBottom: tab === key ? "2px solid #3b82f6" : "2px solid transparent", marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "service-areas" && <ServiceAreasPanel />}
      {tab === "seo" && <SeoPanel />}
      {tab === "branding" && <BrandingPanel />}
      {tab === "ai" && <AiConfigPanel />}
      {tab === "rec-ai" && <RecommendationAiPanel />}
    </div>
  );
}

// ── Branding / Watermark Panel ────────────────────────────────────────────────
type WatermarkRow = { id: string; name: string; url: string; order: number };
type BrandingState = {
  defaultWatermarkId: string;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  watermarkPosition: string;
  watermarkScale: number;
  watermarks: WatermarkRow[];
};

const POSITIONS: { value: string; label: string }[] = [
  { value: "top-left", label: "บนซ้าย" },
  { value: "top-right", label: "บนขวา" },
  { value: "bottom-left", label: "ล่างซ้าย" },
  { value: "bottom-right", label: "ล่างขวา" },
  { value: "center", label: "กลางภาพ" },
];

function BrandingPanel() {
  const [state, setState] = useState<BrandingState>({
    defaultWatermarkId: "",
    watermarkEnabled: true,
    watermarkOpacity: 60,
    watermarkPosition: "bottom-right",
    watermarkScale: 15,
    watermarks: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/site-branding");
    if (res.ok) {
      const data = await res.json();
      setState({
        defaultWatermarkId: data.defaultWatermarkId ?? "",
        watermarkEnabled: data.watermarkEnabled ?? true,
        watermarkOpacity: data.watermarkOpacity ?? 60,
        watermarkPosition: data.watermarkPosition ?? "bottom-right",
        watermarkScale: data.watermarkScale ?? 15,
        watermarks: data.watermarks ?? [],
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const uploadWatermark = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name.replace(/\.[^.]+$/, ""));
      const res = await fetch("/api/watermarks", { method: "POST", body: fd });
      if (res.ok) {
        const newWm = await res.json();
        setState(s => ({
          ...s,
          watermarks: [...s.watermarks, newWm],
          // Auto-set as default if it's the first
          defaultWatermarkId: s.defaultWatermarkId || newWm.id,
        }));
      }
    } finally {
      setUploading(false);
    }
  };

  const renameWatermark = async (id: string, name: string) => {
    setState(s => ({
      ...s,
      watermarks: s.watermarks.map(w => w.id === id ? { ...w, name } : w),
    }));
    await fetch(`/api/watermarks?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  };

  const deleteWatermark = async (id: string) => {
    if (!confirm("ลบ watermark นี้?")) return;
    await fetch(`/api/watermarks?id=${id}`, { method: "DELETE" });
    setState(s => ({
      ...s,
      watermarks: s.watermarks.filter(w => w.id !== id),
      defaultWatermarkId: s.defaultWatermarkId === id ? (s.watermarks.find(w => w.id !== id)?.id ?? "") : s.defaultWatermarkId,
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/site-branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultWatermarkId: state.defaultWatermarkId,
          watermarkEnabled: state.watermarkEnabled,
          watermarkOpacity: state.watermarkOpacity,
          watermarkPosition: state.watermarkPosition,
          watermarkScale: state.watermarkScale,
        }),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: "#444", fontSize: 13 }}>Loading...</div>;

  const badge = { fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 700 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#bbb", marginBottom: 4 }}>Watermarks (Logo Library)</div>
        <div style={{ fontSize: 12, color: "#555" }}>เพิ่ม logo PNG (พื้นหลังโปร่งใส) ได้หลายตัว — ตอนสร้างภาพจะเลือกได้ว่าจะใช้อันไหน</div>
      </div>

      {/* Watermark grid */}
      <div>
        <label style={labelStyle}>Logo Library</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {state.watermarks.map(wm => {
            const isDefault = state.defaultWatermarkId === wm.id;
            return (
              <div key={wm.id} style={{
                background: "#0d0d0d", border: `2px solid ${isDefault ? "#3b82f6" : "#1a1a1a"}`, borderRadius: 8, padding: 10,
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{
                  width: "100%", aspectRatio: "1", background: "#000",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 4, position: "relative",
                  backgroundImage: "linear-gradient(45deg, #161616 25%, transparent 25%), linear-gradient(-45deg, #161616 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #161616 75%), linear-gradient(-45deg, transparent 75%, #161616 75%)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={wm.url} alt={wm.name} style={{ maxWidth: "75%", maxHeight: "75%", objectFit: "contain" }} />
                  {isDefault && (
                    <span style={{ position: "absolute", top: 4, left: 4, fontSize: 9, fontWeight: 700, background: "#3b82f6", color: "#fff", padding: "2px 6px", borderRadius: 10 }}>DEFAULT</span>
                  )}
                </div>
                <input value={wm.name} onChange={(e) => renameWatermark(wm.id, e.target.value)}
                  style={{ background: "#161616", border: "1px solid #222", borderRadius: 4, color: "#ddd", fontSize: 11, padding: "5px 8px", outline: "none" }} />
                <div style={{ display: "flex", gap: 4 }}>
                  {!isDefault && (
                    <button onClick={() => setState(s => ({ ...s, defaultWatermarkId: wm.id }))}
                      style={{ flex: 1, background: "#161616", border: "1px solid #222", color: "#888", borderRadius: 4, padding: "5px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                      ตั้งเป็น default
                    </button>
                  )}
                  <button onClick={() => deleteWatermark(wm.id)}
                    style={{ background: "#161616", border: "1px solid #2a1010", color: "#ef4444", borderRadius: 4, padding: "5px 10px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                    ลบ
                  </button>
                </div>
              </div>
            );
          })}

          {/* Upload box */}
          <div onClick={() => fileRef.current?.click()}
            style={{ background: "#0d0d0d", border: "2px dashed #222", borderRadius: 8, padding: 10, minHeight: 220,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: uploading ? "wait" : "pointer", gap: 6 }}>
            <div style={{ fontSize: 28, color: "#333" }}>+</div>
            <div style={{ fontSize: 11, color: "#444", fontWeight: 600, textAlign: "center" }}>
              {uploading ? "กำลังอัปโหลด..." : "เพิ่ม Logo ใหม่"}
            </div>
            <div style={{ fontSize: 9, color: "#222", textAlign: "center" }}>PNG พื้นหลังโปร่งใส</div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/webp" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadWatermark(f); e.target.value = ""; }} />
        {state.watermarks.length === 0 && (
          <p style={{ fontSize: 11, color: "#444", marginTop: 8 }}>ยังไม่มี logo — เพิ่มอย่างน้อย 1 ตัวเพื่อใช้เป็น watermark</p>
        )}
      </div>

      {/* Enabled toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8 }}>
        <button onClick={() => setState(s => ({ ...s, watermarkEnabled: !s.watermarkEnabled }))}
          style={{ width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", padding: 2, background: state.watermarkEnabled ? "#10b981" : "#333", display: "flex", alignItems: "center", justifyContent: state.watermarkEnabled ? "flex-end" : "flex-start", transition: "all 0.2s" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#bbb", fontWeight: 600 }}>เปิดใช้ Watermark</div>
          <div style={{ fontSize: 11, color: "#555" }}>ใส่ logo อัตโนมัติบนภาพ cover ทุกบทความ</div>
        </div>
        <span style={{ ...badge, background: state.watermarkEnabled ? "rgba(16,185,129,0.15)" : "#1a1a1a", color: state.watermarkEnabled ? "#10b981" : "#444" }}>
          {state.watermarkEnabled ? "ON" : "OFF"}
        </span>
      </div>

      {/* Position */}
      <div>
        <label style={labelStyle}>ตำแหน่งเริ่มต้น</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {POSITIONS.map(p => (
            <button key={p.value} onClick={() => setState(s => ({ ...s, watermarkPosition: p.value }))}
              style={{ padding: "8px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: state.watermarkPosition === p.value ? "#1e3a5f" : "#161616",
                color: state.watermarkPosition === p.value ? "#60a5fa" : "#555" }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>ความโปร่งใส</label>
          <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{state.watermarkOpacity}%</span>
        </div>
        <input type="range" min="10" max="100" step="5" value={state.watermarkOpacity}
          onChange={(e) => setState(s => ({ ...s, watermarkOpacity: Number(e.target.value) }))}
          style={{ width: "100%", accentColor: "#3b82f6" }} />
      </div>

      {/* Scale — now goes up to 100% */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>ขนาดเริ่มต้น (% ของความกว้างภาพ)</label>
          <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{state.watermarkScale}%</span>
        </div>
        <input type="range" min="5" max="100" step="1" value={state.watermarkScale}
          onChange={(e) => setState(s => ({ ...s, watermarkScale: Number(e.target.value) }))}
          style={{ width: "100%", accentColor: "#3b82f6" }} />
        <div style={{ fontSize: 10, color: "#333", marginTop: 4 }}>เช่น ภาพ 1200px กว้าง × 15% = logo กว้าง 180px (ตอนใช้ในแก้รูปจริง ปรับได้อีก)</div>
      </div>

      {/* Save button */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 12, borderTop: "1px solid #1a1a1a" }}>
        <button onClick={save} disabled={saving}
          style={{ background: "#3b82f6", border: "none", borderRadius: 7, padding: "10px 24px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
        {savedAt && <span style={{ fontSize: 12, color: "#10b981" }}>✓ บันทึกแล้ว ({savedAt})</span>}
      </div>
    </div>
  );
}

// ── OG Image Upload (uses Photo Editor with 1.91:1 aspect) ───────────────────
function OgImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  return <ImageEditorField value={value} onChange={onChange} aspectRatio={1200 / 630} hint="แนะนำ 1200×630px (1.91:1)" />;
}

// ── SEO Panel ────────────────────────────────────────────────────────────────

type SeoForm = {
  title: string; description: string; keywords: string;
  ogTitle: string; ogDescription: string; ogImage: string;
};
type SeoData = Record<string, SeoForm>;

function emptySeoForm(): SeoForm {
  return { title: "", description: "", keywords: "", ogTitle: "", ogDescription: "", ogImage: "" };
}

function SeoPanel() {
  const [activeLang, setActiveLang] = useState<LangKey>("en");
  const [forms, setForms] = useState<SeoData>(
    Object.fromEntries(ALL_LANGS.map(l => [l, emptySeoForm()]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/site-seo").then(r => r.json()).then((rows: { lang: string; title: string; description: string; keywords: string[]; ogTitle: string; ogDescription: string; ogImage: string }[]) => {
      if (!Array.isArray(rows)) return;
      setForms(prev => {
        const next = { ...prev };
        for (const row of rows) {
          if (ALL_LANGS.includes(row.lang as LangKey)) {
            next[row.lang] = {
              title: row.title,
              description: row.description,
              keywords: row.keywords.join(", "),
              ogTitle: row.ogTitle,
              ogDescription: row.ogDescription,
              ogImage: row.ogImage,
            };
          }
        }
        return next;
      });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const form = forms[activeLang];
    await fetch(`/api/site-seo/${activeLang}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        keywords: form.keywords.split(",").map(k => k.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setField = (field: keyof SeoForm, value: string) => {
    setForms(prev => ({ ...prev, [activeLang]: { ...prev[activeLang], [field]: value } }));
  };

  const form = forms[activeLang];

  return (
    <div style={{ maxWidth: 680 }}>
      <p style={{ fontSize: 12, color: "#444", marginBottom: 20 }}>
        กำหนด title, description และ OG tags สำหรับหน้าแรกของแต่ละภาษา — ใช้สำหรับ Google Search และการแชร์ link ใน social media
      </p>

      {/* Lang tabs */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 24 }}>
        {ALL_LANGS.map(l => (
          <button key={l} onClick={() => setActiveLang(l)}
            style={{ padding: "5px 14px", borderRadius: 20, border: activeLang === l ? "none" : "1px solid #222", cursor: "pointer", fontSize: 11, fontWeight: 700, background: activeLang === l ? "#3b82f6" : "transparent", color: activeLang === l ? "#fff" : "#333" }}>
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Title */}
        <div>
          <label style={labelStyle}>Title <span style={{ color: "#333", fontWeight: 400 }}>(แนะนำ 50–60 ตัวอักษร)</span></label>
          <input value={form.title} onChange={e => setField("title", e.target.value)} style={inputStyle} placeholder="SIAMDIVE — Scuba Diving Trips Thailand" />
          <p style={{ fontSize: 10, color: form.title.length > 60 ? "#ef4444" : "#333", marginTop: 3 }}>{form.title.length} / 60</p>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description <span style={{ color: "#333", fontWeight: 400 }}>(แนะนำ 120–160 ตัวอักษร)</span></label>
          <textarea value={form.description} onChange={e => setField("description", e.target.value)}
            style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
            placeholder="Book scuba day trips and liveaboards in Thailand. Similan Islands, Koh Losin, Richelieu Rock and more." />
          <p style={{ fontSize: 10, color: form.description.length > 160 ? "#ef4444" : "#333", marginTop: 3 }}>{form.description.length} / 160</p>
        </div>

        {/* Keywords */}
        <div>
          <label style={labelStyle}>Keywords <span style={{ color: "#333", fontWeight: 400 }}>(คั่นด้วย comma)</span></label>
          <input value={form.keywords} onChange={e => setField("keywords", e.target.value)} style={inputStyle} placeholder="scuba diving, liveaboard thailand, similan islands" />
        </div>

        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, marginTop: 4 }}>
          <p style={{ fontSize: 11, color: "#555", fontWeight: 700, marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Open Graph (Social Share)</p>

          {/* OG Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>OG Title <span style={{ color: "#333", fontWeight: 400 }}>(ปล่อยว่างจะใช้ Title ด้านบน)</span></label>
            <input value={form.ogTitle} onChange={e => setField("ogTitle", e.target.value)} style={inputStyle} placeholder="SIAMDIVE — Dive Trips Thailand" />
          </div>

          {/* OG Description */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>OG Description</label>
            <textarea value={form.ogDescription} onChange={e => setField("ogDescription", e.target.value)}
              style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
              placeholder="ทริปดำน้ำในประเทศไทย Daytrip และ Liveaboard..." />
          </div>

          {/* OG Image */}
          <div>
            <label style={labelStyle}>OG Image</label>
            <OgImageUpload value={form.ogImage} onChange={url => setField("ogImage", url)} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={save} disabled={saving}
          style={{ background: "#1d4ed8", border: "none", color: "#fff", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "กำลังบันทึก…" : `บันทึก (${LANG_LABELS[activeLang]})`}
        </button>
        {saved && <span style={{ fontSize: 12, color: "#4ade80" }}>บันทึกแล้ว ✓</span>}
      </div>
    </div>
  );
}

// ── Service Areas Panel ───────────────────────────────────────────────────────

function ServiceAreasPanel() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [langForm, setLangForm] = useState<LangForm>(emptyLangForm());
  const [activeLang, setActiveLang] = useState<LangKey>("en");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await fetch("/api/service-areas").then(r => r.json()).catch(() => []);
    setAreas(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setLangForm(emptyLangForm());
    setEditId(null);
    setActiveLang("en");
    setFormOpen(true);
  };

  const openEdit = (a: ServiceArea) => {
    const f = emptyLangForm();
    for (const tr of a.translations) {
      if (ALL_LANGS.includes(tr.lang as LangKey)) f[tr.lang as LangKey] = tr.name;
    }
    setLangForm(f);
    setEditId(a.id);
    setActiveLang("en");
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setEditId(null); };

  const save = async () => {
    setSaving(true);
    const translations = ALL_LANGS.map(l => ({ lang: l, name: langForm[l] }));
    if (editId) {
      await fetch(`/api/service-areas/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ translations }) });
    } else {
      await fetch("/api/service-areas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ translations }) });
    }
    await load();
    setSaving(false);
    closeForm();
  };

  const del = async (id: string) => {
    if (!confirm("ลบพื้นที่นี้?")) return;
    await fetch(`/api/service-areas/${id}`, { method: "DELETE" });
    await load();
  };

  const getLabel = (a: ServiceArea) =>
    a.translations.find(t => t.lang === "en")?.name ||
    a.translations.find(t => t.name)?.name ||
    "(ไม่มีชื่อ)";

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "#555" }}>จัดการรายการพื้นที่ให้บริการ ใช้ในแบบฟอร์มเพิ่มเรือ</span>
        <button onClick={openNew} style={{ background: "#1a3a1a", border: "1px solid #2a5a2a", color: "#4ade80", borderRadius: 7, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          + เพิ่มพื้นที่
        </button>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {areas.length === 0 && (
          <div style={{ fontSize: 12, color: "#2a2a2a", textAlign: "center", padding: "30px 0" }}>ยังไม่มีพื้นที่ให้บริการ</div>
        )}
        {areas.map(a => (
          <div key={a.id} style={{ background: "#090909", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, color: "#ccc", fontWeight: 600 }}>{getLabel(a)}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {ALL_LANGS.map(l => {
                  const name = a.translations.find(t => t.lang === l)?.name;
                  if (!name) return null;
                  return (
                    <span key={l} style={{ fontSize: 10, color: "#333" }}>
                      <span style={{ color: "#2a2a2a", fontWeight: 700 }}>{LANG_LABELS[l]}</span> {name}
                    </span>
                  );
                })}
              </div>
            </div>
            <button onClick={() => openEdit(a)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 5, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => del(a.id)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 5, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Form panel */}
      {formOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={closeForm} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(480px, 100vw)", background: "#0d0d0d", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ccc", flex: 1 }}>{editId ? "แก้ไขพื้นที่" : "เพิ่มพื้นที่ให้บริการ"}</span>
              <button onClick={save} disabled={saving} style={{ background: "#1d4ed8", border: "none", color: "#fff", borderRadius: 7, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
              <button onClick={closeForm} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Lang tabs */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {ALL_LANGS.map(l => (
                  <button key={l} onClick={() => setActiveLang(l)}
                    style={{ padding: "5px 12px", borderRadius: 20, border: activeLang === l ? "none" : "1px solid #222", cursor: "pointer", fontSize: 11, fontWeight: 700, background: activeLang === l ? "#3b82f6" : "transparent", color: activeLang === l ? "#fff" : "#333" }}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>

              {ALL_LANGS.map(l => (
                <div key={l} style={{ display: activeLang === l ? "block" : "none" }}>
                  <label style={labelStyle}>ชื่อพื้นที่ ({LANG_LABELS[l]})</label>
                  <input
                    value={langForm[l]}
                    onChange={e => setLangForm(f => ({ ...f, [l]: e.target.value }))}
                    style={inputStyle}
                    placeholder={l === "en" ? "e.g. Similan Islands" : l === "th" ? "เช่น หมู่เกาะสิมิลัน" : ""}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ark AI Config Panel ──────────────────────────────────────────────────────

type AiProvider = "anthropic" | "openai" | "google" | "openrouter";

const AI_PROVIDERS: { id: AiProvider; label: string; keyPlaceholder: string }[] = [
  { id: "anthropic", label: "Anthropic (Claude)", keyPlaceholder: "sk-ant-..." },
  { id: "openai", label: "OpenAI (GPT)", keyPlaceholder: "sk-..." },
  { id: "google", label: "Google (Gemini)", keyPlaceholder: "AIza..." },
  { id: "openrouter", label: "OpenRouter", keyPlaceholder: "sk-or-..." },
];

const AI_MODELS_BY_PROVIDER: Record<AiProvider, { id: string; label: string }[]> = {
  anthropic: [
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Fast, Cheap)" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Balanced)" },
    { id: "claude-opus-4-7", label: "Claude Opus 4.7 (Most Capable)" },
  ],
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o Mini (Fast, Cheap)" },
    { id: "gpt-4o", label: "GPT-4o (Balanced)" },
    { id: "gpt-4.1", label: "GPT-4.1 (Most Capable)" },
    { id: "o3-mini", label: "o3-mini (Reasoning)" },
  ],
  google: [
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Fast)" },
    { id: "gemini-2.5-pro-preview-05-06", label: "Gemini 2.5 Pro (Balanced)" },
  ],
  openrouter: [
    { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 via OR" },
    { id: "anthropic/claude-haiku-4", label: "Claude Haiku 4 via OR" },
    { id: "openai/gpt-4o", label: "GPT-4o via OR" },
    { id: "openai/gpt-4o-mini", label: "GPT-4o Mini via OR" },
    { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash via OR" },
    { id: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro via OR" },
    { id: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3 via OR" },
    { id: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick via OR" },
  ],
};

type AiConfigState = {
  provider: string; hasApiKey: boolean; apiKeyPreview: string; model: string;
  maxTokens: number; rateLimit: number; temperature: number; systemPromptExtra: string;
};

function AiConfigPanel() {
  const [config, setConfig] = useState<AiConfigState | null>(null);
  const [provider, setProvider] = useState<AiProvider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("claude-haiku-4-5-20251001");
  const [maxTokens, setMaxTokens] = useState(1024);
  const [rateLimit, setRateLimit] = useState(20);
  const [temperature, setTemperature] = useState(0.7);
  const [extra, setExtra] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/ark-ai/config").then(r => r.json()).then((c: AiConfigState) => {
      setConfig(c); setProvider((c.provider as AiProvider) || "anthropic"); setModel(c.model); setMaxTokens(c.maxTokens);
      setRateLimit(c.rateLimit); setTemperature(c.temperature); setExtra(c.systemPromptExtra);
    }).catch(() => {});
  }, []);

  const handleProviderChange = (p: AiProvider) => {
    setProvider(p);
    const models = AI_MODELS_BY_PROVIDER[p];
    if (models.length > 0) setModel(models[0].id);
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    const body: Record<string, unknown> = { provider, model, maxTokens, rateLimit, temperature, systemPromptExtra: extra };
    if (apiKey) body.apiKey = apiKey;
    await fetch("/api/ark-ai/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setApiKey(""); setSaving(false); setSaved(true);
    const updated = await fetch("/api/ark-ai/config").then(r => r.json());
    setConfig(updated);
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/ark-ai/config", { method: "POST" });
      const data = await res.json();
      setTestResult({ ok: data.ok, msg: data.ok ? `Connected! Model: ${data.model}` : data.error });
    } catch { setTestResult({ ok: false, msg: "Connection failed" }); }
    setTesting(false);
  };

  if (!config) return <div style={{ color: "#444", fontSize: 13 }}>Loading...</div>;

  const currentProvider = AI_PROVIDERS.find(p => p.id === provider)!;
  const models = AI_MODELS_BY_PROVIDER[provider] || [];

  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>Manage AI settings for the Ark AI trip planner chat.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Provider */}
        <div>
          <label style={labelStyle}>AI Provider</label>
          <div style={{ display: "flex", gap: 6 }}>
            {AI_PROVIDERS.map(p => (
              <button key={p.id} onClick={() => handleProviderChange(p.id)}
                style={{
                  flex: 1, padding: "8px 6px", borderRadius: 6,
                  border: provider === p.id ? "1px solid #3b82f6" : "1px solid #333",
                  background: provider === p.id ? "rgba(59,130,246,0.15)" : "#111",
                  color: provider === p.id ? "#60a5fa" : "#666",
                  fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>{currentProvider.label} API Key</label>
          {config.hasApiKey && <p style={{ fontSize: 11, color: "#4ade80", marginBottom: 6 }}>Current: {config.apiKeyPreview}</p>}
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder={config.hasApiKey ? "Enter new key to replace..." : currentProvider.keyPlaceholder} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Model</label>
          <select value={model} onChange={e => setModel(e.target.value)} style={inputStyle}>
            {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Max Tokens</label>
            <input type="number" value={maxTokens} onChange={e => setMaxTokens(+e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Rate Limit (msg/hr)</label>
            <input type="number" value={rateLimit} onChange={e => setRateLimit(+e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Temperature: {temperature}</label>
          <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(+e.target.value)} style={{ width: "100%", accentColor: "#3b82f6" }} />
        </div>
        <div>
          <label style={labelStyle}>Additional System Prompt (optional)</label>
          <textarea value={extra} onChange={e => setExtra(e.target.value)} rows={3} placeholder="Additional instructions..." style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: "10px 0", borderRadius: 7, border: "none", background: "#1d4ed8", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
          <button onClick={handleTest} disabled={testing}
            style={{ flex: 1, padding: "10px 0", borderRadius: 7, border: "1px solid #333", background: "#1a1a1a", color: "#ccc", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: testing ? 0.6 : 1 }}>
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>
        {testResult && (
          <div style={{ padding: 10, borderRadius: 8, background: testResult.ok ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${testResult.ok ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}` }}>
            <p style={{ fontSize: 12, color: testResult.ok ? "#4ade80" : "#ef4444" }}>{testResult.ok ? "✓" : "✗"} {testResult.msg}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recommendation AI Config Panel ─────────────────────────────────────────

const REC_MODELS: { id: string; label: string; cost: string }[] = [
  { id: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3", cost: "$0.14/M" },
  { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", cost: "$0.10/M" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", cost: "$0.18/M" },
  { id: "anthropic/claude-haiku-4", label: "Claude Haiku 4", cost: "$0.80/M" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", cost: "$0.15/M" },
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", cost: "$3.00/M" },
];

type RecAiConfig = {
  provider: string; hasApiKey: boolean; apiKeyPreview: string; model: string;
  maxTokens: number; temperature: number;
  minActivity: number; cacheTTLDays: number; cooldownMinutes: number;
  abTestEnabled: boolean; enabled: boolean;
};

function RecommendationAiPanel() {
  const [config, setConfig] = useState<RecAiConfig | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("deepseek/deepseek-chat-v3-0324");
  const [maxTokens, setMaxTokens] = useState(512);
  const [temperature, setTemperature] = useState(0.3);
  const [minActivity, setMinActivity] = useState(5);
  const [cacheTTLDays, setCacheTTLDays] = useState(7);
  const [cooldownMinutes, setCooldownMinutes] = useState(60);
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/recommendation-ai/config").then(r => r.json()).then((c: RecAiConfig) => {
      setConfig(c);
      setModel(c.model); setMaxTokens(c.maxTokens); setTemperature(c.temperature);
      setMinActivity(c.minActivity); setCacheTTLDays(c.cacheTTLDays);
      setCooldownMinutes(c.cooldownMinutes); setAbTestEnabled(c.abTestEnabled);
      setEnabled(c.enabled);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    const body: Record<string, unknown> = {
      provider: "openrouter", model, maxTokens, temperature,
      minActivity, cacheTTLDays, cooldownMinutes, abTestEnabled, enabled,
    };
    if (apiKey) body.apiKey = apiKey;
    await fetch("/api/recommendation-ai/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setApiKey(""); setSaving(false); setSaved(true);
    const updated = await fetch("/api/recommendation-ai/config").then(r => r.json());
    setConfig(updated);
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/recommendation-ai/config", { method: "POST" });
      const data = await res.json();
      setTestResult({ ok: data.ok, msg: data.ok ? `Connected! Model: ${data.model}` : data.error });
    } catch { setTestResult({ ok: false, msg: "Connection failed" }); }
    setTesting(false);
  };

  if (!config) return <div style={{ color: "#444", fontSize: 13 }}>Loading...</div>;

  const selectedModel = REC_MODELS.find(m => m.id === model);
  const badge = { fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 700 };

  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>
        AI-powered trip recommendations — analyzes visitor behavior and suggests relevant trips + schedules.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Master toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8 }}>
          <button onClick={() => setEnabled(!enabled)}
            style={{ width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", padding: 2, background: enabled ? "#10b981" : "#333", display: "flex", alignItems: "center", justifyContent: enabled ? "flex-end" : "flex-start", transition: "all 0.2s" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#bbb", fontWeight: 600 }}>Enable AI Recommendations</div>
            <div style={{ fontSize: 11, color: "#555" }}>When off, all users see rule-based recommendations</div>
          </div>
          <span style={{ ...badge, background: enabled ? "rgba(16,185,129,0.15)" : "#1a1a1a", color: enabled ? "#10b981" : "#444" }}>
            {enabled ? "ON" : "OFF"}
          </span>
        </div>

        {/* API Key */}
        <div>
          <label style={labelStyle}>OpenRouter API Key</label>
          {config.hasApiKey && <p style={{ fontSize: 11, color: "#4ade80", marginBottom: 6 }}>Current: {config.apiKeyPreview}</p>}
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder={config.hasApiKey ? "Enter new key to replace..." : "sk-or-..."} style={inputStyle} />
        </div>

        {/* Model */}
        <div>
          <label style={labelStyle}>Model</label>
          <select value={model} onChange={e => setModel(e.target.value)} style={inputStyle}>
            {REC_MODELS.map(m => <option key={m.id} value={m.id}>{m.label} ({m.cost})</option>)}
          </select>
          {selectedModel && (
            <p style={{ fontSize: 10, color: "#555", marginTop: 4 }}>
              Cost: {selectedModel.cost} input tokens via OpenRouter
            </p>
          )}
        </div>

        {/* Temperature + Max Tokens */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Max Tokens</label>
            <input type="number" value={maxTokens} onChange={e => setMaxTokens(+e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Temperature</label>
            <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} min={0} max={1} step={0.1} style={inputStyle} />
          </div>
        </div>

        {/* Recommendation Settings */}
        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, marginTop: 4 }}>
          <p style={{ fontSize: 11, color: "#555", fontWeight: 700, marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Recommendation Settings</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Min Activity</label>
              <input type="number" value={minActivity} onChange={e => setMinActivity(+e.target.value)} min={1} max={50} style={inputStyle} />
              <p style={{ fontSize: 10, color: "#333", marginTop: 3 }}>Activities needed before AI kicks in</p>
            </div>
            <div>
              <label style={labelStyle}>Cache TTL (days)</label>
              <input type="number" value={cacheTTLDays} onChange={e => setCacheTTLDays(+e.target.value)} min={1} max={30} style={inputStyle} />
              <p style={{ fontSize: 10, color: "#333", marginTop: 3 }}>Re-compute even if no new activity</p>
            </div>
            <div>
              <label style={labelStyle}>Cooldown (min)</label>
              <input type="number" value={cooldownMinutes} onChange={e => setCooldownMinutes(+e.target.value)} min={5} max={1440} style={inputStyle} />
              <p style={{ fontSize: 10, color: "#333", marginTop: 3 }}>Min gap between AI calls per user</p>
            </div>
          </div>
        </div>

        {/* A/B Test toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8 }}>
          <button onClick={() => setAbTestEnabled(!abTestEnabled)}
            style={{ width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", padding: 2, background: abTestEnabled ? "#3b82f6" : "#333", display: "flex", alignItems: "center", justifyContent: abTestEnabled ? "flex-end" : "flex-start", transition: "all 0.2s" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#bbb", fontWeight: 600 }}>A/B Test Mode</div>
            <div style={{ fontSize: 11, color: "#555" }}>50% AI / 50% rule-based — compare click & plan-add rates</div>
          </div>
          <span style={{ ...badge, background: abTestEnabled ? "rgba(59,130,246,0.15)" : "#1a1a1a", color: abTestEnabled ? "#60a5fa" : "#444" }}>
            {abTestEnabled ? "ON" : "OFF"}
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: "10px 0", borderRadius: 7, border: "none", background: "#1d4ed8", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
          <button onClick={handleTest} disabled={testing || !config.hasApiKey}
            style={{ flex: 1, padding: "10px 0", borderRadius: 7, border: "1px solid #333", background: "#1a1a1a", color: "#ccc", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (testing || !config.hasApiKey) ? 0.6 : 1 }}>
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>

        {testResult && (
          <div style={{ padding: 10, borderRadius: 8, background: testResult.ok ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${testResult.ok ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}` }}>
            <p style={{ fontSize: 12, color: testResult.ok ? "#4ade80" : "#ef4444" }}>{testResult.ok ? "✓" : "✗"} {testResult.msg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
