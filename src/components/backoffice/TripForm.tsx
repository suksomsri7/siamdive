"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ImageEditorField from "@/components/PhotoEditor/ImageEditorField";
import PhotoEditor from "@/components/PhotoEditor";

export const ALL_LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"] as const;
export type LangKey = typeof ALL_LANGS[number];
export const LANG_LABELS: Record<LangKey, string> = { en: "EN", th: "TH", cn: "中文", de: "DE", fr: "FR", ru: "RU", ko: "한국어", ja: "日本語" };

const EMPTY_LANG = { title: "", slug: "", excerpt: "", content: "", keywords: [] as string[] };

export type LangData = typeof EMPTY_LANG;
export type VideoItem = { url: string; name: string };
export type PriceTier = { tier: string; costPrice: string; regularPrice: string; salePrice: string; agentPrice: string };

export type BoatFormData = {
  name: string;
  companyId: string;
  type: "DAYTRIP" | "LIVEABOARD" | "DIVE_RESORT" | "FREEDIVE" | "LAND_TOUR" | "SNORKELING";
  capacity: string;
  status: "DRAFT" | "PUBLISHED";
  featured: boolean;
  photos: string[];
  covers: string[];
  videos: VideoItem[];
  priceTiers: PriceTier[];
  serviceAreaIds: string[];
} & Record<LangKey, LangData>;

// backward compat alias
export type TripFormData = BoatFormData;

export function emptyBoatForm(tiers: string[], type: BoatFormData["type"] = "DAYTRIP"): BoatFormData {
  const langs = Object.fromEntries(ALL_LANGS.map(l => [l, { ...EMPTY_LANG, keywords: [] as string[] }])) as Record<LangKey, LangData>;
  return {
    name: "", companyId: "", type, capacity: "",
    status: "DRAFT", featured: false,
    photos: [], covers: [], videos: [],
    priceTiers: tiers.map(t => ({ tier: t, costPrice: "", regularPrice: "", salePrice: "", agentPrice: "" })),
    serviceAreaIds: [],
    ...langs,
  };
}

export const emptyTripForm = emptyBoatForm;

// ── Tag Input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => { const v = input.trim(); if (v && !tags.includes(v)) onChange([...tags, v]); setInput(""); };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, background: "#161616", border: "1px solid #222", borderRadius: 7, padding: "6px 10px", minHeight: 38, alignItems: "center" }}>
      {tags.map(t => (
        <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, background: "#1e3a5f", color: "#60a5fa", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>
          {t}<button onClick={() => onChange(tags.filter(x => x !== t))} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} onBlur={add}
        placeholder={tags.length === 0 ? "keyword / #hashtag แล้วกด Enter..." : ""}
        style={{ flex: 1, minWidth: 100, background: "transparent", border: "none", outline: "none", color: "#ccc", fontSize: 13, padding: "2px 0" }} />
    </div>
  );
}

// ── Cover & Photo Gallery (Photo Editor) ─────────────────────────────────────
function CoverGallery({ images, onChange }: { images: string[]; onChange: (i: string[]) => void }) {
  return <ImageEditorField multi values={images} onChangeMulti={(urls) => onChange(urls)} aspectRatio={2/3} />;
}
function PhotoGallery({ images, onChange }: { images: string[]; onChange: (i: string[]) => void }) {
  return <ImageEditorField multi values={images} onChangeMulti={(urls) => onChange(urls)} aspectRatio={1.5} />;
}

