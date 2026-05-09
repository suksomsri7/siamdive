"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { addedToMyPlanFallback, addedToMyPlanGeneric } from "@/lib/ark-ai/i18n";

// plan-toast event payload — the dispatcher decides the message + optional
// inline action(s). One-action variant is used by undo / "open existing
// plan" flows. The two-action variant is used when we need an explicit
// decision from the user (e.g. "duplicate detected: view existing or
// create a new one anyway"); both buttons render side-by-side and the
// toast keeps showing until the user picks one or the dwell expires.
type ToastDetail = {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionEvent?: string;
  actionDetail?: unknown;
  actionLabel2?: string;
  actionEvent2?: string;
  actionDetail2?: unknown;
};

export default function PlanToast() {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "th";
  const [detail, setDetail] = useState<ToastDetail | null>(null);
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const seqRef = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as ToastDetail | undefined;
      seqRef.current += 1;
      setPhase("enter");
      setDetail({
        ...d,
        message: d?.message || (d?.title ? addedToMyPlanFallback(lang, d.title) : addedToMyPlanGeneric(lang)),
      });
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase("visible")));
    };
    window.addEventListener("plan-toast", handler);
    return () => window.removeEventListener("plan-toast", handler);
  }, [lang]);

  useEffect(() => {
    if (!detail) return;
    // Two-action toasts force a decision — give the user enough time to
    // read both options before auto-dismissing. One-action toasts are
    // gentler nudges; plain toasts are passive confirmations.
    const dwell = detail.actionLabel2 ? 7000 : detail.actionLabel ? 4500 : 2200;
    const t1 = setTimeout(() => setPhase("exit"), dwell);
    const t2 = setTimeout(() => { setDetail(null); setPhase("enter"); }, dwell + 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [detail]);

  if (!detail) return null;

  const fireAction = (label: 1 | 2) => {
    const evt = label === 1 ? detail.actionEvent : detail.actionEvent2;
    const det = label === 1 ? detail.actionDetail : detail.actionDetail2;
    if (evt) window.dispatchEvent(new CustomEvent(evt, { detail: det ?? {} }));
    setPhase("exit");
  };

  const hasTwoActions = !!detail.actionLabel2;
  const hasAnyAction = !!detail.actionLabel;

  return (
    <div style={{
      position: "fixed",
      bottom: phase === "enter" ? 60 : 80,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 99999,
      padding: hasTwoActions ? "14px 16px 12px" : "12px 16px",
      borderRadius: 14,
      background: "rgba(17,17,17,0.95)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid #333",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: hasTwoActions ? "column" : "row",
      alignItems: hasTwoActions ? "stretch" : "center",
      gap: hasTwoActions ? 10 : 10,
      maxWidth: "calc(100vw - 32px)",
      width: hasTwoActions ? 320 : undefined,
      opacity: phase === "enter" ? 0 : phase === "visible" ? 1 : 0,
      transition: "opacity 0.3s ease, bottom 0.3s ease",
      pointerEvents: hasAnyAction ? "auto" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#e5e5e5",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: hasTwoActions ? "clip" : "ellipsis",
          whiteSpace: hasTwoActions ? "normal" : "nowrap",
          lineHeight: hasTwoActions ? 1.4 : undefined,
        }}>
          {detail.message}
        </span>
        {detail.actionLabel && !hasTwoActions && (
          <button
            type="button"
            onClick={() => fireAction(1)}
            style={{
              background: "transparent",
              border: "none",
              color: "#60a5fa",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              padding: "2px 4px",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {detail.actionLabel}
          </button>
        )}
      </div>

      {hasTwoActions && (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => fireAction(2)}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#cbd5e1",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 8,
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {detail.actionLabel2}
          </button>
          <button
            type="button"
            onClick={() => fireAction(1)}
            style={{
              background: "#3b82f6",
              border: "none",
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 8,
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {detail.actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
