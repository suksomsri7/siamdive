"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { trackChatTripClick } from "@/lib/analytics/client";
import { hasTripInPlan } from "@/lib/plan-store";

type Props = {
  boatId: string;
  title: string;
  type: string;
  price: number;
  area: string;
  slug: string;
  cover: string | null;
  onSelectTrip?: (trip: { boatId: string; title: string; slug: string; type: string; area: string; cover: string | null }) => void;
};

const TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Day Trip", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive", LAND_TOUR: "Land Tour", SNORKELING: "Snorkeling",
  SCUBA_COURSES: "Scuba Courses", FREEDIVE_COURSES: "Freedive Courses",
};

const coverCache = new Map<string, string>();

export default function ChatTripCard({ boatId, title, type, area, slug, cover, onSelectTrip }: Props) {
  const lang = (useParams().lang as string) || "en";
  const [inPlan, setInPlan] = useState(() => hasTripInPlan(boatId));
  const [imgSrc, setImgSrc] = useState<string | null>(cover || coverCache.get(boatId) || null);

  useEffect(() => {
    const fn = () => setInPlan(hasTripInPlan(boatId));
    window.addEventListener("myplan-change", fn);
    return () => window.removeEventListener("myplan-change", fn);
  }, [boatId]);

  useEffect(() => {
    if (imgSrc || !boatId) return;
    if (coverCache.has(boatId)) { setImgSrc(coverCache.get(boatId)!); return; }
    fetch(`/api/boats/by-ids?ids=${boatId}&lang=${lang}`)
      .then(r => r.json())
      .then((data: { covers?: string[]; imageUrl?: string }[]) => {
        const url = data?.[0]?.covers?.[0] || data?.[0]?.imageUrl || null;
        if (url) { coverCache.set(boatId, url); setImgSrc(url); }
      })
      .catch(() => {});
  }, [boatId, lang, imgSrc]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inPlan) return;
    if (onSelectTrip) {
      onSelectTrip({ boatId, title, slug, type, area, cover: imgSrc });
    }
  };

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
      {imgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
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

      {/* Add to plan button — prominent */}
      <button
        onClick={handleAdd}
        disabled={inPlan}
        style={{
          position: "absolute", top: 4, right: 4,
          width: 28, height: 28,
          borderRadius: "50%",
          border: inPlan ? "2px solid rgba(74,222,128,0.6)" : "2px solid rgba(255,255,255,0.5)",
          cursor: inPlan ? "default" : "pointer",
          background: inPlan ? "rgba(74,222,128,0.85)" : "rgba(59,130,246,0.85)",
          backdropFilter: "blur(4px)",
          color: "#fff",
          fontSize: 16,
          fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.15s, background 0.15s",
          boxShadow: inPlan ? "none" : "0 2px 8px rgba(59,130,246,0.4)",
        }}
        onMouseEnter={e => { if (!inPlan) e.currentTarget.style.transform = "scale(1.15)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {inPlan ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        )}
      </button>

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
