"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ImageEditorField from "@/components/PhotoEditor/ImageEditorField";

const ALL_LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"] as const;
type LangKey = typeof ALL_LANGS[number];
const LANG_LABELS: Record<LangKey, string> = { en: "EN", th: "TH", cn: "中文", de: "DE", fr: "FR", ru: "RU", ko: "한국어", ja: "日本語" };

// ─── Types ────────────────────────────────────────────────────────────────────
type CompanyRow = {
  id: string; logo: string | null; phone: string | null; email: string | null; lineId: string | null; status: string;
  translations: { lang: string; name: string; description: string }[];
  boats: { id: string; name: string; type: string; capacity: number | null; photos: string[]; _count: { schedules: number } }[];
};

type BoatRow = {
  id: string; companyId: string; name: string; type: string; capacity: number | null; photos: string[]; covers: string[];
  company: { translations: { lang: string; name: string }[] };
  _count: { schedules: number };
};

// ─── Empty forms ──────────────────────────────────────────────────────────────
const emptyCompany = () => ({
  logo: "", phone: "", email: "", lineId: "", status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  translations: ALL_LANGS.map(l => ({ lang: l, name: "", description: "" })),
});

const emptyBoat = (companyId = "") => ({
  companyId, name: "", type: "DAYTRIP" as "DAYTRIP" | "LIVEABOARD", capacity: "", covers: [] as string[], photos: [] as string[],
});
type BoatForm = ReturnType<typeof emptyBoat>;

