"use client";

import { useState, useEffect, useCallback } from "react";
import { getPlans, createPlan, deletePlan, getDeviceId, tripCount, type UserPlan } from "@/lib/plan-store";
import PlanList from "./plan/PlanList";
import PlanDetail from "./plan/PlanDetail";
import ThemeToggle from "./plan/ThemeToggle";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: string;
  initialPlanId?: string | null;
  // When the chat fires "Build my plan", we open this drawer immediately
  // and show a progress overlay while build-plan runs in the background.
  // The chat dispatches "myplan-build-done" on success (with the new planId)
  // or "myplan-build-error" with a reason list for the user to react to.
  buildingPlan?: boolean;
};

export default function MyPlanScreen({ open, onClose, lang, initialPlanId, buildingPlan }: Props) {
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string[] | null>(null);

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
    if (open && initialPlanId) setActivePlanId(initialPlanId);
  }, [open, initialPlanId]);

  // Mirror the parent-supplied buildingPlan flag into local state so we
  // can clear it when the build resolves without bouncing the parent.
  useEffect(() => {
    if (buildingPlan) {
      setBuilding(true);
      setBuildError(null);
    }
  }, [buildingPlan]);

  // Listen for the async build-plan resolution dispatched by ArkAIChatPanel.
  useEffect(() => {
    const onDone = (e: Event) => {
      const detail = (e as CustomEvent<{ planId?: string }>).detail;
      setBuilding(false);
      setBuildError(null);
      if (detail?.planId) setActivePlanId(detail.planId);
      refresh();
    };
    const onError = (e: Event) => {
      const detail = (e as CustomEvent<{ reasons?: string[] }>).detail;
      setBuilding(false);
      setBuildError(detail?.reasons?.length ? detail.reasons : [lang === "th" ? "สร้าง plan ไม่สำเร็จ" : "Couldn't build the plan"]);
    };
    window.addEventListener("myplan-build-done", onDone);
    window.addEventListener("myplan-build-error", onError);
    return () => {
      window.removeEventListener("myplan-build-done", onDone);
      window.removeEventListener("myplan-build-error", onError);
    };
  }, [refresh, lang]);

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

  const handleDeleteRequest = (planId: string) => {
    setDeletingPlanId(planId);
  };

  const handleDeleteConfirm = () => {
    if (!deletingPlanId) return;
    deletePlan(deletingPlanId);
    if (activePlanId === deletingPlanId) setActivePlanId(null);
    setDeletingPlanId(null);
    refresh();
  };

  const handleOpenPlan = (planId: string) => {
    setActivePlanId(planId);
  };

  if (!open) return null;

  const isTh = lang === "th";

  return (
    <>
      <style>{`
        @keyframes planFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes planNavPulse { 0% { transform: scale(1); } 50% { transform: scale(0.92); } 100% { transform: scale(1); } }
      `}</style>
      <div style={{
        position: "fixed", inset: 0, zIndex: 1300,
        background: "var(--plan-bg)", color: "var(--plan-fg)",
        display: "flex", flexDirection: "column",
        animation: "planFadeIn 0.2s ease both",
        overflow: "hidden", touchAction: "none",
        transition: "background 0.2s, color 0.2s",
      }}>
        {building ? (
          <BuildingOverlay lang={lang} />
        ) : buildError ? (
          <BuildErrorState
            lang={lang}
            reasons={buildError}
            onRetryInChat={() => {
              setBuildError(null);
              onClose();
              setTimeout(() => window.dispatchEvent(new CustomEvent("open-ark-ai")), 100);
            }}
            onDismiss={() => setBuildError(null)}
          />
        ) : activePlanId ? (
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
            <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--plan-border-soft)", flexShrink: 0 }}>
              <button onClick={onClose}
                style={{ background: "none", border: "none", color: "var(--plan-fg-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, marginRight: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
              <p style={{ flex: 1, fontSize: 16, fontWeight: 800, color: "var(--plan-fg)" }}>My Plans</p>
              <ThemeToggle />
            </div>

            {/* Plan List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: 88, overscrollBehavior: "contain", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
              <PlanList
                plans={plans}
                lang={lang}
                onOpen={handleOpenPlan}
                onDelete={handleDeleteRequest}
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

            {/* Delete Confirmation Modal */}
            {deletingPlanId && (
              <DeleteConfirmModal
                lang={lang}
                planName={plans.find((p) => p.id === deletingPlanId)?.name || ""}
                onConfirm={handleDeleteConfirm}
                onClose={() => setDeletingPlanId(null)}
              />
            )}
          </>
        )}

        <PlanBottomNav onClose={onClose} />
      </div>
    </>
  );
}

