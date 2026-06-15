"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
type Installment = {
  id: string;
  seq: number;
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  status: string; // PAID | PENDING
  proofUrl: string | null;
  receiptUrl: string | null;
  note: string | null;
};
type Finance = {
  paidAmount: number;
  total: number;
  remaining: number;
  overdueCount: number;
  nextDueDate: string | null;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID_FULL";
  board: "UNPAID" | "PARTIAL" | "PAID_FULL" | "OVERDUE";
};
type Booker = {
  id: string;
  order: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  note: string | null;
  totalAmount: number;
  installments: Installment[];
  finance: Finance;
};
type TripDetail = {
  id: string;
  name: string;
  coverUrl: string | null;
  photos: string[];
  brochureUrl: string | null;
  note: string | null;
  status: string;
  bookers: Booker[];
};

// ── Constants ─────────────────────────────────────────────────────────────────
const BOOKER_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  TENTATIVE: { label: "จองชั่วคราว", bg: "#3a2a0a", color: "#fbbf24" },
  CONFIRMED: { label: "ยืนยันแล้ว", bg: "#0a2540", color: "#60a5fa" },
  TRAVELED: { label: "เดินทางแล้ว", bg: "#14532d", color: "#4ade80" },
  CANCELLED: { label: "ยกเลิก", bg: "#2a1010", color: "#f87171" },
};
const PAY_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  UNPAID: { label: "ยังไม่ชำระ", bg: "#1a1a1a", color: "#888" },
  PARTIAL: { label: "ชำระบางส่วน", bg: "#0a2540", color: "#60a5fa" },
  PAID_FULL: { label: "ชำระครบ", bg: "#14532d", color: "#4ade80" },
  OVERDUE: { label: "เกินกำหนด", bg: "#3a1010", color: "#f87171" },
};
const BOARD_COLS: { key: Finance["board"]; label: string }[] = [
  { key: "UNPAID", label: "ยังไม่ชำระ" },
  { key: "PARTIAL", label: "ชำระบางส่วน" },
  { key: "OVERDUE", label: "เกินกำหนด" },
  { key: "PAID_FULL", label: "ชำระครบ" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtBaht(n: number) {
  return "฿" + Math.round(n).toLocaleString("en-US");
}
function fmtDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function toDateInput(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}
function isOverdue(inst: Installment) {
  return inst.status !== "PAID" && inst.dueDate && new Date(inst.dueDate) < new Date();
}
async function uploadFile(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) return null;
  const data = await res.json();
  return data.url as string;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BookingTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "board">("table");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingBooker, setAddingBooker] = useState(false);
  const [newBooker, setNewBooker] = useState({ name: "", email: "", phone: "" });
  const [editInfo, setEditInfo] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      if (res.ok) setTrip(await res.json());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patchTrip = async (data: Partial<TripDetail>) => {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  };

  const addBooker = async () => {
    const name = newBooker.name.trim();
    if (!name) return;
    await fetch(`/api/bookings/${id}/bookers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBooker),
    });
    setNewBooker({ name: "", email: "", phone: "" });
    setAddingBooker(false);
    load();
  };

  const deleteTrip = async () => {
    if (!confirm("ลบทริปนี้และข้อมูลผู้จองทั้งหมด?")) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    window.location.href = "/backoffice/bookings";
  };

  const selected = trip?.bookers.find((b) => b.id === selectedId) || null;

  // Trip totals
  const totals = (trip?.bookers || [])
    .filter((b) => b.status !== "CANCELLED")
    .reduce(
      (acc, b) => {
        acc.expected += b.finance.total;
        acc.paid += b.finance.paidAmount;
        acc.overdue += b.finance.overdueCount;
        return acc;
      },
      { expected: 0, paid: 0, overdue: 0 }
    );
  const pct = totals.expected > 0 ? Math.min(100, Math.round((totals.paid / totals.expected) * 100)) : 0;

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#555" }}>กำลังโหลด...</div>;
  if (!trip) return <div style={{ padding: 60, textAlign: "center", color: "#555" }}>ไม่พบทริป</div>;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <Link href="/backoffice/bookings" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}>← รายการจอง</Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 10, marginBottom: 18, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e5e5e5", margin: 0 }}>{trip.name}</h1>
          <p style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
            {trip.bookers.length} ผู้จอง {trip.status === "ARCHIVED" && "· เก็บถาวร"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setEditInfo((v) => !v)} style={btnGhost}>
            {editInfo ? "ปิดแก้ไข" : "แก้ไขข้อมูลทริป"}
          </button>
          <button onClick={() => patchTrip({ status: trip.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" })} style={btnGhost}>
            {trip.status === "ACTIVE" ? "เก็บถาวร" : "นำกลับ"}
          </button>
          <button onClick={deleteTrip} style={{ ...btnGhost, borderColor: "#7f1d1d", color: "#ef4444" }}>ลบ</button>
        </div>
      </div>

      {/* Information */}
      <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {/* Cover */}
          <div style={{ width: 220 }}>
            <p style={pLabel}>Cover</p>
            <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#111", borderRadius: 8, overflow: "hidden", border: "1px solid #1a1a1a" }}>
              {trip.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={trip.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#222", fontSize: 28 }}>🖼</div>
              )}
            </div>
            {editInfo && (
              <FileButton label="เปลี่ยน Cover" accept="image/*" onPick={async (f) => { const u = await uploadFile(f); if (u) patchTrip({ coverUrl: u }); }} />
            )}
          </div>

          {/* Brochure + note */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={pLabel}>โบรชัวร์</p>
            {trip.brochureUrl ? (
              <a href={trip.brochureUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#60a5fa", textDecoration: "none" }}>📄 เปิดโบรชัวร์</a>
            ) : (
              <p style={{ fontSize: 13, color: "#444" }}>ยังไม่มี</p>
            )}
            {editInfo && (
              <FileButton label="อัปโหลดโบรชัวร์" accept="application/pdf,image/*" onPick={async (f) => { const u = await uploadFile(f); if (u) patchTrip({ brochureUrl: u }); }} />
            )}

            <p style={{ ...pLabel, marginTop: 14 }}>หมายเหตุ</p>
            {editInfo ? (
              <textarea
                defaultValue={trip.note || ""}
                onBlur={(e) => patchTrip({ note: e.target.value })}
                placeholder="รายละเอียดทริป..."
                style={{ ...inputStyle, width: "100%", minHeight: 56, resize: "vertical" }}
              />
            ) : (
              <p style={{ fontSize: 13, color: "#ccc", whiteSpace: "pre-wrap" }}>{trip.note || "-"}</p>
            )}
          </div>
        </div>

        {/* Photos gallery */}
        <p style={{ ...pLabel, marginTop: 16 }}>Photo</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {trip.photos.map((url) => (
            <div key={url} style={{ position: "relative", width: 90, height: 60, borderRadius: 6, overflow: "hidden", border: "1px solid #1a1a1a" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {editInfo && (
                <button
                  onClick={() => patchTrip({ photos: trip.photos.filter((p) => p !== url) })}
                  style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 9, border: "none", background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: 1 }}
                >✕</button>
              )}
            </div>
          ))}
          {editInfo && (
            <FileButton compact label="+ รูป" accept="image/*" onPick={async (f) => { const u = await uploadFile(f); if (u) patchTrip({ photos: [...trip.photos, u] }); }} />
          )}
          {trip.photos.length === 0 && !editInfo && <p style={{ fontSize: 13, color: "#444" }}>-</p>}
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <StatBox label="เก็บได้ / ยอดรวม" value={`${fmtBaht(totals.paid)} / ${fmtBaht(totals.expected)}`} sub={`${pct}%`} />
        <StatBox label="คงเหลือ" value={fmtBaht(Math.max(0, totals.expected - totals.paid))} />
        <StatBox label="งวดเกินกำหนด" value={String(totals.overdue)} danger={totals.overdue > 0} />
      </div>

      {/* Toolbar: view toggle + add */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, overflow: "hidden" }}>
          {(["table", "board"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "8px 16px", background: view === v ? "#1e40af" : "transparent",
              border: "none", color: view === v ? "#fff" : "#888", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              {v === "table" ? "ตาราง" : "บอร์ด"}
            </button>
          ))}
        </div>
        <button onClick={() => setAddingBooker(true)} style={{
          padding: "9px 16px", borderRadius: 8, border: "none",
          background: "#1e40af", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>+ เพิ่มผู้จอง</button>
      </div>

      {/* Add booker inline */}
      {addingBooker && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, padding: 12, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, flexWrap: "wrap" }}>
          <input autoFocus placeholder="ชื่อผู้จอง" value={newBooker.name} onChange={(e) => setNewBooker({ ...newBooker, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") addBooker(); }} style={{ ...inputStyle, flex: 2, minWidth: 160 }} />
          <input placeholder="อีเมล" value={newBooker.email} onChange={(e) => setNewBooker({ ...newBooker, email: e.target.value })} style={{ ...inputStyle, flex: 2, minWidth: 140 }} />
          <input placeholder="เบอร์โทร" value={newBooker.phone} onChange={(e) => setNewBooker({ ...newBooker, phone: e.target.value })} style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
          <button onClick={addBooker} disabled={!newBooker.name.trim()} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: newBooker.name.trim() ? "#1e40af" : "#1e3a5f", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>เพิ่ม</button>
          <button onClick={() => { setAddingBooker(false); setNewBooker({ name: "", email: "", phone: "" }); }} style={btnGhost}>ยกเลิก</button>
        </div>
      )}

      {/* Roster */}
      {trip.bookers.length === 0 ? (
        <div style={{ padding: 50, textAlign: "center", color: "#555" }}>ยังไม่มีผู้จอง</div>
      ) : view === "table" ? (
        <RosterTable bookers={trip.bookers} onOpen={setSelectedId} />
      ) : (
        <RosterBoard bookers={trip.bookers} onOpen={setSelectedId} />
      )}

      {/* Booker drawer */}
      {selected && (
        <BookerDrawer
          booker={selected}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

// ── Roster Table ──────────────────────────────────────────────────────────────
function RosterTable({ bookers, onOpen }: { bookers: Booker[]; onOpen: (id: string) => void }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
            {["#", "ชื่อ", "ติดต่อ", "สถานะ", "การชำระ", "ยอดรวม", "ชำระแล้ว", "คงเหลือ", "งวดถัดไป"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#555", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookers.map((b) => {
            const bs = BOOKER_STATUS[b.status] || BOOKER_STATUS.TENTATIVE;
            const ps = PAY_LABEL[b.finance.board];
            const overdue = b.finance.overdueCount > 0 && b.status !== "CANCELLED";
            return (
              <tr key={b.id} onClick={() => onOpen(b.id)}
                style={{ borderBottom: "1px solid #111", cursor: "pointer", background: overdue ? "rgba(127,29,29,0.08)" : "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#0d0d0d")}
                onMouseLeave={(e) => (e.currentTarget.style.background = overdue ? "rgba(127,29,29,0.08)" : "transparent")}
              >
                <td style={{ padding: "10px 12px", color: "#555" }}>{b.order}</td>
                <td style={{ padding: "10px 12px", color: "#e5e5e5", fontWeight: 600 }}>{b.name}</td>
                <td style={{ padding: "10px 12px", color: "#999", fontSize: 12 }}>
                  {b.email && <div>{b.email}</div>}
                  {b.phone && <div style={{ color: "#666" }}>{b.phone}</div>}
                  {!b.email && !b.phone && "-"}
                </td>
                <td style={{ padding: "10px 12px" }}><Chip {...bs} /></td>
                <td style={{ padding: "10px 12px" }}><Chip {...ps} /></td>
                <td style={{ padding: "10px 12px", color: "#ccc", whiteSpace: "nowrap" }}>{fmtBaht(b.finance.total)}</td>
                <td style={{ padding: "10px 12px", color: "#4ade80", whiteSpace: "nowrap" }}>{fmtBaht(b.finance.paidAmount)}</td>
                <td style={{ padding: "10px 12px", color: b.finance.remaining > 0 ? "#fbbf24" : "#555", whiteSpace: "nowrap" }}>{fmtBaht(b.finance.remaining)}</td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: b.finance.overdueCount > 0 ? "#f87171" : "#888", fontSize: 12 }}>
                  {fmtDate(b.finance.nextDueDate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Roster Board (Kanban) ─────────────────────────────────────────────────────
function RosterBoard({ bookers, onOpen }: { bookers: Booker[]; onOpen: (id: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, minWidth: 720, overflowX: "auto" }}>
      {BOARD_COLS.map((col) => {
        const items = bookers.filter((b) => b.status !== "CANCELLED" && b.finance.board === col.key);
        const meta = PAY_LABEL[col.key];
        return (
          <div key={col.key} style={{ background: "#0b0b0b", border: "1px solid #1a1a1a", borderRadius: 10, padding: 10, minHeight: 120 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: meta.color }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#ccc" }}>{col.label}</span>
              <span style={{ fontSize: 11, color: "#555", marginLeft: "auto" }}>{items.length}</span>
            </div>
            {items.map((b) => (
              <div key={b.id} onClick={() => onOpen(b.id)} style={{
                background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: 10, marginBottom: 8, cursor: "pointer",
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#e5e5e5", margin: 0, marginBottom: 4 }}>{b.name}</p>
                <p style={{ fontSize: 12, color: "#fbbf24", margin: 0 }}>คงเหลือ {fmtBaht(b.finance.remaining)}</p>
                {b.finance.nextDueDate && (
                  <p style={{ fontSize: 11, color: col.key === "OVERDUE" ? "#f87171" : "#666", margin: "4px 0 0" }}>กำหนด {fmtDate(b.finance.nextDueDate)}</p>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Booker Drawer ─────────────────────────────────────────────────────────────
function BookerDrawer({ booker, onClose, onChanged }: { booker: Booker; onClose: () => void; onChanged: () => void }) {
  const patchBooker = async (data: Record<string, unknown>) => {
    await fetch(`/api/bookings/bookers/${booker.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    onChanged();
  };
  const deleteBooker = async () => {
    if (!confirm(`ลบผู้จอง "${booker.name}"?`)) return;
    await fetch(`/api/bookings/bookers/${booker.id}`, { method: "DELETE" });
    onClose();
    onChanged();
  };
  const addInstallment = async () => {
    await fetch(`/api/bookings/bookers/${booker.id}/installments`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 0 }),
    });
    onChanged();
  };
  const patchInst = async (instId: string, data: Record<string, unknown>) => {
    await fetch(`/api/bookings/installments/${instId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    onChanged();
  };
  const deleteInst = async (instId: string) => {
    await fetch(`/api/bookings/installments/${instId}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 101,
        width: "min(560px, 95vw)", background: "#0d0d0d", borderLeft: "1px solid #1a1a1a", overflowY: "auto",
        animation: "slideIn 0.2s ease-out",
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ position: "sticky", top: 0, background: "#0d0d0d", zIndex: 1, padding: "16px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5", margin: 0 }}>ผู้จอง #{booker.order}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={deleteBooker} style={{ ...btnGhost, borderColor: "#7f1d1d", color: "#ef4444", padding: "4px 12px", fontSize: 11 }}>ลบ</button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer", padding: 4 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Contact */}
          <p style={pLabel}>ข้อมูลผู้จอง</p>
          <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
            <Field label="ชื่อ" defaultValue={booker.name} onSave={(v) => patchBooker({ name: v })} />
            <Field label="อีเมล" defaultValue={booker.email || ""} onSave={(v) => patchBooker({ email: v })} />
            <Field label="เบอร์โทร" defaultValue={booker.phone || ""} onSave={(v) => patchBooker({ phone: v })} />
            <div>
              <p style={pLabelSm}>สถานะการจอง</p>
              <select defaultValue={booker.status} onChange={(e) => patchBooker({ status: e.target.value })} style={{ ...inputStyle, width: "100%" }}>
                {Object.entries(BOOKER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <Field label="ยอดทั้งหมด (บาท)" type="number" defaultValue={String(booker.totalAmount || "")} onSave={(v) => patchBooker({ totalAmount: Number(v) || 0 })} />
            <Field label="อื่นๆ" defaultValue={booker.note || ""} onSave={(v) => patchBooker({ note: v })} />
          </div>

          {/* Finance summary */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <MiniStat label="ชำระแล้ว" value={fmtBaht(booker.finance.paidAmount)} color="#4ade80" />
            <MiniStat label="คงเหลือ" value={fmtBaht(booker.finance.remaining)} color={booker.finance.remaining > 0 ? "#fbbf24" : "#555"} />
            <MiniStat label="สถานะ" value={PAY_LABEL[booker.finance.board].label} color={PAY_LABEL[booker.finance.board].color} />
          </div>

          {/* Installments */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ ...pLabel, margin: 0 }}>การชำระเงิน (งวด)</p>
            <button onClick={addInstallment} style={{ ...btnGhost, padding: "5px 12px", fontSize: 11 }}>+ เพิ่มงวด</button>
          </div>

          {booker.installments.length === 0 ? (
            <p style={{ fontSize: 12, color: "#444", padding: "12px 0" }}>ยังไม่มีงวดการชำระ</p>
          ) : (
            booker.installments.map((inst) => {
              const overdue = isOverdue(inst);
              const paid = inst.status === "PAID";
              return (
                <div key={inst.id} style={{
                  background: "#111", border: `1px solid ${overdue ? "#7f1d1d" : "#1a1a1a"}`, borderRadius: 10, padding: 12, marginBottom: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5" }}>งวดที่ {inst.seq}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        onClick={() => patchInst(inst.id, { status: paid ? "PENDING" : "PAID" })}
                        style={{
                          padding: "4px 12px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                          background: paid ? "#14532d" : "#1e40af", color: paid ? "#4ade80" : "#fff",
                        }}
                      >{paid ? "✓ ชำระแล้ว" : "ทำเครื่องหมายว่าชำระ"}</button>
                      <button onClick={() => deleteInst(inst.id)} style={{ background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer" }}>🗑</button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div>
                      <p style={pLabelSm}>ยอด (บาท)</p>
                      <input type="number" defaultValue={inst.amount || ""} onBlur={(e) => patchInst(inst.id, { amount: Number(e.target.value) || 0 })} style={{ ...inputStyle, width: "100%" }} />
                    </div>
                    <div>
                      <p style={pLabelSm}>กำหนดชำระ</p>
                      <input type="date" defaultValue={toDateInput(inst.dueDate)} onChange={(e) => patchInst(inst.id, { dueDate: e.target.value || null })} style={{ ...inputStyle, width: "100%" }} />
                    </div>
                  </div>
                  {overdue && <p style={{ fontSize: 11, color: "#f87171", marginBottom: 8 }}>⚠️ เกินกำหนดชำระ</p>}
                  {paid && inst.paidAt && <p style={{ fontSize: 11, color: "#4ade80", marginBottom: 8 }}>ชำระเมื่อ {fmtDate(inst.paidAt)}</p>}

                  {/* Files */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <DocSlot
                      label="สลิป/หลักฐาน"
                      url={inst.proofUrl}
                      onUpload={async (f) => { const u = await uploadFile(f); if (u) patchInst(inst.id, { proofUrl: u }); }}
                      onRemove={() => patchInst(inst.id, { proofUrl: null })}
                    />
                    <DocSlot
                      label="ใบเสร็จ"
                      url={inst.receiptUrl}
                      onUpload={async (f) => { const u = await uploadFile(f); if (u) patchInst(inst.id, { receiptUrl: u }); }}
                      onRemove={() => patchInst(inst.id, { receiptUrl: null })}
                    />
                  </div>
                </div>
              );
            })
          )}
          <div style={{ height: 40 }} />
        </div>
      </div>
    </>
  );
}

// ── Small components ──────────────────────────────────────────────────────────
function Chip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: bg, color, whiteSpace: "nowrap" }}>{label}</span>;
}
function StatBox({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 160, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: "12px 14px" }}>
      <p style={{ fontSize: 11, color: "#555", margin: 0, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 17, fontWeight: 700, color: danger ? "#f87171" : "#e5e5e5", margin: 0 }}>
        {value}{sub && <span style={{ fontSize: 12, color: "#60a5fa", marginLeft: 6 }}>{sub}</span>}
      </p>
    </div>
  );
}
function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "8px 10px" }}>
      <p style={{ fontSize: 10, color: "#555", margin: 0, marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color, margin: 0 }}>{value}</p>
    </div>
  );
}
function Field({ label, defaultValue, onSave, type = "text" }: { label: string; defaultValue: string; onSave: (v: string) => void; type?: string }) {
  return (
    <div>
      <p style={pLabelSm}>{label}</p>
      <input
        type={type}
        defaultValue={defaultValue}
        onBlur={(e) => { if (e.target.value !== defaultValue) onSave(e.target.value); }}
        style={{ ...inputStyle, width: "100%" }}
      />
    </div>
  );
}
function FileButton({ label, accept, onPick, compact }: { label: string; accept: string; onPick: (f: File) => void; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <label style={{
      display: compact ? "flex" : "inline-flex", alignItems: "center", justifyContent: "center",
      ...(compact ? { width: 90, height: 60 } : { marginTop: 8, padding: "6px 12px" }),
      borderRadius: 6, border: "1px dashed #333", color: "#888", fontSize: 12, cursor: "pointer",
    }}>
      {busy ? "..." : label}
      <input type="file" accept={accept} style={{ display: "none" }} onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        setBusy(true); await onPick(f); setBusy(false); e.target.value = "";
      }} />
    </label>
  );
}
function DocSlot({ label, url, onUpload, onRemove }: { label: string; url: string | null; onUpload: (f: File) => Promise<void>; onRemove: () => void }) {
  const [busy, setBusy] = useState(false);
  const isPdf = url?.toLowerCase().endsWith(".pdf");
  return (
    <div style={{ flex: 1 }}>
      <p style={pLabelSm}>{label}</p>
      {url ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <a href={url} target="_blank" rel="noreferrer" style={{ flex: 1, display: "block", textDecoration: "none" }}>
            {isPdf ? (
              <div style={{ height: 48, borderRadius: 6, border: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontSize: 12 }}>📄 ดู PDF</div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" style={{ width: "100%", height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #1a1a1a" }} />
            )}
          </a>
          <button onClick={onRemove} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" }}>✕</button>
        </div>
      ) : (
        <label style={{ display: "flex", height: 48, alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px dashed #333", color: "#666", fontSize: 11, cursor: "pointer" }}>
          {busy ? "..." : "+ แนบไฟล์"}
          <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            setBusy(true); await onUpload(f); setBusy(false); e.target.value = "";
          }} />
        </label>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 7, background: "#111", border: "1px solid #262626",
  color: "#e5e5e5", fontSize: 13, fontFamily: "inherit", outline: "none",
};
const btnGhost: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 8, border: "1px solid #262626",
  background: "transparent", color: "#aaa", fontSize: 12, fontWeight: 600, cursor: "pointer",
};
const pLabel: React.CSSProperties = { fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 };
const pLabelSm: React.CSSProperties = { fontSize: 11, color: "#666", marginBottom: 4 };
