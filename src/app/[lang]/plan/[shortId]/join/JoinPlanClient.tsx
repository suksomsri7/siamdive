"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Plan = {
  shortId: string;
  name: string;
  coverUrl: string | null;
  tripCount: number;
  memberCount: number;
  ownerName: string | null;
  role: "VIEWER" | "EDITOR";
};

type Props = {
  lang: string;
  token: string;
  plan: Plan;
};

const T: Record<string, Record<string, string>> = {
  title:       { th: "ขอชวนมาร่วมแผนทริปดำน้ำ", en: "You're invited to a trip plan" },
  by:          { th: "โดย",                       en: "by" },
  trips:       { th: "ทริป",                      en: "trips" },
  members:     { th: "สมาชิก",                    en: "members" },
  role_view:   { th: "ดูได้อย่างเดียว",            en: "View access" },
  role_edit:   { th: "ปรับเปลี่ยนได้",             en: "Edit access" },
  choose:      { th: "เลือกวิธีร่วมแผน",          en: "Choose how to join" },
  join:        { th: "ร่วมแผนนี้",                en: "Join this plan" },
  joinDesc:    { th: "เห็นแผนเดียวกัน อัปเดต real-time", en: "Same plan, real-time sync" },
  copy:        { th: "Copy เป็นแผนของฉัน",        en: "Copy as my own plan" },
  copyDesc:    { th: "แยกแผนใหม่ของตัวเอง แก้ไขได้อิสระ", en: "Fork a private copy you can edit" },
  yourName:    { th: "ชื่อของคุณ",                en: "Your name" },
  email:       { th: "อีเมล",                     en: "Email" },
  emailPh:     { th: "you@example.com",           en: "you@example.com" },
  namePh:      { th: "ชื่อเล่นก็ได้",              en: "Nickname is fine" },
  emailReq:    { th: "กรุณากรอกอีเมล",            en: "Email is required" },
  submit:      { th: "ยืนยัน",                    en: "Continue" },
  cancel:      { th: "ยกเลิก",                    en: "Cancel" },
  loading:     { th: "กำลังเข้าร่วม…",             en: "Joining…" },
  copying:     { th: "กำลังคัดลอก…",               en: "Copying…" },
  err:         { th: "ลองอีกครั้งครับ",            en: "Something went wrong, try again" },
};
const L = (k: keyof typeof T, lang: string) => T[k][lang] || T[k].en;

type Mode = "join" | "copy";

export default function JoinPlanClient({ lang, token, plan }: Props) {
  const router = useRouter();
  const [mode, setMode]       = useState<Mode | null>(null);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError(L("emailReq", lang)); return; }
    setLoading(true);
    setError(null);
    try {
      const path = mode === "join" ? "join" : "copy";
      const res = await fetch(`/api/plans/share/${token}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, email: email.trim() }),
      });
      if (!res.ok) { setError(L("err", lang)); setLoading(false); return; }
      const data = await res.json() as { shortId: string };
      router.replace(`/${lang}/plan/${data.shortId}`);
    } catch {
      setError(L("err", lang));
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0d0d0d",
      color: "#e5e5e5",
      padding: "32px 20px 60px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Cover image */}
        {plan.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plan.coverUrl} alt=""
            style={{ width: "100%", aspectRatio: "21/9", objectFit: "cover", borderRadius: 14 }} />
        ) : (
          <div style={{
            width: "100%", aspectRatio: "21/9",
            background: "linear-gradient(135deg,#0f172a,#1e3a5f)",
            borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 48,
          }}>🤿</div>
        )}

        <p style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.08em", margin: "20px 0 4px" }}>
          {L("title", lang)}
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 6px", lineHeight: 1.2 }}>
          {plan.name}
        </h1>
        <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
          {plan.ownerName && <>{L("by", lang)} <span style={{ color: "#ddd" }}>{plan.ownerName}</span> · </>}
          {plan.tripCount} {L("trips", lang)} · {plan.memberCount} {L("members", lang)}
        </p>
        <span style={{
          display: "inline-block", marginTop: 10,
          padding: "3px 9px", borderRadius: 999,
          fontSize: 11, fontWeight: 700,
          background: plan.role === "EDITOR" ? "rgba(245,158,11,0.18)" : "rgba(59,130,246,0.18)",
          color: plan.role === "EDITOR" ? "#fbbf24" : "#93c5fd",
          border: `1px solid ${plan.role === "EDITOR" ? "rgba(245,158,11,0.4)" : "rgba(96,165,250,0.4)"}`,
        }}>
          {plan.role === "EDITOR" ? `✏️ ${L("role_edit", lang)}` : `👁 ${L("role_view", lang)}`}
        </span>

        {/* Mode picker — Join (shared) vs Copy (fork) */}
        {!mode && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", margin: "28px 0 10px" }}>
              {L("choose", lang)}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => setMode("join")}
                style={{
                  textAlign: "left", padding: "14px 16px", borderRadius: 12,
                  background: "rgba(59,130,246,0.14)",
                  border: "1px solid rgba(96,165,250,0.35)",
                  color: "#fff", cursor: "pointer", fontFamily: "inherit",
                }}>
                <p style={{ fontSize: 14, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🤝</span> {L("join", lang)}
                </p>
                <p style={{ fontSize: 12, color: "#bfdbfe", margin: "3px 0 0" }}>
                  {L("joinDesc", lang)}
                </p>
              </button>
              <button onClick={() => setMode("copy")}
                style={{
                  textAlign: "left", padding: "14px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff", cursor: "pointer", fontFamily: "inherit",
                }}>
                <p style={{ fontSize: 14, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📋</span> {L("copy", lang)}
                </p>
                <p style={{ fontSize: 12, color: "#888", margin: "3px 0 0" }}>
                  {L("copyDesc", lang)}
                </p>
              </button>
            </div>
          </>
        )}

        {/* Name + email form */}
        {mode && (
          <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
              {mode === "join" ? `🤝 ${L("join", lang)}` : `📋 ${L("copy", lang)}`}
            </p>

            <label style={{ display: "block", fontSize: 12, color: "#aaa", margin: "0 0 4px" }}>{L("yourName", lang)}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={L("namePh", lang)}
              style={inputStyle} />

            <label style={{ display: "block", fontSize: 12, color: "#aaa", margin: "12px 0 4px" }}>{L("email", lang)} *</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={L("emailPh", lang)}
              type="email" required style={inputStyle} />

            {error && (
              <p style={{ fontSize: 12, color: "#ef4444", margin: "10px 0 0" }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button type="button" onClick={() => { setMode(null); setError(null); }}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#aaa", cursor: "pointer", fontFamily: "inherit",
                  fontSize: 13, fontWeight: 700,
                }}>
                {L("cancel", lang)}
              </button>
              <button type="submit" disabled={loading}
                style={{
                  flex: 2, padding: "12px", borderRadius: 10,
                  background: loading ? "#475569" : (mode === "join" ? "#3b82f6" : "#10b981"),
                  border: "none", color: "#fff",
                  cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
                  fontSize: 13, fontWeight: 800,
                }}>
                {loading ? (mode === "join" ? L("loading", lang) : L("copying", lang)) : L("submit", lang)}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff", fontFamily: "inherit", fontSize: 14,
  outline: "none",
};
