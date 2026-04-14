"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type DisplayItem        = { id: string; refId: string; refType: string; order: number };
type DisplayRowTrans    = { lang: string; title: string; subtitle: string };
type DisplayRow         = {
  id: string; topic: string; layout: string; itemType: string;
  order: number; active: boolean; maxItems: number | null;
  items: DisplayItem[]; translations: DisplayRowTrans[];
};
type RefItem = { id: string; label: string; sub?: string; cover?: string; badge?: string };
type SelectedEntry = { refId: string; refType: string; item: RefItem };
type SchedRaw = { id: string; translations: { lang: string; title: string }[]; departureDate: string | null; status: string };
type BoatEntry = { id: string; name: string; title: string; covers: string[]; schedules: SchedRaw[] };

const ALL_LANGS = ["en","th","cn","ja","ko","de","fr","ru"] as const;
type LangKey    = typeof ALL_LANGS[number];
const LANG_LABELS: Record<LangKey,string> = { en:"EN", th:"TH", cn:"中文", ja:"日本語", ko:"한국어", de:"DE", fr:"FR", ru:"RU" };

type TransForm = Record<LangKey, { title: string; subtitle: string }>;
const emptyTransForm = (): TransForm =>
  Object.fromEntries(ALL_LANGS.map(l => [l, { title: "", subtitle: "" }])) as TransForm;

// ── Constants ─────────────────────────────────────────────────────────────────
const SOURCES = [
  { value: "DAYTRIP",          label: "Scuba Day Trips",   icon: "🤿",  itemRefType: "SCHEDULE" as const, boatLabel: "เรือ/ทัวร์"  },
  { value: "SNORKELING",       label: "Snorkeling",         icon: "🐠",  itemRefType: "SCHEDULE" as const, boatLabel: "เรือ/ทัวร์"  },
  { value: "LAND_TOUR",        label: "Land Tour",          icon: "🗺",  itemRefType: "SCHEDULE" as const, boatLabel: "ทัวร์"        },
  { value: "LIVEABOARD",       label: "Liveaboard",         icon: "🚢",  itemRefType: "BOAT"     as const, boatLabel: "เรือ"         },
  { value: "DIVE_RESORT",      label: "Dive Resort",        icon: "🏝",  itemRefType: "PACKAGE"  as const, boatLabel: "Dive Center"  },
  { value: "FREEDIVE",         label: "Freedive Trips",     icon: "🫧",  itemRefType: "SCHEDULE" as const, boatLabel: "เรือ/ทัวร์"  },
  { value: "SCUBA_COURSES",    label: "Scuba Courses",      icon: "🎓",  itemRefType: "PACKAGE"  as const, boatLabel: "Dive Center"  },
  { value: "FREEDIVE_COURSES", label: "Freedive Courses",   icon: "🫁",  itemRefType: "PACKAGE"  as const, boatLabel: "Dive Center"  },
  { value: "BLOG",             label: "Blog",               icon: "📝",  itemRefType: "BLOG"     as const, boatLabel: ""            },
] as const;
type SourceValue = typeof SOURCES[number]["value"];

const LAYOUTS = [
  {
    value: "FULL",
    label: "Full",
    desc: "แบนเนอร์เต็มความกว้าง",
    preview: (
      <div style={{ width: "100%", height: 36, background: "#3b82f633", borderRadius: 5, border: "1px solid #3b82f655" }} />
    ),
  },
  {
    value: "VERTICAL",
    label: "Vertical",
    desc: "การ์ดแนวตั้ง (portrait)",
    preview: (
      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 18, height: 32, background: "#3b82f633", borderRadius: 4, border: "1px solid #3b82f655" }} />
        ))}
      </div>
    ),
  },
  {
    value: "HORIZONTAL",
    label: "Horizontal",
    desc: "การ์ดสี่เหลี่ยมผืนผ้า",
    preview: (
      <div style={{ display: "flex", gap: 4, overflow: "hidden" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flexShrink: 0, width: 28, height: 18, background: "#3b82f633", borderRadius: 3, border: "1px solid #3b82f655" }} />
        ))}
      </div>
    ),
  },
] as const;

const LAYOUT_STYLE: Record<string, { color: string; bg: string }> = {
  FULL:       { color: "#a78bfa", bg: "#2e1065" },
  VERTICAL:   { color: "#34d399", bg: "#064e3b" },
  HORIZONTAL: { color: "#60a5fa", bg: "#1e3a5f" },
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "#4ade80", FULL: "#fbbf24", DRAFT: "#555", CANCELLED: "#f87171", COMPLETED: "#818cf8", PUBLISHED: "#4ade80",
};

