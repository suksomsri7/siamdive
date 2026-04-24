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
};

export default function ChatTripCard({ boatId, title, type, price, area, slug, cover }: Props) {
  const lang = (useParams().lang as string) || "en";

  return (
    <a
      href={`/${lang}/trips/${slug}`}
      onClick={() => trackChatTripClick(boatId, slug)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#161616", border: "1px solid #262626", borderRadius: 10,
        padding: 10, margin: "8px 0", textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#3b82f6")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#262626")}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 56, height: 42, background: "#222", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {type === "LAND_TOUR" ? "🌴" : "🤿"}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {area && <p style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{area}</p>}
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
        <p style={{ fontSize: 10, color: "#666" }}>{TYPE_LABEL[type] || type}</p>
      </div>
      {price > 0 && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 8, color: "#555", fontWeight: 700 }}>FROM</p>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#60a5fa" }}>{"฿"}{price.toLocaleString()}</p>
        </div>
      )}
    </a>
  );
}
