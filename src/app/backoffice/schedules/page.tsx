"use client";

import { useState, useEffect, useCallback } from "react";

type BoatOption = {
  id: string; name: string; type: string; companyId: string | null;
  translations: { lang: string; title: string }[];
  company: { translations: { lang: string; name: string }[] } | null;
};

type CompanyOption = {
  id: string;
  translations: { lang: string; name: string }[];
};

type ScheduleRow = {
  id: string; boatId: string; departureDate: string; returnDate: string | null;
  totalSeats: number | null; availableSeats: number | null; status: string; season: string | null; note: string | null; itinerary: string;
  boat: { id: string; name: string; translations: { lang: string; title: string }[]; company: { translations: { lang: string; name: string }[] } };
};

const STATUS_OPTS = ["OPEN", "FULL", "CANCELLED", "COMPLETED"] as const;
type ScheduleStatus = typeof STATUS_OPTS[number];

const STATUS_STYLE: Record<ScheduleStatus, { bg: string; color: string }> = {
  OPEN: { bg: "#14532d", color: "#4ade80" },
  FULL: { bg: "#78350f", color: "#fbbf24" },
  CANCELLED: { bg: "#2a1010", color: "#f87171" },
  COMPLETED: { bg: "#1a1a2e", color: "#818cf8" },
};

