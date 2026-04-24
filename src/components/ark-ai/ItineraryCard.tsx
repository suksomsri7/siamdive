"use client";

import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
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
  const [shortId, setShortId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const ensureSaved = useCallback(async (): Promise<string | null> => {
    if (shortId) return shortId;
    setSaving(true);
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
        if (!stored.includes(result.shortId)) {
          stored.unshift(result.shortId);
          localStorage.setItem("ark-ai-plans", JSON.stringify(stored.slice(0, 50)));
        }
        setShortId(result.shortId);
        onSave?.(data);
        return result.shortId;
      }
    } catch {} finally {
      setSaving(false);
    }
    return null;
  }, [shortId, data, lang, onSave]);

  const handleViewDetails = async () => {
    const id = await ensureSaved();
    if (id) window.open(`/${lang}/plan/${id}`, "_blank");
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const id = await ensureSaved();
      if (id) {
        trackChatItineraryShare(id);
        const url = `${location.origin}/${lang}/plan/${id}`;
        if (navigator.share) {
          await navigator.share({ title: data.title, text: `${data.title} — SiamDive`, url });
        } else {
          await navigator.clipboard.writeText(url);
          alert(lang === "th" ? "คัดลอกลิงก์แล้ว!" : "Link copied!");
        }
      }
    } catch {} finally {
      setSharing(false);
    }
  };

  const totalActivities = data.days.reduce((sum, d) => sum + d.activities.length, 0);

  return (
    <div style={{ margin: "10px 0", background: "#111", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px" }}>
        <p style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>TRIP PLAN</p>
        <p style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", marginTop: 4 }}>{data.title}</p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#888", background: "#1a1a1a", padding: "3px 10px", borderRadius: 8 }}>
            {data.durationDays} {lang === "th" ? "วัน" : "days"}
          </span>
          {data.totalDives > 0 && (
            <span style={{ fontSize: 11, color: "#60a5fa", background: "rgba(96,165,250,0.1)", padding: "3px 10px", borderRadius: 8 }}>
              {data.totalDives} {lang === "th" ? "ไดฟ์" : "dives"}
            </span>
          )}
          {data.totalTours > 0 && (
            <span style={{ fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "3px 10px", borderRadius: 8 }}>
              {data.totalTours} {lang === "th" ? "ทัวร์" : "tours"}
            </span>
          )}
          {data.areas.length > 0 && (
            <span style={{ fontSize: 11, color: "#888", background: "#1a1a1a", padding: "3px 10px", borderRadius: 8 }}>
              {data.areas.join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Day summary - compact */}
      <div style={{ padding: "0 16px 12px" }}>
        {data.days.map((day) => (
          <div key={day.day} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: day.day < data.days.length ? "1px solid #1a1a1a" : "none" }}>
            <span style={{ background: "#1e40af", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, flexShrink: 0 }}>
              D{day.day}
            </span>
            <span style={{ fontSize: 12, color: "#ccc", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {day.label}
            </span>
            <span style={{ fontSize: 11, color: "#666", flexShrink: 0 }}>
              {day.activities.length} {lang === "th" ? "กิจกรรม" : "activities"}
            </span>
          </div>
        ))}
      </div>

      {/* View details button - primary CTA */}
      <div style={{ padding: "0 16px 12px" }}>
        <button
          onClick={handleViewDetails}
          disabled={saving}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #1e40af, #3b82f6)", color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1, transition: "opacity 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {saving ? (lang === "th" ? "กำลังบันทึก..." : "Saving...") : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {lang === "th" ? "ดูรายละเอียดแผนทริป" : "View full trip plan"}
            </>
          )}
        </button>
      </div>

      {/* Secondary actions */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>
        <button
          onClick={() => ensureSaved()}
          disabled={!!shortId || saving}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8,
            border: "1px solid #262626",
            background: shortId ? "#1a2e1a" : "#161616",
            color: shortId ? "#4ade80" : "#ccc",
            fontSize: 12, fontWeight: 600, cursor: shortId ? "default" : "pointer",
          }}
        >
          {shortId ? (lang === "th" ? "บันทึกแล้ว ✓" : "Saved ✓") : (lang === "th" ? "บันทึก" : "Save")}
        </button>
        <button
          onClick={handleShare}
          disabled={sharing}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8,
            border: "1px solid #262626", background: "#161616",
            color: "#ccc", fontSize: 12, fontWeight: 600,
            cursor: "pointer", opacity: sharing ? 0.6 : 1,
          }}
        >
          {sharing ? "..." : (lang === "th" ? "แชร์" : "Share")}
        </button>
      </div>
    </div>
  );
}
