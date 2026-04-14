"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ImageEditorField from "@/components/PhotoEditor/ImageEditorField";

const ALL_LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"] as const;
type LangKey = typeof ALL_LANGS[number];
const LANG_LABELS: Record<LangKey, string> = { en: "EN", th: "TH", cn: "中文", de: "DE", fr: "FR", ru: "RU", ko: "한국어", ja: "日本語" };

type CompanyRow = {
  id: string; logo: string | null; phone: string | null; email: string | null; lineId: string | null; status: string;
  covers: string[]; photos: string[];
  translations: { lang: string; name: string; description: string }[];
  boats: { id: string; name: string; type: string }[];
  createdAt: string;
};

const emptyForm = () => ({
  logo: "",
  phone: "", email: "", lineId: "",
  status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  covers: [] as string[],
  photos: [] as string[],
  translations: ALL_LANGS.map(l => ({ lang: l, name: "", description: "" })),
});
type CompanyForm = ReturnType<typeof emptyForm>;

function rowToForm(c: CompanyRow): CompanyForm {
  return {
    logo: c.logo ?? "",
    phone: c.phone ?? "", email: c.email ?? "", lineId: c.lineId ?? "",
    status: c.status as "ACTIVE" | "INACTIVE",
    covers: c.covers ?? [],
    photos: c.photos ?? [],
    translations: ALL_LANGS.map(l => {
      const t = c.translations.find(x => x.lang === l);
      return { lang: l, name: t?.name ?? "", description: t?.description ?? "" };
    }),
  };
}

// ── Cover Gallery (uses Photo Editor) ─────────────────────────────────────────
function CoverGallery({ images, onChange }: { images: string[]; onChange: (i: string[]) => void }) {
  return <ImageEditorField multi values={images} onChangeMulti={(urls) => onChange(urls)} aspectRatio={1.5} />;
}

// ── Photo Gallery (uses Photo Editor) ─────────────────────────────────────────
function PhotoGallery({ images, onChange }: { images: string[]; onChange: (i: string[]) => void }) {
  return <ImageEditorField multi values={images} onChangeMulti={(urls) => onChange(urls)} aspectRatio={1.5} />;
}

