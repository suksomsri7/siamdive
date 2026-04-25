"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPlans, getActivePlan, switchPlan, createPlan, renamePlan, deletePlan,
  setStartDate, removeTrip, clearPlan, getSavedEmail,
  type UserPlan, type PlanTrip,
} from "@/lib/plan-store";
import EmailPrompt from "./EmailPrompt";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: string;
};

const TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Day Trip", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive", LAND_TOUR: "Land Tour", SNORKELING: "Snorkeling",
  SCUBA_COURSES: "Scuba Courses", FREEDIVE_COURSES: "Freedive Courses",
};

export default function MyPlanScreen({ open, onClose, lang }: Props) {
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [activePlan, setActivePlan] = useState<UserPlan | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailMode, setEmailMode] = useState<"save" | "recover">("save");
  const renameRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setPlans(getPlans());
    setActivePlan(getActivePlan());
  }, []);

  useEffect(() => {
    if (open) refresh();
    const handler = () => refresh();
    window.addEventListener("myplan-change", handler);
    return () => window.removeEventListener("myplan-change", handler);
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    body.style.touchAction = "none";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      html.style.overflow = "";
      body.style.touchAction = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

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

  if (!open) return null;

  return (
    <>
      <style>{`@keyframes planFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div style={{
        position: "fixed", inset: 0, zIndex: 1300,
        background: "#0a0a0a", color: "#e5e5e5",
        display: "flex", flexDirection: "column",
        animation: "planFadeIn 0.2s ease both",
        overflow: "hidden", touchAction: "none",
      }}>
        {/* Header */}
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, marginRight: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
          </div>

          {/* Plan name — tap to show selector */}
          <button
            onClick={() => setShowSelector(!showSelector)}
            style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
          >
            <p style={{ fontSize: 14, fontWeight: 800, color: "#f5f5f5" }}>
              {activePlan?.name || "My Plan"}
            </p>
            {plans.length > 0 && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showSelector ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
            {plans.length > 1 && (
              <span style={{ fontSize: 10, color: "#555", background: "#1a1a1a", padding: "1px 6px", borderRadius: 6, fontWeight: 600 }}>
                {plans.length}
              </span>
            )}
          </button>

          {activePlan && activePlan.trips.length > 0 && (
            <button onClick={handleClear}
              style={{ background: "none", border: "1px solid #333", color: "#666", padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {isTh ? "ล้าง" : "Clear"}
            </button>
          )}
        </div>

        {/* Plan Selector Dropdown */}
        {showSelector && (
          <div style={{ borderBottom: "1px solid #1a1a1a", background: "#0f0f0f", padding: "8px 16px", flexShrink: 0 }}>
            {plans.map((p) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                borderRadius: 8, marginBottom: 4, cursor: "pointer",
                background: p.id === activePlan?.id ? "rgba(59,130,246,0.1)" : "transparent",
                border: p.id === activePlan?.id ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
              }}>
                {renaming === p.id ? (
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameEnd}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRenameEnd(); }}
                    style={{
                      flex: 1, background: "#1a1a1a", border: "1px solid #333", borderRadius: 6,
                      color: "#f5f5f5", fontSize: 13, padding: "4px 8px", fontFamily: "inherit", outline: "none",
                    }}
                  />
                ) : (
                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => handleSwitch(p.id)}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: p.id === activePlan?.id ? "#60a5fa" : "#ccc" }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: 10, color: "#555" }}>
                      {(p.trips as PlanTrip[]).length} {isTh ? "ทริป" : "trips"}
                    </p>
                  </div>
                )}

                {renaming !== p.id && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); handleRenameStart(p); }}
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4, display: "flex" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/>
                      </svg>
                    </button>
                    {plans.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                        style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4, display: "flex" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                width: "100%", padding: "10px 0", borderRadius: 8, marginTop: 4,
                border: "1px dashed rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.05)",
                color: "#60a5fa", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
              + {isTh ? "สร้างแพลนใหม่" : "New Plan"}
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", overscrollBehavior: "contain", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
          {!activePlan || activePlan.trips.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 16px", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#e5e5e5", marginBottom: 6 }}>
                {isTh ? "ยังไม่มีทริปในแพลน" : "No trips in your plan yet"}
              </p>
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, maxWidth: 280 }}>
                {isTh
                  ? 'กด "+" บนทริปที่สนใจ จาก AI หรือหน้าเว็บ เพื่อเพิ่มเข้าแพลนของคุณ'
                  : 'Tap "+" on any trip card to add it to your plan'}
              </p>
              <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-ark-ai")), 100); }}
                style={{ marginTop: 24, padding: "12px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1e40af, #3b82f6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {isTh ? "ให้ AI แนะนำทริป" : "Ask AI for trips"}
              </button>
              {!getSavedEmail() && (
                <button onClick={() => { setEmailMode("recover"); setEmailOpen(true); }}
                  style={{ marginTop: 16, background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer" }}>
                  {isTh ? "เคยบันทึกแพลนไว้? กู้คืน" : "Have saved plans? Restore"}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Date picker */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {isTh ? "วันเริ่มต้นทริป" : "Trip start date"}
                </label>
                <input
                  type="date"
                  value={activePlan.startDate || ""}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split("T")[0]}
                  style={{
                    display: "block", width: "100%", marginTop: 6,
                    padding: "12px 14px", borderRadius: 10,
                    background: "#111", border: "1px solid #222",
                    color: "#f5f5f5", fontSize: 15, fontFamily: "inherit",
                    outline: "none", colorScheme: "dark",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Trip list */}
              <p style={{ fontSize: 11, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                {isTh ? `ทริปในแพลน (${activePlan.trips.length})` : `Trips (${activePlan.trips.length})`}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activePlan.trips.map((trip, idx) => (
                  <TripRow key={trip.boatId} trip={trip} index={idx} startDate={activePlan.startDate} lang={lang} onRemove={handleRemove} />
                ))}
              </div>

              {/* Add more */}
              <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-ark-ai")), 100); }}
                style={{
                  width: "100%", marginTop: 16, padding: "12px 0", borderRadius: 10,
                  border: "1px dashed rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.05)",
                  color: "#60a5fa", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>
                + {isTh ? "เพิ่มทริปจาก AI" : "Add trips from AI"}
              </button>

              {/* Save email banner */}
              {!getSavedEmail() && (
                <div style={{
                  marginTop: 20, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)",
                  borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#ccc" }}>
                      {isTh ? "บันทึกแพลนถาวร" : "Save plans permanently"}
                    </p>
                    <p style={{ fontSize: 11, color: "#666" }}>
                      {isTh ? "เข้าถึงจากทุกเครื่อง" : "Access from any device"}
                    </p>
                  </div>
                  <button onClick={() => { setEmailMode("save"); setEmailOpen(true); }}
                    style={{
                      padding: "6px 14px", borderRadius: 8, border: "none",
                      background: "#1e40af", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                    }}>
                    {isTh ? "ใส่อีเมล" : "Add email"}
                  </button>
                </div>
              )}

              {/* Contact CTA */}
              <div style={{ marginTop: 20, background: "#111", border: "1px solid #1e1e2e", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#ccc", fontWeight: 600, marginBottom: 4 }}>
                  {isTh ? "พร้อมจองแล้ว?" : "Ready to book?"}
                </p>
                <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>
                  {isTh ? "ส่งแพลนนี้ให้ทีมงาน เราจัดให้ครบ" : "Send this plan to our team"}
                </p>
                <a href="https://lin.ee/wayWuGH" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "12px 28px", borderRadius: 10, border: "none",
                    background: "#06c755", color: "#fff", fontSize: 14, fontWeight: 700,
                    textDecoration: "none",
                  }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755z"/>
                  </svg>
                  {isTh ? "จองผ่าน Line" : "Book via Line"}
                </a>
              </div>
            </>
          )}
        </div>

        <EmailPrompt open={emailOpen} onClose={() => setEmailOpen(false)} lang={lang} mode={emailMode} />
      </div>
    </>
  );
}

function TripRow({ trip, index, startDate, lang, onRemove }: {
  trip: PlanTrip; index: number; startDate: string | null; lang: string; onRemove: (id: string) => void;
}) {
  const dayLabel = startDate
    ? new Date(new Date(startDate).getTime() + index * 86400000).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#111", border: "1px solid #1e1e2e", borderRadius: 12, padding: 12,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{index + 1}</span>
      </div>

      {trip.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={trip.cover} alt="" style={{ width: 52, height: 40, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 52, height: 40, background: "#1a1a2e", borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          🤿
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {dayLabel && <p style={{ fontSize: 10, color: "#555" }}>{dayLabel}</p>}
        {trip.area && <p style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase" }}>{trip.area}</p>}
        <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</p>
        <p style={{ fontSize: 10, color: "#555" }}>{TYPE_LABEL[trip.type] || trip.type}</p>
      </div>

      <button onClick={() => onRemove(trip.boatId)}
        style={{
          width: 28, height: 28, borderRadius: 8, border: "1px solid #262626",
          background: "transparent", color: "#555", fontSize: 14,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
        ✕
      </button>
    </div>
  );
}