function BuildingOverlay({ lang }: { lang: string }) {
  const isTh = lang === "th";
  const steps = isTh
    ? ["กำลังหาเรือที่ตรงกับวัน...", "ตรวจ schedule และ package...", "เลือกทริปที่ดีที่สุด...", "เกือบเสร็จแล้ว..."]
    : ["Searching boats for your dates...", "Checking schedules and packages...", "Picking the best fit...", "Almost ready..."];
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStepIdx(i => Math.min(i + 1, steps.length - 1)), 1200);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px", textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, marginBottom: 24,
        borderRadius: "50%", background: "linear-gradient(135deg, #1e40af, #3b82f6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 32px rgba(59,130,246,0.45)",
        animation: "buildPulse 1.6s ease-in-out infinite",
      }}>
        <img src="/ai-mask.png" alt="" width={36} height={36} style={{ filter: "brightness(1.15)" }} />
      </div>
      <p style={{ fontSize: 18, fontWeight: 800, color: "#f5f5f5", marginBottom: 6 }}>
        {isTh ? "AI กำลังสร้าง plan ให้..." : "AI is building your plan..."}
      </p>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 28, lineHeight: 1.5, maxWidth: 320 }}>
        {isTh
          ? "ระบบกำลังจับคู่ความต้องการกับทริปที่มี schedule ตรง ใช้เวลาประมาณ 2-3 วินาที"
          : "Matching your preferences against live trip schedules. Takes about 2-3 seconds."}
      </p>
      <div style={{
        width: "100%", maxWidth: 320,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 10,
            background: i === stepIdx ? "rgba(59,130,246,0.12)" : "transparent",
            border: i === stepIdx ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
            opacity: i <= stepIdx ? 1 : 0.35,
            transition: "all 0.3s",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: i < stepIdx ? "#22c55e" : i === stepIdx ? "#3b82f6" : "#1f2937",
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.3s",
            }}>
              {i < stepIdx ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : i === stepIdx ? (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "buildDot 0.8s ease-in-out infinite" }} />
              ) : null}
            </div>
            <p style={{ fontSize: 13, color: i === stepIdx ? "#f5f5f5" : "#9ca3af", textAlign: "left", margin: 0 }}>{s}</p>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes buildPulse { 0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(59,130,246,0.35); } 50% { transform: scale(1.06); box-shadow: 0 12px 40px rgba(59,130,246,0.55); } }
        @keyframes buildDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

function BuildErrorState({ lang, reasons, onRetryInChat, onDismiss }: { lang: string; reasons: string[]; onRetryInChat: () => void; onDismiss: () => void }) {
  const isTh = lang === "th";
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>🤔</div>
      <p style={{ fontSize: 17, fontWeight: 800, color: "#f5f5f5", marginBottom: 10 }}>
        {isTh ? "ยังสร้าง plan ไม่ได้" : "Can't build the plan yet"}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", maxWidth: 340 }}>
        {reasons.map((r, i) => (
          <li key={i} style={{
            fontSize: 13, color: "#cbd5e1", marginBottom: 8, lineHeight: 1.5,
            padding: "10px 14px", background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10,
          }}>{r}</li>
        ))}
      </ul>
      <button onClick={onRetryInChat} style={{
        padding: "12px 24px", borderRadius: 10, border: "none",
        background: "#1e40af", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
        marginBottom: 8,
      }}>
        {isTh ? "กลับไปคุยกับ AI" : "Back to AI chat"}
      </button>
      <button onClick={onDismiss} style={{
        padding: "8px 16px", background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer",
      }}>
        {isTh ? "ดูแพลนทั้งหมด" : "See all plans"}
      </button>
    </div>
  );
}

