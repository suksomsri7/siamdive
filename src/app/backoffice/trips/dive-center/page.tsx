"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BoatForm, BoatFormData, emptyBoatForm, ALL_LANGS, type LangKey } from "@/components/backoffice/TripForm";

type BoatRow = {
  id: string; companyId: string | null; name: string; type: string; capacity: number | null;
  photos: string[]; covers: string[]; status: string; featured: boolean;
  company: { translations: { lang: string; name: string }[] } | null;
  translations: { lang: string; title: string; slug: string; excerpt: string; content: string; keywords: string[] }[];
  videos: { url: string; name: string; order: number }[];
  priceTiers: { tier: string; costPrice: number | null; regularPrice: number; salePrice: number | null; agentPrice: number | null }[];
  serviceAreas: { serviceAreaId: string; serviceArea: { id: string; translations: { lang: string; name: string }[] } }[];
  currency?: string;
  _count?: { schedules: number };
};
type CompanyRow = { id: string; translations: { lang: string; name: string }[] };

const TIERS = ["ADULT", "CHILD"];

// child-boat (course/trip/liveaboard owned by the same company) → display group + manage link
const CHILD_GROUPS: { label: string; icon: string; types: string[] }[] = [
  { label: "คอร์สที่เปิดสอน", icon: "🎓", types: ["SCUBA_COURSES", "FREEDIVE_COURSES"] },
  { label: "ทริปวันเดียว", icon: "🤿", types: ["DAYTRIP", "SNORKELING", "LAND_TOUR", "FREEDIVE"] },
  { label: "Liveaboard", icon: "🚢", types: ["LIVEABOARD"] },
  { label: "Dive Resort", icon: "🏝", types: ["DIVE_RESORT"] },
  { label: "Instructor", icon: "🎖", types: ["SCUBA_INSTRUCTOR", "FREEDIVE_INSTRUCTOR"] },
];
const TYPE_HREF: Record<string, string> = {
  DAYTRIP: "/backoffice/trips/daytrip", SNORKELING: "/backoffice/trips/snorkeling",
  LAND_TOUR: "/backoffice/trips/land-tour", LIVEABOARD: "/backoffice/trips/liveaboard",
  DIVE_RESORT: "/backoffice/trips/dive-resort", FREEDIVE: "/backoffice/trips/freedive",
  SCUBA_COURSES: "/backoffice/courses", FREEDIVE_COURSES: "/backoffice/freedive-courses",
  SCUBA_INSTRUCTOR: "/backoffice/scuba-instructor", FREEDIVE_INSTRUCTOR: "/backoffice/freedive-instructor",
};

function rowToBoatForm(b: BoatRow): BoatFormData {
  const form = emptyBoatForm(TIERS, "DIVE_CENTER");
  form.name = b.name; form.companyId = b.companyId ?? ""; form.type = "DIVE_CENTER";
  form.capacity = b.capacity?.toString() ?? "";
  form.status = b.status as "DRAFT" | "PUBLISHED"; form.featured = b.featured;
  form.photos = b.photos ?? []; form.covers = b.covers ?? [];
  form.videos = b.videos.sort((a, x) => a.order - x.order).map(v => ({ url: v.url, name: v.name }));
  form.priceTiers = TIERS.map(tier => {
    const p = b.priceTiers.find(x => x.tier === tier);
    return { tier, costPrice: p?.costPrice?.toString() ?? "", regularPrice: p?.regularPrice?.toString() ?? "", salePrice: p?.salePrice?.toString() ?? "", agentPrice: p?.agentPrice?.toString() ?? "" };
  });
  form.serviceAreaIds = b.serviceAreas.map(sa => sa.serviceAreaId);
  form.currency = b.currency ?? "THB";
  for (const tr of b.translations) {
    if (ALL_LANGS.includes(tr.lang as typeof ALL_LANGS[number]))
      (form as Record<string, unknown>)[tr.lang] = { title: tr.title, slug: tr.slug, excerpt: tr.excerpt, content: tr.content, keywords: tr.keywords ?? [] };
  }
  return form;
}

