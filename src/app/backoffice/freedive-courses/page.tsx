"use client";

import { useState, useEffect, useCallback } from "react";
import { BoatForm, BoatFormData, emptyBoatForm, ALL_LANGS, type LangKey } from "@/components/backoffice/TripForm";
import PackagePanel from "@/components/backoffice/PackagePanel";
import OptionsPanel from "@/components/backoffice/OptionsPanel";

type PkgRow = {
  id: string; name: string; totalSeats: number | null; status: string;
  translations: { lang: string; title: string }[];
  priceTiers: { tier: string; regularPrice: number; salePrice: number | null }[];
};
type BoatRow = {
  id: string; companyId: string; name: string; type: string; capacity: number | null;
  photos: string[]; covers: string[]; status: string; featured: boolean;
  company: { translations: { lang: string; name: string }[] };
  translations: { lang: string; title: string; slug: string; excerpt: string; content: string; keywords: string[] }[];
  videos: { url: string; name: string; order: number }[];
  priceTiers: { tier: string; costPrice: number | null; regularPrice: number; salePrice: number | null; agentPrice: number | null }[];
  serviceAreas: { serviceAreaId: string; serviceArea: { id: string; translations: { lang: string; name: string }[] } }[];
};
type CompanyRow = { id: string; translations: { lang: string; name: string }[] };

const TIERS = ["ADULT", "CHILD"];

