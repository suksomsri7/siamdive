"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPlans, getActivePlan, switchPlan, createPlan, renamePlan, deletePlan,
  removeTrip, clearPlan,
  type UserPlan, type PlanTrip,
} from "@/lib/plan-store";

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
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [activePlan, setActivePlan] = useState<UserPlan | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setPlans(getPlans());
    setActivePlan(getActivePlan());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("myplan-change", handler);
    return () => window.removeEventListener("myplan-change", handler);
  }, [refresh]);

  useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renaming]);

  const isTh = lang === "th";

  const handleSwitch = (id: string) => {
    switchPlan(id);
    setShowSelector(false);
    refresh();
  };

  const handleCreate = () => {
    const count = plans.length + 1;
    createPlan(isTh ? `แพลน ${count}` : `Plan ${count}`);
    setShowSelector(false);
    refresh();
  };

  const handleRenameStart = (plan: UserPlan) => {
    setRenaming(plan.id);
    setRenameValue(plan.name);
  };

  const handleRenameEnd = () => {
    if (renaming && renameValue.trim()) {
      renamePlan(renaming, renameValue.trim());
    }
    setRenaming(null);
    refresh();
  };

  const handleDelete = (planId: string) => {
    deletePlan(planId);
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

  // Plan selector header
  const selectorHeader = (
    <div style={{ padding: "0 0 8px", borderBottom: "1px solid #1a1a1a", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <button
          onClick={() => setShowSelector(!showSelector)}
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
        >
          <p style={{ fontSize: 13, fontWeight: 800, color: "#f5f5f5" }}>
            {activePlan?.name || "My Plan"}
          </p>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: showSelector ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          {plans.length > 1 && (
            <span style={{ fontSize: 9, color: "#555", background: "#1a1a1a", padding: "1px 5px", borderRadius: 5, fontWeight: 600 }}>
              {plans.length}
            </span>
          )}
        </button>
        {activePlan && activePlan.trips.length > 0 && (
          <button onClick={handleClear}
            style={{ background: "none", border: "1px solid #333", color: "#666", padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            {isTh ? "ล้าง" : "Clear"}
          </button>
        )}
      </div>

      {showSelector && (
        <div style={{ padding: "4px 0" }}>
          {plans.map((p) => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 8px",
              borderRadius: 6, marginBottom: 2, cursor: "pointer",
              background: p.id === activePlan?.id ? "rgba(59,130,246,0.1)" : "transparent",
            }}>
              {renaming === p.id ? (
                <input
                  ref={renameRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameEnd}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRenameEnd(); }}
                  style={{
                    flex: 1, background: "#1a1a1a", border: "1px solid #333", borderRadius: 4,
                    color: "#f5f5f5", fontSize: 12, padding: "3px 6px", fontFamily: "inherit", outline: "none",
                  }}
                />
              ) : (
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => handleSwitch(p.id)}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: p.id === activePlan?.id ? "#60a5fa" : "#ccc" }}>
                    {p.name} <span style={{ color: "#555", fontWeight: 400 }}>({(p.trips as PlanTrip[]).length})</span>
                  </p>
                </div>
              )}
              {renaming !== p.id && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handleRenameStart(p); }}
                    style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 2, display: "flex" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/>
                    </svg>
                  </button>
                  {plans.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 2, display: "flex" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
          <button onClick={handleCreate}
            style={{
              width: "100%", padding: "8px 0", borderRadius: 6, marginTop: 4,
              border: "1px dashed rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.05)",
              color: "#60a5fa", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
            + {isTh ? "สร้างแพลนใหม่" : "New Plan"}
          </button>
        </div>
      )}
    </div>
  );

  if (!activePlan || activePlan.trips.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 16px" }}>
        {plans.length > 0 && selectorHeader}
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
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
      {selectorHeader}

      {/* Trip list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {activePlan.trips.map((trip, idx) => (
          <TripRow key={trip.boatId} trip={trip} index={idx} lang={lang} onRemove={handleRemove} />
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={onSwitchToChat}
          style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #1e40af", background: "transparent", color: "#60a5fa", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + {isTh ? "เพิ่มทริป" : "Add more trips"}
        </button>
      </div>

    </div>
  );
}

function TripRow({ trip, index, lang, onRemove }: {
  trip: PlanTrip; index: number; lang: string; onRemove: (id: string) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, padding: 10,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>{index + 1}</span>
      </div>

      {trip.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={trip.cover} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 48, height: 36, background: "#222", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          🤿
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {trip.area && <p style={{ fontSize: 8, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase" }}>{trip.area}</p>}
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</p>
        <p style={{ fontSize: 9, color: "#555" }}>{TYPE_LABEL[trip.type] || trip.type}</p>
      </div>

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
