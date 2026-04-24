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

export default function ChatTripCard({ boatId, title, type, price, area, slug, cover }: Props) {
  const lang = (useParams().lang as string) || "en";

  return (
    <a
      href={`/${lang}/trips/${slug}`}
      onClick={() => trackChatTripClick(boatId, slug)}
      style={{
        display: "block", position: "relative", overflow: "hidden",
        borderRadius: 12, margin: "8px 0", textDecoration: "none",
        aspectRatio: "16/9", width: "100%",
        border: "1px solid #262626",
        transition: "border-color 0.2s, transform 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.transform = "scale(1.02)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#262626"; e.currentTarget.style.transform = "scale(1)"; }}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #0f172a, #1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
          {type === "LAND_TOUR" ? "🌴" : "🤿"}
        </div>
      )}

      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.05) 100%)" }} />

      {/* Type badge */}
      <div style={{ position: "absolute", top: 8, left: 8 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
          padding: "3px 8px", borderRadius: 10,
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,0.25)", color: "#fff",
        }}>
          {TYPE_LABEL[type] || type}
        </span>
      </div>

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12 }}>
        {area && <p style={{ fontSize: 11, color: "#93c5fd", marginBottom: 2, fontWeight: 600 }}>{area}</p>}
        <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{title}</p>
        {price > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 9, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>From</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#60a5fa" }}>{"฿"}{price.toLocaleString()}</span>
          </div>
        )}
      </div>
    </a>
  );
}
