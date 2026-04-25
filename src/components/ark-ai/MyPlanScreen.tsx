"use client";

import { useState, useEffect, useCallback } from "react";
import { getPlans, createPlan, deletePlan, getDeviceId, type UserPlan } from "@/lib/plan-store";
import PlanList from "./plan/PlanList";
import PlanDetail from "./plan/PlanDetail";

type Props = { open: boolean; onClose: () => void; lang: string };

export default function MyPlanScreen({ open, onClose, lang }: Props) {
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(() => {
    const p = getPlans();
    setPlans(p);
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

  const handleCreate = (name: string) => {
    createPlan(name);
    refresh();
    setCreating(false);
  };

  const handleDelete = (planId: string) => {
    deletePlan(planId);
    if (activePlanId === planId) setActivePlanId(null);
    refresh();
  };

  const handleOpenPlan = (planId: string) => {
    setActivePlanId(planId);
  };

  if (!open) return null;

  const isTh = lang === "th";

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
        {activePlanId ? (
          <PlanDetail
            planId={activePlanId}
            deviceId={getDeviceId()}
            lang={lang}
            onBack={() => { setActivePlanId(null); refresh(); }}
            onClose={onClose}
          />
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
              <button onClick={onClose}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, marginRight: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
              <p style={{ flex: 1, fontSize: 16, fontWeight: 800, color: "#f5f5f5" }}>My Plans</p>
            </div>

            {/* Plan List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", overscrollBehavior: "contain", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
              <PlanList
                plans={plans}
                lang={lang}
                onOpen={handleOpenPlan}
                onDelete={handleDelete}
                onCreateStart={() => setCreating(true)}
              />
            </div>

            {/* Create Plan Modal */}
            {creating && (
              <CreatePlanModal
                lang={lang}
                onCreate={handleCreate}
                onClose={() => setCreating(false)}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

function CreatePlanModal({ lang, onCreate, onClose }: { lang: string; onCreate: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const isTh = lang === "th";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(0,0,0,0.7)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1401,
        background: "#111", borderRadius: "16px 16px 0 0",
        padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
      }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", marginBottom: 16 }}>
          {isTh ? "สร้างแพลนใหม่" : "Create New Plan"}
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isTh ? "ชื่อแพลน เช่น สิมิลัน มีนา 2026" : "Plan name, e.g. Similan March 2026"}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onCreate(name.trim()); }}
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 10,
            background: "#0a0a0a", border: "1px solid #262626",
            color: "#f5f5f5", fontSize: 15, fontFamily: "inherit",
            outline: "none", boxSizing: "border-box",
          }}
        />
        <button
          onClick={() => name.trim() && onCreate(name.trim())}
          disabled={!name.trim()}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
            background: name.trim() ? "linear-gradient(135deg, #1e40af, #3b82f6)" : "#222",
            color: name.trim() ? "#fff" : "#555",
            fontSize: 15, fontWeight: 700, cursor: name.trim() ? "pointer" : "default",
            marginTop: 12,
          }}
        >
          {isTh ? "สร้างแพลน" : "Create Plan"}
        </button>
        <button onClick={onClose}
          style={{ width: "100%", padding: "10px 0", marginTop: 8, background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" }}>
          {isTh ? "ยกเลิก" : "Cancel"}
        </button>
      </div>
    </>
  );
}
