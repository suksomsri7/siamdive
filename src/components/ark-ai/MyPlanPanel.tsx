"use client";

import { useState, useEffect, useCallback } from "react";
import { getPlan, setStartDate, removeTrip, clearPlan, type MyPlan, type PlanTrip } from "@/lib/plan-store";

type Props = {
  lang: string;
  onSwitchToChat: () => void;
};

const TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Day Trip", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive", LAND_TOUR: "Land Tour", SNORKELING: "Snorkeling",
  SCUBA_COURSES: "Scuba Courses", FREEDIVE_COURSES: "Freedive Courses",
};

export default function MyPlanPanel({ lang, onSwitchToChat }: Props) {
  const [plan, setPlan] = useState<MyPlan>({ startDate: null, trips: [] });

  const refresh = useCallback(() => setPlan(getPlan()), []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("myplan-change", handler);
    return () => window.removeEventListener("myplan-change", handler);
  }, [refresh]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value || null);
    refresh();
  };

  const handleRemove = (boatId: string) => {
    removeTrip(boatId);
    refresh();
  };

  const handleClear = () => {
    clearPlan();
    refresh();
  };

  const isTh = lang === "th";

  if (plan.trips.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", textAlign: "center" }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5", marginBottom: 4 }}>
          {isTh ? "ยังไม่มีทริปในแพลน" : "No trips in your plan"}
        </p>
        <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5, maxWidth: 260 }}>
          {isTh
            ? 'กด "+" บนทริปที่สนใจเพื่อเพิ่มเข้าแพลน'
            : 'Tap "+" on trips you like to add them to your plan'}
        </p>
        <button onClick={onSwitchToChat}
          style={{ marginTop: 20, padding: "10px 24px", borderRadius: 10, border: "none", background: "#1e40af", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {isTh ? "ไปแชทหาทริป" : "Chat to find trips"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
      {/* Date picker */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {isTh ? "วันเริ่มต้นทริป" : "Trip start date"}
        </label>
        <input
          type="date"
          value={plan.startDate || ""}
          onChange={handleDateChange}
          min={new Date().toISOString().split("T")[0]}
          style={{
            display: "block", width: "100%", marginTop: 6,
            padding: "10px 12px", borderRadius: 10,
            background: "#161616", border: "1px solid #262626",
            color: "#f5f5f5", fontSize: 14, fontFamily: "inherit",
            outline: "none",
            colorScheme: "dark",
          }}
        />
      </div>

      {/* Trip list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {plan.trips.map((trip, idx) => (
          <TripRow key={trip.boatId} trip={trip} index={idx} startDate={plan.startDate} lang={lang} onRemove={handleRemove} />
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={onSwitchToChat}
          style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #1e40af", background: "transparent", color: "#60a5fa", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + {isTh ? "เพิ่มทริป" : "Add more trips"}
        </button>
        <button onClick={handleClear}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#666", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {isTh ? "ล้าง" : "Clear"}
        </button>
      </div>

      {/* Contact CTA */}
      <div style={{ marginTop: 20, background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: 16, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#ccc", marginBottom: 8 }}>
          {isTh ? "พร้อมจองแล้ว? ติดต่อเราเลย" : "Ready to book? Contact us"}
        </p>
        <a href="https://lin.ee/wayWuGH" target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 24px", borderRadius: 10, border: "none",
            background: "#06c755", color: "#fff", fontSize: 13, fontWeight: 700,
            textDecoration: "none",
          }}>
          💬 {isTh ? "จองผ่าน Line" : "Book via Line"}
        </a>
      </div>
    </div>
  );
}

function TripRow({ trip, index, startDate, lang, onRemove }: {
  trip: PlanTrip; index: number; startDate: string | null; lang: string; onRemove: (id: string) => void;
}) {
  const dayLabel = startDate
    ? new Date(new Date(startDate).getTime() + index * 86400000).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : `Day ${index + 1}`;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, padding: 10,
    }}>
      {/* Day badge */}
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>{index + 1}</span>
      </div>

      {/* Cover */}
      {trip.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={trip.cover} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 48, height: 36, background: "#222", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          🤿
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 9, color: "#666" }}>{dayLabel}</p>
        {trip.area && <p style={{ fontSize: 8, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase" }}>{trip.area}</p>}
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</p>
        <p style={{ fontSize: 9, color: "#555" }}>{TYPE_LABEL[trip.type] || trip.type}</p>
      </div>

      {/* Remove */}
      <button onClick={() => onRemove(trip.boatId)}
        style={{
          width: 24, height: 24, borderRadius: 6, border: "1px solid #333",
          background: "transparent", color: "#666", fontSize: 12,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
        ✕
      </button>
    </div>
  );
}
