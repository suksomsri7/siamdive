"use client";

import { useState } from "react";
import { getPlans, createPlan } from "@/lib/plan-store";

type Props = {
  lang: string;
  suggestedName?: string;
  onSelect: (planId: string) => void;
  onClose: () => void;
};

export default function PlanSelectorSheet({ lang, suggestedName, onSelect, onClose }: Props) {
  const [plans] = useState(() => getPlans());
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(suggestedName || "");
  const isTh = lang === "th";

  const handleCreate = () => {
    if (!name.trim()) return;
    const plan = createPlan(name.trim());
    onSelect(plan.id);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.7)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1501,
        background: "#111",
        borderRadius: "16px 16px 0 0",
        padding: "20px 16px",
        paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
        maxHeight: "60vh",
        display: "flex", flexDirection: "column",
      }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: "#f5f5f5", marginBottom: 4 }}>
          {isTh ? "เพิ่มลงแพลนไหน?" : "Add to which plan?"}
        </p>
        <p style={{ fontSize: 11, color: "#666", marginBottom: 14 }}>
          {isTh ? "เลือกแพลนที่ต้องการเพิ่มทริปนี้" : "Select a plan to add this trip to"}
        </p>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(148,163,184,0.1)",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "#1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {plan.name}
                </p>
                <p style={{ fontSize: 11, color: "#555", margin: "2px 0 0" }}>
                  {plan.trips.length} {isTh ? "ทริป" : "trips"}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}

          {creating ? (
            <div style={{
              padding: "12px 14px", borderRadius: 12,
              background: "#0f0f0f",
              border: "1px solid #1a1a1a",
              display: "flex", gap: 8,
            }}>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleCreate(); }}
                placeholder={isTh ? "ชื่อแพลน" : "Plan name"}
                style={{
                  flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(148,163,184,0.12)",
                  borderRadius: 8, color: "#f5f5f5", fontSize: 13, padding: "8px 10px",
                  outline: "none", fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: name.trim() ? "#1e40af" : "#222",
                  color: name.trim() ? "#fff" : "#555",
                  fontSize: 13, fontWeight: 700, cursor: name.trim() ? "pointer" : "default",
                  flexShrink: 0,
                }}
              >
                {isTh ? "สร้าง" : "Create"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "12px 14px", borderRadius: 12,
                background: "transparent",
                border: "1px dashed #333",
                cursor: "pointer", color: "#666",
                fontSize: 13, fontWeight: 600,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {isTh ? "สร้างแพลนใหม่" : "Create New Plan"}
            </button>
          )}
        </div>

        <button onClick={onClose}
          style={{ width: "100%", padding: "10px 0", background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" }}>
          {isTh ? "ยกเลิก" : "Cancel"}
        </button>
      </div>
    </>
  );
}
