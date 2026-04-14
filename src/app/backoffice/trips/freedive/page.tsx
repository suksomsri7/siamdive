"use client";

import { useState, useEffect, useCallback } from "react";
import { BoatForm, BoatFormData, emptyBoatForm, ALL_LANGS, LANG_LABELS, type LangKey, RichEditor } from "@/components/backoffice/TripForm";
import PackagePanel from "@/components/backoffice/PackagePanel";
import OptionsPanel from "@/components/backoffice/OptionsPanel";

type SchedLang = { title: string; slug: string; excerpt: string; content: string; itinerary: string; keywords: string[] };
type SchedPackage = { packageId: string; availableSeats: string; isFull: boolean; appendScheduleDetail: boolean };
type ScheduleRow = {
  id: string; boatId: string; dateType: string; departureDate: string | null; returnDate: string | null; weekDays: string[];
  totalSeats: number | null; availableSeats: number | null; status: string; season: string | null; note: string | null; itinerary: string;
  translations: (SchedLang & { lang: string })[];
  packages: { packageId: string; priceTiers: { tier: string; costPrice: number | null; regularPrice: number; salePrice: number | null; agentPrice: number | null }[] }[];
};
type PackageOption = { id: string; name: string; title: string };
type BoatRow = {
  id: string; companyId: string; name: string; type: string; capacity: number | null;
  photos: string[]; covers: string[]; status: string; featured: boolean;
  company: { translations: { lang: string; name: string }[] };
  translations: { lang: string; title: string; slug: string; excerpt: string; content: string; keywords: string[] }[];
  videos: { url: string; name: string; order: number }[];
  priceTiers: { tier: string; costPrice: number | null; regularPrice: number; salePrice: number | null; agentPrice: number | null }[];
  serviceAreas: { serviceAreaId: string; serviceArea: { id: string; translations: { lang: string; name: string }[] } }[];
  schedules: ScheduleRow[];
};
type CompanyRow = { id: string; translations: { lang: string; name: string }[] };

const TIERS = ["ADULT", "CHILD"];
const STATUS_OPTS = ["DRAFT", "OPEN", "FULL", "CANCELLED", "COMPLETED"] as const;
type ScheduleStatus = typeof STATUS_OPTS[number];
const STATUS_STYLE: Record<ScheduleStatus, { bg: string; color: string }> = {
  DRAFT: { bg: "#111", color: "#555" },
  OPEN: { bg: "#14532d", color: "#4ade80" },
  FULL: { bg: "#78350f", color: "#fbbf24" },
  CANCELLED: { bg: "#2a1010", color: "#f87171" },
  COMPLETED: { bg: "#1a1a2e", color: "#818cf8" },
};

function rowToBoatForm(b: BoatRow): BoatFormData {
  const form = emptyBoatForm(TIERS, "FREEDIVE" as "DAYTRIP");
  form.name = b.name; form.companyId = b.companyId; form.type = "FREEDIVE" as "DAYTRIP";
  form.capacity = b.capacity?.toString() ?? "";
  form.status = b.status as "DRAFT" | "PUBLISHED"; form.featured = b.featured;
  form.photos = b.photos ?? []; form.covers = b.covers ?? [];
  form.videos = b.videos.sort((a, x) => a.order - x.order).map(v => ({ url: v.url, name: v.name }));
  form.priceTiers = TIERS.map(tier => {
    const p = b.priceTiers.find(x => x.tier === tier);
    return { tier, costPrice: p?.costPrice?.toString() ?? "", regularPrice: p?.regularPrice?.toString() ?? "", salePrice: p?.salePrice?.toString() ?? "", agentPrice: p?.agentPrice?.toString() ?? "" };
  });
  form.serviceAreaIds = b.serviceAreas.map((sa: { serviceAreaId: string }) => sa.serviceAreaId);
  for (const tr of b.translations) {
    if (ALL_LANGS.includes(tr.lang as typeof ALL_LANGS[number]))
      (form as Record<string, unknown>)[tr.lang] = { title: tr.title, slug: tr.slug, excerpt: tr.excerpt, content: tr.content, keywords: tr.keywords ?? [] };
  }
  return form;
}