// ─── Cover & Photo Gallery (Photo Editor) ────────────────────────────────────
function CoverGallery({ images, onChange }: { images: string[]; onChange: (i: string[]) => void }) {
  return <ImageEditorField multi values={images} onChangeMulti={(urls) => onChange(urls)} aspectRatio={1.5} />;
}
function PhotoGallery({ images, onChange }: { images: string[]; onChange: (i: string[]) => void }) {
  return <ImageEditorField multi values={images} onChangeMulti={(urls) => onChange(urls)} aspectRatio={1.5} />;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FleetPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [boats, setBoats] = useState<BoatRow[]>([]);
  const [companyFilter, setCompanyFilter] = useState("ALL");

  // Company panel
  const [companyPanelOpen, setCompanyPanelOpen] = useState(false);
  const [companyEditId, setCompanyEditId] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState(emptyCompany());
  const [companySaving, setCompanySaving] = useState(false);

  // Boat panel
  const [boatPanelOpen, setBoatPanelOpen] = useState(false);
  const [boatEditId, setBoatEditId] = useState<string | null>(null);
  const [boatForm, setBoatForm] = useState<BoatForm>(emptyBoat());
  const [boatSaving, setBoatSaving] = useState(false);

  const load = useCallback(async () => {
    const [co, bo] = await Promise.all([
      fetch("/api/companies").then(r => r.json()),
      fetch("/api/boats").then(r => r.json()),
    ]);
    setCompanies(co);
    setBoats(bo);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Company CRUD
  const openNewCompany = () => { setCompanyForm(emptyCompany()); setCompanyEditId(null); setCompanyPanelOpen(true); };
  const openEditCompany = (c: CompanyRow) => {
    setCompanyForm({
      logo: c.logo ?? "", phone: c.phone ?? "", email: c.email ?? "", lineId: c.lineId ?? "",
      status: c.status as "ACTIVE" | "INACTIVE",
      translations: ALL_LANGS.map(l => { const tr = c.translations.find(t => t.lang === l); return { lang: l, name: tr?.name ?? "", description: tr?.description ?? "" }; }),
    });
    setCompanyEditId(c.id);
    setCompanyPanelOpen(true);
  };
  const closeCompany = () => { setCompanyPanelOpen(false); setCompanyEditId(null); };

  const saveCompany = async () => {
    setCompanySaving(true);
    const body = { logo: companyForm.logo || null, phone: companyForm.phone || null, email: companyForm.email || null, lineId: companyForm.lineId || null, status: companyForm.status, translations: companyForm.translations };
    const url = companyEditId ? `/api/companies/${companyEditId}` : "/api/companies";
    await fetch(url, { method: companyEditId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setCompanySaving(false);
    closeCompany();
    load();
  };

  const deleteCompany = async (id: string) => {
    if (!confirm("ลบบริษัทนี้? เรือและทริปทั้งหมดจะถูกลบด้วย")) return;
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    load();
  };

  // Boat CRUD
  const openNewBoat = (companyId = "") => { setBoatForm(emptyBoat(companyId)); setBoatEditId(null); setBoatPanelOpen(true); };
  const openEditBoat = (b: BoatRow) => {
    setBoatForm({ companyId: b.companyId, name: b.name, type: b.type as "DAYTRIP" | "LIVEABOARD", capacity: b.capacity?.toString() ?? "", covers: b.covers ?? [], photos: b.photos ?? [] });
    setBoatEditId(b.id);
    setBoatPanelOpen(true);
  };
  const closeBoat = () => { setBoatPanelOpen(false); setBoatEditId(null); };

  const saveBoat = async () => {
    setBoatSaving(true);
    const body = { companyId: boatForm.companyId || null, name: boatForm.name, type: boatForm.type, capacity: boatForm.capacity ? Number(boatForm.capacity) : null, covers: boatForm.covers, photos: boatForm.photos };
    const url = boatEditId ? `/api/boats/${boatEditId}` : "/api/boats";
    await fetch(url, { method: boatEditId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBoatSaving(false);
    closeBoat();
    load();
  };

  const deleteBoat = async (id: string) => {
    if (!confirm("ลบเรือนี้?")) return;
    await fetch(`/api/boats/${id}`, { method: "DELETE" });
    load();
  };

  const companyName = (c: CompanyRow | { translations: { lang: string; name: string }[] }) => c.translations.find(t => t.lang === "en")?.name || c.translations[0]?.name || "—";
  const filteredBoats = companyFilter === "ALL" ? boats : boats.filter(b => b.companyId === companyFilter);

  const inp: React.CSSProperties = { width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { fontSize: 11, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Companies ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#e5e5e5", margin: 0 }}>🏢 บริษัท / Companies</h2>
        <button onClick={openNewCompany} style={{ background: "#1a1a1a", color: "#aaa", border: "1px solid #222", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>+ เพิ่มบริษัท</button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
        {companies.length === 0 && <div style={{ fontSize: 13, color: "#2a2a2a", padding: "12px 0" }}>ยังไม่มีบริษัท</div>}
        {companies.map(c => (
          <div key={c.id} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: "14px 16px", minWidth: 200, maxWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {c.logo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={c.logo} alt="" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }} />
                : <div style={{ width: 32, height: 32, background: "#1a1a1a", borderRadius: 4 }} />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>{companyName(c)}</div>
                <div style={{ fontSize: 11, color: "#333" }}>{c.boats.length} เรือ · {c.boats.reduce((s, b) => s + b._count.schedules, 0)} schedules</div>
              </div>
            </div>
            {c.phone && <div style={{ fontSize: 11, color: "#444", marginBottom: 2 }}>📞 {c.phone}</div>}
            {c.email && <div style={{ fontSize: 11, color: "#444", marginBottom: 8 }}>✉ {c.email}</div>}
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => openNewBoat(c.id)} style={{ background: "none", border: "1px solid #1a3a5f", color: "#2a5a8f", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>+ เรือ</button>
              <button onClick={() => openEditCompany(c)} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>แก้ไข</button>
              <button onClick={() => deleteCompany(c.id)} style={{ background: "none", border: "1px solid #2a1010", color: "#4a2020", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>ลบ</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Boats ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#e5e5e5", margin: 0 }}>🚢 เรือ / Boats</h2>
        <button onClick={() => openNewBoat()} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ เพิ่มเรือ</button>
      </div>

      {/* Company filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {[{ id: "ALL", name: "ทั้งหมด" }, ...companies.map(c => ({ id: c.id, name: companyName(c) }))].map(c => (
          <button key={c.id} onClick={() => setCompanyFilter(c.id)}
            style={{ padding: "5px 14px", borderRadius: 20, border: companyFilter === c.id ? "none" : "1px solid #222", cursor: "pointer", fontSize: 12, fontWeight: 600, background: companyFilter === c.id ? "#3b82f6" : "transparent", color: companyFilter === c.id ? "#fff" : "#333" }}>
            {c.name}
          </button>
        ))}
      </div>

      <div style={{ background: "#0d0d0d", borderRadius: 12, border: "1px solid #1a1a1a", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
              {["", "ชื่อเรือ", "บริษัท", "ประเภท", "ความจุ", "ทริป", ""].map((h, i) => (
                <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBoats.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#2a2a2a", fontSize: 14 }}>ยังไม่มีเรือ</td></tr>
            )}
            {filteredBoats.map(b => (
              <tr key={b.id} style={{ borderBottom: "1px solid #111" }}>
                <td style={{ padding: "10px 14px", width: 56 }}>
                  {(b.photos as string[])?.[0]
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={(b.photos as string[])[0]} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 5 }} />
                    : <div style={{ width: 48, height: 36, background: "#111", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🚢</div>}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#ccc" }}>{b.name}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#555" }}>{b.company?.translations?.find(t => t.lang === "en")?.name ?? b.company?.translations?.[0]?.name ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: b.type === "LIVEABOARD" ? "#1e3a5f" : "#14532d", color: b.type === "LIVEABOARD" ? "#60a5fa" : "#4ade80" }}>{b.type}</span>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#555" }}>{b.capacity ? `${b.capacity} คน` : "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#555" }}>{b._count.schedules}</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <button onClick={() => openEditBoat(b)} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer", marginRight: 6 }}>แก้ไข</button>
                  <button onClick={() => deleteBoat(b.id)} style={{ background: "none", border: "1px solid #2a1010", color: "#4a2020", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Company Panel ── */}
      {companyPanelOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={closeCompany} style={{ flex: 1, background: "rgba(0,0,0,.6)" }} />
          <div style={{ width: 580, maxWidth: "100vw", background: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", height: "100vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#e5e5e5" }}>{companyEditId ? "แก้ไขบริษัท" : "เพิ่มบริษัทใหม่"}</h2>
              <button onClick={closeCompany} style={{ background: "none", border: "none", color: "#333", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", paddingBottom: 80, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Contact */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Logo URL</label>
                  <input value={companyForm.logo} onChange={e => setCompanyForm(f => ({ ...f, logo: e.target.value }))} placeholder="https://..." style={inp} />
                </div>
                <div>
                  <label style={lbl}>สถานะ</label>
                  <select value={companyForm.status} onChange={e => setCompanyForm(f => ({ ...f, status: e.target.value as "ACTIVE" | "INACTIVE" }))} style={inp}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>โทรศัพท์</label>
                  <input value={companyForm.phone} onChange={e => setCompanyForm(f => ({ ...f, phone: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>อีเมล</label>
                  <input type="email" value={companyForm.email} onChange={e => setCompanyForm(f => ({ ...f, email: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>LINE ID</label>
                  <input value={companyForm.lineId} onChange={e => setCompanyForm(f => ({ ...f, lineId: e.target.value }))} style={inp} />
                </div>
              </div>
              {/* Name per language */}
              <div>
                <label style={lbl}>ชื่อบริษัท (แต่ละภาษา)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ALL_LANGS.map(l => (
                    <div key={l} style={{ display: "grid", gridTemplateColumns: "40px 1fr 2fr", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2a2a2a" }}>{LANG_LABELS[l]}</span>
                      <input value={companyForm.translations.find(t => t.lang === l)?.name ?? ""} onChange={e => setCompanyForm(f => ({ ...f, translations: f.translations.map(t => t.lang === l ? { ...t, name: e.target.value } : t) }))} placeholder="ชื่อ..." style={inp} />
                      <input value={companyForm.translations.find(t => t.lang === l)?.description ?? ""} onChange={e => setCompanyForm(f => ({ ...f, translations: f.translations.map(t => t.lang === l ? { ...t, description: e.target.value } : t) }))} placeholder="รายละเอียด..." style={inp} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #1a1a1a", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={closeCompany} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={saveCompany} disabled={companySaving} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: companySaving ? "wait" : "pointer", opacity: companySaving ? 0.6 : 1 }}>{companySaving ? "กำลังบันทึก..." : "บันทึก"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Boat Panel ── */}
      {boatPanelOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={closeBoat} style={{ flex: 1, background: "rgba(0,0,0,.6)" }} />
          <div style={{ width: 500, maxWidth: "100vw", background: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", height: "100vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#e5e5e5" }}>{boatEditId ? "แก้ไขเรือ" : "เพิ่มเรือใหม่"}</h2>
              <button onClick={closeBoat} style={{ background: "none", border: "none", color: "#333", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", paddingBottom: 80, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lbl}>บริษัท</label>
                <select value={boatForm.companyId} onChange={e => setBoatForm(f => ({ ...f, companyId: e.target.value }))} style={inp}>
                  <option value="">— เลือกบริษัท —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{companyName(c)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>ชื่อเรือ</label>
                <input value={boatForm.name} onChange={e => setBoatForm(f => ({ ...f, name: e.target.value }))} placeholder="เช่น MV Manta Queen 5" style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>ประเภท</label>
                  <select value={boatForm.type} onChange={e => setBoatForm(f => ({ ...f, type: e.target.value as "DAYTRIP" | "LIVEABOARD" }))} style={inp}>
                    <option value="DAYTRIP">Day Trip</option>
                    <option value="LIVEABOARD">Liveaboard</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>ความจุ (คน)</label>
                  <input type="number" value={boatForm.capacity} onChange={e => setBoatForm(f => ({ ...f, capacity: e.target.value }))} placeholder="เช่น 30" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Cover Images (หน้าปกสินค้า)</label>
                <CoverGallery images={boatForm.covers} onChange={imgs => setBoatForm(f => ({ ...f, covers: imgs }))} />
              </div>
              <div>
                <label style={lbl}>รูปทั่วไป (Gallery)</label>
                <PhotoGallery images={boatForm.photos} onChange={imgs => setBoatForm(f => ({ ...f, photos: imgs }))} />
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #1a1a1a", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={closeBoat} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={saveBoat} disabled={boatSaving} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: boatSaving ? "wait" : "pointer", opacity: boatSaving ? 0.6 : 1 }}>{boatSaving ? "กำลังบันทึก..." : "บันทึก"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