function DeleteConfirmModal({ lang, planName, onConfirm, onClose }: { lang: string; planName: string; onConfirm: () => void; onClose: () => void }) {
  const isTh = lang === "th";
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(0,0,0,0.7)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1401,
        background: "#111", borderRadius: "16px 16px 0 0",
        padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", marginBottom: 8 }}>
          {isTh ? "ลบแพลนนี้?" : "Delete this plan?"}
        </p>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.5 }}>
          {isTh
            ? `"${planName}" จะถูกลบถาวร ไม่สามารถกู้คืนได้`
            : `"${planName}" will be permanently deleted and cannot be recovered`}
        </p>
        <button onClick={onConfirm}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
            background: "#dc2626", color: "#fff",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>
          {isTh ? "ลบแพลน" : "Delete Plan"}
        </button>
        <button onClick={onClose}
          style={{ width: "100%", padding: "10px 0", marginTop: 8, background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" }}>
          {isTh ? "ยกเลิก" : "Cancel"}
        </button>
      </div>
    </>
  );
}

function PlanBottomNav({ onClose }: { onClose: () => void }) {
  const [tapped, setTapped] = useState<string | null>(null);
  const [badge, setBadge] = useState(0);

  useEffect(() => {
    setBadge(tripCount());
    const handler = () => setBadge(tripCount());
    window.addEventListener("myplan-change", handler);
    return () => window.removeEventListener("myplan-change", handler);
  }, []);

  const handleTap = (id: string, action: () => void) => {
    setTapped(id);
    action();
    setTimeout(() => setTapped(null), 300);
  };

  return (
    <nav style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      display: "flex", justifyContent: "center",
      flexShrink: 0,
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", alignItems: "stretch",
        background: "linear-gradient(to top, rgba(8,8,8,0.98), rgba(13,13,13,0.95))",
        backdropFilter: "blur(20px) saturate(1.5)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {/* Search */}
        <button
          onClick={() => handleTap("search", () => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-search")), 100); })}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 3,
            padding: "10px 0 8px", border: "none", background: "transparent",
            color: "rgba(255,255,255,0.4)", cursor: "pointer",
            animation: tapped === "search" ? "planNavPulse 0.3s ease" : "none",
            transition: "color 0.15s",
          }}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.01em" }}>Search</span>
        </button>

        {/* AI center button */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button
            onClick={() => handleTap("ai", () => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-ark-ai")), 100); })}
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
              border: "none", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
              transform: "translateY(-12px)",
              animation: tapped === "ai" ? "planNavPulse 0.3s ease" : "none",
              transition: "box-shadow 0.2s",
            }}
          >
            <img src="/ai-mask.png" alt="AI" width={28} height={28} style={{ filter: "brightness(1.1)" }} />
          </button>
        </div>

        {/* My Plan (active) */}
        <button
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 3,
            padding: "10px 0 8px", border: "none", background: "transparent",
            color: "#fff", cursor: "default",
          }}
        >
          <div style={{ position: "relative" }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
            {badge > 0 && (
              <span style={{
                position: "absolute", top: -5, right: -10,
                minWidth: 16, height: 16, borderRadius: 8,
                background: "#ef4444", color: "#fff",
                fontSize: 9, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px",
                boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
              }}>{badge}</span>
            )}
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.01em" }}>My Plan</span>
        </button>
      </div>
    </nav>
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
            background: name.trim() ? "#1e40af" : "#1a1a1a",
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
