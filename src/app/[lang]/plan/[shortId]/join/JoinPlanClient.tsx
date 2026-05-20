"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PlanTimeline from "@/components/ark-ai/plan/PlanTimeline";
import PrepBlock from "@/components/ark-ai/plan/PrepBlock";
import type { PlanTrip } from "@/lib/plan-store";
import type { PlanItem } from "@/components/ark-ai/plan/PlanItemsBlock";

type Plan = {
  id: string;
  shortId: string;
  name: string;
  coverUrl: string | null;
  status: string;
  trips: unknown[];
  items: PlanItem[];
  tripCount: number;
  memberCount: number;
  ownerName: string | null;
  role: "VIEWER" | "EDITOR";
  createdAt: string;
};

type Props = {
  lang: string;
  token: string;
  plan: Plan;
};

const T: Record<string, Record<string, string>> = {
  invited:     { th: "ขอเชิญร่วมแผนทริปดำน้ำ",  en: "You're invited to a trip plan" },
  by:          { th: "โดย",                       en: "by" },
  trips:       { th: "ทริป",                      en: "trips" },
  members:     { th: "สมาชิก",                    en: "members" },
  role_view:   { th: "ดูได้อย่างเดียว",            en: "View access" },
  role_edit:   { th: "ปรับเปลี่ยนได้",             en: "Edit access" },
  join:        { th: "ร่วมแผน",                   en: "Join" },
  copy:        { th: "Copy เป็นแผนของฉัน",        en: "Copy as mine" },
  joinTitle:   { th: "ร่วมแผนนี้",                en: "Join this plan" },
  joinDesc:    { th: "เห็นแผนเดียวกันทุกคน อัปเดต real-time", en: "See the same plan, real-time updates" },
  copyTitle:   { th: "Copy เป็นแผนของฉัน",        en: "Copy as my own plan" },
  copyDesc:    { th: "Fork เป็นแผนใหม่ของตัวเอง แก้ไขได้อิสระ", en: "Fork a private copy you can edit alone" },
  yourName:    { th: "ชื่อของคุณ",                en: "Your name" },
  email:       { th: "อีเมล",                     en: "Email" },
  emailPh:     { th: "you@example.com",           en: "you@example.com" },
  namePh:      { th: "ชื่อเล่นก็ได้",              en: "Nickname is fine" },
  emailReq:    { th: "กรุณากรอกอีเมล",            en: "Email is required" },
  submit:      { th: "ยืนยัน",                    en: "Continue" },
  cancel:      { th: "ยกเลิก",                    en: "Cancel" },
  loadingJoin: { th: "กำลังเข้าร่วม…",             en: "Joining…" },
  loadingCopy: { th: "กำลังคัดลอก…",               en: "Copying…" },
  err:         { th: "ลองอีกครั้งครับ",            en: "Something went wrong, try again" },
  tripsHead:   { th: "ทริปในแพลน",                en: "Trips in this plan" },
  createdBy:   { th: "สร้างโดย",                   en: "Created by" },
};
const L = (k: keyof typeof T, lang: string) => T[k][lang] || T[k].en;

type Mode = "join";

const STATUS_LABEL: Record<string, { th: string; en: string; color: string }> = {
  PLANNING:  { th: "กำลังวางแผน", en: "Planning",  color: "#f59e0b" },
  CONFIRMED: { th: "ยืนยันแล้ว",   en: "Confirmed", color: "#10b981" },
  COMPLETED: { th: "เสร็จแล้ว",    en: "Completed", color: "#8b5cf6" },
};

