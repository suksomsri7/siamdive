"use client";

import { useParams } from "next/navigation";
import { trackChatTripClick } from "@/lib/analytics/client";

type Props = {
  boatId: string;
  title: string;
  type: string;
  price: number;
  area: string;
  slug: string;
  cover: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Day Trip", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive", LAND_TOUR: "Land Tour", SNORKELING: "Snorkeling",
  SCUBA_COURSES: "Scuba Courses", FREEDIVE_COURSES: "Freedive Courses",
};

export default function ChatTripCard({ boatId, title, type, area, slug, cover }: Props) {
  const lang = (useParams().lang as string) || "en";

  return (
    <a
      href={`/${lang}/trips/${slug}`}
      onClick={() => trackChatTripClick(boatId, slug)}
      style={{
        display: "flex", gap: 12, alignItems: "stretch",
        background: "#111", border: "1px solid #222", borderRadius: 12,
        padding: 0, margin: "8px 0", textDecoration: "none",
        overflow: "hidden", transition: "border-color 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#3b82f6")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#222")}
    >
      {/* Cover image */}
      <div style={{ width: 100, minHeight: 80, flexShrink: 0, position: "relative" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0f172a, #1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
            {type === "LAND_TOUR" ? "🌴" : "🤿"}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: "10px 12px 10px 0", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          {area && <span style={{ fontSize: 10, color: "#93c5fd", fontWeight: 600 }}>{area}</span>}
          <span style={{ fontSize: 9, color: "#555" }}>•</span>
          <span style={{ fontSize: 10, color: "#555" }}>{TYPE_LABEL[type] || type}</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{title}</p>
        <p style={{ fontSize: 11, color: "#60a5fa", marginTop: 4, fontWeight: 600 }}>
          {lang === "th" ? "ดูรายละเอียด →" : "View details →"}
        </p>
      </div>
    </a>
  );
}
