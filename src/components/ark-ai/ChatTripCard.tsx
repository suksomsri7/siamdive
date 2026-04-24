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
        position: "relative", display: "block", flexShrink: 0, overflow: "hidden",
        borderRadius: 12, width: 130, aspectRatio: "2/3" as const,
        textDecoration: "none",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.8)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Cover */}
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #0f172a, #1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
          {type === "LAND_TOUR" ? "🌴" : "🤿"}
        </div>
      )}

      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.05) 100%)" }} />

      {/* Type badge */}
      <div style={{ position: "absolute", top: 6, left: 6 }}>
        <span style={{
          fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
          padding: "2px 5px", borderRadius: 10, color: "#fff",
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,0.25)",
        }}>
          {TYPE_LABEL[type] || type}
        </span>
      </div>

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 8px 10px" }}>
        {area && <p style={{ fontSize: 9, color: "#93c5fd", marginBottom: 2, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{area}</p>}
        <p style={{
          fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>{title}</p>
      </div>
    </a>
  );
}
