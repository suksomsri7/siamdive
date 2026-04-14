"use client";

import { useState } from "react";
import TripPullUp from "@/components/TripPullUp";

export type TripListItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  duration: string;
  type: "DAYTRIP" | "LIVEABOARD";
  destinationName: string;
  imageUrl?: string;
  description?: string;
  nextDeparture?: string | null;
  nextStatus?: string | null;
};

type PullUpTrip = {
  slug: string; title: string; description?: string; price: number;
  duration: string; type: "DAYTRIP" | "LIVEABOARD"; destinationName: string;
  imageUrl?: string; boatId?: string;
};

function TripListCard({ trip, onClick }: { trip: TripListItem; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#111",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${hovered ? "#1e3a5f" : "#1a1a1a"}`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.7)" : "none",
      }}
    >
      {/* Image */}
      <div style={{ aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
        {trip.imageUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={trip.imageUrl} alt={trip.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease", transform: hovered ? "scale(1.05)" : "scale(1)" }} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#0f172a,#1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🤿</div>
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />

        {/* Status badge */}
        {trip.nextStatus === "OPEN" && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: "rgba(20,83,45,0.9)", color: "#4ade80",
          }}>Open</span>
        )}
        {trip.nextStatus === "FULL" && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: "rgba(69,26,3,0.9)", color: "#fbbf24",
          }}>Full</span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 18px" }}>
        {trip.destinationName && (
          <p style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{trip.destinationName}</p>
        )}
        <h3 style={{
          fontSize: 15, fontWeight: 800, lineHeight: 1.3, color: "#e5e5e5", marginBottom: 7,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{trip.title}</h3>
        {trip.description && (
          <p style={{
            fontSize: 12, color: "#555", lineHeight: 1.55, marginBottom: 10,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{trip.description}</p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, flexWrap: "wrap", gap: 6 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {trip.duration && <span style={{ fontSize: 11, color: "#444" }}>{trip.duration}</span>}
            {trip.nextDeparture && (
              <span style={{ fontSize: 11, color: "#555" }}>
                {new Date(trip.nextDeparture).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
          {trip.price > 0 && (
            <span style={{ fontSize: 16, fontWeight: 900, color: "#60a5fa" }}>฿{trip.price.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TripListClient({ label, trips }: { label: string; trips: TripListItem[] }) {
  const [selected, setSelected] = useState<PullUpTrip | null>(null);

  const openTrip = (trip: TripListItem) => {
    setSelected({
      slug: trip.slug,
      title: trip.title,
      description: trip.description,
      price: trip.price,
      duration: trip.duration,
      type: trip.type,
      destinationName: trip.destinationName,
      imageUrl: trip.imageUrl,
      boatId: trip.id,
    });
  };

  return (
    <>
      {/* Page header */}
      <div style={{ paddingTop: 96, paddingBottom: 36, paddingLeft: 24, paddingRight: 24, background: "linear-gradient(to bottom, rgba(59,130,246,0.06), transparent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>SIAMDIVE</p>
          <h1 style={{ fontSize: "clamp(1.8rem,5vw,3rem)", fontWeight: 900, color: "#fff", marginBottom: 8 }}>{label}</h1>
          <p style={{ fontSize: 13, color: "#333" }}>{trips.length} {trips.length === 1 ? "trip" : "trips"} available</p>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 24px 80px" }}>
        {trips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#2a2a2a", fontSize: 14 }}>
            ยังไม่มีทริปในหมวดนี้
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {trips.map(trip => (
              <TripListCard key={trip.id} trip={trip} onClick={() => openTrip(trip)} />
            ))}
          </div>
        )}
      </div>

      <TripPullUp trip={selected} onClose={() => setSelected(null)} />
    </>
  );
}