const emptyForm = () => ({ topic: "", layout: "HORIZONTAL" as string, active: true });
type RowForm = ReturnType<typeof emptyForm>;

function boatTitle(boat: { name: string; translations?: { lang: string; title: string }[] } | undefined): string {
  if (!boat) return "—";
  return boat.translations?.find(t => t.lang === "en")?.title || boat.name;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DisplayPage() {
  const [rows,       setRows]      = useState<DisplayRow[]>([]);
  const [panelOpen,  setPanelOpen] = useState(false);
  const [editId,     setEditId]    = useState<string | null>(null);
  const [form,       setForm]      = useState<RowForm>(emptyForm());
  const [saving,     setSaving]    = useState(false);
  const [transForm,  setTransForm] = useState<TransForm>(emptyTransForm());
  const [activeLang, setActiveLang]= useState<LangKey>("en");
  const [maxItems,   setMaxItems]  = useState<string>("");
  const [autoLatest, setAutoLatest] = useState<boolean>(false);

  // ── Picker state ──
  const [pickerSource,  setPickerSource]  = useState<SourceValue | "">("");
  const [rowItemType,   setRowItemType]   = useState<string>("");  // locked itemType for the row
  const [boats,         setBoats]         = useState<BoatEntry[]>([]);
  const [pickerBoat,    setPickerBoat]    = useState<string>("");
  const [refItems,      setRefItems]      = useState<RefItem[]>([]);
  const [loadingBoats,  setLoadingBoats]  = useState(false);
  const [loadingRef,    setLoadingRef]    = useState(false);
  const [selected,      setSelected]      = useState<SelectedEntry[]>([]);

  const load = useCallback(async () => {
    const data = await fetch("/api/display-rows").then(r => r.json()).catch(() => []);
    setRows(Array.isArray(data) ? data : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  // ── Load boats when source changes ──
  useEffect(() => {
    if (!pickerSource) { setBoats([]); setRefItems([]); setPickerBoat(""); return; }
    if (pickerSource === "BLOG") {
      // no boat step for blog
      setBoats([]); setPickerBoat("");
      setLoadingRef(true);
      fetch("/api/blogs").then(r => r.json()).catch(() => []).then((data: Record<string, unknown>[]) => {
        const all = Array.isArray(data) ? data : [];
        setRefItems(all.map(b => {
          const trans = (b.translations as { lang: string; title: string }[]) ?? [];
          const covers = (b.covers as string[]) ?? [];
          return { id: b.id as string, label: trans.find(t => t.lang === "en")?.title || "Untitled", cover: covers[0], badge: b.status as string };
        }));
      }).finally(() => setLoadingRef(false));
      return;
    }
    // BOAT-level source (e.g. LIVEABOARD): pick boats directly, skip schedule drill-down
    const srcDef = SOURCES.find(s => s.value === pickerSource);
    if (srcDef?.itemRefType === "BOAT") {
      setBoats([]); setPickerBoat("");
      setLoadingRef(true);
      fetch(`/api/boats?type=${pickerSource}`).then(r => r.json()).catch(() => []).then((data: Record<string, unknown>[]) => {
        const all = Array.isArray(data) ? data : [];
        setRefItems(all.map(b => {
          const trans = (b.translations as { lang: string; title: string }[]) ?? [];
          const covers = (b.covers as string[]) ?? [];
          return { id: b.id as string, label: trans.find(t => t.lang === "en")?.title || (b.name as string), cover: covers[0], badge: b.status as string };
        }));
      }).finally(() => setLoadingRef(false));
      return;
    }
    // fetch boats by type
    setBoats([]); setPickerBoat(""); setRefItems([]);
    setLoadingBoats(true);
    fetch(`/api/boats?type=${pickerSource}`).then(r => r.json()).catch(() => []).then((data: Record<string, unknown>[]) => {
      const all = Array.isArray(data) ? data : [];
      setBoats(all.map(b => ({
        id: b.id as string,
        name: b.name as string,
        title: (b.translations as { lang: string; title: string }[])?.find(t => t.lang === "en")?.title || b.name as string,
        covers: (b.covers as string[]) ?? [],
        schedules: (b.schedules as SchedRaw[]) ?? [],
      })));
    }).finally(() => setLoadingBoats(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerSource]);

  // ── Load items when boat changes ──
  useEffect(() => {
    if (!pickerBoat || !pickerSource || pickerSource === "BLOG") { setRefItems([]); return; }
    const src = SOURCES.find(s => s.value === pickerSource);
    if (!src) return;

    if (src.itemRefType === "SCHEDULE") {
      // use embedded schedules from already-fetched boat
      const boat = boats.find(b => b.id === pickerBoat);
      if (!boat) return;
      setRefItems(boat.schedules.map(s => {
        const title = s.translations?.find(t => t.lang === "en")?.title || "";
        const dep = s.departureDate
          ? new Date(s.departureDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
          : "ไม่ระบุวัน";
        return { id: s.id, label: title || boat.title || boat.name, sub: dep, cover: boat.covers[0], badge: s.status };
      }));
    } else {
      // PACKAGE — fetch from API
      setRefItems([]); setLoadingRef(true);
      fetch(`/api/packages?boatId=${pickerBoat}`).then(r => r.json()).catch(() => []).then((data: Record<string, unknown>[]) => {
        const all = Array.isArray(data) ? data : [];
        const boat = boats.find(b => b.id === pickerBoat);
        setRefItems(all.map(p => {
          const trans = (p.translations as { lang: string; title: string }[]) ?? [];
          return { id: p.id as string, label: trans.find(t => t.lang === "en")?.title || (p.name as string), cover: boat?.covers[0], badge: p.status as string };
        }));
      }).finally(() => setLoadingRef(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerBoat]);

  const currentSrc = SOURCES.find(s => s.value === pickerSource);
  const isBoatLevel = currentSrc?.itemRefType === "BOAT";

  const toggleItem = (item: RefItem) => {
    const refType = currentSrc?.itemRefType ?? "SCHEDULE";
    setSelected(prev => {
      const exists = prev.some(e => e.refId === item.id);
      if (exists) return prev.filter(e => e.refId !== item.id);
      return [...prev, { refId: item.id, refType, item }];
    });
  };

  const removeSelected = (refId: string) => setSelected(prev => prev.filter(e => e.refId !== refId));

  const moveSelectedUp = (idx: number) => {
    if (idx === 0) return;
    setSelected(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a; });
  };
  const moveSelectedDown = (idx: number) => {
    setSelected(prev => { if (idx >= prev.length - 1) return prev; const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a; });
  };

  const openNew = () => {
    setForm(emptyForm()); setEditId(null);
    setTransForm(emptyTransForm()); setMaxItems(""); setAutoLatest(false); setActiveLang("en");
    setSelected([]); setPickerSource(""); setPickerBoat(""); setRowItemType(""); setPanelOpen(true);
  };

  const openEdit = async (row: DisplayRow) => {
    setForm({ topic: row.topic, layout: row.layout, active: row.active });
    setEditId(row.id); setRowItemType(row.itemType);
    setMaxItems(row.maxItems != null ? String(row.maxItems) : "");
    setAutoLatest((row as any).autoLatest === true);
    setActiveLang("en");
    // load translations
    const tf = emptyTransForm();
    for (const t of (row.translations ?? [])) {
      if (ALL_LANGS.includes(t.lang as LangKey)) {
        tf[t.lang as LangKey] = { title: t.title, subtitle: t.subtitle };
      }
    }
    setTransForm(tf);
    setPickerSource(""); setPickerBoat(""); setPanelOpen(true);
    // Placeholder list while loading (preserve item order from row)
    const placeholder = row.items.map(i => ({ refId: i.refId, refType: i.refType, item: { id: i.refId, label: "..." } }));
    setSelected(placeholder);
    // Resolve real labels
    const schedIds = row.items.filter(i => i.refType === "SCHEDULE").map(i => i.refId);
    const pkgIds   = row.items.filter(i => i.refType === "PACKAGE").map(i => i.refId);
    const blogIds  = row.items.filter(i => i.refType === "BLOG").map(i => i.refId);
    const boatIds  = row.items.filter(i => i.refType === "BOAT").map(i => i.refId);
    const [schedData, pkgData, blogData, boatData] = await Promise.all([
      schedIds.length ? fetch("/api/schedules").then(r => r.json()).catch(() => []) : [],
      pkgIds.length   ? fetch("/api/packages").then(r => r.json()).catch(() => [])  : [],
      blogIds.length  ? fetch("/api/blogs").then(r => r.json()).catch(() => [])     : [],
      boatIds.length  ? fetch(`/api/boats?type=${row.itemType}`).then(r => r.json()).catch(() => []) : [],
    ]);
    const resolved: SelectedEntry[] = row.items.map(i => {
      if (i.refType === "SCHEDULE") {
        const s = (Array.isArray(schedData) ? schedData : []).find((x: Record<string, unknown>) => x.id === i.refId);
        if (s) {
          const boat = s.boat as { name: string; translations: { lang: string; title: string }[]; covers: string[] } | undefined;
          const trans = (s.translations as { lang: string; title: string }[]) ?? [];
          const title = trans.find(t => t.lang === "en")?.title || "";
          const dep = s.departureDate ? new Date(s.departureDate as string).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "ไม่ระบุวัน";
          return { refId: i.refId, refType: i.refType, item: { id: i.refId, label: title || boatTitle(boat), sub: `${boatTitle(boat)} · ${dep}`, cover: (boat?.covers ?? [])[0], badge: s.status as string } };
        }
      }
      if (i.refType === "PACKAGE") {
        const p = (Array.isArray(pkgData) ? pkgData : []).find((x: Record<string, unknown>) => x.id === i.refId);
        if (p) {
          const boat = p.boat as { name: string; translations: { lang: string; title: string }[]; covers: string[] } | undefined;
          const trans = (p.translations as { lang: string; title: string }[]) ?? [];
          return { refId: i.refId, refType: i.refType, item: { id: i.refId, label: trans.find(t => t.lang === "en")?.title || (p.name as string), sub: boatTitle(boat), cover: (boat?.covers ?? [])[0], badge: p.status as string } };
        }
      }
      if (i.refType === "BLOG") {
        const b = (Array.isArray(blogData) ? blogData : []).find((x: Record<string, unknown>) => x.id === i.refId);
        if (b) {
          const trans = (b.translations as { lang: string; title: string }[]) ?? [];
          const covers = (b.covers as string[]) ?? [];
          return { refId: i.refId, refType: i.refType, item: { id: i.refId, label: trans.find(t => t.lang === "en")?.title || "Untitled", cover: covers[0], badge: b.status as string } };
        }
      }
      if (i.refType === "BOAT") {
        const b = (Array.isArray(boatData) ? boatData : []).find((x: Record<string, unknown>) => x.id === i.refId);
        if (b) {
          const trans = (b.translations as { lang: string; title: string }[]) ?? [];
          const covers = (b.covers as string[]) ?? [];
          return { refId: i.refId, refType: i.refType, item: { id: i.refId, label: trans.find(t => t.lang === "en")?.title || (b.name as string), cover: covers[0], badge: b.status as string } };
        }
      }
      return { refId: i.refId, refType: i.refType, item: { id: i.refId, label: i.refId } };
    });
    setSelected(resolved);
  };

  const close = () => { setPanelOpen(false); setEditId(null); };

  const moveUp = async (row: DisplayRow, idx: number) => {
    if (idx === 0) return;
    const r = [...rows]; [r[idx-1], r[idx]] = [r[idx], r[idx-1]]; setRows(r);
    await Promise.all([
      fetch(`/api/display-rows/${r[idx-1].id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({order:idx-1}) }),
      fetch(`/api/display-rows/${r[idx].id}`,   { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({order:idx}) }),
    ]);
  };
  const moveDown = async (row: DisplayRow, idx: number) => {
    if (idx >= rows.length - 1) return;
    const r = [...rows]; [r[idx], r[idx+1]] = [r[idx+1], r[idx]]; setRows(r);
    await Promise.all([
      fetch(`/api/display-rows/${r[idx].id}`,   { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({order:idx}) }),
      fetch(`/api/display-rows/${r[idx+1].id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({order:idx+1}) }),
    ]);
  };
  const toggleActive = async (row: DisplayRow) => {
    setRows(prev => prev.map(r => r.id === row.id ? {...r, active: !r.active} : r));
    await fetch(`/api/display-rows/${row.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({active: !row.active}) });
  };
  const handleDelete = async (id: string, topic: string) => {
    if (!confirm(`ลบ Row "${topic}"?`)) return;
    await fetch(`/api/display-rows/${id}`, { method:"DELETE" }); load();
  };

  const handleSave = async () => {
    if (!form.topic.trim()) return;
    setSaving(true);
    const entries = selected;
    const parsedMax = maxItems.trim() !== "" ? parseInt(maxItems, 10) : null;
    const translations = ALL_LANGS
      .filter(l => transForm[l].title.trim())
      .map(l => ({ lang: l, title: transForm[l].title.trim(), subtitle: transForm[l].subtitle.trim() }));
    const body = {
      topic: form.topic, layout: form.layout,
      itemType: rowItemType || pickerSource || entries[0]?.refType || "SCHEDULE",
      order: editId ? (rows.find(r => r.id === editId)?.order ?? rows.length) : rows.length,
      active: form.active,
      maxItems: parsedMax,
      autoLatest,
      translations,
      items: entries.map((e, i) => ({ refId: e.refId, refType: e.refType, order: i })),
    };
    if (editId) await fetch(`/api/display-rows/${editId}`, { method:"PUT",  headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    else        await fetch("/api/display-rows",            { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    setSaving(false); close(); load();
  };

  const inp: React.CSSProperties = { width:"100%", background:"#161616", border:"1px solid #222", borderRadius:7, color:"#ccc", fontSize:13, padding:"9px 12px", outline:"none", boxSizing:"border-box" };
  const lbl: React.CSSProperties = { fontSize:11, color:"#333", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:6 };
  const stepLabel: React.CSSProperties = { fontSize:10, color:"#252525", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 };

  const selectedArr = selected;
  const isBlog = pickerSource === "BLOG";

  return (
    <div style={{ padding:"24px 20px", maxWidth:900 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#e5e5e5" }}>🖥 Display</h1>
          <p style={{ margin:"4px 0 0", fontSize:12, color:"#333" }}>กำหนดการแสดงผล Rows บนหน้าเว็บ · {rows.length} rows</p>
        </div>
        <button onClick={openNew} style={{ background:"#3b82f6", border:"none", color:"#fff", borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ เพิ่ม Row</button>
      </div>

      {/* Row list */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {rows.map((row, idx) => {
          const ls = LAYOUT_STYLE[row.layout] ?? { color:"#888", bg:"#1a1a1a" };
          const layoutLabel = LAYOUTS.find(l => l.value === row.layout)?.label ?? row.layout;
          const srcIcon = SOURCES.find(s => s.value === row.itemType)?.icon ?? "";
          return (
            <div key={row.id} style={{ background:"#0d0d0d", border:`1px solid ${row.active ? "#1a1a1a" : "#111"}`, borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, opacity:row.active ? 1 : 0.45 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:3, flexShrink:0 }}>
                <button onClick={() => moveUp(row, idx)} disabled={idx===0} style={{ background:"none", border:"1px solid #1a1a1a", color:idx===0 ? "#1a1a1a" : "#444", borderRadius:5, width:24, height:22, cursor:idx===0 ? "default":"pointer", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
                <button onClick={() => moveDown(row, idx)} disabled={idx>=rows.length-1} style={{ background:"none", border:"1px solid #1a1a1a", color:idx>=rows.length-1 ? "#1a1a1a":"#444", borderRadius:5, width:24, height:22, cursor:idx>=rows.length-1 ? "default":"pointer", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
              </div>
              <span style={{ fontSize:11, color:"#222", fontWeight:700, minWidth:16, textAlign:"center" }}>{idx+1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                  {srcIcon && <span style={{ fontSize:14 }}>{srcIcon}</span>}
                  <span style={{ fontWeight:700, color:"#ccc", fontSize:14 }}>{row.topic}</span>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:ls.bg, color:ls.color }}>{layoutLabel}</span>
                </div>
                <div style={{ fontSize:11, color:"#2a2a2a", marginTop:4 }}>
                  {row.items.length} items
                  {row.maxItems != null && <span style={{ marginLeft:6, color:"#1a3a5c" }}>· max {row.maxItems}</span>}
                  {(row.translations?.length ?? 0) > 0 && <span style={{ marginLeft:6, color:"#1a3a2a" }}>· {row.translations.length} ภาษา</span>}
                </div>
              </div>
              <button onClick={() => toggleActive(row)} style={{ background:row.active ? "#14532d":"#111", border:`1px solid ${row.active ? "#166534":"#1a1a1a"}`, color:row.active ? "#4ade80":"#333", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                {row.active ? "ON":"OFF"}
              </button>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button onClick={() => openEdit(row)} style={{ background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#aaa", borderRadius:7, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>แก้ไข</button>
                <button onClick={() => handleDelete(row.id, row.topic)} style={{ background:"none", border:"1px solid #2a1010", color:"#4a2020", borderRadius:7, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>ลบ</button>
              </div>
            </div>
          );
        })}
      </div>
      {rows.length === 0 && <div style={{ textAlign:"center", color:"#333", padding:"60px 0", fontSize:14 }}>ยังไม่มี Row — กด + เพิ่ม Row เพื่อเริ่ม</div>}

      {/* ── Panel ── */}
      {panelOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", justifyContent:"flex-end" }}>
          <div onClick={close} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.65)" }} />
          <div style={{ position:"relative", width:"min(640px,100vw)", background:"#0a0a0a", borderLeft:"1px solid #1a1a1a", display:"flex", flexDirection:"column", height:"100%" }}>

            <div style={{ padding:"20px 22px", borderBottom:"1px solid #111", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <span style={{ fontWeight:700, fontSize:16, color:"#e5e5e5" }}>{editId ? "แก้ไข Row" : "เพิ่ม Row"}</span>
              <button onClick={close} style={{ background:"none", border:"none", color:"#555", fontSize:20, cursor:"pointer" }}>×</button>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"22px", display:"flex", flexDirection:"column", gap:22 }}>

              {/* Topic */}
              <div>
                <label style={lbl}>Topic (ชื่อภายใน backoffice) *</label>
                <input type="text" value={form.topic} onChange={e => setForm(f => ({...f, topic:e.target.value}))} placeholder="เช่น Liveaboard ยอดนิยม, บทความล่าสุด..." style={inp} />
              </div>

              {/* Translations */}
              <div>
                <label style={lbl}>หัวข้อ Section (แสดงบนเว็บ)</label>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:12 }}>
                  {ALL_LANGS.map(l => (
                    <button key={l} onClick={() => setActiveLang(l)}
                      style={{ padding:"4px 12px", borderRadius:20, border:activeLang===l ? "none":"1px solid #1a1a1a", cursor:"pointer", fontSize:11, fontWeight:700, background:activeLang===l ? "#3b82f6":"transparent", color:activeLang===l ? "#fff":"#333" }}>
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
                {ALL_LANGS.map(l => (
                  <div key={l} style={{ display:activeLang===l ? "flex":"none", flexDirection:"column", gap:8 }}>
                    <div>
                      <label style={{ ...lbl, textTransform:"none", letterSpacing:0, color:"#444" }}>Title ({LANG_LABELS[l]})</label>
                      <input value={transForm[l].title} onChange={e => setTransForm(f => ({...f, [l]:{...f[l], title:e.target.value}}))}
                        style={inp} placeholder={l==="en" ? "e.g. Featured Liveaboards" : l==="th" ? "เช่น Liveaboard แนะนำ" : ""} />
                    </div>
                    <div>
                      <label style={{ ...lbl, textTransform:"none", letterSpacing:0, color:"#444" }}>Subtitle ({LANG_LABELS[l]}) <span style={{ color:"#222", fontWeight:400 }}>— optional, ซ่อนถ้าว่าง</span></label>
                      <input value={transForm[l].subtitle} onChange={e => setTransForm(f => ({...f, [l]:{...f[l], subtitle:e.target.value}}))}
                        style={inp} placeholder={l==="en" ? "e.g. Carefully selected routes" : l==="th" ? "เช่น เส้นทางที่คัดสรรมาเป็นพิเศษ" : ""} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Layout */}
              <div>
                <label style={lbl}>การแสดงผล</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {LAYOUTS.map(l => {
                    const active = form.layout === l.value;
                    return (
                      <button key={l.value} onClick={() => setForm(f => ({...f, layout:l.value}))}
                        style={{ background:active ? "#0f172a":"#111", border:`2px solid ${active ? "#3b82f6":"#1a1a1a"}`, borderRadius:10, padding:"12px 10px", cursor:"pointer", textAlign:"left" }}>
                        <div style={{ marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", height:40 }}>{l.preview}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:active ? "#60a5fa":"#555", marginBottom:3 }}>{l.label}</div>
                        <div style={{ fontSize:10, color:active ? "#3b82f688":"#252525", lineHeight:1.4 }}>{l.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Item Picker ── */}
              <div>
                <label style={lbl}>เพิ่ม Items</label>

                {/* Step ①: Source */}
                <p style={stepLabel}>① เลือกแหล่งข้อมูล</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:14 }}>
                  {SOURCES.map(src => {
                    const active = pickerSource === src.value;
                    return (
                      <button key={src.value}
                        onClick={() => {
                          setPickerSource(src.value as SourceValue);
                          if (!rowItemType) setRowItemType(src.value);
                        }}
                        style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 10px", background:active ? "rgba(59,130,246,0.1)":"#111", border:`1px solid ${active ? "#3b82f6":"#1a1a1a"}`, borderRadius:8, cursor:"pointer", fontSize:12, color:active ? "#60a5fa":"#444", fontWeight:active ? 600:400 }}>
                        <span style={{ fontSize:14 }}>{src.icon}</span>
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{src.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Step ②: Boat / DiveCenter selector (non-BLOG, non-BOAT-level sources) */}
                {pickerSource && !isBlog && !isBoatLevel && (
                  <>
                    <p style={stepLabel}>② เลือก{currentSrc?.boatLabel || "เรือ"}</p>
                    {loadingBoats ? (
                      <div style={{ textAlign:"center", color:"#2a2a2a", padding:"14px 0", fontSize:13 }}>กำลังโหลด...</div>
                    ) : boats.length === 0 ? (
                      <div style={{ textAlign:"center", color:"#2a2a2a", padding:"14px 0", fontSize:13 }}>ไม่มีข้อมูล</div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:180, overflowY:"auto", marginBottom:14 }}>
                        {boats.map(boat => {
                          const active = pickerBoat === boat.id;
                          return (
                            <button key={boat.id} onClick={() => setPickerBoat(boat.id)}
                              style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:active ? "rgba(59,130,246,0.1)":"#111", border:`1px solid ${active ? "#3b82f6":"#1a1a1a"}`, borderRadius:8, cursor:"pointer", textAlign:"left" }}>
                              {boat.covers[0]
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={boat.covers[0]} alt="" style={{ width:40, height:28, objectFit:"cover", borderRadius:4, flexShrink:0 }} />
                                : <div style={{ width:40, height:28, background:"#161616", borderRadius:4, flexShrink:0, border:"1px solid #1a1a1a" }} />
                              }
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, color:active ? "#93c5fd":"#555", fontWeight:active ? 600:400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{boat.title || boat.name}</div>
                                <div style={{ fontSize:10, color:"#252525", marginTop:2 }}>{boat.name}</div>
                              </div>
                              {active && <span style={{ fontSize:10, color:"#3b82f6", flexShrink:0 }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Step ③ (or ② for BLOG/BOAT): Items list */}
                {pickerSource && (pickerBoat || isBlog || isBoatLevel) && (
                  <>
                    <p style={stepLabel}>
                      {isBlog || isBoatLevel ? "② " : "③ "}
                      เลือก {isBlog ? "Blog" : isBoatLevel ? "เรือ" : currentSrc?.itemRefType === "PACKAGE" ? "Package" : "Schedule"}
                      {selectedArr.length > 0 && <span style={{ color:"#3b82f6", marginLeft:6 }}>({selectedArr.length} เลือกแล้ว)</span>}
                    </p>
                    {loadingRef ? (
                      <div style={{ textAlign:"center", color:"#2a2a2a", padding:"20px 0", fontSize:13 }}>กำลังโหลด...</div>
                    ) : refItems.length === 0 ? (
                      <div style={{ textAlign:"center", color:"#2a2a2a", padding:"20px 0", fontSize:13 }}>ไม่มีข้อมูล</div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:260, overflowY:"auto", paddingRight:2 }}>
                        {refItems.map(item => {
                          const checked = selected.some(e => e.refId === item.id);
                          const badgeColor = item.badge ? (STATUS_COLOR[item.badge] ?? "#555") : undefined;
                          return (
                            <label key={item.id} onClick={() => toggleItem(item)}
                              style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, border:`1px solid ${checked ? "#3b82f644":"#1a1a1a"}`, background:checked ? "rgba(59,130,246,0.07)":"#0d0d0d", cursor:"pointer" }}>
                              <input type="checkbox" checked={checked} onChange={() => toggleItem(item)} style={{ accentColor:"#3b82f6", width:13, height:13, flexShrink:0 }} />
                              {item.cover
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={item.cover} alt="" style={{ width:44, height:32, objectFit:"cover", borderRadius:5, flexShrink:0 }} />
                                : <div style={{ width:44, height:32, background:"#161616", borderRadius:5, flexShrink:0, border:"1px solid #1a1a1a" }} />
                              }
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, color:checked ? "#ccc":"#555", fontWeight:checked ? 500:400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.label}</div>
                                {item.sub && <div style={{ fontSize:10, color:"#333", marginTop:2 }}>{item.sub}</div>}
                              </div>
                              {item.badge && badgeColor && <span style={{ fontSize:9, fontWeight:700, color:badgeColor, flexShrink:0 }}>{item.badge}</span>}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Selected items summary */}
              {selectedArr.length > 0 && (
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <label style={{ ...lbl, marginBottom:0 }}>รายการที่เลือก ({selectedArr.length})</label>
                    <button onClick={() => setSelected([])} style={{ background:"none", border:"1px solid #222", color:"#555", borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer" }}>ล้างทั้งหมด</button>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:200, overflowY:"auto" }}>
                    {selectedArr.map((entry, i) => {
                      const refTypeBadge = entry.refType === "BLOG" ? "📝" : entry.refType === "PACKAGE" ? "📦" : entry.refType === "BOAT" ? "🚢" : "📅";
                      const isFirst = i === 0;
                      const isLast  = i === selectedArr.length - 1;
                      return (
                        <div key={entry.refId} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 8px", background:"#0d0d0d", border:"1px solid #161616", borderRadius:7 }}>
                          {/* reorder buttons */}
                          <div style={{ display:"flex", flexDirection:"column", gap:2, flexShrink:0 }}>
                            <button onClick={() => moveSelectedUp(i)} disabled={isFirst}
                              style={{ background:"none", border:"1px solid #1a1a1a", color:isFirst ? "#1a1a1a":"#444", borderRadius:3, width:18, height:16, cursor:isFirst ? "default":"pointer", fontSize:8, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>▲</button>
                            <button onClick={() => moveSelectedDown(i)} disabled={isLast}
                              style={{ background:"none", border:"1px solid #1a1a1a", color:isLast ? "#1a1a1a":"#444", borderRadius:3, width:18, height:16, cursor:isLast ? "default":"pointer", fontSize:8, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>▼</button>
                          </div>
                          <span style={{ fontSize:11, color:"#2a2a2a", fontWeight:700, minWidth:14, textAlign:"center" }}>{i+1}</span>
                          <span style={{ fontSize:12 }}>{refTypeBadge}</span>
                          {entry.item.cover
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={entry.item.cover} alt="" style={{ width:32, height:24, objectFit:"cover", borderRadius:3, flexShrink:0 }} />
                            : null
                          }
                          <span style={{ flex:1, fontSize:12, color:"#666", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.item.label}</span>
                          {entry.item.sub && <span style={{ fontSize:10, color:"#2a2a2a", flexShrink:0 }}>{entry.item.sub}</span>}
                          <button onClick={() => removeSelected(entry.refId)} style={{ background:"none", border:"none", color:"#333", cursor:"pointer", fontSize:14, lineHeight:1, padding:"0 2px", flexShrink:0 }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Max Items */}
              <div>
                <label style={lbl}>จำนวน Items สูงสุดที่แสดง</label>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="number" min="1" max="50" value={maxItems}
                    onChange={e => setMaxItems(e.target.value)}
                    style={{ ...inp, width:100 }} placeholder="ทั้งหมด" />
                  <span style={{ fontSize:12, color:"#333" }}>ปล่อยว่าง = แสดงทุก item</span>
                </div>
              </div>

              {/* Auto Latest — only meaningful for BLOG rows */}
              {(rowItemType === "BLOG" || pickerSource === "BLOG") && (
                <div>
                  <label style={lbl}>โหมด Blog</label>
                  <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                    <input type="checkbox" checked={autoLatest} onChange={e => setAutoLatest(e.target.checked)} style={{ accentColor:"#3b82f6", width:15, height:15 }} />
                    <span style={{ fontSize:13, color: autoLatest ? "#3b82f6" : "#555" }}>
                      ดึง blog ล่าสุดอัตโนมัติ {autoLatest && `(${maxItems || "20"} ตัวล่าสุด ที่ PUBLISHED)`}
                    </span>
                  </label>
                  {autoLatest && (
                    <p style={{ fontSize:11, color:"#444", marginTop:6, lineHeight:1.4 }}>
                      ⚡ จะ ignore รายการ blog ที่เลือกด้านบน — ใช้ blog ล่าสุดที่ publish เสมอ. ปล่อย maxItems ว่างจะใช้ default 20 ตัว
                    </p>
                  )}
                </div>
              )}

              {/* Active */}
              <div>
                <label style={lbl}>สถานะ</label>
                <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active:e.target.checked}))} style={{ accentColor:"#3b82f6", width:15, height:15 }} />
                  <span style={{ fontSize:13, color:form.active ? "#4ade80":"#555" }}>{form.active ? "แสดงผล":"ซ่อน"}</span>
                </label>
              </div>
            </div>

            <div style={{ padding:"16px 22px", borderTop:"1px solid #111", display:"flex", gap:10, flexShrink:0 }}>
              <button onClick={handleSave} disabled={saving || !form.topic.trim()}
                style={{ flex:1, background:"#3b82f6", border:"none", color:"#fff", borderRadius:8, padding:"12px", fontSize:14, fontWeight:600, cursor:(saving || !form.topic.trim()) ? "not-allowed":"pointer", opacity:(saving || !form.topic.trim()) ? 0.5:1 }}>
                {saving ? "กำลังบันทึก..." : editId ? "บันทึกการแก้ไข" : "เพิ่ม Row"}
              </button>
              <button onClick={close} style={{ background:"#111", border:"1px solid #222", color:"#555", borderRadius:8, padding:"12px 20px", fontSize:14, cursor:"pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
