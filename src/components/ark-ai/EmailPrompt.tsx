"use client";

import { useState } from "react";
import { attachEmail, recoverByEmail, getSavedEmail } from "@/lib/plan-store";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: string;
  mode: "save" | "recover";
};

export default function EmailPrompt({ open, onClose, lang, mode: initialMode }: Props) {
  const [mode, setMode] = useState<"save" | "recover">(initialMode);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTh = lang === "th";
  const savedEmail = getSavedEmail();

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);

    if (mode === "save") {
      const ok = await attachEmail(email);
      if (ok) {
        setDone(true);
        setTimeout(onClose, 1500);
      } else {
        setError(isTh ? "เกิดข้อผิดพลาด ลองใหม่" : "Something went wrong, try again");
      }
    } else {
      const plans = await recoverByEmail(email);
      if (plans) {
        setDone(true);
        setTimeout(() => {
          onClose();
          window.dispatchEvent(new CustomEvent("myplan-change"));
        }, 1000);
      } else {
        setError(isTh ? "ไม่พบแพลนจากอีเมลนี้" : "No plans found for this email");
      }
    }

    setLoading(false);
  };

  if (!open) return null;

  return (
    <>
      <style>{`@keyframes emailFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 1400,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      }} />
      {/* Modal */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1401,
        background: "#111", borderRadius: "16px 16px 0 0",
        padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        animation: "emailFadeIn 0.2s ease both",
      }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>✓</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#4ade80" }}>
              {mode === "save"
                ? (isTh ? "บันทึกอีเมลแล้ว!" : "Email saved!")
                : (isTh ? "กู้คืนแพลนสำเร็จ!" : "Plans restored!")}
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", marginBottom: 4 }}>
              {mode === "save"
                ? (isTh ? "บันทึกแพลนถาวร" : "Save your plans")
                : (isTh ? "กู้คืนแพลน" : "Restore your plans")}
            </p>
            <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 16 }}>
              {mode === "save"
                ? (isTh ? "ใส่อีเมลเพื่อเข้าถึงแพลนจากทุกเครื่อง" : "Enter your email to access plans from any device")
                : (isTh ? "ใส่อีเมลที่เคยบันทึกไว้" : "Enter the email you saved before")}
            </p>

            {savedEmail && mode === "save" && (
              <p style={{ fontSize: 12, color: "#4ade80", marginBottom: 12 }}>
                {isTh ? `เชื่อมต่อกับ ${savedEmail} แล้ว` : `Connected to ${savedEmail}`}
              </p>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder={isTh ? "อีเมลของคุณ" : "Your email"}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 10,
                background: "#0a0a0a", border: error ? "1px solid #ef4444" : "1px solid #262626",
                color: "#f5f5f5", fontSize: 15, fontFamily: "inherit",
                outline: "none", boxSizing: "border-box",
              }}
            />

            {error && (
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
                background: isValid ? "linear-gradient(135deg, #1e40af, #3b82f6)" : "#222",
                color: isValid ? "#fff" : "#555",
                fontSize: 15, fontWeight: 700, cursor: isValid ? "pointer" : "default",
                marginTop: 12, transition: "background 0.2s, color 0.2s",
              }}
            >
              {loading
                ? "..."
                : mode === "save"
                  ? (isTh ? "บันทึก" : "Save")
                  : (isTh ? "กู้คืน" : "Restore")}
            </button>

            {/* Toggle mode */}
            <button
              onClick={() => { setMode(mode === "save" ? "recover" : "save"); setError(null); }}
              style={{
                width: "100%", padding: "10px 0", marginTop: 8,
                background: "none", border: "none",
                color: "#60a5fa", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              {mode === "save"
                ? (isTh ? "มีแพลนอยู่แล้ว? กู้คืน" : "Have existing plans? Restore")
                : (isTh ? "ต้องการบันทึกแพลนใหม่?" : "Want to save new plans?")}
            </button>

            <button onClick={onClose}
              style={{
                width: "100%", padding: "8px 0",
                background: "none", border: "none",
                color: "#555", fontSize: 12, cursor: "pointer",
              }}>
              {isTh ? "ข้าม" : "Skip"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