const emptySchedLang = (): SchedLang => ({ title: "", slug: "", excerpt: "", content: "", itinerary: "", keywords: [] });
const emptySchedForm = (boatId = "") => ({
  boatId, dateType: "single" as "single" | "period" | "daily" | "weekly",
  departureDate: "", returnDate: "",
  weekDays: [] as string[],
  status: "OPEN" as ScheduleStatus,
  season: null as string | null,
  packages: [] as SchedPackage[],
  ...Object.fromEntries(ALL_LANGS.map(l => [l, emptySchedLang()])) as Record<LangKey, SchedLang>,
});
type SchedForm = ReturnType<typeof emptySchedForm>;

export default function FreedivePage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [boats, setBoats] = useState<BoatRow[]>([]);
  const [serviceAreas, setServiceAreas] = useState<{ id: string; translations: { lang: string; name: string }[] }[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [boatOpen, setBoatOpen] = useState(false);
  const [editBoatId, setEditBoatId] = useState<string | null>(null);
  const [boatForm, setBoatForm] = useState<BoatFormData>(emptyBoatForm(TIERS, "FREEDIVE" as "DAYTRIP"));
  const [savingBoat, setSavingBoat] = useState(false);
  const [pkgBoat, setPkgBoat] = useState<{ id: string; name: string } | null>(null);
  const [optionsBoat, setOptionsBoat] = useState<{ id: string; name: string } | null>(null);
  const [schedOpen, setSchedOpen] = useState(false);
  const [editSchedId, setEditSchedId] = useState<string | null>(null);
  const [schedForm, setSchedForm] = useState<SchedForm>(emptySchedForm());
  const [savingSched, setSavingSched] = useState(false);
  const [schedActiveLang, setSchedActiveLang] = useState<LangKey>("en");
  const [schedKwInput, setSchedKwInput] = useState<Record<LangKey, string>>(() => Object.fromEntries(ALL_LANGS.map(l => [l, ""])) as Record<LangKey, string>);
  const [schedPackageOptions, setSchedPackageOptions] = useState<PackageOption[]>([]);

  const load = useCallback(async () => {
    const [coData, boatData] = await Promise.all([
      fetch("/api/companies").then(r => r.json()).catch(() => []),
      fetch("/api/boats?type=FREEDIVE").then(r => r.json()).catch(() => []),
    ]);
    setCompanies(Array.isArray(coData) ? coData : []);
    setBoats(Array.isArray(boatData) ? boatData : []);
    const saData = await fetch("/api/service-areas").then(r => r.json()).catch(() => []);
    setServiceAreas(Array.isArray(saData) ? saData : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const openNewBoat = () => { setBoatForm(emptyBoatForm(TIERS, "FREEDIVE" as "DAYTRIP")); setEditBoatId(null); setBoatOpen(true); };
  const openEditBoat = (b: BoatRow) => { setBoatForm(rowToBoatForm(b)); setEditBoatId(b.id); setBoatOpen(true); };
  const closeBoat = () => { setBoatOpen(false); setEditBoatId(null); };
  const saveBoat = async () => {
    setSavingBoat(true);
    const body = { companyId: boatForm.companyId || null, name: boatForm.name, type: "FREEDIVE", capacity: boatForm.capacity || null, photos: boatForm.photos, covers: boatForm.covers, status: boatForm.status, featured: boatForm.featured, translations: ALL_LANGS.map(l => ({ lang: l, ...boatForm[l] })), videos: boatForm.videos, priceTiers: boatForm.priceTiers.map(p => ({ tier: p.tier, costPrice: p.costPrice ? Number(p.costPrice) : null, regularPrice: Number(p.regularPrice) || 0, salePrice: p.salePrice ? Number(p.salePrice) : null, agentPrice: p.agentPrice ? Number(p.agentPrice) : null })), serviceAreaIds: boatForm.serviceAreaIds };
    if (editBoatId) await fetch(`/api/boats/${editBoatId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    else await fetch("/api/boats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSavingBoat(false); closeBoat(); load();
  };
  const deleteBoat = async (id: string) => {
    if (!confirm("ลบ Freedive นี้?")) return;
    await fetch(`/api/boats/${id}`, { method: "DELETE" }); load();
  };

  const loadPackageOptions = async (boatId: string) => {
    const data = await fetch(`/api/packages?boatId=${boatId}`).then(r => r.json()).catch(() => []);
    setSchedPackageOptions((Array.isArray(data) ? data : []).map((p: { id: string; name: string; translations: { lang: string; title: string }[] }) => ({
      id: p.id, name: p.name, title: p.translations.find(t => t.lang === "en")?.title || p.name,
    })));
  };
  const openNewSched = (boatId: string) => { setSchedForm(emptySchedForm(boatId)); setEditSchedId(null); setSchedActiveLang("en"); loadPackageOptions(boatId); setSchedOpen(true); };
  const openEditSched = (s: ScheduleRow) => {
    const base = emptySchedForm(s.boatId);
    base.dateType = (s.dateType as "single" | "period" | "daily" | "weekly") || (s.returnDate ? "period" : "single");
    base.departureDate = s.departureDate?.slice(0, 10) ?? "";
    base.returnDate = s.returnDate?.slice(0, 10) ?? "";
    base.weekDays = s.weekDays ?? [];
    base.status = s.status as ScheduleStatus;
    base.season = s.season ?? null;
    base.packages = (s.packages ?? []).map(p => ({ packageId: p.packageId, availableSeats: p.availableSeats?.toString() ?? "", isFull: p.isFull ?? false, appendScheduleDetail: p.appendScheduleDetail ?? false }));
    for (const tr of s.translations ?? []) { if (ALL_LANGS.includes(tr.lang as LangKey)) (base as Record<string, unknown>)[tr.lang] = { title: tr.title, slug: tr.slug, excerpt: tr.excerpt, content: tr.content, itinerary: tr.itinerary, keywords: tr.keywords ?? [] }; }
    loadPackageOptions(s.boatId);
    setSchedForm(base); setEditSchedId(s.id); setSchedActiveLang("en"); setSchedOpen(true);
  };
  const closeSched = () => { setSchedOpen(false); setEditSchedId(null); };
  const saveSched = async () => {
    setSavingSched(true);
    const body = { boatId: schedForm.boatId, dateType: schedForm.dateType, departureDate: (schedForm.dateType === "single" || schedForm.dateType === "period" || schedForm.dateType === "range") ? (schedForm.departureDate || null) : null, returnDate: (schedForm.dateType === "period" || schedForm.dateType === "range") ? (schedForm.returnDate || null) : null, weekDays: schedForm.weekDays, status: schedForm.status, season: schedForm.season, packages: schedForm.packages, translations: ALL_LANGS.map(l => ({ lang: l, ...(schedForm[l] as SchedLang) })) };
    if (editSchedId) await fetch(`/api/schedules/${editSchedId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    else await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSavingSched(false); closeSched(); load();
  };
  const dupSched = async (s: ScheduleRow) => {
    const body = { boatId: s.boatId, dateType: s.dateType, departureDate: (s.dateType === "single" || s.dateType === "period" || s.dateType === "range") ? s.departureDate : null, returnDate: (s.dateType === "period" || s.dateType === "range") ? s.returnDate : null, weekDays: s.weekDays, status: "DRAFT", season: s.season, packages: s.packages, translations: s.translations };
    const res = await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { const err = await res.text(); alert("คัดลอกไม่สำเร็จ: " + err); return; }
    load();
  };
  const deleteSched = async (id: string) => {
    if (!confirm("ลบตารางนี้?")) return;
    await fetch(`/api/schedules/${id}`, { method: "DELETE" }); load();
  };

  const companyOptions = companies.map(c => ({ id: c.id, name: c.translations.find(t => t.lang === "en")?.name ?? c.translations[0]?.name ?? c.id }));
  const inp: React.CSSProperties = { background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box", width: "100%" };
  const lbl: React.CSSProperties = { fontSize: 11, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 960 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e5e5e5" }}>🫧 Freedive Trips</h1>
        <button onClick={openNewBoat} style={{ background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + เพิ่ม Freedive Trip
        </button>
      </div>

      {boats.length === 0 && (
        <div style={{ textAlign: "center", color: "#333", padding: "60px 0", fontSize: 14 }}>
          ยังไม่มี Freedive — กด + เพิ่ม Freedive Trip เพื่อเริ่ม
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {boats.map(boat => {
          const enTitle = boat.translations.find(t => t.lang === "en")?.title;
          const cover = boat.covers[0] ?? boat.photos[0];
          const isExp = expanded.has(boat.id);
          const statusSt = boat.status === "PUBLISHED" ? { bg: "#14532d", color: "#4ade80" } : { bg: "#1a1a1a", color: "#555" };
          const coName = boat.company?.translations.find(t => t.lang === "en")?.name ?? boat.company?.translations[0]?.name ?? "";

          return (
            <div key={boat.id} style={{ border: "1px solid #1a1a1a", borderRadius: 10, overflow: "hidden", background: "#090909" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px" }}>
                <div style={{ width: 64, height: 48, borderRadius: 7, overflow: "hidden", flexShrink: 0, background: "#111", border: "1px solid #1a1a1a" }}>
                  {cover && <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />  /* eslint-disable-line @next/next/no-img-element */}
                </div>
                {/* Info + Actions */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Row 1: name + status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: "#ccc", fontSize: 14 }}>{enTitle || boat.name}</span>
                    {enTitle && enTitle !== boat.name && <span style={{ fontSize: 11, color: "#333" }}>({boat.name})</span>}
                    <span style={{ fontSize: 9, fontWeight: 700, background: statusSt.bg, color: statusSt.color, padding: "1px 6px", borderRadius: 8 }}>{boat.status}</span>
                    {boat.featured && <span style={{ fontSize: 9, fontWeight: 700, background: "#1e3a5f", color: "#60a5fa", padding: "1px 6px", borderRadius: 8 }}>⭐</span>}
                  </div>
                  {coName && <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>{coName}</div>}
                  {/* Row 2: action icons */}
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    <button title="Schedule" onClick={() => openNewSched(boat.id)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></button>
                    <button title="Packages" onClick={() => setPkgBoat({ id: boat.id, name: boat.translations.find(t => t.lang === "en")?.title || boat.name })} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></button>
                    <button title="Options" onClick={() => setOptionsBoat({ id: boat.id, name: boat.translations.find(t => t.lang === "en")?.title || boat.name })} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="16" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="18" r="2"/></svg>
                    </button>
                    <button title="แก้ไข" onClick={() => openEditBoat(boat)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button title="ลบ" onClick={() => deleteBoat(boat.id)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    <button onClick={() => toggleExpand(boat.id)} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 6, padding: "5px 7px", fontSize: 10, cursor: "pointer", minWidth: 26 }}>{isExp ? "▲" : `▼ ${boat.schedules.length}`}</button>
                  </div>
                </div>
              </div>
              {isExp && (
                <div style={{ borderTop: "1px solid #111", background: "#050505" }}>
                  {boat.schedules.length === 0
                    ? <div style={{ padding: "10px 16px", fontSize: 11, color: "#2a2a2a" }}>ยังไม่มี Schedule — กด + Schedule เพื่อเพิ่ม</div>
                    : boat.schedules.map(s => {
                      const st = STATUS_STYLE[s.status as ScheduleStatus] ?? { bg: "#1a1a1a", color: "#555" };
                      const WEEKDAY_TH: Record<string,string> = { MON:"จันทร์",TUE:"อังคาร",WED:"พุธ",THU:"พฤหัส",FRI:"ศุกร์",SAT:"เสาร์",SUN:"อาทิตย์" };
                      const dep = s.dateType === "daily" ? "ทุกวัน" : s.dateType === "weekly" ? (s.weekDays?.map(d => WEEKDAY_TH[d] ?? d).join(", ") || "รายสัปดาห์") : s.departureDate ? new Date(s.departureDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "";
                      const ret = s.returnDate ? new Date(s.returnDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : null;
                      return (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: "1px solid #0d0d0d" }}>
                          <span style={{ fontSize: 12, color: "#aaa", fontWeight: 600, minWidth: 76 }}>{dep}</span>
                          {ret && <span style={{ fontSize: 11, color: "#333" }}>→ {ret}</span>}
                          <span style={{ fontSize: 9, fontWeight: 700, background: st.bg, color: st.color, padding: "2px 7px", borderRadius: 8 }}>{s.status}</span>
                          <div style={{ display: "flex", gap: 5, marginLeft: "auto" }}>
                            <button onClick={() => dupSched(s)} style={{ background: "none", border: "1px solid #1a2a1a", color: "#2a5a2a", borderRadius: 5, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>คัดลอก</button>
                            <button onClick={() => openEditSched(s)} style={{ background: "none", border: "1px solid #1e1e1e", color: "#444", borderRadius: 5, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>แก้ไข</button>
                            <button onClick={() => deleteSched(s.id)} style={{ background: "none", border: "1px solid #2a1010", color: "#3a1a1a", borderRadius: 5, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>ลบ</button>
                          </div>
                        </div>
                      );
                    })}
                  <div style={{ padding: "6px 10px" }}>
                    <button onClick={() => openNewSched(boat.id)} style={{ background: "none", border: "1px dashed #1a2a1a", color: "#2a5a2a", borderRadius: 6, padding: "5px 14px", fontSize: 11, cursor: "pointer", width: "100%" }}>+ เพิ่ม Schedule</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Package panel ── */}
      {pkgBoat && <PackagePanel boatId={pkgBoat.id} boatName={pkgBoat.name} onClose={() => setPkgBoat(null)} seasonPricing />}
      {optionsBoat && <OptionsPanel boatId={optionsBoat.id} boatName={optionsBoat.name} onClose={() => setOptionsBoat(null)} />}

      {boatOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={closeBoat} style={{ flex: 1, background: "rgba(0,0,0,.6)" }} />
          <div style={{ width: "min(720px,100%)", background: "#0d0d0d", borderLeft: "1px solid #1a1a1a", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#0d0d0d", borderBottom: "1px solid #111" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#ddd" }}>{editBoatId ? "แก้ไข Freedive Trip" : "เพิ่ม Freedive Trip"}</span>
              <button onClick={closeBoat} style={{ background: "none", border: "none", color: "#444", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ flex: 1, padding: "20px" }}>
              <BoatForm form={boatForm} onChange={setBoatForm} companies={companyOptions} serviceAreas={serviceAreas} />
            </div>
            <div style={{ position: "sticky", bottom: 0, padding: "14px 20px", background: "#0d0d0d", borderTop: "1px solid #111", display: "flex", gap: 10 }}>
              <button onClick={saveBoat} disabled={savingBoat} style={{ flex: 1, background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 700, cursor: savingBoat ? "wait" : "pointer" }}>
                {savingBoat ? "กำลังบันทึก..." : editBoatId ? "บันทึกการแก้ไข" : "เพิ่ม Freedive Trip"}
              </button>
              <button onClick={closeBoat} style={{ background: "#111", border: "1px solid #222", color: "#555", borderRadius: 8, padding: "11px 18px", fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {schedOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={closeSched} style={{ flex: 1, background: "rgba(0,0,0,.6)" }} />
          <div style={{ width: "min(560px,100%)", background: "#0d0d0d", borderLeft: "1px solid #1a1a1a", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#0d0d0d", borderBottom: "1px solid #111" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#ddd" }}>{editSchedId ? "แก้ไข Trip" : "เพิ่ม Trip"}</span>
              <button onClick={closeSched} style={{ background: "none", border: "none", color: "#444", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Date type */}
              <div>
                <label style={lbl}>ประเภทวัน</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {([["single","รายวัน"],["period","ช่วงเวลา"]] as const).map(([t, label]) => (
                    <button key={t} onClick={() => setSchedForm(f => ({ ...f, dateType: t }))}
                      style={{ padding: "6px 16px", borderRadius: 20, border: schedForm.dateType === t ? "none" : "1px solid #222", cursor: "pointer", fontSize: 12, fontWeight: 600, background: schedForm.dateType === t ? "#3b82f6" : "transparent", color: schedForm.dateType === t ? "#fff" : "#444" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {schedForm.dateType === "single" && (
                <div><label style={lbl}>วันที่ *</label><input type="date" value={schedForm.departureDate} onChange={e => setSchedForm(f => ({ ...f, departureDate: e.target.value }))} style={inp} /></div>
              )}
              {schedForm.dateType === "period" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={lbl}>วันเริ่ม *</label><input type="date" value={schedForm.departureDate} onChange={e => setSchedForm(f => ({ ...f, departureDate: e.target.value }))} style={inp} /></div>
                  <div><label style={lbl}>วันสิ้นสุด</label><input type="date" value={schedForm.returnDate} onChange={e => setSchedForm(f => ({ ...f, returnDate: e.target.value }))} style={inp} /></div>
                </div>
              )}
              {schedForm.dateType === "weekly" && (
                <div>
                  <label style={lbl}>วันในสัปดาห์</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {([["MON","จันทร์"],["TUE","อังคาร"],["WED","พุธ"],["THU","พฤหัส"],["FRI","ศุกร์"],["SAT","เสาร์"],["SUN","อาทิตย์"]] as const).map(([d, label]) => {
                      const checked = schedForm.weekDays.includes(d);
                      return (
                        <button key={d} onClick={() => setSchedForm(f => ({ ...f, weekDays: checked ? f.weekDays.filter(x => x !== d) : [...f.weekDays, d] }))}
                          style={{ padding: "6px 14px", borderRadius: 20, border: checked ? "none" : "1px solid #222", cursor: "pointer", fontSize: 12, fontWeight: 600, background: checked ? "#7c3aed" : "transparent", color: checked ? "#fff" : "#444" }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div><label style={lbl}>สถานะ</label><select value={schedForm.status} onChange={e => setSchedForm(f => ({ ...f, status: e.target.value as ScheduleStatus }))} style={inp}>{STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>

              {/* Packages + ราคาต่อ Package */}
              {schedPackageOptions.length > 0 && (
                <div>
                  <label style={lbl}>Packages & ราคา</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {schedPackageOptions.map(pkg => {
                      const sp = schedForm.packages.find(x => x.packageId === pkg.id);
                      const checked = !!sp;
                      const toggle = () => setSchedForm(f => ({
                        ...f,
                        packages: checked
                          ? f.packages.filter(x => x.packageId !== pkg.id)
                          : [...f.packages, { packageId: pkg.id, availableSeats: "", isFull: false, appendScheduleDetail: false }],
                      }));
                      const updatePkg = (field: "availableSeats" | "isFull" | "appendScheduleDetail", val: string | boolean) => setSchedForm(f => ({
                        ...f, packages: f.packages.map(x => x.packageId !== pkg.id ? x : { ...x, [field]: val }),
                      }));
                      return (
                        <div key={pkg.id} style={{ border: `1px solid ${checked ? "#3b82f6" : "#222"}`, borderRadius: 8, overflow: "hidden" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: checked ? "rgba(59,130,246,0.06)" : "#111", cursor: "pointer" }}>
                            <input type="checkbox" checked={checked} onChange={toggle} style={{ accentColor: "#3b82f6", width: 14, height: 14, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: checked ? "#e5e5e5" : "#555" }}>{pkg.title}</span>
                            {pkg.title !== pkg.name && <span style={{ fontSize: 10, color: "#333", marginLeft: "auto" }}>{pkg.name}</span>}
                          </label>
                          {checked && sp && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
                              <span style={{ fontSize: 11, color: "#444", flexShrink: 0 }}>Available:</span>
                              <input type="number" value={sp.isFull ? "" : sp.availableSeats} onChange={e => updatePkg("availableSeats", e.target.value)} disabled={sp.isFull} placeholder="ไม่จำกัด"
                                style={{ ...inp, width: 90, fontSize: 12, opacity: sp.isFull ? 0.3 : 1 }} />
                              <button onClick={() => updatePkg("isFull", !sp.isFull)}
                                style={{ padding: "5px 14px", borderRadius: 20, border: sp.isFull ? "none" : "1px solid #ef444460", background: sp.isFull ? "#7f1d1d" : "transparent", color: sp.isFull ? "#fca5a5" : "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                                FULL
                              </button>
                              <label style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", cursor: "pointer", fontSize: 11, color: sp.appendScheduleDetail ? "#3b82f6" : "#555", flexShrink: 0 }} title="แสดง Schedule detail ต่อท้ายเมื่อ user เปิด package นี้">
                                <input type="checkbox" checked={sp.appendScheduleDetail} onChange={e => updatePkg("appendScheduleDetail", e.target.checked)} style={{ accentColor: "#3b82f6", width: 13, height: 13 }} />
                                ต่อท้าย Schedule detail
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                  {ALL_LANGS.map(l => <button key={l} onClick={() => setSchedActiveLang(l)} style={{ padding: "5px 12px", borderRadius: 20, border: schedActiveLang === l ? "none" : "1px solid #222", cursor: "pointer", fontSize: 11, fontWeight: 700, background: schedActiveLang === l ? "#3b82f6" : "transparent", color: schedActiveLang === l ? "#fff" : "#333" }}>{LANG_LABELS[l]}</button>)}
                </div>
                {ALL_LANGS.map(l => {
                  const lf = schedForm[l] as SchedLang;
                  return (
                    <div key={l} style={{ display: schedActiveLang === l ? "flex" : "none", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div><label style={lbl}>Title</label><input value={lf.title} onChange={e => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), title: e.target.value } }))} style={inp} /></div>
                        <div><label style={lbl}>Slug</label><input value={lf.slug} onChange={e => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), slug: e.target.value } }))} style={inp} /></div>
                      </div>
                      <div><label style={lbl}>Excerpt</label><textarea value={lf.excerpt} onChange={e => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), excerpt: e.target.value } }))} style={{ ...inp, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} /></div>
                      <div><label style={lbl}>Detail</label><RichEditor value={lf.content} onChange={h => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), content: h } }))} /></div>
                      <div><label style={lbl}>Itinerary</label><RichEditor value={lf.itinerary} onChange={h => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), itinerary: h } }))} /></div>
                      <div>
                        <label style={lbl}>Keywords</label>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                          {lf.keywords.map((kw, i) => <span key={i} style={{ background: "#1a1a2e", color: "#818cf8", fontSize: 11, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>{kw}<button onClick={() => { const kws = [...lf.keywords]; kws.splice(i, 1); setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), keywords: kws } })); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0, fontSize: 13 }}>×</button></span>)}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input value={schedKwInput[l]} onChange={e => setSchedKwInput(k => ({ ...k, [l]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter" && schedKwInput[l].trim()) { setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), keywords: [...lf.keywords, schedKwInput[l].trim()] } })); setSchedKwInput(k => ({ ...k, [l]: "" })); } }} style={{ ...inp, flex: 1 }} placeholder="พิมพ์แล้วกด Enter" />
                          <button onClick={() => { if (schedKwInput[l].trim()) { setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), keywords: [...lf.keywords, schedKwInput[l].trim()] } })); setSchedKwInput(k => ({ ...k, [l]: "" })); } }} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#818cf8", borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontSize: 11 }}>+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ position: "sticky", bottom: 0, padding: "14px 20px", background: "#0d0d0d", borderTop: "1px solid #111", display: "flex", gap: 10 }}>
              <button onClick={saveSched} disabled={savingSched} style={{ flex: 1, background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 700, cursor: savingSched ? "wait" : "pointer" }}>
                {savingSched ? "กำลังบันทึก..." : editSchedId ? "บันทึกการแก้ไข" : "เพิ่ม Trip"}
              </button>
              <button onClick={closeSched} style={{ background: "#111", border: "1px solid #222", color: "#555", borderRadius: 8, padding: "11px 18px", fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