// ── Logo upload (uses Photo Editor, square aspect) ────────────────────────────
function LogoUpload({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  return (
    <div style={{ maxWidth: 200 }}>
      <ImageEditorField value={value} onChange={onChange} aspectRatio={1} hint="โลโก้บริษัท (สี่เหลี่ยมจัตุรัส)" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm());
  const [activeLang, setActiveLang] = useState<LangKey>("en");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await fetch("/api/companies").then(r => r.json()).catch(() => []);
    setCompanies(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(emptyForm()); setEditId(null); setActiveLang("en"); setPanelOpen(true); };
  const openEdit = (c: CompanyRow) => { setForm(rowToForm(c)); setEditId(c.id); setActiveLang("en"); setPanelOpen(true); };
  const close = () => { setPanelOpen(false); setEditId(null); };

  const setTrans = (lang: LangKey, field: "name" | "description", val: string) => {
    setForm(f => ({
      ...f,
      translations: f.translations.map(t => t.lang === lang ? { ...t, [field]: val } : t),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      logo: form.logo || null,
      phone: form.phone || null,
      email: form.email || null,
      lineId: form.lineId || null,
      status: form.status,
      covers: form.covers,
      photos: form.photos,
      translations: form.translations.filter(t => t.name.trim()),
    };
    if (editId) {
      await fetch(`/api/companies/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setSaving(false); close(); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบบริษัทนี้? เรือและข้อมูลทั้งหมดจะถูกลบด้วย")) return;
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    load();
  };

  const inp: React.CSSProperties = { width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { fontSize: 11, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e5e5e5" }}>🏢 บริษัท</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#333" }}>{companies.length} บริษัท</p>
        </div>
        <button onClick={openNew}
          style={{ background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + เพิ่มบริษัท
        </button>
      </div>

      {/* Company cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {companies.map(c => {
          const enTrans = c.translations.find(t => t.lang === "en") ?? c.translations[0];
          const thTrans = c.translations.find(t => t.lang === "th");
          const dayCount = c.boats.filter(b => b.type === "DAYTRIP").length;
          const liveCount = c.boats.filter(b => b.type === "LIVEABOARD").length;

          return (
            <div key={c.id} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
              {/* Logo */}
              <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#111", border: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {c.logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : <span style={{ fontSize: 22 }}>🏢</span>}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: "#ccc", fontSize: 15 }}>{enTrans?.name || "—"}</span>
                  {thTrans?.name && thTrans.name !== enTrans?.name && (
                    <span style={{ fontSize: 12, color: "#444" }}>{thTrans.name}</span>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: c.status === "ACTIVE" ? "#14532d" : "#1a1a1a", color: c.status === "ACTIVE" ? "#4ade80" : "#555" }}>
                    {c.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 5, flexWrap: "wrap" }}>
                  {(dayCount > 0 || liveCount > 0) && (
                    <span style={{ fontSize: 11, color: "#444" }}>
                      {dayCount > 0 && `🤿 ${dayCount} Day Trip`}{dayCount > 0 && liveCount > 0 && " · "}{liveCount > 0 && `🚢 ${liveCount} Liveaboard`}
                    </span>
                  )}
                  {c.boats.length === 0 && <span style={{ fontSize: 11, color: "#2a2a2a" }}>ยังไม่มีเรือ</span>}
                  {c.phone && <span style={{ fontSize: 11, color: "#333" }}>📞 {c.phone}</span>}
                  {c.email && <span style={{ fontSize: 11, color: "#333" }}>✉ {c.email}</span>}
                  {c.lineId && <span style={{ fontSize: 11, color: "#333" }}>LINE: {c.lineId}</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => openEdit(c)}
                  style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#aaa", borderRadius: 7, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
                  แก้ไข
                </button>
                <button onClick={() => handleDelete(c.id)}
                  style={{ background: "none", border: "1px solid #2a1010", color: "#4a2020", borderRadius: 7, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
                  ลบ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {companies.length === 0 && (
        <div style={{ textAlign: "center", color: "#333", padding: "60px 0", fontSize: 14 }}>ยังไม่มีบริษัท — กด + เพื่อเพิ่ม</div>
      )}

      {/* ── Panel ── */}
      {panelOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={close} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }} />
          <div style={{ position: "relative", width: "min(520px,100vw)", background: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: "20px 22px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#e5e5e5" }}>{editId ? "แก้ไขบริษัท" : "เพิ่มบริษัท"}</span>
              <button onClick={close} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "22px", paddingBottom: 80, display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Logo */}
              <div>
                <label style={lbl}>โลโก้</label>
                <LogoUpload value={form.logo} onChange={u => setForm(f => ({ ...f, logo: u }))} />
              </div>

              {/* Contact */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>โทรศัพท์</label>
                  <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+66 xx xxx xxxx" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="info@company.com" style={inp} />
                </div>
                <div>
                  <label style={lbl}>LINE ID</label>
                  <input type="text" value={form.lineId} onChange={e => setForm(f => ({ ...f, lineId: e.target.value }))} placeholder="@lineid" style={inp} />
                </div>
                <div>
                  <label style={lbl}>สถานะ</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "ACTIVE" | "INACTIVE" }))} style={inp}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Cover Images */}
              <div>
                <label style={lbl}>Cover Images (หน้าปกสินค้า)</label>
                <CoverGallery images={form.covers} onChange={imgs => setForm(f => ({ ...f, covers: imgs }))} />
              </div>

              {/* General Photos */}
              <div>
                <label style={lbl}>รูปทั่วไป (Gallery)</label>
                <PhotoGallery images={form.photos} onChange={imgs => setForm(f => ({ ...f, photos: imgs }))} />
              </div>

              {/* Translations */}
              <div>
                <label style={lbl}>ชื่อบริษัท (หลายภาษา)</label>
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
                      <label style={lbl}>ชื่อ ({LANG_LABELS[l]})</label>
                      <input type="text" value={form.translations.find(t => t.lang === l)?.name ?? ""} onChange={e => setTrans(l, "name", e.target.value)} placeholder="Company name..." style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>คำอธิบาย ({LANG_LABELS[l]})</label>
                      <textarea value={form.translations.find(t => t.lang === l)?.description ?? ""} onChange={e => setTrans(l, "description", e.target.value)} rows={3}
                        style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} placeholder="Description..." />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "16px 22px", borderTop: "1px solid #111", display: "flex", gap: 10 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer" }}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button onClick={close} style={{ background: "#111", border: "1px solid #222", color: "#555", borderRadius: 8, padding: "12px 20px", fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
