"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { trackChatItinerarySave, trackChatItineraryShare } from "@/lib/analytics/client";

type Activity = {
  icon: string;
  title: string;
  type: string;
  boatId?: string;
  boatSlug?: string;
  boatTitle?: string;
  price?: number;
  note?: string;
};

type Day = {
  day: number;
  date?: string;
  label: string;
  activities: Activity[];
};

type Budget = {
  diving?: number;
  landTour?: number;
  accommodation?: number;
  transport?: number;
  other?: number;
  total?: number;
};

export type ItineraryData = {
  title: string;
  durationDays: number;
  areas: string[];
  days: Day[];
  budget: Budget;
  totalDives: number;
  totalTours: number;
};

export default function ItineraryCard({
  data,
  onSave,
}: {
  data: ItineraryData;
  onSave?: (data: ItineraryData) => void;
}) {
  const lang = (useParams().lang as string) || "en";
  const [saved, setSaved] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleSave = async () => {
    if (saved) return;
    try {
      const res = await fetch("/api/ark-ai/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          lang,
          days: data.days,
          budget: data.budget,
          boatIds: data.days.flatMap(d => d.activities.filter(a => a.boatId).map(a => a.boatId!)),
          blogIds: [],
          totalDives: data.totalDives,
          totalTours: data.totalTours,
          areas: data.areas,
          durationDays: data.durationDays,
        }),
      });
      const result = await res.json();
      if (result.shortId) {
        trackChatItinerarySave(result.shortId);
        const stored = JSON.parse(localStorage.getItem("ark-ai-plans") || "[]");
        stored.unshift(result.shortId);
        localStorage.setItem("ark-ai-plans", JSON.stringify(stored.slice(0, 50)));
        setSaved(true);
        onSave?.(data);
      }
    } catch {}
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      let shortId: string | null = null;
      const stored: string[] = JSON.parse(localStorage.getItem("ark-ai-plans") || "[]");
      if (stored.length && saved) {
        shortId = stored[0];
      } else {
        const res = await fetch("/api/ark-ai/itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title, lang, days: data.days, budget: data.budget,
            boatIds: data.days.flatMap(d => d.activities.filter(a => a.boatId).map(a => a.boatId!)),
            blogIds: [], totalDives: data.totalDives, totalTours: data.totalTours,
            areas: data.areas, durationDays: data.durationDays,
          }),
        });
        const result = await res.json();
        shortId = result.shortId;
        if (shortId) {
          const s = JSON.parse(localStorage.getItem("ark-ai-plans") || "[]");
          s.unshift(shortId);
          localStorage.setItem("ark-ai-plans", JSON.stringify(s.slice(0, 50)));
          setSaved(true);
        }
      }

      if (shortId) {
        trackChatItineraryShare(shortId);
        const url = `${location.origin}/${lang}/plan/${shortId}`;
        if (navigator.share) {
          await navigator.share({ title: data.title, text: `${data.title} — SiamDive`, url });
        } else {
          await navigator.clipboard.writeText(url);
          alert("Link copied!");
        }
      }
    } catch {} finally {
      setSharing(false);
    }
  };

  return (
    <div style={{ margin: "10px 0", background: "#111", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #1a1a1a" }}>
        <p style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>TRIP PLAN</p>
        <p style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", marginTop: 2 }}>{data.title}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "#888" }}>
          <span>{data.durationDays} {lang === "th" ? "วัน" : "days"}</span>
          {data.totalDives > 0 && <span>{data.totalDives} {lang === "th" ? "ไดฟ์" : "dives"}</span>}
          {data.totalTours > 0 && <span>{data.totalTours} {lang === "th" ? "ทัวร์" : "tours"}</span>}
          {data.areas.length > 0 && <span>{data.areas.join(", ")}</span>}
        </div>
      </div>

      {/* Days */}
      <div style={{ padding: "10px 16px" }}>
        {data.days.map((day) => (
          <div key={day.day} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ background: "#1e40af", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>Day {day.day}</span>
              {day.date && <span style={{ fontSize: 11, color: "#666" }}>{day.date}</span>}
              <span style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>{day.label}</span>
            </div>
            {day.activities.map((act, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0 5px 20px" }}>
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.2 }}>{act.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, color: "#ddd" }}>
                    {act.boatSlug ? (
                      <a href={`/${lang}/trips/${act.boatSlug}`} target="_blank" rel="noopener" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>{act.title}</a>
                    ) : act.title}
                  </span>
                  {act.note && <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{act.note}</p>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pricing note */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #1a1a1a" }}>
        <p style={{ fontSize: 12, color: "#888", textAlign: "center" }}>
          {lang === "th" ? "สอบถามราคาและจองได้ที่ SiamDive" : "Contact SiamDive for pricing & booking"}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, padding: "10px 16px", borderTop: "1px solid #1a1a1a" }}>
        <button onClick={handleSave} disabled={saved}
          style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #262626", background: saved ? "#1a2e1a" : "#161616", color: saved ? "#4ade80" : "#ccc", fontSize: 13, fontWeight: 700, cursor: saved ? "default" : "pointer" }}>
          {saved ? (lang === "th" ? "บันทึกแล้ว" : "Saved") : (lang === "th" ? "บันทึก" : "Save")}
        </button>
        <button onClick={handleShare} disabled={sharing}
          style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "#1e40af", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: sharing ? 0.6 : 1 }}>
          {sharing ? "..." : (lang === "th" ? "แชร์" : "Share")}
        </button>
      </div>
    </div>
  );
}
