"use client";

import { useState } from "react";
import PlanTimeline from "@/components/ark-ai/plan/PlanTimeline";
import PrepBlock from "@/components/ark-ai/plan/PrepBlock";
import type { PlanTrip } from "@/lib/plan-store";

type Trip = {
  boatId: string; title: string; slug?: string; type: string; area?: string; cover?: string;
  addedAt?: number; schedule?: PlanTrip["schedule"]; note?: string;
};

type Props = {
  plan: {
    shortId: string; name: string; coverUrl: string | null;
    status: string; trips: Trip[]; ownerName: string | null;
    memberCount: number; createdAt: string;
  };
  currentLang: string;
};

const TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Day Trip", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive", LAND_TOUR: "Land Tour", SNORKELING: "Snorkeling",
};

const STATUS_LABEL: Record<string, { th: string; en: string; color: string }> = {
  PLANNING: { th: "กำลังวางแผน", en: "Planning", color: "#f59e0b" },
  CONFIRMED: { th: "ยืนยันแล้ว", en: "Confirmed", color: "#10b981" },
  COMPLETED: { th: "เสร็จแล้ว", en: "Completed", color: "#8b5cf6" },
};

export default function SharedPlanClient({ plan, currentLang }: Props) {
  const [copied, setCopied] = useState(false);
  const isTh = currentLang === "th";

  const cover = plan.coverUrl || plan.trips.find(t => t.cover)?.cover;
  const status = STATUS_LABEL[plan.status] || STATUS_LABEL.PLANNING;
  const createdDate = new Date(plan.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const handleShare = async () => {
    const url = `${location.origin}/${currentLang}/plan/${plan.shortId}`;
    if (navigator.share) {
      await navigator.share({ title: plan.name, text: `${plan.name} — SiamDive`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingTop: 60 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Hero */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg, #0f172a, #1e3a5f)", marginBottom: 20 }}>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${status.color}22`, border: `1px solid ${status.color}44`, padding: "2px 10px", borderRadius: 12, marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: status.color }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: status.color }}>{isTh ? status.th : status.en}</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>{plan.name}</h1>
          </div>
        </div>

        {/* Info strip */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 24 }}>
          {[
            { label: isTh ? "ทริป" : "Trips", value: plan.trips.length, icon: "🗺" },
            { label: isTh ? "สมาชิก" : "Members", value: plan.memberCount, icon: "👤" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 20 }}>{s.icon}</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#f5f5f5" }}>{s.value}</p>
              <p style={{ fontSize: 10, color: "#666" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Trips timeline */}
        {plan.trips.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", marginBottom: 10 }}>
              {isTh ? "ทริปในแพลน" : "Trips in this plan"}
            </p>
            <PlanTimeline
              planId={plan.shortId}
              trips={plan.trips.map(t => ({
                boatId: t.boatId,
                title: t.title,
                slug: t.slug || "",
                type: t.type,
                area: t.area || "",
                cover: t.cover || null,
                addedAt: t.addedAt || 0,
                schedule: t.schedule,
                note: t.note,
              }))}
              lang={currentLang}
              canEdit={false}
            />
            <div style={{ marginTop: 18 }}>
              <PrepBlock
                trips={plan.trips.map(t => ({
                  boatId: t.boatId,
                  title: t.title,
                  slug: t.slug || "",
                  type: t.type,
                  area: t.area || "",
                  cover: t.cover || null,
                  addedAt: t.addedAt || 0,
                  schedule: t.schedule,
                  note: t.note,
                }))}
                lang={currentLang}
              />
            </div>
          </div>
        )}

        {/* Meta */}
        <div style={{ textAlign: "center", fontSize: 11, color: "#444", marginBottom: 24 }}>
          {plan.ownerName && <span>{isTh ? "สร้างโดย" : "Created by"} {plan.ownerName} · </span>}
          <span>{createdDate}</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleShare}
            style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "1px solid #262626", background: "#161616", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {copied ? (isTh ? "คัดลอกลิงก์แล้ว!" : "Link Copied!") : (isTh ? "แชร์" : "Share")}
          </button>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a href={`/${currentLang}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            {isTh ? "สร้างแพลนของคุณเอง" : "Create your own plan with SIAM AI"}
          </a>
        </div>
      </div>
    </div>
  );
}
