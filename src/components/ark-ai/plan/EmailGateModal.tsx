"use client";

import { useState } from "react";
import { attachEmail } from "@/lib/plan-store";
import { t } from "@/lib/ark-ai/i18n";

type Props = {
  lang: string;
  onSuccess: (email: string, name: string | null) => void;
  onClose: () => void;
};

export default function EmailGateModal({ lang, onSuccess, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const L = (key: Parameters<typeof t>[1]) => t(lang, key);

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(L("invalidEmailFull"));
      return;
    }
    setSaving(true);
    setError("");
    const ok = await attachEmail(trimmed, name.trim() || undefined);
    if (ok) {
      onSuccess(trimmed, name.trim() || null);
    } else {
      setError(L("somethingWentWrongLong"));
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(0,0,0,0.7)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1401,
        background: "#111", borderRadius: "16px 16px 0 0",
        padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5" }}>
            {L("linkYourEmail")}
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 20 }}>
          {L("linkEmailReason")}
        </p>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={L("yourName")}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 10,
            background: "#0a0a0a", border: "1px solid #262626",
            color: "#f5f5f5", fontSize: 14, fontFamily: "inherit", outline: "none",
            boxSizing: "border-box", marginBottom: 10,
          }}
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder={L("yourEmail")}
          type="email"
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 10,
            background: "#0a0a0a", border: "1px solid #262626",
            color: "#f5f5f5", fontSize: 14, fontFamily: "inherit", outline: "none",
            boxSizing: "border-box",
          }}
        />

        {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving || !email.trim()}
          style={{
            width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 10,
            border: "none", fontSize: 14, fontWeight: 700, cursor: email.trim() ? "pointer" : "default",
            background: email.trim() ? "#1e40af" : "#1a1a1a",
            color: email.trim() ? "#fff" : "#555",
          }}
        >
          {saving ? "..." : L("confirm")}
        </button>
      </div>
    </>
  );
}
