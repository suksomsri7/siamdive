"use client";

import { useEffect, useState, useRef } from "react";

export default function PlanToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const [fade, setFade] = useState(false);
  const seqRef = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const title = (e as CustomEvent).detail?.title || "";
      seqRef.current += 1;
      setFade(false);
      setMsg((title ? `เพิ่ม "${title}" ลง My Plan แล้ว` : "เพิ่มลง My Plan แล้ว") + `\0${seqRef.current}`);
    };
    window.addEventListener("plan-toast", handler);
    return () => window.removeEventListener("plan-toast", handler);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t1 = setTimeout(() => setFade(true), 1800);
    const t2 = setTimeout(() => { setMsg(null); setFade(false); }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [msg]);

  if (!msg) return null;

  return (
    <div style={{
      position: "fixed",
      top: "calc(env(safe-area-inset-top, 0px) + 16px)",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      padding: "12px 20px",
      borderRadius: 14,
      background: "rgba(17,17,17,0.92)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid #222",
      display: "flex",
      alignItems: "center",
      gap: 8,
      maxWidth: "calc(100vw - 32px)",
      opacity: fade ? 0 : 1,
      transition: "opacity 0.6s ease",
      pointerEvents: "none",
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
        {msg?.replace(/\0.*$/, "")}
      </span>
    </div>
  );
}
