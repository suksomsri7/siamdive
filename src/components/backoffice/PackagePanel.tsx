"use client";

import { useState, useEffect, useCallback } from "react";
import { ALL_LANGS, LANG_LABELS, type LangKey, RichEditor } from "./TripForm";
import ImageEditorField from "../PhotoEditor/ImageEditorField";

// ─── Types ────────────────────────────────────────────────────────────────────

type LangForm = {
  title: string; slug: string; excerpt: string; content: string; keywords: string[];
};

type SeasonTier = "HIGH_SEASON" | "PEAK_SEASON" | "GREEN_SEASON" | "ALL_SEASON";

type PriceTierForm = {
  tier: SeasonTier; costPrice: string; regularPrice: string; salePrice: string; agentPrice: string;
};

type SeasonPeriodForm = {
  _key: string; // local key for React
  season: SeasonTier; startDate: string; endDate: string;
};

type PkgForm = {
  name: string; totalSeats: string; status: "DRAFT" | "PUBLISHED";
  photos: string[];
  priceTiers: PriceTierForm[];
  seasonPeriods: SeasonPeriodForm[];
  // dive-resort room attributes (only edited when roomFields=true)
  bedType: string; occupancyMin: string; occupancyMax: string; roomSizeSqm: string; pricePerNight: string; amenities: string[];
} & Record<LangKey, LangForm>;

type PkgRow = {
  id: string; name: string; totalSeats: number | null; status: string;
  photos: string[];
  translations: { lang: string; title: string; slug: string; excerpt: string; content: string; keywords: string[] }[];
  priceTiers: { tier: string; costPrice: number | null; regularPrice: number; salePrice: number | null; agentPrice: number | null }[];
  seasonPeriods: { id: string; season: string; startDate: string; endDate: string }[];
  bedType?: string | null; occupancyMin?: number | null; occupancyMax?: number | null; roomSizeSqm?: number | null; pricePerNight?: number | null; amenities?: string[];
};

const SEASONS: { tier: SeasonTier; label: string; color: string }[] = [
  { tier: "HIGH_SEASON",  label: "High Season",  color: "#f59e0b" },
  { tier: "PEAK_SEASON",  label: "Peak Season",  color: "#ef4444" },
  { tier: "GREEN_SEASON", label: "Green Season", color: "#22c55e" },
  { tier: "ALL_SEASON",   label: "All Season",   color: "#818cf8" },
];

let _keyCounter = 0;
const newKey = () => String(++_keyCounter);

function emptyTiers(): PriceTierForm[] {
  return SEASONS.map(s => ({ tier: s.tier, costPrice: "", regularPrice: "", salePrice: "", agentPrice: "" }));
}

function emptyLang(): LangForm {
  return { title: "", slug: "", excerpt: "", content: "", keywords: [] };
}

function emptyForm(): PkgForm {
  const langs = Object.fromEntries(ALL_LANGS.map(l => [l, emptyLang()])) as Record<LangKey, LangForm>;
  return { name: "", totalSeats: "", status: "DRAFT", photos: [], priceTiers: emptyTiers(), seasonPeriods: [], bedType: "", occupancyMin: "", occupancyMax: "", roomSizeSqm: "", pricePerNight: "", amenities: [], ...langs };
}

