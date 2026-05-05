"use client";

import { useState, useMemo } from "react";
import { getTripTemplate, type CertLevel } from "@/lib/ark-ai/trip-prep-templates";
import type { PlanTrip } from "@/lib/plan-store";

type Props = {
  trips: PlanTrip[];
  cert?: CertLevel;
  lang: string;
};

const HEADER = {
  th: "การเตรียมตัว", en: "Prepare for the trip",
  cn: "行前准备", de: "Vorbereitung", fr: "Préparation",
  ru: "Подготовка", ko: "준비물", ja: "持ち物・準備",
};
const SUBLINE = {
  th: "เช็กลิสต์ก่อนเดินทาง — ปรับตามประเภททริปและระดับ cert ที่ให้ไว้",
  en: "Pre-trip checklist — tuned to your trip type and cert level",
};
const TOGGLE_HIDE = { th: "ซ่อน", en: "Hide" };
const TOGGLE_SHOW = { th: "เปิด", en: "Show" };

/** Pick the most "demanding" trip in the plan so we surface the union of
 *  packing items needed across the vacation. Liveaboard wins over daytrip
 *  (extra clothes, toiletries, logbook) and DSD over OW (medical form). */
function pickRepresentativeTrip(trips: PlanTrip[]): PlanTrip | null {
  if (trips.length === 0) return null;
  const score = (t: PlanTrip): number => {
    if (t.type === "LIVEABOARD" || t.type === "DIVE_RESORT") return 4;
    if (t.type === "DAYTRIP" || t.type === "FREEDIVE") return 3;
    if (t.type === "SNORKELING") return 2;
    if (t.type === "LAND_TOUR") return 1;
    return 0;
  };
  return trips.slice().sort((a, b) => score(b) - score(a))[0];
}

export default function PrepBlock({ trips, cert = "ow", lang }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isTh = lang === "th";

  const rep = useMemo(() => pickRepresentativeTrip(trips), [trips]);
  const tpl = useMemo(() => (rep ? getTripTemplate(rep.type, cert) : null), [rep, cert]);

  if (!tpl) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(59,130,246,0.04), rgba(168,85,247,0.04))",
      border: "1px solid rgba(96,165,250,0.18)",
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setExpanded(s => !s)}
        style={{
          width: "100%", padding: "12px 14px",
          background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "center", gap: 10,
          fontFamily: "inherit",
        }}
      >
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: "rgba(96,165,250,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0,
        }}>
          🎒
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#dbeafe", margin: 0 }}>
            {isTh ? HEADER.th : HEADER.en}
          </p>
          <p style={{ fontSize: 11, color: "#7a8aa8", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {isTh ? SUBLINE.th : SUBLINE.en}
          </p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a8aa8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <div style={{ padding: "0 14px 14px" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {tpl.prepare.map((item, i) => (
              <li key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                fontSize: 13, color: "#dbeafe", lineHeight: 1.5,
              }}>
                <span style={{
                  flexShrink: 0, width: 16, height: 16, marginTop: 2,
                  borderRadius: 4, border: "1.5px solid rgba(96,165,250,0.5)",
                  background: "rgba(0,0,0,0.2)",
                }} />
                <span>{isTh ? item.th : item.en}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
