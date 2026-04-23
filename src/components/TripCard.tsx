"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const BOAT_TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Scuba Day Trips", SNORKELING: "Snorkeling", LAND_TOUR: "Land Tour",
  LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort", FREEDIVE: "Freedive",
  SCUBA_COURSES: "Scuba Courses", FREEDIVE_COURSES: "Freedive Courses",
  SCUBA_INSTRUCTOR: "Scuba Dive Instructor", FREEDIVE_INSTRUCTOR: "Freedive Instructor",
};

type TripCardProps = {
  slug: string;
  title: string;
  price: number;
  duration: string;
  type: "DAYTRIP" | "LIVEABOARD";
  destinationName: string;
  imageUrl?: string;
  covers?: string[];
  boatType?: string;
  description?: string;
  variant?: "vertical" | "horizontal";
  // When set, rendered between destination (route) and title (boat name)
  // so the card reads as route / date / boat. Used by the Top Trips row
  // where each card represents a specific schedule departure.
  dateLabel?: string;
  lang?: string;
  onClick?: () => void;
};

export default function TripCard({
  slug, title, price, duration, type, destinationName, imageUrl, covers, boatType, description, variant = "vertical", dateLabel, lang, onClick,
}: TripCardProps) {
  const [hovered, setHovered] = useState(false);
  const isHorizontal = variant === "horizontal";

  // Pick a random cover once on client mount (random per page load)
  const [displayImage, setDisplayImage] = useState<string | undefined>(imageUrl);
  useEffect(() => {
    const pool = covers && covers.length ? covers : (imageUrl ? [imageUrl] : []);
    if (pool.length) setDisplayImage(pool[Math.floor(Math.random() * pool.length)]);
  }, [covers, imageUrl]);

  const cardStyle = isHorizontal ? {
    borderRadius: 12,
    width: "clamp(260px, 28vw, 360px)",
    aspectRatio: "16/9" as const,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    transform: hovered ? "scale(1.04)" : "scale(1)",
    zIndex: hovered ? 20 : 1,
    boxShadow: hovered ? "0 12px 50px rgba(0,0,0,0.9)" : "none",
  } : {
    borderRadius: 12,
    width: "clamp(140px, 14vw, 200px)",
    aspectRatio: "2/3" as const,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    transform: hovered ? "scale(1.08)" : "scale(1)",
    zIndex: hovered ? 20 : 1,
    boxShadow: hovered ? "0 12px 50px rgba(0,0,0,0.9)" : "none",
  };

  const inner = (
    <>
      {displayImage ? (
        <Image src={displayImage} alt={title} fill className="object-cover"
          style={{ transition: "transform 0.4s ease", transform: hovered ? "scale(1.06)" : "scale(1)" }}
          sizes="(max-width: 768px) 50vw, 20vw" />
      ) : (
        <div className="w-full h-full flex items-center justify-center"
          style={{ background: "linear-gradient(160deg, #0f172a, #1e3a5f)", fontSize: 40 }}>🤿</div>
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)" }} />
      <div className="absolute top-2 left-2">
        <span style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", padding: "2px 5px", borderRadius: 10, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)" }}>
          {boatType ? (BOAT_TYPE_LABEL[boatType] || boatType) : (type === "LIVEABOARD" ? "Liveaboard" : "Scuba Day Trips")}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p style={{ fontSize: 10, color: "#93c5fd", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{destinationName}</p>
        {dateLabel && (
          <p style={{ fontSize: 10, color: "#ffffff", fontWeight: 300, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dateLabel}</p>
        )}
        <p style={{ fontSize: isHorizontal ? 14 : 12, fontWeight: 700, lineHeight: 1.35, whiteSpace: dateLabel ? "nowrap" as const : undefined, display: dateLabel ? "block" : "-webkit-box", WebkitLineClamp: dateLabel ? 1 : 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: dateLabel ? "ellipsis" as const : undefined }}>{title}</p>
        {isHorizontal ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            {duration && <span style={{ fontSize: 11, color: "#64748b" }}>{duration}</span>}
            {price > 0 && <span style={{ fontSize: 13, fontWeight: 900, color: "#60a5fa" }}>฿{price.toLocaleString()}</span>}
          </div>
        ) : (description || duration || price > 0) ? (
          <div style={{ maxHeight: hovered ? 80 : 0, opacity: hovered ? 1 : 0, overflow: "hidden", transition: "max-height 0.25s ease, opacity 0.2s ease", marginTop: hovered ? 8 : 0 }}>
            {description && (
              <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{description}</p>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {duration && <span style={{ fontSize: 11, color: "#64748b" }}>{duration}</span>}
              {price > 0 && <span style={{ fontSize: 13, fontWeight: 900, color: "#60a5fa" }}>฿{price.toLocaleString()}</span>}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="relative flex-shrink-0 overflow-hidden cursor-pointer"
        style={cardStyle} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {inner}
      </div>
    );
  }

  return (
    <Link href={`/${lang || "en"}/trips/${slug}`} className="relative flex-shrink-0 overflow-hidden cursor-pointer"
      style={cardStyle} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {inner}
    </Link>
  );
}
