"use client";

import { useEffect, useState, useRef } from "react";

// plan-toast event payload — the dispatcher decides the message + optional
// inline action. The undo path passes both `actionLabel` and `actionEvent`,
// the latter dispatched on click so the originator (e.g. ArkAIChatPanel)
// can react without coupling to PlanToast.
type ToastDetail = {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionEvent?: string;
  actionDetail?: unknown;
};

export default function PlanToast() {
  const [detail, setDetail] = useState<ToastDetail | null>(null);
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const seqRef = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as ToastDetail | undefined;
      seqRef.current += 1;
      setPhase("enter");
      setDetail({ ...d, message: d?.message || (d?.title ? `เพิ่ม "${d.title}" ลง My Plan แล้ว` : "เพิ่มลง My Plan แล้ว") });
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase("visible")));
    };
    window.addEventListener("plan-toast", handler);
    return () => window.removeEventListener("plan-toast", handler);
  }, []);

  useEffect(() => {
    if (!detail) return;
    // Hold longer when there's an action so the user can read + decide.
    const dwell = detail.actionLabel ? 4500 : 2200;
    const t1 = setTimeout(() => setPhase("exit"), dwell);
    const t2 = setTimeout(() => { setDetail(null); setPhase("enter"); }, dwell + 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [detail]);

  if (!detail) return null;

  const fireAction = () => {
    if (detail.actionEvent) {
      window.dispatchEvent(new CustomEvent(detail.actionEvent, { detail: detail.actionDetail ?? {} }));
    }
    setPhase("exit");
  };

  return (
    <div style={{
      position: "fixed",
      bottom: phase === "enter" ? 60 : 80,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 99999,
      padding: "12px 16px",
      borderRadius: 14,
      background: "rgba(17,17,17,0.95)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid #333",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      maxWidth: "calc(100vw - 32px)",
      opacity: phase === "enter" ? 0 : phase === "visible" ? 1 : 0,
      transition: "opacity 0.3s ease, bottom 0.3s ease",
      // pointerEvents must be auto when there's an action button to click.
      pointerEvents: detail.actionLabel ? "auto" : "none",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: "#e5e5e5",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {detail.message}
      </span>
      {detail.actionLabel && (
        <button
          type="button"
          onClick={fireAction}
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
  );
}
