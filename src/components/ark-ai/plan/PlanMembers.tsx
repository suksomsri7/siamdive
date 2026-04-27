"use client";

import { useState } from "react";

type Member = {
  id: string; email: string; name: string | null; role: string; certLevel: string | null;
};

type Props = {
  planId: string;
  deviceId: string;
  lang: string;
  owner: { email: string | null; name: string | null };
  members: Member[];
  onClose: () => void;
};

export default function PlanMembers({ planId, deviceId, lang, owner, members, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [localMembers, setLocalMembers] = useState(members);

  const isTh = lang === "th";

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError(isTh ? "กรุณากรอก email ที่ถูกต้อง" : "Please enter a valid email");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/plans/${planId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, email: trimmed, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error === "forbidden" ? (isTh ? "เฉพาะเจ้าของแพลนเท่านั้น" : "Owner only") : "Error");
        return;
      }
      const newMember = await res.json();
      setLocalMembers((prev) => {
        const idx = prev.findIndex((m) => m.email === newMember.email);
        if (idx >= 0) { const copy = [...prev]; copy[idx] = newMember; return copy; }
        return [...prev, newMember];
      });
      setEmail("");
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (memberEmail: string) => {
    try {
      await fetch(`/api/plans/${planId}/members?deviceId=${encodeURIComponent(deviceId)}&email=${encodeURIComponent(memberEmail)}`, {
        method: "DELETE",
      });
      setLocalMembers((prev) => prev.filter((m) => m.email !== memberEmail));
    } catch {}
  };

  const ROLE_LABEL: Record<string, string> = {
    OWNER: isTh ? "เจ้าของ" : "Owner",
    EDITOR: isTh ? "แก้ไขได้" : "Editor",
    VIEWER: isTh ? "ดูอย่างเดียว" : "Viewer",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(0,0,0,0.7)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1401,
        background: "#111", borderRadius: "16px 16px 0 0",
        maxHeight: "80vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5" }}>
              {isTh ? "สมาชิก" : "Members"}
            </p>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
          </div>
        </div>

        {/* Members list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {/* Owner */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#e5e5e5", border: "2px solid #333", flexShrink: 0 }}>
              {(owner.name || owner.email || "O")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {owner.name || owner.email || (isTh ? "คุณ" : "You")}
              </p>
              {owner.email && <p style={{ fontSize: 11, color: "#555" }}>{owner.email}</p>}
            </div>
            <span style={{ fontSize: 10, color: "#888", background: "#1a1a1a", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
              {ROLE_LABEL.OWNER}
            </span>
          </div>

          {/* Members */}
          {localMembers.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #0f0f0f" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#888", border: "2px solid #333", flexShrink: 0 }}>
                {(m.name || m.email)[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.name || m.email.split("@")[0]}
                </p>
                <p style={{ fontSize: 11, color: "#555" }}>{m.email}</p>
                {m.certLevel && <p style={{ fontSize: 10, color: "#10b981" }}>🤿 {m.certLevel}</p>}
              </div>
              <span style={{ fontSize: 10, color: "#888", background: "#1a1a1a", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                {ROLE_LABEL[m.role] || m.role}
              </span>
              <button onClick={() => handleRemove(m.email)}
                style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #262626", background: "transparent", color: "#555", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Invite form */}
        <div style={{ padding: "16px 20px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid #1a1a1a", flexShrink: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>
            {isTh ? "เชิญสมาชิก" : "Invite Member"}
          </p>
          <div style={{ marginBottom: 8 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #262626", color: "#f5f5f5", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
              style={{ padding: "10px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #262626", color: "#f5f5f5", fontSize: 13, fontFamily: "inherit", outline: "none" }}
            >
              <option value="EDITOR">{ROLE_LABEL.EDITOR}</option>
              <option value="VIEWER">{ROLE_LABEL.VIEWER}</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={sending || !email.trim()}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                background: email.trim() ? "#1e40af" : "#1a1a1a",
                color: email.trim() ? "#fff" : "#555", fontSize: 13, fontWeight: 700,
                cursor: email.trim() ? "pointer" : "default",
              }}
            >
              {sending ? "..." : (isTh ? "เชิญ" : "Invite")}
            </button>
          </div>
          {error && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>{error}</p>}
        </div>
      </div>
    </>
  );
}