// ── Video Gallery ─────────────────────────────────────────────────────────────
export function VideoGallery({ videos, onChange }: { videos: VideoItem[]; onChange: (v: VideoItem[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    const items: VideoItem[] = [];
    for (const f of Array.from(files)) {
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.url) items.push({ url: d.url, name: f.name.replace(/\.[^.]+$/, "") });
    }
    onChange([...videos, ...items]);
    setUploading(false);
  };

  const updateName = (i: number, name: string) => {
    const next = [...videos]; next[i] = { ...next[i], name }; onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {videos.map((v, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 12px" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🎬</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={v.name} onChange={e => updateName(i, e.target.value)}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#ccc", fontSize: 13, fontWeight: 600 }} />
            <div style={{ fontSize: 10, color: "#2a2a2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{v.url}</div>
          </div>
          <button onClick={() => onChange(videos.filter((_, j) => j !== i))} style={{ background: "none", border: "1px solid #2a1010", color: "#4a2020", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>ลบ</button>
        </div>
      ))}
      <div>
        <button onClick={() => ref.current?.click()} disabled={uploading}
          style={{ background: "#111", border: "2px dashed #222", borderRadius: 8, color: uploading ? "#2a2a2a" : "#444", fontSize: 13, padding: "10px 18px", cursor: uploading ? "wait" : "pointer", width: "100%" }}>
          {uploading ? "กำลังอัพโหลด..." : "+ เพิ่มคลิปวิดีโอ (หลายไฟล์ได้)"}
        </button>
        <input ref={ref} type="file" accept="video/*" multiple style={{ display: "none" }} onChange={e => { upload(e.target.files); e.target.value = ""; }} />
      </div>
    </div>
  );
}

// ── Rich Editor (full featured) ───────────────────────────────────────────────
type ToolbarItem =
  | { type: "sep" }
  | { type: "btn"; cmd: string; arg?: string; label: string; title: string }
  | { type: "select"; options: { label: string; arg: string }[]; cmd: string; title: string; defaultLabel: string };

const TOOLBAR: ToolbarItem[] = [
  { type: "select", cmd: "formatBlock", title: "Heading", defaultLabel: "¶", options: [
    { label: "¶ Normal", arg: "p" }, { label: "H1", arg: "h1" }, { label: "H2", arg: "h2" }, { label: "H3", arg: "h3" }, { label: "H4", arg: "h4" }, { label: "pre", arg: "pre" },
  ]},
  { type: "sep" },
  { type: "btn", cmd: "bold", label: "B", title: "Bold" },
  { type: "btn", cmd: "italic", label: "I", title: "Italic" },
  { type: "btn", cmd: "underline", label: "U", title: "Underline" },
  { type: "btn", cmd: "strikeThrough", label: "S̶", title: "Strikethrough" },
  { type: "sep" },
  { type: "btn", cmd: "justifyLeft", label: "⬅", title: "Align Left" },
  { type: "btn", cmd: "justifyCenter", label: "☰", title: "Align Center" },
  { type: "btn", cmd: "justifyRight", label: "➡", title: "Align Right" },
  { type: "sep" },
  { type: "btn", cmd: "insertUnorderedList", label: "•", title: "Bullet List" },
  { type: "btn", cmd: "insertOrderedList", label: "1.", title: "Numbered List" },
  { type: "btn", cmd: "indent", label: "→|", title: "Indent" },
  { type: "btn", cmd: "outdent", label: "|←", title: "Outdent" },
  { type: "sep" },
  { type: "btn", cmd: "insertHorizontalRule", label: "—", title: "Horizontal Rule" },
  { type: "btn", cmd: "formatBlock", arg: "blockquote", label: "❝", title: "Blockquote" },
  { type: "sep" },
  { type: "btn", cmd: "removeFormat", label: "Tx", title: "Clear Format" },
  { type: "btn", cmd: "undo", label: "↩", title: "Undo" },
  { type: "btn", cmd: "redo", label: "↪", title: "Redo" },
];

export function RichEditor({ value, onChange, placeholder }: { value: string; onChange: (h: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef(value);
  const imgRef = useRef<HTMLInputElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [editorState, setEditorState] = useState<{ id: string; url: string } | null>(null);

  // Sync external value → DOM innerHTML, but ONLY when the DOM is actually out
  // of sync. Comparing against ref.current.innerHTML (instead of last.current)
  // is critical: it stops us from overwriting the DOM right after the user
  // typed, which would otherwise reset the caret to position 0.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
      last.current = value;
    }
  }, [value]);

  const exec = useCallback((cmd: string, a?: string) => {
    ref.current?.focus(); document.execCommand(cmd, false, a);
    const h = ref.current?.innerHTML ?? ""; last.current = h; onChange(h);
  }, [onChange]);

  const onInput = () => { const h = ref.current?.innerHTML ?? ""; last.current = h; onChange(h); };

  // Upload original → open Photo Editor → insert processed image into rich text
  const insertImg = async (f: File) => {
    const fd = new FormData(); fd.append("original", f);
    const r = await fetch("/api/blog-images", { method: "POST", body: fd });
    const data = await r.json();
    if (data.id && data.originalUrl) {
      setEditorState({ id: data.id, url: data.originalUrl });
    }
  };

  const insertLink = () => { const u = prompt("URL:", "https://"); if (u) exec("createLink", u); };

  const bs: React.CSSProperties = { padding: "4px 7px", borderRadius: 4, border: "none", background: "transparent", color: "#555", fontSize: 11, fontWeight: 700, cursor: "pointer", lineHeight: 1 };

  const toolbar = (
    <div style={{ display: "flex", gap: 1, padding: "5px 8px", background: "#0d0d0d", borderBottom: "1px solid #1e1e1e", flexWrap: "wrap", alignItems: "center" }}>
      {TOOLBAR.map((item, i) => {
        if (item.type === "sep") return <div key={i} style={{ width: 1, height: 14, background: "#1e1e1e", margin: "0 3px" }} />;
        if (item.type === "select") return (
          <select key={i} title={item.title} defaultValue="" onChange={e => { if (e.target.value) exec(item.cmd, e.target.value); e.target.value = ""; }}
            style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: 4, color: "#555", fontSize: 11, padding: "3px 4px", cursor: "pointer", outline: "none" }}>
            <option value="" disabled>{item.defaultLabel}</option>
            {item.options.map(o => <option key={o.arg} value={o.arg}>{o.label}</option>)}
          </select>
        );
        return (
          <button key={item.label} title={item.title}
            onMouseDown={e => { e.preventDefault(); exec(item.cmd, item.arg); }}
            style={bs}
            onMouseEnter={e => (e.currentTarget.style.color = "#aaa")}
            onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
            {item.label}
          </button>
        );
      })}
      <button title="Link" onMouseDown={e => { e.preventDefault(); insertLink(); }} style={bs} onMouseEnter={e => (e.currentTarget.style.color = "#aaa")} onMouseLeave={e => (e.currentTarget.style.color = "#555")}>🔗</button>
      <button title="Insert Image" onMouseDown={e => { e.preventDefault(); imgRef.current?.click(); }} style={bs} onMouseEnter={e => (e.currentTarget.style.color = "#aaa")} onMouseLeave={e => (e.currentTarget.style.color = "#555")}>🖼</button>
      <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) insertImg(f); e.target.value = ""; }} />
      <button title="Insert Table" onMouseDown={e => { e.preventDefault(); exec("insertHTML", '<table style="border-collapse:collapse;width:100%"><tr><td style="border:1px solid #333;padding:6px">&nbsp;</td><td style="border:1px solid #333;padding:6px">&nbsp;</td></tr><tr><td style="border:1px solid #333;padding:6px">&nbsp;</td><td style="border:1px solid #333;padding:6px">&nbsp;</td></tr></table>'); }} style={bs} onMouseEnter={e => (e.currentTarget.style.color = "#aaa")} onMouseLeave={e => (e.currentTarget.style.color = "#555")}>⊞</button>
      <button title={fullscreen ? "Exit Fullscreen" : "Fullscreen"} onMouseDown={e => { e.preventDefault(); setFullscreen(v => !v); }} style={{ ...bs, marginLeft: "auto", color: fullscreen ? "#60a5fa" : "#555" }} onMouseEnter={e => (e.currentTarget.style.color = "#aaa")} onMouseLeave={e => (e.currentTarget.style.color = fullscreen ? "#60a5fa" : "#555")}>{fullscreen ? "⊠" : "⛶"}</button>
    </div>
  );

  // IMPORTANT: do NOT use dangerouslySetInnerHTML here. React would re-apply
  // it on every parent re-render, wiping the DOM and resetting the caret.
  // The useEffect above handles initial mount + external value updates.
  const editorArea = (
    <div ref={ref} contentEditable suppressContentEditableWarning onInput={onInput} data-placeholder={placeholder}
      style={{ minHeight: fullscreen ? "calc(100vh - 80px)" : 220, padding: "12px 14px", outline: "none", color: "#ccc", fontSize: 14, lineHeight: 1.75, background: "#161616", overflowY: "auto" }} />
  );

  const css = `
    [contenteditable]:empty:before{content:attr(data-placeholder);color:#2a2a2a;pointer-events:none}
    [contenteditable] h1{font-size:1.6em;font-weight:800;margin:1.8em 0 0.6em;color:#e5e5e5}
    [contenteditable] h2{font-size:1.3em;font-weight:800;margin:1.8em 0 0.6em;color:#e5e5e5}
    [contenteditable] h3{font-size:1.1em;font-weight:700;margin:1.4em 0 0.4em;color:#e5e5e5}
    [contenteditable] h4{font-size:1em;font-weight:700;margin:1.2em 0 0.4em;color:#ccc}
    [contenteditable] > h1:first-child,[contenteditable] > h2:first-child,[contenteditable] > h3:first-child,[contenteditable] > h4:first-child{margin-top:0}
    [contenteditable] p{margin:0 0 1em}
    [contenteditable] p:last-child{margin-bottom:0}
    [contenteditable] blockquote{border-left:3px solid #333;margin:1em 0;padding:6px 14px;color:#888;font-style:italic;background:#111}
    [contenteditable] pre{background:#0a0a0a;border:1px solid #1a1a1a;border-radius:6px;padding:10px 14px;font-family:monospace;font-size:12px;color:#9ca3af;overflow-x:auto;margin:1em 0}
    [contenteditable] ul{padding-left:22px;list-style:disc;margin:0.4em 0 1.2em}[contenteditable] ol{padding-left:22px;margin:0.4em 0 1.2em}
    [contenteditable] li{margin:2px 0}
    [contenteditable] a{color:#60a5fa;text-decoration:underline}
    [contenteditable] img{max-width:100%;border-radius:6px;margin:8px 0;display:block}
    [contenteditable] hr{border:none;border-top:1px solid #222;margin:14px 0}
    [contenteditable] table{border-collapse:collapse;width:100%;margin:10px 0}
    [contenteditable] td,[contenteditable] th{border:1px solid #333;padding:6px 10px;font-size:13px}
  `;

  const editorModal = editorState && (
    <PhotoEditor
      imageUrl={editorState.url}
      imageId={editorState.id}
      onSave={(result) => {
        exec("insertImage", result.coverUrl);
        setEditorState(null);
      }}
      onClose={() => setEditorState(null)}
    />
  );

  if (fullscreen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
        {toolbar}
        <div style={{ flex: 1, overflowY: "auto" }}>{editorArea}</div>
        <style>{css}</style>
        {editorModal}
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #222", borderRadius: 8, overflow: "hidden" }}>
      {toolbar}
      {editorArea}
      <style>{css}</style>
      {editorModal}
    </div>
  );
}

