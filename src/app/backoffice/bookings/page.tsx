"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type TripRow = {
  id: string;
  name: string;
  coverUrl: string | null;
  status: string;
  bookerCount: number;
  totalExpected: number;
  totalPaid: number;
  remaining: number;
  overdueCount: number;
  createdAt: string;
  updatedAt: string;
};

function fmtBaht(n: number) {
  return "฿" + Math.round(n).toLocaleString("en-US");
}

export default function BookingsPage() {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showArchived) params.set("archived", "1");
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [showArchived, query]);

  useEffect(() => { load(); }, [load]);

  const createTrip = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setNewName("");
        setCreating(false);
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e5e5e5", margin: 0 }}>รายการจอง</h1>
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{trips.length} ทริป</p>
        </div>
        <button onClick={() => setCreating(true)} style={{
          padding: "10px 18px", borderRadius: 8, border: "none",
          background: "#1e40af", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          + เพิ่มทริป
        </button>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อทริป..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8,
            background: "#0d0d0d", border: "1px solid #1a1a1a",
            color: "#e5e5e5", fontSize: 13, fontFamily: "inherit", outline: "none",
          }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888", cursor: "pointer", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          แสดงที่เก็บถาวร
        </label>
      </div>

      {/* Create inline form */}
      {creating && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, padding: 14, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10 }}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createTrip(); if (e.key === "Escape") setCreating(false); }}
            placeholder="ชื่อทริป เช่น สิมิลัน 4 วัน 3 คืน (พ.ค. 69)"
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8,
              background: "#111", border: "1px solid #262626",
              color: "#e5e5e5", fontSize: 13, fontFamily: "inherit", outline: "none",
            }}
          />
          <button onClick={createTrip} disabled={saving || !newName.trim()} style={{
            padding: "10px 18px", borderRadius: 8, border: "none",
            background: saving || !newName.trim() ? "#1e3a5f" : "#1e40af", color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: saving || !newName.trim() ? "default" : "pointer",
          }}>
            {saving ? "..." : "สร้าง"}
          </button>
          <button onClick={() => { setCreating(false); setNewName(""); }} style={{
            padding: "10px 16px", borderRadius: 8, border: "1px solid #262626",
            background: "transparent", color: "#888", fontSize: 13, cursor: "pointer",
          }}>
            ยกเลิก
          </button>
        </div>
      )}

      {/* Trip cards */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#555" }}>กำลังโหลด...</div>
      ) : trips.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "#555" }}>
          {query ? "ไม่พบทริป" : "ยังไม่มีทริป — กด “เพิ่มทริป” เพื่อเริ่ม"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {trips.map((t) => {
            const pct = t.totalExpected > 0 ? Math.min(100, Math.round((t.totalPaid / t.totalExpected) * 100)) : 0;
            return (
              <Link key={t.id} href={`/backoffice/bookings/${t.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12,
                  overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
                >
                  {/* Cover */}
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#111" }}>
                    {t.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#222", fontSize: 32 }}>🧾</div>
                    )}
                    {t.status === "ARCHIVED" && (
                      <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "rgba(0,0,0,0.7)", color: "#888" }}>เก็บถาวร</span>
                    )}
                    {t.overdueCount > 0 && (
                      <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(127,29,29,0.9)", color: "#fca5a5" }}>
                        🔴 {t.overdueCount} งวดเกินกำหนด
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: 14 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#e5e5e5", margin: 0, marginBottom: 8, lineHeight: 1.35 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>{t.bookerCount} ผู้จอง</p>

                    {/* Progress */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4 }}>
                      <span>{fmtBaht(t.totalPaid)} / {fmtBaht(t.totalExpected)}</span>
                      <span style={{ color: pct >= 100 ? "#4ade80" : "#60a5fa", fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "#16a34a" : "#2563eb", transition: "width 0.3s" }} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