function rowToForm(pkg: PkgRow): PkgForm {
  const form = emptyForm();
  form.name = pkg.name;
  form.totalSeats = pkg.totalSeats?.toString() ?? "";
  form.status = pkg.status as "DRAFT" | "PUBLISHED";
  form.photos = pkg.photos ?? [];
  form.bedType = pkg.bedType ?? "";
  form.occupancyMin = pkg.occupancyMin?.toString() ?? "";
  form.occupancyMax = pkg.occupancyMax?.toString() ?? "";
  form.roomSizeSqm = pkg.roomSizeSqm?.toString() ?? "";
  form.pricePerNight = pkg.pricePerNight?.toString() ?? "";
  form.amenities = pkg.amenities ?? [];
  form.priceTiers = SEASONS.map(s => {
    const p = pkg.priceTiers?.find(x => x.tier === s.tier);
    return { tier: s.tier, costPrice: p?.costPrice?.toString() ?? "", regularPrice: p?.regularPrice?.toString() ?? "", salePrice: p?.salePrice?.toString() ?? "", agentPrice: p?.agentPrice?.toString() ?? "" };
  });
  form.seasonPeriods = (pkg.seasonPeriods ?? []).map(p => ({
    _key: newKey(),
    season: p.season as SeasonTier,
    startDate: p.startDate?.slice(0, 10) ?? "",
    endDate: p.endDate?.slice(0, 10) ?? "",
  }));
  for (const tr of pkg.translations) {
    if (ALL_LANGS.includes(tr.lang as LangKey))
      (form as Record<string, unknown>)[tr.lang] = { title: tr.title, slug: tr.slug, excerpt: tr.excerpt, content: tr.content, keywords: tr.keywords ?? [] };
  }
  return form;
}

// ─── Input helpers ────────────────────────────────────────────────────────────

const inputStyle = { width: "100%", background: "#111", border: "1px solid #222", borderRadius: 6, padding: "7px 10px", color: "#ddd", fontSize: 13, outline: "none", boxSizing: "border-box" as const };
const labelStyle = { fontSize: 11, color: "#444", fontWeight: 600, marginBottom: 3, display: "block" as const };
const taStyle = { ...inputStyle, resize: "vertical" as const, minHeight: 80, fontFamily: "inherit" };

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { boatId: string; boatName: string; onClose: () => void; seasonPricing?: boolean; defaultEditId?: string; defaultNew?: boolean; label?: string; roomFields?: boolean; };

