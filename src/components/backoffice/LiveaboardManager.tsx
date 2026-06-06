"use client";

import { useState, useEffect, useCallback } from "react";
import { BoatForm, BoatFormData, emptyBoatForm, ALL_LANGS, LANG_LABELS, type LangKey, RichEditor } from "@/components/backoffice/TripForm";
import ScheduleFullDetails from "@/components/ScheduleFullDetails";
import PackagePanel from "@/components/backoffice/PackagePanel";
import OptionsPanel from "@/components/backoffice/OptionsPanel";

// ─── Types ────────────────────────────────────────────────────────────────────
type SchedLang = { title: string; slug: string; excerpt: string; content: string; itinerary: string; keywords: string[]; included: string[]; excluded: string[]; requirements: string; highlights: string; marineLife: string[]; optionalExtras: string[]; goodToKnow: string; paymentTerms: string };
type SchedLogistics = { departurePort: string; departureTime: string; departureAirport: string; returnPort: string; returnTime: string; returnAirport: string; requiredCert: string; requiredDives: string; totalDivesMin: string; totalDivesMax: string };
const emptyLogistics = (): SchedLogistics => ({ departurePort: "", departureTime: "", departureAirport: "", returnPort: "", returnTime: "", returnAirport: "", requiredCert: "", requiredDives: "", totalDivesMin: "", totalDivesMax: "" });
type SchedPackage = { packageId: string; availableSeats: string; isFull: boolean; appendScheduleDetail: boolean; regularPrice: string; salePrice: string };
type ScheduleRow = {
  id: string; boatId: string; dateType: string; departureDate: string | null; returnDate: string | null; weekDays: string[];
  totalSeats: number | null; availableSeats: number | null; status: string; season: string | null; note: string | null; itinerary: string; fromPrice: number | null;
  logistics?: Partial<SchedLogistics> | null;
  translations: (SchedLang & { lang: string; route?: string; details?: Record<string, unknown> })[];
  packages: { packageId: string; priceTiers: { tier: string; costPrice: number | null; regularPrice: number; salePrice: number | null; agentPrice: number | null }[] }[];
};
type PackageOption = { id: string; name: string; title: string };
type BoatRow = {
  id: string; companyId: string; name: string; type: string; capacity: number | null; currency: string;
  photos: string[]; covers: string[]; status: string; featured: boolean;
  company: { translations: { lang: string; name: string }[] };
  translations: { lang: string; title: string; slug: string; excerpt: string; content: string; keywords: string[] }[];
  videos: { url: string; name: string; order: number }[];
  priceTiers: { tier: string; costPrice: number | null; regularPrice: number; salePrice: number | null; agentPrice: number | null }[];
  serviceAreas: { serviceAreaId: string; serviceArea: { id: string; translations: { lang: string; name: string }[] } }[];
  schedules: ScheduleRow[];
};
type CompanyRow = {
  id: string;
  translations: { lang: string; name: string }[];
};
type CountryRow = {
  id: string;
  code: string;
  flag: string;
  order: number;
  translations: { lang: string; name: string }[];
};
type ServiceAreaRow = {
  id: string;
  countryId: string | null;
  translations: { lang: string; name: string }[];
};

const TIERS = ["DIVER", "NON_DIVER"];
const STATUS_OPTS = ["DRAFT", "OPEN", "FULL", "CANCELLED", "COMPLETED"] as const;
type ScheduleStatus = typeof STATUS_OPTS[number];
const STATUS_STYLE: Record<ScheduleStatus, { bg: string; color: string }> = {
  DRAFT: { bg: "#111", color: "#555" },
  OPEN: { bg: "#14532d", color: "#4ade80" },
  FULL: { bg: "#78350f", color: "#fbbf24" },
  CANCELLED: { bg: "#2a1010", color: "#f87171" },
  COMPLETED: { bg: "#1a1a2e", color: "#818cf8" },
};