// ── Price Row ─────────────────────────────────────────────────────────────────
const PRICE_LABELS: Record<string, string> = { ADULT: "ผู้ใหญ่", CHILD: "เด็ก", NON_DIVER: "Non-diver", DIVER: "Diver" };

function PricingSection({ tiers, onChange }: { tiers: PriceTier[]; onChange: (t: PriceTier[]) => void }) {
  const set = (i: number, f: keyof PriceTier, v: string) => { const next = [...tiers]; next[i] = { ...next[i], [f]: v }; onChange(next); };
  const inp: React.CSSProperties = { width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 6, color: "#ccc", fontSize: 13, padding: "7px 10px", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 1fr 1fr", gap: 6 }}>
        {["", "ต้นทุน", "ราคาขาย *", "ส่วนลด", "ราคาส่ง"].map((h, i) => (
          <span key={i} style={{ fontSize: 10, color: "#2a2a2a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 2px" }}>{h}</span>
        ))}
      </div>
      {tiers.map((tier, i) => (
        <div key={tier.tier} style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 1fr 1fr", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>{PRICE_LABELS[tier.tier] ?? tier.tier}</span>
          {(["costPrice", "regularPrice", "salePrice", "agentPrice"] as const).map(f => (
            <div key={f} style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#2a2a2a", fontWeight: 700 }}>฿</span>
              <input type="number" value={tier[f]} onChange={e => set(i, f, e.target.value)} placeholder="—" style={{ ...inp, paddingLeft: 20 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main BoatForm component ───────────────────────────────────────────────────
export interface BoatFormProps {
  form: BoatFormData;
  onChange: (f: BoatFormData) => void;
  companies: { id: string; name: string }[];
  serviceAreas?: {
    id: string;
    countryId?: string | null;
    translations: { lang: string; name: string }[];
  }[];
  countries?: {
    id: string;
    code: string;
    flag: string;
    translations: { lang: string; name: string }[];
  }[];
  nameLabel?: string;
}

export function BoatForm({ form, onChange, companies, serviceAreas = [], countries = [], nameLabel = "ชื่อเรือ (ภายใน)" }: BoatFormProps) {
  const [activeLang, setActiveLang] = useState<LangKey>("en");
  const [areaCountryId, setAreaCountryId] = useState<string>("");

  // Auto-pick the country that owns the first selected service-area on mount/edit,
  // or fall back to the first available country.
  useEffect(() => {
    if (areaCountryId) return;
    if (countries.length === 0) return;
    const firstSelectedArea = serviceAreas.find(a => form.serviceAreaIds.includes(a.id));
    if (firstSelectedArea?.countryId) {
      setAreaCountryId(firstSelectedArea.countryId);
    } else {
      setAreaCountryId(countries[0]!.id);
    }
  }, [countries, serviceAreas, form.serviceAreaIds, areaCountryId]);

  const set = (key: keyof BoatFormData, val: unknown) => onChange({ ...form, [key as string]: val });
  const setLang = (l: LangKey, f: string, v: string | string[]) => onChange({ ...form, [l]: { ...form[l], [f]: v } });
  const inp: React.CSSProperties = { width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { fontSize: 11, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* Company */}
      <div>
        <label style={lbl}>บริษัท / เจ้าของเรือ</label>
        <select value={form.companyId} onChange={e => set("companyId", e.target.value)} style={inp}>
          <option value="">— ไม่ระบุ —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {companies.length === 0 && (
          <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>กำลังโหลดรายชื่อบริษัท…</div>
        )}
      </div>

      {/* Name + Status + Featured */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "end" }}>
        <div>
          <label style={lbl}>{nameLabel}</label>
          <input type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="เช่น MV Manta Queen 5" style={inp} />
        </div>
        <div>
          <label style={lbl}>สถานะ</label>
          <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inp, width: "auto" }}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">เผยแพร่</option>
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", paddingBottom: 9 }}>
          <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} style={{ accentColor: "#3b82f6", width: 14, height: 14 }} />
          <span style={{ fontSize: 12, color: "#555" }}>Featured</span>
        </label>
      </div>

      {/* Cover Images */}
      <div>
        <label style={lbl}>Cover Images (หน้าปกสินค้า)</label>
        <CoverGallery images={form.covers} onChange={imgs => set("covers", imgs)} />
      </div>

      {/* General Photos */}
      <div>
        <label style={lbl}>รูปทั่วไป (Gallery)</label>
        <PhotoGallery images={form.photos} onChange={imgs => set("photos", imgs)} />
      </div>

      {/* Video Clips */}
      <div>
        <label style={lbl}>Video Clips</label>
        <VideoGallery videos={form.videos} onChange={vids => set("videos", vids)} />
      </div>

      {/* Country + Service Areas (country first, then areas) */}
      {(countries.length > 0 || serviceAreas.length > 0) && (() => {
        const pickName = (trs: { lang: string; name: string }[]) =>
          trs.find(t => t.lang === "th")?.name || trs.find(t => t.lang === "en")?.name || trs.find(t => t.name)?.name || "";

        const selectedCount = (cid: string) =>
          serviceAreas.filter(a => a.countryId === cid && form.serviceAreaIds.includes(a.id)).length;

        const visibleAreas = areaCountryId
          ? serviceAreas.filter(a => a.countryId === areaCountryId)
          : serviceAreas;

        const totalSelected = form.serviceAreaIds.length;
        const inCurrentCountry = areaCountryId ? selectedCount(areaCountryId) : totalSelected;
        const inOtherCountries = totalSelected - inCurrentCountry;

        return (
          <div>
            <label style={lbl}>ประเทศ &amp; พื้นที่ให้บริการ</label>

            {/* Country chips */}
            {countries.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {countries.map(c => {
                  const active = areaCountryId === c.id;
                  const count = selectedCount(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => setAreaCountryId(c.id)}
                      style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: active ? "#1e3a5f" : "#111", border: `1px solid ${active ? "#3b82f6" : "#222"}`, borderRadius: 20, padding: "5px 12px" }}>
                      <span style={{ fontSize: 14 }}>{c.flag || "🏳️"}</span>
                      <span style={{ fontSize: 12, color: active ? "#60a5fa" : "#666", fontWeight: active ? 700 : 500 }}>
                        {pickName(c.translations) || c.code}
                      </span>
                      {count > 0 && (
                        <span style={{ fontSize: 9, background: "#3b82f6", color: "#fff", borderRadius: 8, padding: "0 5px", fontWeight: 700 }}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Filtered service-area chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {visibleAreas.length === 0 && (
                <div style={{ fontSize: 11, color: "#444", padding: "8px 0" }}>
                  ยังไม่มีพื้นที่ให้บริการในประเทศนี้ — เพิ่มที่ Settings → พื้นที่ให้บริการ
                </div>
              )}
              {visibleAreas.map(a => {
                const checked = form.serviceAreaIds.includes(a.id);
                const label = pickName(a.translations) || a.id;
                return (
                  <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: checked ? "#1a2a3a" : "#111", border: `1px solid ${checked ? "#3b82f6" : "#222"}`, borderRadius: 20, padding: "5px 12px" }}>
                    <input type="checkbox" checked={checked}
                      onChange={e => set("serviceAreaIds", e.target.checked ? [...form.serviceAreaIds, a.id] : form.serviceAreaIds.filter(id => id !== a.id))}
                      style={{ accentColor: "#3b82f6", width: 13, height: 13 }} />
                    <span style={{ fontSize: 12, color: checked ? "#60a5fa" : "#555", fontWeight: checked ? 600 : 400 }}>{label}</span>
                  </label>
                );
              })}
            </div>

            {inOtherCountries > 0 && (
              <div style={{ fontSize: 10, color: "#555", marginTop: 8 }}>
                + เลือกในประเทศอื่นไว้ {inOtherCountries} พื้นที่ (สลับธงด้านบนเพื่อดู/แก้)
              </div>
            )}
          </div>
        );
      })()}

      {/* Lang tabs */}
      <div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
          {ALL_LANGS.map(l => (
            <button key={l} onClick={() => setActiveLang(l)}
              style={{ padding: "5px 12px", borderRadius: 20, border: activeLang === l ? "none" : "1px solid #222", cursor: "pointer", fontSize: 11, fontWeight: 700, background: activeLang === l ? "#3b82f6" : "transparent", color: activeLang === l ? "#fff" : "#333" }}>
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        {ALL_LANGS.map(l => (
          <div key={l} style={{ display: activeLang === l ? "flex" : "none", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={lbl}>Title ({LANG_LABELS[l]})</label>
              <input type="text" value={form[l].title} onChange={e => setLang(l, "title", e.target.value)} placeholder="Title..." style={inp} />
            </div>
            <div>
              <label style={lbl}>Permalink</label>
              <div style={{ display: "flex", alignItems: "center", background: "#161616", border: "1px solid #222", borderRadius: 7, overflow: "hidden" }}>
                <span style={{ padding: "9px 10px", fontSize: 12, color: "#2a2a2a", fontWeight: 600, borderRight: "1px solid #222", whiteSpace: "nowrap" }}>/boat/</span>
                <input type="text" value={form[l].slug} onChange={e => setLang(l, "slug", e.target.value.toLowerCase().replace(/[^a-z0-9-ก-๙]/g, "-").replace(/-+/g, "-"))}
                  placeholder="boat-slug" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#ccc", fontSize: 13, padding: "9px 12px" }} />
              </div>
            </div>
            <div>
              <label style={lbl}>Excerpt</label>
              <textarea value={form[l].excerpt} onChange={e => setLang(l, "excerpt", e.target.value)} rows={2}
                style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={lbl}>Content</label>
              <RichEditor value={form[l].content} onChange={h => setLang(l, "content", h)} placeholder="เนื้อหา..." />
            </div>
            <div>
              <label style={lbl}>Keywords / Hashtags ({LANG_LABELS[l]})</label>
              <TagInput tags={form[l].keywords} onChange={kw => setLang(l, "keywords", kw)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// backward compat
export const TripForm = BoatForm;
export type TripFormProps = BoatFormProps;