const emptyForm = () => ({
  companyId: "", boatId: "", departureDate: "", returnDate: "", totalSeats: "", availableSeats: "",
  status: "OPEN" as ScheduleStatus, note: "", itinerary: "",
});
type ScheduleForm = ReturnType<typeof emptyForm>;

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [boats, setBoats] = useState<BoatOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [boatFilter, setBoatFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [sc, bo, co] = await Promise.all([
      fetch("/api/schedules").then(r => r.json()).catch(() => []),
      fetch("/api/boats").then(r => r.json()).catch(() => []),
      fetch("/api/companies").then(r => r.json()).catch(() => []),
    ]);
    setSchedules(Array.isArray(sc) ? sc : []);
    setBoats(Array.isArray(bo) ? bo : []);
    setCompanies(Array.isArray(co) ? co : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(emptyForm()); setEditId(null); setPanelOpen(true); };
  const openEdit = (s: ScheduleRow) => {
    const boat = boats.find(b => b.id === s.boatId);
    setForm({
      companyId: boat?.companyId ?? "",
      boatId: s.boatId,
      departureDate: s.departureDate ? s.departureDate.slice(0, 10) : "",
      returnDate: s.returnDate ? s.returnDate.slice(0, 10) : "",
      totalSeats: s.totalSeats?.toString() ?? "",
      availableSeats: s.availableSeats?.toString() ?? "",
      status: s.status as ScheduleStatus,
      note: s.note ?? "",
      itinerary: s.itinerary ?? "",
    });
    setEditId(s.id); setPanelOpen(true);
  };
  const close = () => { setPanelOpen(false); setEditId(null); };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      boatId: form.boatId,
      departureDate: form.departureDate,
      returnDate: form.returnDate || null,
      totalSeats: form.totalSeats ? Number(form.totalSeats) : null,
      availableSeats: form.availableSeats ? Number(form.availableSeats) : null,
      status: form.status,
      note: form.note || null,
      itinerary: form.itinerary,
    };
    const url = editId ? `/api/schedules/${editId}` : "/api/schedules";
    await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false); close(); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบรอบนี้?")) return;
    await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    load();
  };

  const boatLabel = (b: BoatOption) => {
    const co = b.company?.translations?.find(x => x.lang === "en")?.name ?? b.company?.translations?.[0]?.name ?? "";
    const title = b.translations?.find(x => x.lang === "en")?.title;
    return `${co ? co + " · " : ""}${b.name}${title ? " — " + title : ""}`;
  };

  const companyLabel = (c: CompanyOption) =>
    c.translations?.find(x => x.lang === "en")?.name ?? c.translations?.[0]?.name ?? c.id;

  const formBoatOptions = form.companyId
    ? boats.filter(b => b.companyId === form.companyId)
    : boats;

  const filtered = schedules.filter(s => {
    if (boatFilter !== "ALL" && s.boatId !== boatFilter) return false;
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    return true;
  });

  const grouped: Record<string, ScheduleRow[]> = {};
  for (const s of filtered) {
    if (!s.departureDate) continue;
    const key = s.departureDate.slice(0, 7);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const months = Object.keys(grouped).sort();

  const formatDate = (d: string) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  const monthLabel = (ym: string) => {
    const [y, m] = ym.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  };

  const inp: React.CSSProperties = { width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { fontSize: 11, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e5e5e5", margin: 0 }}>📅 ตารางออกเดินทาง</h1>
          <p style={{ fontSize: 13, color: "#333", margin: "4px 0 0" }}>{schedules.length} รอบทั้งหมด</p>
        </div>
        <button onClick={openNew} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ เพิ่มรอบ</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        <select value={boatFilter} onChange={e => setBoatFilter(e.target.value)} style={{ ...inp, width: "auto", minWidth: 240 }}>
          <option value="ALL">ทุกเรือ</option>
          {boats.map(b => <option key={b.id} value={b.id}>{boatLabel(b)}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6 }}>
          {["ALL", ...STATUS_OPTS].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: "6px 14px", borderRadius: 20, border: statusFilter === s ? "none" : "1px solid #222", cursor: "pointer", fontSize: 11, fontWeight: 700, background: statusFilter === s ? "#3b82f6" : "transparent", color: statusFilter === s ? "#fff" : "#333" }}>
              {s === "ALL" ? "ทั้งหมด" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule list grouped by month */}
      {months.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", color: "#2a2a2a", fontSize: 14 }}>ยังไม่มีรอบออกเดินทาง</div>
      )}
      {months.map(month => (
        <div key={month} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #111" }}>
            {monthLabel(month)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {grouped[month].map(s => {
              const st = STATUS_STYLE[s.status as ScheduleStatus] ?? STATUS_STYLE.OPEN;
              const boatTitle = s.boat?.translations?.find(x => x.lang === "en")?.title ?? s.boat?.name ?? s.boatId;
              const companyName = s.boat?.company?.translations?.find(x => x.lang === "en")?.name ?? s.boat?.company?.translations?.[0]?.name ?? "";
              return (
                <div key={s.id} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ minWidth: 80, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#e5e5e5", lineHeight: 1 }}>{new Date(s.departureDate).getDate()}</div>
                    <div style={{ fontSize: 10, color: "#333", textTransform: "uppercase" }}>{new Date(s.departureDate).toLocaleDateString("en", { month: "short", year: "2-digit" })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {boatTitle}
                    </div>
                    <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
                      {companyName && <span>{companyName} · </span>}
                      {s.boat?.name && s.boat.name !== boatTitle && <span>{s.boat.name} · </span>}
                      {s.returnDate && <span>กลับ {formatDate(s.returnDate)} · </span>}
                      {s.totalSeats && <span>ที่นั่ง {s.availableSeats ?? s.totalSeats}/{s.totalSeats}</span>}
                    </div>
                    {s.note && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{s.note}</div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 10, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>{s.status}</span>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openEdit(s)} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}>แก้ไข</button>
                    <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "1px solid #2a1010", color: "#4a2020", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}>ลบ</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Panel */}
      {panelOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={close} style={{ flex: 1, background: "rgba(0,0,0,.6)" }} />
          <div style={{ width: 480, maxWidth: "100vw", background: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", height: "100vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#e5e5e5" }}>{editId ? "แก้ไขรอบ" : "เพิ่มรอบใหม่"}</h2>
              <button onClick={close} style={{ background: "none", border: "none", color: "#333", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", paddingBottom: 80, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lbl}>บริษัท</label>
                <select
                  value={form.companyId}
                  onChange={e => {
                    const nextCompanyId = e.target.value;
                    setForm(f => {
                      const stillValid = !nextCompanyId || boats.find(b => b.id === f.boatId)?.companyId === nextCompanyId;
                      return { ...f, companyId: nextCompanyId, boatId: stillValid ? f.boatId : "" };
                    });
                  }}
                  style={inp}
                >
                  <option value="">— ทุกบริษัท —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{companyLabel(c)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>เรือ</label>
                <select value={form.boatId} onChange={e => setForm(f => ({ ...f, boatId: e.target.value }))} style={inp}>
                  <option value="">— เลือกเรือ —</option>
                  {formBoatOptions.map(b => <option key={b.id} value={b.id}>{boatLabel(b)}</option>)}
                </select>
                {form.companyId && formBoatOptions.length === 0 && (
                  <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>บริษัทนี้ยังไม่มีเรือ — เพิ่มเรือที่หน้า Fleet ก่อน</div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>วันออกเดินทาง *</label>
                  <input type="date" value={form.departureDate} onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>วันกลับ</label>
                  <input type="date" value={form.returnDate} onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>ที่นั่งทั้งหมด</label>
                  <input type="number" value={form.totalSeats} onChange={e => setForm(f => ({ ...f, totalSeats: e.target.value }))} placeholder="เช่น 30" style={inp} />
                </div>
                <div>
                  <label style={lbl}>ที่นั่งว่าง</label>
                  <input type="number" value={form.availableSeats} onChange={e => setForm(f => ({ ...f, availableSeats: e.target.value }))} placeholder="เช่น 30" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>สถานะ</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {STATUS_OPTS.map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      style={{ padding: "7px 16px", borderRadius: 20, border: form.status === s ? "none" : "1px solid #222", cursor: "pointer", fontSize: 12, fontWeight: 700, background: form.status === s ? STATUS_STYLE[s].bg : "transparent", color: form.status === s ? STATUS_STYLE[s].color : "#333" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>หมายเหตุ</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} />
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #1a1a1a", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={close} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