// ─── Boat form helpers ────────────────────────────────────────────────────────
function rowToBoatForm(b: BoatRow): BoatFormData {
  const form = emptyBoatForm(TIERS, "LIVEABOARD");
  form.name = b.name; form.companyId = b.companyId; form.type = "LIVEABOARD";
  form.capacity = b.capacity?.toString() ?? "";
  form.currency = b.currency ?? "THB";
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

const emptySchedLang = (): SchedLang => ({ title: "", slug: "", excerpt: "", content: "", itinerary: "", keywords: [], included: [], excluded: [], requirements: "", highlights: "", marineLife: [], optionalExtras: [], goodToKnow: "", paymentTerms: "" });
const emptySchedForm = (boatId = "") => ({
  boatId, dateType: "single" as "single" | "period" | "daily" | "weekly",
  departureDate: "", returnDate: "",
  weekDays: [] as string[],
  status: "OPEN" as ScheduleStatus,
  season: null as string | null,
  fromPrice: "" as string,
  note: "" as string,
  packages: [] as SchedPackage[],
  logistics: emptyLogistics(),
  ...Object.fromEntries(ALL_LANGS.map(l => [l, emptySchedLang()])) as Record<LangKey, SchedLang>,
});
type SchedForm = ReturnType<typeof emptySchedForm>;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LiveaboardManager({
  label = "🛳 Liveaboard",
}: {
  label?: string;
} = {}) {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [boats, setBoats] = useState<BoatRow[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaRow[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [filterCountryId, setFilterCountryId] = useState<string>(""); // "" = all
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Boat panel
  const [boatOpen, setBoatOpen] = useState(false);
  const [editBoatId, setEditBoatId] = useState<string | null>(null);
  const [boatForm, setBoatForm] = useState<BoatFormData>(emptyBoatForm(TIERS, "LIVEABOARD"));
  const [savingBoat, setSavingBoat] = useState(false);

  // Package panel
  const [pkgBoat, setPkgBoat] = useState<{ id: string; name: string } | null>(null);
  const [optionsBoat, setOptionsBoat] = useState<{ id: string; name: string } | null>(null);

  // Schedule panel
  const [schedOpen, setSchedOpen] = useState(false);
  const [editSchedId, setEditSchedId] = useState<string | null>(null);
  const [schedForm, setSchedForm] = useState<SchedForm>(emptySchedForm());
  const [savingSched, setSavingSched] = useState(false);
  const [schedActiveLang, setSchedActiveLang] = useState<LangKey>("en");
  const [schedPreviewOpen, setSchedPreviewOpen] = useState(false);
  const [schedKwInput, setSchedKwInput] = useState<Record<LangKey, string>>(() => Object.fromEntries(ALL_LANGS.map(l => [l, ""])) as Record<LangKey, string>);
  const [schedPackageOptions, setSchedPackageOptions] = useState<PackageOption[]>([]);

  const load = useCallback(async () => {
    const [coData, boatData, saData, ctData] = await Promise.all([
      fetch("/api/companies?minimal=1").then(r => r.json()).catch(() => []),
      fetch("/api/boats?type=LIVEABOARD").then(r => r.json()).catch(() => []),
      fetch("/api/service-areas").then(r => r.json()).catch(() => []),
      fetch("/api/countries").then(r => r.json()).catch(() => []),
    ]);
    setCompanies(Array.isArray(coData) ? coData : []);
    setBoats(Array.isArray(boatData) ? boatData : []);
    setServiceAreas(Array.isArray(saData) ? saData : []);
    setCountries(Array.isArray(ctData) ? ctData : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  // ─ Boat CRUD ─
  const openNewBoat = () => { setBoatForm(emptyBoatForm(TIERS, "LIVEABOARD")); setEditBoatId(null); setBoatOpen(true); };
  const openEditBoat = (b: BoatRow) => { setBoatForm(rowToBoatForm(b)); setEditBoatId(b.id); setBoatOpen(true); };
  const closeBoat = () => { setBoatOpen(false); setEditBoatId(null); };
  const saveBoat = async () => {
    setSavingBoat(true);
    const body = { companyId: boatForm.companyId, name: boatForm.name, type: "LIVEABOARD", capacity: boatForm.capacity || null, currency: boatForm.currency || "THB", photos: boatForm.photos, covers: boatForm.covers, status: boatForm.status, featured: boatForm.featured, translations: ALL_LANGS.map(l => ({ lang: l, ...boatForm[l] })), videos: boatForm.videos, priceTiers: [], serviceAreaIds: boatForm.serviceAreaIds };
    if (editBoatId) await fetch(`/api/boats/${editBoatId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    else await fetch("/api/boats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSavingBoat(false); closeBoat(); load();
  };
  const deleteBoat = async (id: string) => {
    if (!confirm("ลบเรือนี้?")) return;
    await fetch(`/api/boats/${id}`, { method: "DELETE" }); load();
  };

  // ─ Schedule CRUD ─
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
    base.fromPrice = s.fromPrice?.toString() ?? "";
    base.note = s.note ?? "";
    const lg = (s.logistics ?? {}) as Partial<SchedLogistics>;
    base.logistics = { ...emptyLogistics(), ...Object.fromEntries(Object.entries(lg).map(([k, v]) => [k, v == null ? "" : String(v)])) } as SchedLogistics;
    base.packages = (s.packages ?? []).map(p => { const t0 = p.priceTiers?.[0]; return { packageId: p.packageId, availableSeats: p.availableSeats?.toString() ?? "", isFull: p.isFull ?? false, appendScheduleDetail: p.appendScheduleDetail ?? false, regularPrice: t0?.regularPrice?.toString() ?? "", salePrice: t0?.salePrice?.toString() ?? "" }; });
    for (const tr of s.translations ?? []) { if (ALL_LANGS.includes(tr.lang as LangKey)) { const dt = (tr.details ?? {}) as Record<string, unknown>; (base as Record<string, unknown>)[tr.lang] = { title: tr.title, slug: tr.slug, excerpt: tr.excerpt, content: tr.content, itinerary: tr.itinerary, keywords: tr.keywords ?? [], included: tr.included ?? [], excluded: tr.excluded ?? [], requirements: (dt.requirements as string) ?? "", highlights: (dt.highlights as string) ?? "", marineLife: (dt.marineLife as string[]) ?? [], optionalExtras: (dt.optionalExtras as string[]) ?? [], goodToKnow: (dt.goodToKnow as string) ?? "", paymentTerms: (dt.paymentTerms as string) ?? "" }; } }
    loadPackageOptions(s.boatId);
    setSchedForm(base); setEditSchedId(s.id); setSchedActiveLang("en"); setSchedOpen(true);
  };
  const closeSched = () => { setSchedOpen(false); setEditSchedId(null); };
  const saveSched = async () => {
    setSavingSched(true);
    const pkgsWithPrices = schedForm.packages.map(p => ({ packageId: p.packageId, availableSeats: p.availableSeats, isFull: p.isFull, appendScheduleDetail: p.appendScheduleDetail, priceTiers: (p.regularPrice || p.salePrice) ? [{ tier: "DIVER", regularPrice: p.regularPrice || "0", salePrice: p.salePrice || null }] : [] }));
    const lg0 = schedForm.logistics; const num = (v: string) => v && !isNaN(Number(v)) ? Number(v) : undefined;
    const logistics = { departurePort: lg0.departurePort || undefined, departureTime: lg0.departureTime || undefined, departureAirport: lg0.departureAirport || undefined, returnPort: lg0.returnPort || undefined, returnTime: lg0.returnTime || undefined, returnAirport: lg0.returnAirport || undefined, requiredCert: lg0.requiredCert || undefined, requiredDives: num(lg0.requiredDives), totalDivesMin: num(lg0.totalDivesMin), totalDivesMax: num(lg0.totalDivesMax) };
    const cleanList = (a: string[]) => (a ?? []).map(x => x.trim()).filter(Boolean);
    const body = { boatId: schedForm.boatId, dateType: schedForm.dateType, departureDate: (schedForm.dateType === "single" || schedForm.dateType === "period" || schedForm.dateType === "range") ? (schedForm.departureDate || null) : null, returnDate: (schedForm.dateType === "period" || schedForm.dateType === "range") ? (schedForm.returnDate || null) : null, weekDays: schedForm.weekDays, status: schedForm.status, season: schedForm.season, fromPrice: schedForm.fromPrice || null, note: schedForm.note || null, logistics, packages: pkgsWithPrices, translations: ALL_LANGS.map(l => { const sl = schedForm[l] as SchedLang; return { lang: l, ...sl, included: cleanList(sl.included), excluded: cleanList(sl.excluded), details: { requirements: sl.requirements || "", highlights: sl.highlights || "", marineLife: cleanList(sl.marineLife), optionalExtras: cleanList(sl.optionalExtras), goodToKnow: sl.goodToKnow || "", paymentTerms: sl.paymentTerms || "" } }; }) };
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

  // Country filter via service-area → country relation (uses canonical countryId,
  // not substring matching on names).
  const areaCountry = new Map(serviceAreas.map(a => [a.id, a.countryId]));
  const visibleBoats = filterCountryId
    ? boats.filter(b => b.serviceAreas.some(sa => areaCountry.get(sa.serviceAreaId) === filterCountryId))
    : boats;

  const pickCountryName = (trs: { lang: string; name: string }[]) =>
    trs.find(t => t.lang === "th")?.name || trs.find(t => t.lang === "en")?.name || trs.find(t => t.name)?.name || "";

  const boatsByCountry = (cid: string) =>
    boats.filter(b => b.serviceAreas.some(sa => areaCountry.get(sa.serviceAreaId) === cid)).length;

  const companyOptions = companies.map(c => ({ id: c.id, name: c.translations.find(t => t.lang === "en")?.name ?? c.translations[0]?.name ?? c.id }));
  const inp: React.CSSProperties = { background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box", width: "100%" };
  const lbl: React.CSSProperties = { fontSize: 11, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 960 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e5e5e5" }}>{label}</h1>
        <button onClick={openNewBoat}
          style={{ background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + เพิ่มเรือ
        </button>
      </div>

      {/* Country filter */}
      {countries.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
          <button onClick={() => setFilterCountryId("")}
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: !filterCountryId ? "#1e3a5f" : "#111", border: `1px solid ${!filterCountryId ? "#3b82f6" : "#222"}`, borderRadius: 20, padding: "5px 14px" }}>
            <span style={{ fontSize: 12, color: !filterCountryId ? "#60a5fa" : "#666", fontWeight: !filterCountryId ? 700 : 500 }}>ทุกประเทศ</span>
            <span style={{ fontSize: 9, background: "#222", color: "#888", borderRadius: 8, padding: "0 5px", fontWeight: 700 }}>{boats.length}</span>
          </button>
          {countries.map(c => {
            const active = filterCountryId === c.id;
            const count = boatsByCountry(c.id);
            if (count === 0 && !active) return null;
            return (
              <button key={c.id} onClick={() => setFilterCountryId(c.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: active ? "#1e3a5f" : "#111", border: `1px solid ${active ? "#3b82f6" : "#222"}`, borderRadius: 20, padding: "5px 12px" }}>
                <span style={{ fontSize: 14 }}>{c.flag || "🏳️"}</span>
                <span style={{ fontSize: 12, color: active ? "#60a5fa" : "#666", fontWeight: active ? 700 : 500 }}>
                  {pickCountryName(c.translations) || c.code}
                </span>
                <span style={{ fontSize: 9, background: "#222", color: "#888", borderRadius: 8, padding: "0 5px", fontWeight: 700 }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {visibleBoats.length === 0 && (
        <div style={{ textAlign: "center", color: "#333", padding: "60px 0", fontSize: 14 }}>
          {filterCountryId
            ? "ยังไม่มีเรือ Liveaboard ในประเทศนี้"
            : "ยังไม่มีเรือ Liveaboard — กด + เพิ่มเรือ เพื่อเริ่ม"}
        </div>
      )}

      {/* ── Boat list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visibleBoats.map(boat => {
          const enTitle = boat.translations.find(t => t.lang === "en")?.title;
          const cover = boat.covers[0] ?? boat.photos[0];
          const isExp = expanded.has(boat.id);
          const statusSt = boat.status === "PUBLISHED" ? { bg: "#14532d", color: "#4ade80" } : { bg: "#1a1a1a", color: "#555" };
          const coName = boat.company?.translations.find(t => t.lang === "en")?.name ?? boat.company?.translations[0]?.name ?? "";

          return (
            <div key={boat.id} style={{ border: "1px solid #1a1a1a", borderRadius: 10, overflow: "hidden", background: "#090909" }}>
              {/* Boat row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px" }}>
                {/* Cover */}
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
                    <button title="Schedule" onClick={() => openNewSched(boat.id)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </button>
                    <button title="Cabins" onClick={() => setPkgBoat({ id: boat.id, name: boat.translations.find(t => t.lang === "en")?.title || boat.name })} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    </button>
                    <button title="Options" onClick={() => setOptionsBoat({ id: boat.id, name: boat.translations.find(t => t.lang === "en")?.title || boat.name })} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="16" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="18" r="2"/></svg>
                    </button>
                    <button title="แก้ไข" onClick={() => openEditBoat(boat)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button title="ลบ" onClick={() => deleteBoat(boat.id)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                    <button onClick={() => toggleExpand(boat.id)} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 6, padding: "5px 7px", fontSize: 10, cursor: "pointer", minWidth: 26 }}>
                      {isExp ? "▲" : `▼ ${boat.schedules.length}`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedules */}
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
                          {(() => { const t = s.translations?.find(t => t.lang === "en"); return t?.title ? <span style={{ fontSize: 10, color: "#666", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}{t.route ? ` · ${t.route}` : ""}</span> : null; })()}
                          {s.fromPrice != null && <span style={{ fontSize: 10, color: "#8a7a3a", fontWeight: 600 }}>เริ่ม {s.fromPrice.toLocaleString()} {boat.currency || "THB"}</span>}
                          <div style={{ display: "flex", gap: 5, marginLeft: "auto" }}>
                            <button onClick={() => dupSched(s)} style={{ background: "none", border: "1px solid #1a2a1a", color: "#2a5a2a", borderRadius: 5, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>คัดลอก</button>
                            <button onClick={() => openEditSched(s)} style={{ background: "none", border: "1px solid #1e1e1e", color: "#444", borderRadius: 5, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>แก้ไข</button>
                            <button onClick={() => deleteSched(s.id)} style={{ background: "none", border: "1px solid #2a1010", color: "#3a1a1a", borderRadius: 5, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>ลบ</button>
                          </div>
                        </div>
                      );
                    })}
                  <div style={{ padding: "6px 10px" }}>
                    <button onClick={() => openNewSched(boat.id)} style={{ background: "none", border: "1px dashed #1a2a1a", color: "#2a5a2a", borderRadius: 6, padding: "5px 14px", fontSize: 11, cursor: "pointer", width: "100%" }}>
                      + เพิ่ม Schedule
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Cabin panel ── */}
      {pkgBoat && <PackagePanel boatId={pkgBoat.id} boatName={pkgBoat.name} onClose={() => setPkgBoat(null)} label="Cabin" cabinFields />}
      {optionsBoat && <OptionsPanel boatId={optionsBoat.id} boatName={optionsBoat.name} onClose={() => setOptionsBoat(null)} />}

      {/* ── Boat slide panel ── */}
      {boatOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={closeBoat} style={{ flex: 1, background: "rgba(0,0,0,.6)" }} />
          <div style={{ width: "min(720px,100%)", background: "#0d0d0d", borderLeft: "1px solid #1a1a1a", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#0d0d0d", borderBottom: "1px solid #111" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#ddd" }}>{editBoatId ? "แก้ไขเรือ" : "เพิ่มเรือ Liveaboard"}</span>
              <button onClick={closeBoat} style={{ background: "none", border: "none", color: "#444", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ flex: 1, padding: "20px" }}>
              <BoatForm form={boatForm} onChange={setBoatForm} companies={companyOptions} serviceAreas={serviceAreas} countries={countries} />
            </div>
            <div style={{ position: "sticky", bottom: 0, padding: "14px 20px", background: "#0d0d0d", borderTop: "1px solid #111", display: "flex", gap: 10 }}>
              <button onClick={saveBoat} disabled={savingBoat}
                style={{ flex: 1, background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 700, cursor: savingBoat ? "wait" : "pointer" }}>
                {savingBoat ? "กำลังบันทึก..." : editBoatId ? "บันทึกการแก้ไข" : "เพิ่มเรือ"}
              </button>
              <button onClick={closeBoat} style={{ background: "#111", border: "1px solid #222", color: "#555", borderRadius: 8, padding: "11px 18px", fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule slide panel ── */}
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

              <div><label style={lbl}>ราคาเริ่มต้น (from) — สกุล {boats.find(b => b.id === schedForm.boatId)?.currency || "THB"}</label><input type="number" value={schedForm.fromPrice} onChange={e => setSchedForm(f => ({ ...f, fromPrice: e.target.value }))} placeholder="เช่น 2916" style={inp} /></div>

              <div><label style={lbl}>โน้ตภายใน/ราคา (note — แสดงใต้ราคาในแอดมิน)</label><input value={schedForm.note} onChange={e => setSchedForm(f => ({ ...f, note: e.target.value }))} placeholder="เช่น From $1,750/person · diver+non-diver · travel.padi.com" style={inp} /></div>

              {/* Cabins + ราคาต่อ Cabin */}
              {schedPackageOptions.length > 0 && (
                <div>
                  <label style={lbl}>Cabins</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {schedPackageOptions.map(pkg => {
                      const sp = schedForm.packages.find(x => x.packageId === pkg.id);
                      const checked = !!sp;
                      const toggle = () => setSchedForm(f => ({
                        ...f,
                        packages: checked
                          ? f.packages.filter(x => x.packageId !== pkg.id)
                          : [...f.packages, { packageId: pkg.id, availableSeats: "", isFull: false, appendScheduleDetail: false, regularPrice: "", salePrice: "" }],
                      }));
                      const updatePkg = (field: "availableSeats" | "isFull" | "appendScheduleDetail" | "regularPrice" | "salePrice", val: string | boolean) => setSchedForm(f => ({
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
                            <div style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                                <span style={{ fontSize: 11, color: "#444", flexShrink: 0 }}>Available:</span>
                                <input type="number" value={sp.isFull ? "" : sp.availableSeats} onChange={e => updatePkg("availableSeats", e.target.value)} disabled={sp.isFull} placeholder="ไม่จำกัด"
                                  style={{ ...inp, width: 90, fontSize: 12, opacity: sp.isFull ? 0.3 : 1 }} />
                                <button onClick={() => updatePkg("isFull", !sp.isFull)}
                                  style={{ padding: "5px 14px", borderRadius: 20, border: sp.isFull ? "none" : "1px solid #ef444460", background: sp.isFull ? "#7f1d1d" : "transparent", color: sp.isFull ? "#fca5a5" : "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                                  FULL
                                </button>
                                <label style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", cursor: "pointer", fontSize: 11, color: sp.appendScheduleDetail ? "#3b82f6" : "#555", flexShrink: 0 }} title="แสดง Schedule detail ต่อท้ายเมื่อ user เปิด cabin นี้">
                                  <input type="checkbox" checked={sp.appendScheduleDetail} onChange={e => updatePkg("appendScheduleDetail", e.target.checked)} style={{ accentColor: "#3b82f6", width: 13, height: 13 }} />
                                  ต่อท้าย Schedule detail
                                </label>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px 8px" }}>
                                <span style={{ fontSize: 11, color: "#444", flexShrink: 0 }}>ราคาขาย:</span>
                                <input type="number" value={sp.regularPrice} onChange={e => updatePkg("regularPrice", e.target.value)} placeholder="0"
                                  style={{ ...inp, width: 110, fontSize: 12 }} />
                                <span style={{ fontSize: 11, color: "#444", flexShrink: 0 }}>ราคาส่วนลด:</span>
                                <input type="number" value={sp.salePrice} onChange={e => updatePkg("salePrice", e.target.value)} placeholder="ไม่มี"
                                  style={{ ...inp, width: 110, fontSize: 12 }} />
                                <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>{boats.find(b => b.id === schedForm.boatId)?.currency || "THB"}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Logistics — schedule-level (ไม่แยกภาษา), liveaboard PADI-style */}
              {(() => { const lg = schedForm.logistics; const set = (k: keyof SchedLogistics, v: string) => setSchedForm(f => ({ ...f, logistics: { ...f.logistics, [k]: v } })); return (
                <div style={{ border: "1px dashed #ccc", borderRadius: 8, padding: 12, marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: "#888", fontWeight: 700, marginBottom: 8 }}>Logistics / Requirements (PADI-style)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div><label style={lbl}>Departure port</label><input value={lg.departurePort} onChange={e => set("departurePort", e.target.value)} style={inp} /></div>
                    <div><label style={lbl}>Departure time</label><input value={lg.departureTime} placeholder="15:00" onChange={e => set("departureTime", e.target.value)} style={inp} /></div>
                    <div><label style={lbl}>Departure airport</label><input value={lg.departureAirport} onChange={e => set("departureAirport", e.target.value)} style={inp} /></div>
                    <div><label style={lbl}>Return port</label><input value={lg.returnPort} onChange={e => set("returnPort", e.target.value)} style={inp} /></div>
                    <div><label style={lbl}>Return time</label><input value={lg.returnTime} placeholder="09:00" onChange={e => set("returnTime", e.target.value)} style={inp} /></div>
                    <div><label style={lbl}>Return airport</label><input value={lg.returnAirport} onChange={e => set("returnAirport", e.target.value)} style={inp} /></div>
                    <div><label style={lbl}>Required cert</label><input value={lg.requiredCert} placeholder="Open Water" onChange={e => set("requiredCert", e.target.value)} style={inp} /></div>
                    <div><label style={lbl}>Min dives req.</label><input value={lg.requiredDives} type="number" onChange={e => set("requiredDives", e.target.value)} style={inp} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}><div><label style={lbl}>Dives min</label><input value={lg.totalDivesMin} type="number" onChange={e => set("totalDivesMin", e.target.value)} style={inp} /></div><div><label style={lbl}>Dives max</label><input value={lg.totalDivesMax} type="number" onChange={e => set("totalDivesMax", e.target.value)} style={inp} /></div></div>
                  </div>
                </div>
              ); })()}
              <div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                  <button type="button" onClick={() => setSchedPreviewOpen(true)} style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid #3b82f6", background: "transparent", color: "#3b82f6", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>👁 ดูตัวอย่าง (View Detail)</button>
                </div>
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
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div><label style={lbl}>✓ Included (1 รายการ/บรรทัด)</label><textarea value={(lf.included ?? []).join("\n")} placeholder={"Nitrox\nAirport transfer\nFull board"} onChange={e => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), included: e.target.value.split("\n") } }))} style={{ ...inp, minHeight: 110, resize: "vertical", fontFamily: "inherit" }} /></div>
                        <div><label style={lbl}>✗ Not included (1 รายการ/บรรทัด)</label><textarea value={(lf.excluded ?? []).join("\n")} placeholder={"Alcoholic drinks\nGratuities\nNitrox"} onChange={e => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), excluded: e.target.value.split("\n") } }))} style={{ ...inp, minHeight: 110, resize: "vertical", fontFamily: "inherit" }} /></div>
                      </div>
                      <div style={{ borderTop: "1px dashed #ccc", paddingTop: 10, fontSize: 11, color: "#888", fontWeight: 700 }}>PADI-style full details (liveaboard)</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div><label style={lbl}>Marine life (1 รายการ/บรรทัด)</label><textarea value={(lf.marineLife ?? []).join("\n")} placeholder={"Manta ray\nWhale shark\nReef shark"} onChange={e => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), marineLife: e.target.value.split("\n") } }))} style={{ ...inp, minHeight: 90, resize: "vertical", fontFamily: "inherit" }} /></div>
                        <div><label style={lbl}>Optional extras (1 รายการ/บรรทัด)</label><textarea value={(lf.optionalExtras ?? []).join("\n")} placeholder={"Nitrox (100 USD/week)\nRental gear\nMassage"} onChange={e => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), optionalExtras: e.target.value.split("\n") } }))} style={{ ...inp, minHeight: 90, resize: "vertical", fontFamily: "inherit" }} /></div>
                      </div>
                      <div><label style={lbl}>Requirements</label><RichEditor value={lf.requirements} onChange={h => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), requirements: h } }))} /></div>
                      <div><label style={lbl}>Itinerary highlights</label><RichEditor value={lf.highlights} onChange={h => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), highlights: h } }))} /></div>
                      <div><label style={lbl}>Good to know</label><RichEditor value={lf.goodToKnow} onChange={h => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), goodToKnow: h } }))} /></div>
                      <div><label style={lbl}>Payment &amp; cancellation</label><RichEditor value={lf.paymentTerms} onChange={h => setSchedForm(f => ({ ...f, [l]: { ...(f[l] as SchedLang), paymentTerms: h } }))} /></div>

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
              <button type="button" onClick={() => setSchedPreviewOpen(true)} style={{ background: "transparent", border: "1px solid #3b82f6", color: "#3b82f6", borderRadius: 8, padding: "11px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>👁 ดูตัวอย่าง</button>
              <button onClick={saveSched} disabled={savingSched}
                style={{ flex: 1, background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 700, cursor: savingSched ? "wait" : "pointer" }}>
                {savingSched ? "กำลังบันทึก..." : editSchedId ? "บันทึกการแก้ไข" : "เพิ่ม Trip"}
              </button>
              <button onClick={closeSched} style={{ background: "#111", border: "1px solid #222", color: "#555", borderRadius: 8, padding: "11px 18px", fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
      {schedPreviewOpen && (() => {
        const sl = schedForm[schedActiveLang] as SchedLang;
        const clean = (a: string[]) => (a ?? []).map(x => x.trim()).filter(Boolean);
        const n = (v: string) => v && !isNaN(Number(v)) ? Number(v) : undefined;
        const lg = schedForm.logistics;
        const data = { included: clean(sl.included), excluded: clean(sl.excluded), details: { requirements: sl.requirements, highlights: sl.highlights, marineLife: clean(sl.marineLife), optionalExtras: clean(sl.optionalExtras), goodToKnow: sl.goodToKnow, paymentTerms: sl.paymentTerms }, logistics: { departurePort: lg.departurePort || undefined, departureTime: lg.departureTime || undefined, departureAirport: lg.departureAirport || undefined, returnPort: lg.returnPort || undefined, returnTime: lg.returnTime || undefined, returnAirport: lg.returnAirport || undefined, requiredCert: lg.requiredCert || undefined, requiredDives: n(lg.requiredDives), totalDivesMin: n(lg.totalDivesMin), totalDivesMax: n(lg.totalDivesMax) } };
        return (
          <div onClick={() => setSchedPreviewOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 16px", overflowY: "auto" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", color: "#222", borderRadius: 14, maxWidth: 560, width: "100%", padding: "22px 22px 30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: "#999", fontWeight: 700 }}>ตัวอย่าง View Detail ({LANG_LABELS[schedActiveLang]}) — เหมือนที่ผู้ใช้เห็น</div>
                <button onClick={() => setSchedPreviewOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#444" }}>×</button>
              </div>
              <h3 style={{ margin: "0 0 14px", fontSize: 18 }}>{sl.title || "(ไม่มีชื่อ)"}</h3>
              <ScheduleFullDetails data={data} lang={schedActiveLang} fg="#222" subtle="#888" chipBg="rgba(0,0,0,0.05)" border="#e5e5e5" />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