function rowToBoatForm(b: BoatRow): BoatFormData {
  const form = emptyBoatForm(TIERS, "FREEDIVE_COURSES" as "DAYTRIP");
  form.name = b.name; form.companyId = b.companyId; form.type = "FREEDIVE_COURSES" as "DAYTRIP";
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

export default function FreediveCoursesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [boats, setBoats] = useState<BoatRow[]>([]);
  const [serviceAreas, setServiceAreas] = useState<{ id: string; translations: { lang: string; name: string }[] }[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [boatPackages, setBoatPackages] = useState<Record<string, PkgRow[]>>({});
  const [boatOpen, setBoatOpen] = useState(false);
  const [editBoatId, setEditBoatId] = useState<string | null>(null);
  const [boatForm, setBoatForm] = useState<BoatFormData>(emptyBoatForm(TIERS, "FREEDIVE_COURSES" as "DAYTRIP"));
  const [savingBoat, setSavingBoat] = useState(false);
  const [pkgBoat, setPkgBoat] = useState<{ id: string; name: string } | null>(null);
  const [editPkgId, setEditPkgId] = useState<string | null>(null);
  const [newPkg, setNewPkg] = useState(false);
  const [optionsBoat, setOptionsBoat] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    const [coData, boatData] = await Promise.all([
      fetch("/api/companies").then(r => r.json()).catch(() => []),
      fetch("/api/boats?type=FREEDIVE_COURSES").then(r => r.json()).catch(() => []),
    ]);
    setCompanies(Array.isArray(coData) ? coData : []);
    setBoats(Array.isArray(boatData) ? boatData : []);
    const saData = await fetch("/api/service-areas").then(r => r.json()).catch(() => []);
    setServiceAreas(Array.isArray(saData) ? saData : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (boatId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(boatId)) { next.delete(boatId); return next; }
      next.add(boatId);
      return next;
    });
    if (!boatPackages[boatId]) {
      const data = await fetch(`/api/packages?boatId=${boatId}`).then(r => r.json()).catch(() => []);
      setBoatPackages(prev => ({ ...prev, [boatId]: Array.isArray(data) ? data : [] }));
    }
  };

  const openNewBoat = () => { setBoatForm(emptyBoatForm(TIERS, "FREEDIVE_COURSES" as "DAYTRIP")); setEditBoatId(null); setBoatOpen(true); };
  const openEditBoat = (b: BoatRow) => { setBoatForm(rowToBoatForm(b)); setEditBoatId(b.id); setBoatOpen(true); };
  const closeBoat = () => { setBoatOpen(false); setEditBoatId(null); };
  const saveBoat = async () => {
    setSavingBoat(true);
    const body = { companyId: boatForm.companyId || null, name: boatForm.name, type: "FREEDIVE_COURSES", capacity: boatForm.capacity || null, photos: boatForm.photos, covers: boatForm.covers, status: boatForm.status, featured: boatForm.featured, translations: ALL_LANGS.map(l => ({ lang: l, ...boatForm[l as LangKey] })), videos: boatForm.videos, priceTiers: boatForm.priceTiers.map(p => ({ tier: p.tier, costPrice: p.costPrice ? Number(p.costPrice) : null, regularPrice: Number(p.regularPrice) || 0, salePrice: p.salePrice ? Number(p.salePrice) : null, agentPrice: p.agentPrice ? Number(p.agentPrice) : null })), serviceAreaIds: boatForm.serviceAreaIds };
    if (editBoatId) await fetch(`/api/boats/${editBoatId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    else await fetch("/api/boats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSavingBoat(false); closeBoat(); load();
  };
  const deleteBoat = async (id: string) => {
    if (!confirm("ลบ Freedive Course นี้?")) return;
    await fetch(`/api/boats/${id}`, { method: "DELETE" }); load();
  };

  const refreshPkgs = async (boatId: string) => {
    const data = await fetch(`/api/packages?boatId=${boatId}`).then(r => r.json()).catch(() => []);
    setBoatPackages(prev => ({ ...prev, [boatId]: Array.isArray(data) ? data : [] }));
  };

  const closePkgPanel = async (boatId: string) => {
    await refreshPkgs(boatId);
    setPkgBoat(null); setEditPkgId(null); setNewPkg(false);
  };

  const deleteDropdownPkg = async (pkgId: string, boatId: string) => {
    if (!confirm("ลบ package นี้?")) return;
    await fetch(`/api/packages/${pkgId}`, { method: "DELETE" });
    await refreshPkgs(boatId);
  };

  const companyOptions = companies.map(c => ({ id: c.id, name: c.translations.find(t => t.lang === "en")?.name ?? c.translations[0]?.name ?? c.id }));

  return (
    <div style={{ padding: "24px 20px", maxWidth: 960 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e5e5e5" }}>🫧 Freedive Courses</h1>
        <button onClick={openNewBoat} style={{ background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + เพิ่ม Dive Center
        </button>
      </div>

      {boats.length === 0 && (
        <div style={{ textAlign: "center", color: "#333", padding: "60px 0", fontSize: 14 }}>
          ยังไม่มี Freedive Course — กด + เพิ่ม Course เพื่อเริ่ม
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {boats.map(boat => {
          const enTitle = boat.translations.find(t => t.lang === "en")?.title;
          const cover = boat.covers[0] ?? boat.photos[0];
          const isExp = expanded.has(boat.id);
          const pkgs = boatPackages[boat.id];
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
                  {coName && <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>{coName}</div>}
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    <button title="Packages" onClick={() => { setPkgBoat({ id: boat.id, name: enTitle || boat.name }); setNewPkg(true); }} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></button>
                    <button title="Options" onClick={() => setOptionsBoat({ id: boat.id, name: enTitle || boat.name })} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="16" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="18" r="2"/></svg>
                    </button>
                    <button title="แก้ไข" onClick={() => openEditBoat(boat)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button title="ลบ" onClick={() => deleteBoat(boat.id)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    <button onClick={() => toggleExpand(boat.id)} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 6, padding: "5px 7px", fontSize: 10, cursor: "pointer", minWidth: 26 }}>
                      {isExp ? "▲" : (pkgs ? `▼ ${pkgs.length}` : "▼")}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Package dropdown ── */}
              {isExp && (
                <div style={{ borderTop: "1px solid #111", background: "#050505" }}>
                  {!pkgs
                    ? <div style={{ padding: "10px 16px", fontSize: 11, color: "#2a2a2a" }}>กำลังโหลด...</div>
                    : pkgs.length === 0
                      ? <div style={{ padding: "10px 16px", fontSize: 11, color: "#2a2a2a" }}>ยังไม่มี Package — กดปุ่ม 📦 เพื่อเพิ่ม</div>
                      : pkgs.map(pkg => {
                        const title = pkg.translations.find(t => t.lang === "en")?.title || pkg.name;
                        const pkgStatusSt = pkg.status === "PUBLISHED" ? { bg: "#14532d", color: "#4ade80" } : { bg: "#111", color: "#555" };
                        return (
                          <div key={pkg.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid #0d0d0d" }}>
                            <span style={{ fontSize: 12, color: "#ccc", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
                            {pkg.name !== title && <span style={{ fontSize: 10, color: "#333", flexShrink: 0 }}>{pkg.name}</span>}
                            <span style={{ fontSize: 9, fontWeight: 700, background: pkgStatusSt.bg, color: pkgStatusSt.color, padding: "2px 7px", borderRadius: 8, flexShrink: 0 }}>{pkg.status}</span>
                            <button title="แก้ไข" onClick={() => { setPkgBoat({ id: boat.id, name: enTitle || boat.name }); setEditPkgId(pkg.id); }}
                              style={{ background: "none", border: "1px solid #222", color: "#aaa", borderRadius: 5, padding: "3px 6px", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button title="ลบ" onClick={() => deleteDropdownPkg(pkg.id, boat.id)}
                              style={{ background: "none", border: "1px solid #2a1010", color: "#5a2020", borderRadius: 5, padding: "3px 6px", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
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

      {/* ── Package panel ── */}
      {pkgBoat && <PackagePanel boatId={pkgBoat.id} boatName={pkgBoat.name} onClose={() => closePkgPanel(pkgBoat.id)} seasonPricing defaultEditId={editPkgId ?? undefined} defaultNew={newPkg} />}
      {optionsBoat && <OptionsPanel boatId={optionsBoat.id} boatName={optionsBoat.name} onClose={() => setOptionsBoat(null)} />}

      {boatOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={closeBoat} style={{ flex: 1, background: "rgba(0,0,0,.6)" }} />
          <div style={{ width: "min(720px,100%)", background: "#0d0d0d", borderLeft: "1px solid #1a1a1a", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#0d0d0d", borderBottom: "1px solid #111" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#ddd" }}>{editBoatId ? "แก้ไข Freedive Course" : "เพิ่ม Freedive Course"}</span>
              <button onClick={closeBoat} style={{ background: "none", border: "none", color: "#444", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ flex: 1, padding: "20px" }}>
              <BoatForm form={boatForm} onChange={setBoatForm} companies={companyOptions} serviceAreas={serviceAreas} nameLabel="ชื่อ Dive Center" />
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