export default function JoinPlanClient({ lang, token, plan }: Props) {
  const router = useRouter();
  const isTh = lang === "th";
  const [mode, setMode]       = useState<Mode | null>(null);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Recipient is purely a viewer of the preview — never an editor of the
  // owner's plan. They become an EDITOR only AFTER tapping Join with an
  // EDITOR token. Until then PlanTimeline is read-only.
  const canEdit = false;

  const trips = (plan.trips as PlanTrip[]) || [];
  const status = STATUS_LABEL[plan.status] || STATUS_LABEL.PLANNING;
  // Fall back to the first trip's cover when the plan itself has none —
  // matches what SharedPlanClient does so the hero never renders empty.
  const cover = plan.coverUrl || trips.find(t => t.cover)?.cover || null;
  const createdDate = new Date(plan.createdAt).toLocaleDateString(isTh ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError(L("emailReq", lang)); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/plans/share/${token}/join`, {
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
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5", paddingBottom: 120 }}>
      <style>{`
        @keyframes joinBannerSlide { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes joinModalIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Sticky invite bar. Just the Join CTA — no role chip, no Copy.
          The recipient came here to join; everything else is noise. */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "10px 14px",
        animation: "joinBannerSlide 0.3s ease-out both",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <button onClick={() => { setMode("join"); setError(null); }}
            style={{
              padding: "9px 22px", borderRadius: 8,
              background: "#3b82f6", border: "1px solid #2563eb",
              color: "#fff", fontSize: 13, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 1px 6px rgba(59,130,246,0.35)",
            }}>
            {L("join", lang)}
          </button>
        </div>
      </div>

      {/* Plan preview — matches MyPlan layout: cover hero, info strip, trips
          timeline, prep block. Read-only via canEdit=false. */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 60px" }}>

        {/* Hero */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg, #0f172a, #1e3a5f)", marginBottom: 18 }}>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${status.color}22`, border: `1px solid ${status.color}44`, padding: "2px 10px", borderRadius: 12, marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: status.color }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: status.color }}>{isTh ? status.th : status.en}</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.2 }}>{plan.name}</h1>
          </div>
        </div>

        {/* Trips timeline (read-only) */}
        {trips.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
              {L("tripsHead", lang)}
            </p>
            <PlanTimeline
              planId={plan.id}
              trips={trips}
              items={plan.items}
              lang={lang}
              canEdit={canEdit}
            />
          </div>
        )}

        {/* Prep block */}
        {trips.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <PrepBlock trips={trips} lang={lang} />
          </div>
        )}

        {/* Meta */}
        <div style={{ textAlign: "center", fontSize: 11, color: "#555", margin: "24px 0 0" }}>
          {plan.ownerName && <span>{L("createdBy", lang)} <span style={{ color: "#888" }}>{plan.ownerName}</span> · </span>}
          <span>{createdDate}</span>
        </div>
      </div>

      {/* Name + email modal */}
      {mode && (
        <div
          onClick={() => { if (!loading) { setMode(null); setError(null); } }}
          style={{
            position: "fixed", inset: 0, zIndex: 1200,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 420,
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 20,
              animation: "joinModalIn 0.22s ease-out both",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
              🤝 {L("joinTitle", lang)}
            </p>
            <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 16px", lineHeight: 1.45 }}>
              {L("joinDesc", lang)}
            </p>

            <label style={{ display: "block", fontSize: 12, color: "#aaa", margin: "0 0 4px" }}>
              {L("yourName", lang)}
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={L("namePh", lang)} style={inputStyle} />

            <label style={{ display: "block", fontSize: 12, color: "#aaa", margin: "12px 0 4px" }}>
              {L("email", lang)} *
            </label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={L("emailPh", lang)}
              type="email" required style={inputStyle} />

            {error && (
              <p style={{ fontSize: 12, color: "#ef4444", margin: "10px 0 0" }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button type="button" onClick={() => { setMode(null); setError(null); }} disabled={loading}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#aaa", cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                }}>
                {L("cancel", lang)}
              </button>
              <button type="submit" disabled={loading}
                style={{
                  flex: 2, padding: "12px", borderRadius: 10,
                  background: loading ? "#475569" : "#3b82f6",
                  border: "none", color: "#fff",
                  cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
                  fontSize: 13, fontWeight: 800,
                }}>
                {loading ? L("loadingJoin", lang) : L("submit", lang)}
              </button>
            </div>
          </form>
        </div>
      )}
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