export default function DiveCenterPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [boats, setBoats] = useState<BoatRow[]>([]);
  const [serviceAreas, setServiceAreas] = useState<{ id: string; countryId: string | null; translations: { lang: string; name: string }[] }[]>([]);
  const [countries, setCountries] = useState<{ id: string; code: string; flag: string; translations: { lang: string; name: string }[] }[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [children, setChildren] = useState<Record<string, BoatRow[]>>({});
  const [boatOpen, setBoatOpen] = useState(false);
  const [editBoatId, setEditBoatId] = useState<string | null>(null);
  const [boatForm, setBoatForm] = useState<BoatFormData>(emptyBoatForm(TIERS, "DIVE_CENTER"));
  const [savingBoat, setSavingBoat] = useState(false);

  const load = useCallback(async () => {
    const [coData, boatData] = await Promise.all([
      fetch("/api/companies?minimal=1").then(r => r.json()).catch(() => []),
      fetch("/api/boats?type=DIVE_CENTER").then(r => r.json()).catch(() => []),
    ]);
    setCompanies(Array.isArray(coData) ? coData : []);
    setBoats(Array.isArray(boatData) ? boatData : []);
    const saData = await fetch("/api/service-areas").then(r => r.json()).catch(() => []);
    setServiceAreas(Array.isArray(saData) ? saData : []);
    const ctData = await fetch("/api/countries").then(r => r.json()).catch(() => []);
    setCountries(Array.isArray(ctData) ? ctData : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (boat: BoatRow) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(boat.id)) { next.delete(boat.id); return next; }
      next.add(boat.id);
      return next;
    });
    if (!children[boat.id] && boat.companyId) {
      const data: BoatRow[] = await fetch(`/api/boats?companyId=${boat.companyId}`).then(r => r.json()).catch(() => []);
      setChildren(prev => ({ ...prev, [boat.id]: (Array.isArray(data) ? data : []).filter(b => b.id !== boat.id) }));
    }
  };

  const openNewBoat = () => { setBoatForm(emptyBoatForm(TIERS, "DIVE_CENTER")); setEditBoatId(null); setBoatOpen(true); };
  const openEditBoat = (b: BoatRow) => { setBoatForm(rowToBoatForm(b)); setEditBoatId(b.id); setBoatOpen(true); };
  const closeBoat = () => { setBoatOpen(false); setEditBoatId(null); };
  const saveBoat = async () => {
    setSavingBoat(true);
    const body = { companyId: boatForm.companyId || null, name: boatForm.name, type: "DIVE_CENTER", capacity: boatForm.capacity || null, photos: boatForm.photos, covers: boatForm.covers, status: boatForm.status, featured: boatForm.featured, currency: boatForm.currency, translations: ALL_LANGS.map(l => ({ lang: l, ...boatForm[l as LangKey] })), videos: boatForm.videos, priceTiers: boatForm.priceTiers.map(p => ({ tier: p.tier, costPrice: p.costPrice ? Number(p.costPrice) : null, regularPrice: Number(p.regularPrice) || 0, salePrice: p.salePrice ? Number(p.salePrice) : null, agentPrice: p.agentPrice ? Number(p.agentPrice) : null })), serviceAreaIds: boatForm.serviceAreaIds };
    if (editBoatId) await fetch(`/api/boats/${editBoatId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    else await fetch("/api/boats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSavingBoat(false); closeBoat(); load();
  };
  const deleteBoat = async (id: string) => {
    if (!confirm("ลบ Dive Center นี้? (คอร์ส/ทริปของบริษัทจะไม่ถูกลบ)")) return;
    await fetch(`/api/boats/${id}`, { method: "DELETE" }); load();
  };

  const companyOptions = companies.map(c => ({ id: c.id, name: c.translations.find(t => t.lang === "en")?.name ?? c.translations[0]?.name ?? c.id }));

  return (
    <div style={{ padding: "24px 20px", maxWidth: 960 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e5e5e5" }}>🏬 Dive Center</h1>
        <button onClick={openNewBoat} style={{ background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + เพิ่ม Dive Center
        </button>
      </div>
      <p style={{ margin: "0 0 24px", fontSize: 12, color: "#444", lineHeight: 1.6 }}>
        หน้าโปรไฟล์ศูนย์ดำน้ำ (operator). คอร์ส/ทริป/liveaboard ที่ผูก <b>บริษัทเดียวกัน</b> จะมาแสดงในนี้อัตโนมัติ — สร้าง/แก้คอร์ส·ทริปได้ในเมนูของแต่ละหมวด แล้วเลือกบริษัทนี้
      </p>

      {boats.length === 0 && (
        <div style={{ textAlign: "center", color: "#333", padding: "60px 0", fontSize: 14 }}>
          ยังไม่มี Dive Center — กด + เพิ่ม Dive Center เพื่อเริ่ม
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {boats.map(boat => {
          const enTitle = boat.translations.find(t => t.lang === "en")?.title;
          const cover = boat.covers[0] ?? boat.photos[0];
          const isExp = expanded.has(boat.id);
          const kids = children[boat.id];
          const statusSt = boat.status === "PUBLISHED" ? { bg: "#14532d", color: "#4ade80" } : { bg: "#1a1a1a", color: "#555" };
          const coName = boat.company?.translations.find(t => t.lang === "en")?.name ?? boat.company?.translations[0]?.name ?? "";

          return (
            <div key={boat.id} style={{ border: "1px solid #1a1a1a", borderRadius: 10, overflow: "hidden", background: "#090909" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px" }}>
                <div style={{ width: 64, height: 48, borderRadius: 7, overflow: "hidden", flexShrink: 0, background: "#111", border: "1px solid #1a1a1a" }}>
                  {cover && <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />  /* eslint-disable-line @next/next/no-img-element */}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: "#ccc", fontSize: 14 }}>{enTitle || boat.name}</span>
                    {enTitle && enTitle !== boat.name && <span style={{ fontSize: 11, color: "#333" }}>({boat.name})</span>}
                    <span style={{ fontSize: 9, fontWeight: 700, background: statusSt.bg, color: statusSt.color, padding: "1px 6px", borderRadius: 8 }}>{boat.status}</span>
                    {boat.featured && <span style={{ fontSize: 9, fontWeight: 700, background: "#1e3a5f", color: "#60a5fa", padding: "1px 6px", borderRadius: 8 }}>⭐</span>}
                  </div>
                  {coName
                    ? <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>🏢 {coName}</div>
                    : <div style={{ fontSize: 10, color: "#7a5a2a", marginTop: 2 }}>⚠️ ยังไม่ผูกบริษัท — คอร์ส/ทริปจะไม่แสดง</div>}
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    <button title="แก้ไข" onClick={() => openEditBoat(boat)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button title="ลบ" onClick={() => deleteBoat(boat.id)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    <button onClick={() => toggleExpand(boat)} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 6, padding: "5px 9px", fontSize: 10, cursor: "pointer" }}>
                      {isExp ? "▲ ซ่อนคอร์ส/ทริป" : "▼ คอร์ส/ทริป"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── คอร์ส/ทริป/liveaboard ของบริษัทนี้ ── */}
              {isExp && (
                <div style={{ borderTop: "1px solid #111", background: "#050505", padding: "10px 16px" }}>
                  {!boat.companyId
                    ? <div style={{ fontSize: 11, color: "#7a5a2a" }}>ผูกบริษัทก่อน (กดแก้ไข → เลือกบริษัท) เพื่อแสดงคอร์ส/ทริป</div>
                    : !kids
                      ? <div style={{ fontSize: 11, color: "#2a2a2a" }}>กำลังโหลด...</div>
                      : kids.length === 0
                        ? <div style={{ fontSize: 11, color: "#2a2a2a" }}>บริษัทนี้ยังไม่มีคอร์ส/ทริปอื่น — สร้างในเมนู Scuba Courses / Day Trips / Liveaboard แล้วเลือกบริษัทนี้</div>
                        : CHILD_GROUPS.map(g => {
                          const items = kids.filter(k => g.types.includes(k.type));
                          if (items.length === 0) return null;
                          return (
                            <div key={g.label} style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{g.icon} {g.label} ({items.length})</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {items.map(k => {
                                  const kt = k.translations.find(t => t.lang === "en")?.title || k.name;
                                  const kSt = k.status === "PUBLISHED" ? { bg: "#14532d", color: "#4ade80" } : { bg: "#111", color: "#555" };
                                  return (
                                    <Link key={k.id} href={TYPE_HREF[k.type] ?? "#"} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#0c0c0c", border: "1px solid #141414", borderRadius: 7, textDecoration: "none" }}>
                                      <span style={{ fontSize: 12, color: "#bbb", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kt}</span>
                                      {typeof k._count?.schedules === "number" && k._count.schedules > 0 && <span style={{ fontSize: 9, color: "#3b82f6" }}>📅 {k._count.schedules}</span>}
                                      <span style={{ fontSize: 9, fontWeight: 700, background: kSt.bg, color: kSt.color, padding: "2px 7px", borderRadius: 8, flexShrink: 0 }}>{k.status}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>

      {boatOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={closeBoat} style={{ flex: 1, background: "rgba(0,0,0,.6)" }} />
          <div style={{ width: "min(720px,100%)", background: "#0d0d0d", borderLeft: "1px solid #1a1a1a", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#0d0d0d", borderBottom: "1px solid #111" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#ddd" }}>{editBoatId ? "แก้ไข Dive Center" : "เพิ่ม Dive Center"}</span>
              <button onClick={closeBoat} style={{ background: "none", border: "none", color: "#444", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ flex: 1, padding: "20px" }}>
              <BoatForm form={boatForm} onChange={setBoatForm} companies={companyOptions} serviceAreas={serviceAreas} countries={countries} nameLabel="ชื่อศูนย์ดำน้ำ" />
            </div>
            <div style={{ position: "sticky", bottom: 0, padding: "14px 20px", background: "#0d0d0d", borderTop: "1px solid #111", display: "flex", gap: 10 }}>
              <button onClick={saveBoat} disabled={savingBoat} style={{ flex: 1, background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 700, cursor: savingBoat ? "wait" : "pointer" }}>
                {savingBoat ? "กำลังบันทึก..." : editBoatId ? "บันทึกการแก้ไข" : "เพิ่ม Dive Center"}
              </button>
              <button onClick={closeBoat} style={{ background: "#111", border: "1px solid #222", color: "#555", borderRadius: 8, padding: "11px 18px", fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