export default function PackagePanel({ boatId, boatName, onClose, seasonPricing = false, defaultEditId, defaultNew, label = "Package", roomFields = false }: Props) {
  const [packages, setPackages] = useState<PkgRow[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PkgForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<LangKey>("en");
  const [keywordInput, setKeywordInput] = useState<Record<LangKey, string>>(() =>
    Object.fromEntries(ALL_LANGS.map(l => [l, ""])) as Record<LangKey, string>
  );

  const load = useCallback(async () => {
    const data = await fetch(`/api/packages?boatId=${boatId}`).then(r => r.json()).catch(() => []);
    setPackages(Array.isArray(data) ? data : []);
  }, [boatId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { if (defaultNew) openNew(); }, [defaultNew]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (defaultEditId && packages.length > 0) {
      const pkg = packages.find(p => p.id === defaultEditId);
      if (pkg) openEdit(pkg);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultEditId, packages]);

  const set = (key: keyof PkgForm, val: unknown) => setForm(f => ({ ...f, [key]: val }));
  const setLang = (l: LangKey, key: keyof LangForm, val: unknown) =>
    setForm(f => ({ ...f, [l]: { ...(f[l] as LangForm), [key]: val } }));
  const setTierField = (tier: SeasonTier, field: keyof PriceTierForm, val: string) =>
    setForm(f => ({ ...f, priceTiers: f.priceTiers.map(t => t.tier === tier ? { ...t, [field]: val } : t) }));

  const addPeriod = (season: SeasonTier) =>
    setForm(f => ({ ...f, seasonPeriods: [...f.seasonPeriods, { _key: newKey(), season, startDate: "", endDate: "" }] }));
  const updatePeriod = (key: string, field: "startDate" | "endDate", val: string) =>
    setForm(f => ({ ...f, seasonPeriods: f.seasonPeriods.map(p => p._key === key ? { ...p, [field]: val } : p) }));
  const removePeriod = (key: string) =>
    setForm(f => ({ ...f, seasonPeriods: f.seasonPeriods.filter(p => p._key !== key) }));

  const openNew = () => { setForm(emptyForm()); setEditId(null); setFormOpen(true); setActiveLang("en"); };
  const openEdit = (pkg: PkgRow) => { setForm(rowToForm(pkg)); setEditId(pkg.id); setFormOpen(true); setActiveLang("en"); };
  const closeForm = () => { setFormOpen(false); setEditId(null); };

  const save = async () => {
    setSaving(true);
    const body = {
      boatId, name: form.name, totalSeats: form.totalSeats || null, status: form.status,
      photos: form.photos,
      ...(roomFields ? {
        bedType: form.bedType || null, occupancyMin: form.occupancyMin || null, occupancyMax: form.occupancyMax || null,
        roomSizeSqm: form.roomSizeSqm || null, pricePerNight: form.pricePerNight || null, amenities: form.amenities,
      } : {}),
      translations: ALL_LANGS.map(l => ({ lang: l, ...(form[l] as LangForm) })),
      priceTiers: seasonPricing ? form.priceTiers.map(t => ({
        tier: t.tier,
        costPrice: t.costPrice ? Number(t.costPrice) : null,
        regularPrice: Number(t.regularPrice) || 0,
        salePrice: t.salePrice ? Number(t.salePrice) : null,
        agentPrice: t.agentPrice ? Number(t.agentPrice) : null,
      })) : [],
      seasonPeriods: form.seasonPeriods.filter(p => p.startDate && p.endDate).map(p => ({
        season: p.season, startDate: p.startDate, endDate: p.endDate,
      })),
    };
    if (editId) await fetch(`/api/packages/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    else await fetch("/api/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load(); setSaving(false); closeForm();
  };

  const deletePkg = async (id: string) => {
    if (!confirm(`ลบ ${label.toLowerCase()} นี้?`)) return;
    await fetch(`/api/packages/${id}`, { method: "DELETE" }); await load();
  };

  const addKeyword = (l: LangKey) => {
    const kw = keywordInput[l].trim(); if (!kw) return;
    setLang(l, "keywords", [...(form[l] as LangForm).keywords, kw]);
    setKeywordInput(k => ({ ...k, [l]: "" }));
  };
  const removeKeyword = (l: LangKey, i: number) => {
    const kws = [...(form[l] as LangForm).keywords]; kws.splice(i, 1); setLang(l, "keywords", kws);
  };

  const statusSt = (s: string) => s === "PUBLISHED" ? { bg: "#14532d", color: "#4ade80" } : { bg: "#1a1a1a", color: "#555" };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />

      {/* Package list panel */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(520px, 100vw)", background: "#0d0d0d", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>{label}s</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{boatName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>✕</button>
          <button onClick={openNew} style={{ background: "#1a3a1a", border: "1px solid #2a5a2a", color: "#4ade80", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            + เพิ่ม {label}
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {packages.length === 0 && <div style={{ fontSize: 12, color: "#2a2a2a", textAlign: "center", marginTop: 40 }}>ยังไม่มี {label}</div>}
          {packages.map(pkg => {
            const enTitle = pkg.translations.find(t => t.lang === "en")?.title;
            const st = statusSt(pkg.status);
            return (
              <div key={pkg.id} style={{ background: "#090909", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: "#ccc", fontSize: 13 }}>{enTitle || pkg.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, background: st.bg, color: st.color, padding: "1px 6px", borderRadius: 8 }}>{pkg.status}</span>
                  {pkg.totalSeats && <span style={{ fontSize: 10, color: "#333" }}>{pkg.totalSeats} ที่นั่ง</span>}
                </div>
                {enTitle && enTitle !== pkg.name && <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>({pkg.name})</div>}

                {/* Season summary */}
                {seasonPricing && (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {SEASONS.map(s => {
                      const tier = pkg.priceTiers?.find(x => x.tier === s.tier);
                      const periods = (pkg.seasonPeriods ?? []).filter(x => x.season === s.tier);
                      if (!tier?.regularPrice && !periods.length) return null;
                      return (
                        <div key={s.tier} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: s.color, background: `${s.color}18`, padding: "1px 7px", borderRadius: 6, flexShrink: 0 }}>{s.label}</span>
                          {tier?.regularPrice ? (
                            <span style={{ fontSize: 11, color: "#aaa" }}>
                              {tier.salePrice ? <><s style={{ color: "#333", fontSize: 10 }}>฿{tier.regularPrice.toLocaleString()}</s> ฿{tier.salePrice.toLocaleString()}</> : <>฿{tier.regularPrice.toLocaleString()}</>}
                            </span>
                          ) : null}
                          {periods.length > 0 && (
                            <span style={{ fontSize: 10, color: "#555" }}>
                              {periods.map(p => `${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}`).join(", ")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => openEdit(pkg)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 5, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => deletePkg(pkg.id)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 5, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Package form panel */}
      {formOpen && (
        <>
        <div onClick={closeForm} style={{ position: "absolute", inset: 0, zIndex: 2 }} />
        <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(620px, 100vw)", background: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", zIndex: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ccc", flex: 1 }}>{editId ? `แก้ไข ${label}` : `เพิ่ม ${label}`}</span>
            <button onClick={save} disabled={saving} style={{ background: "#1d4ed8", border: "none", color: "#fff", borderRadius: 7, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Basic info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={labelStyle}>ชื่อ {label} (ภายใน)</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} style={inputStyle} placeholder="เช่น Sea View Suite - Full Board" />
              </div>
              <div>
                <label style={labelStyle}>ที่นั่ง</label>
                <input value={form.totalSeats} onChange={e => set("totalSeats", e.target.value)} style={{ ...inputStyle, width: 64 }} type="number" placeholder="—" />
              </div>
              <div>
                <label style={labelStyle}>สถานะ</label>
                <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                </select>
              </div>
            </div>

            {/* Room attributes (dive resort) */}
            {roomFields && (
              <div style={{ border: "1px solid #1d2a1d", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10, background: "#0f140f" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#6cc26c" }}>🛏️ รายละเอียดห้องพัก</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <div><label style={labelStyle}>ประเภทเตียง</label><input value={form.bedType} onChange={e => set("bedType", e.target.value)} style={inputStyle} placeholder="Double or Twin" /></div>
                  <div><label style={labelStyle}>จุขั้นต่ำ</label><input type="number" value={form.occupancyMin} onChange={e => set("occupancyMin", e.target.value)} style={inputStyle} placeholder="1" /></div>
                  <div><label style={labelStyle}>จุสูงสุด</label><input type="number" value={form.occupancyMax} onChange={e => set("occupancyMax", e.target.value)} style={inputStyle} placeholder="2" /></div>
                  <div><label style={labelStyle}>ขนาด (ตร.ม.)</label><input type="number" value={form.roomSizeSqm} onChange={e => set("roomSizeSqm", e.target.value)} style={inputStyle} placeholder="—" /></div>
                  <div style={{ gridColumn: "span 2" }}><label style={labelStyle}>ราคาห้อง/คืน</label><input type="number" value={form.pricePerNight} onChange={e => set("pricePerNight", e.target.value)} style={inputStyle} placeholder="—" /></div>
                </div>
                <div><label style={labelStyle}>สิ่งอำนวยความสะดวก (คั่นด้วย ,)</label>
                  <input value={form.amenities.join(", ")} onChange={e => set("amenities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} style={inputStyle} placeholder="Air Conditioning, Private bathroom" /></div>
              </div>
            )}

            {/* Photos — unlimited gallery */}
            <div>
              <label style={{ ...labelStyle, fontSize: 12, color: "#555", marginBottom: 8 }}>รูปภาพ {label} (อัพโหลดได้ไม่จำกัด)</label>
              <ImageEditorField multi values={form.photos} onChangeMulti={(urls) => set("photos", urls)} aspectRatio={1} />
            </div>

            {/* Season Pricing + Date Ranges — Dive Resort only */}
            {seasonPricing && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ ...labelStyle, fontSize: 12, color: "#555" }}>ราคาและช่วงเวลาตามฤดูกาล</label>

                {/* Price header */}
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr", gap: 8 }}>
                  <div />
                  {["ต้นทุน", "ราคาขาย *", "ส่วนลด", "ราคาส่ง"].map(h => (
                    <span key={h} style={{ fontSize: 9, color: "#2a2a2a", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", textAlign: "center" as const }}>{h}</span>
                  ))}
                </div>

                {SEASONS.map(s => {
                  const tier = form.priceTiers.find(t => t.tier === s.tier)!;
                  const periods = form.seasonPeriods.filter(p => p.season === s.tier);
                  return (
                    <div key={s.tier} style={{ border: `1px solid ${s.color}30`, borderRadius: 8, overflow: "hidden" }}>
                      {/* Price row */}
                      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "10px 12px", background: `${s.color}08` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</span>
                        {(["costPrice", "regularPrice", "salePrice", "agentPrice"] as const).map(field => (
                          <div key={field} style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#2a2a2a", pointerEvents: "none" }}>฿</span>
                            <input type="number" value={tier[field]} onChange={e => setTierField(s.tier, field, e.target.value)} placeholder="—"
                              style={{ ...inputStyle, paddingLeft: 18, fontSize: 12 }} />
                          </div>
                        ))}
                      </div>

                      {/* Date ranges */}
                      <div style={{ padding: "8px 12px", background: "#0a0a0a", borderTop: `1px solid ${s.color}20` }}>
                        <div style={{ fontSize: 10, color: "#333", fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>ช่วงวันที่</div>
                        {periods.map(p => (
                          <div key={p._key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <input type="date" value={p.startDate} onChange={e => updatePeriod(p._key, "startDate", e.target.value)}
                              style={{ ...inputStyle, flex: 1, fontSize: 12 }} />
                            <span style={{ color: "#333", fontSize: 12, flexShrink: 0 }}>→</span>
                            <input type="date" value={p.endDate} onChange={e => updatePeriod(p._key, "endDate", e.target.value)}
                              style={{ ...inputStyle, flex: 1, fontSize: 12 }} />
                            <button onClick={() => removePeriod(p._key)}
                              style={{ background: "none", border: "1px solid #2a1010", color: "#5a2020", borderRadius: 5, padding: "5px 7px", cursor: "pointer", flexShrink: 0, fontSize: 12 }}>✕</button>
                          </div>
                        ))}
                        <button onClick={() => addPeriod(s.tier)}
                          style={{ background: "none", border: `1px dashed ${s.color}50`, color: s.color, borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer", width: "100%", opacity: 0.7 }}>
                          + เพิ่มช่วงวันที่
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Language tabs */}
            <div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                {ALL_LANGS.map(l => (
                  <button key={l} onClick={() => setActiveLang(l)} style={{ padding: "5px 12px", borderRadius: 20, border: activeLang === l ? "none" : "1px solid #222", cursor: "pointer", fontSize: 11, fontWeight: 700, background: activeLang === l ? "#3b82f6" : "transparent", color: activeLang === l ? "#fff" : "#333" }}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
              {ALL_LANGS.map(l => {
                const lf = form[l] as LangForm;
                return (
                  <div key={l} style={{ display: activeLang === l ? "flex" : "none", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div><label style={labelStyle}>Title</label><input value={lf.title} onChange={e => setLang(l, "title", e.target.value)} style={inputStyle} /></div>
                      <div><label style={labelStyle}>Slug</label><input value={lf.slug} onChange={e => setLang(l, "slug", e.target.value)} style={inputStyle} /></div>
                    </div>
                    <div><label style={labelStyle}>Excerpt</label><textarea value={lf.excerpt} onChange={e => setLang(l, "excerpt", e.target.value)} style={{ ...taStyle, minHeight: 60 }} /></div>
                    <div><label style={labelStyle}>Detail (Content)</label><RichEditor value={lf.content} onChange={h => setLang(l, "content", h)} /></div>
                    <div>
                      <label style={labelStyle}>Keywords</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                        {lf.keywords.map((kw, i) => (
                          <span key={i} style={{ background: "#1a1a2e", color: "#818cf8", fontSize: 11, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                            {kw}<button onClick={() => removeKeyword(l, i)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input value={keywordInput[l]} onChange={e => setKeywordInput(k => ({ ...k, [l]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addKeyword(l)} style={{ ...inputStyle, flex: 1 }} placeholder="พิมพ์แล้วกด Enter" />
                        <button onClick={() => addKeyword(l)} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#818cf8", borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontSize: 11 }}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
        </>
      )}
    </div>
  );
}
