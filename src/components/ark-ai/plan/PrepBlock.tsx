"use client";

import { useState, useMemo } from "react";
import { getTripTemplate, type CertLevel } from "@/lib/ark-ai/trip-prep-templates";
import type { PlanTrip } from "@/lib/plan-store";

type Props = {
  trips: PlanTrip[];
  cert?: CertLevel;
  lang: string;
};

const HEADER: Record<string, string> = {
  th: "การเตรียมตัว", en: "Prepare for the trip",
  cn: "行前准备", de: "Vorbereitung", fr: "Préparation",
  ru: "Подготовка", ko: "준비물", ja: "持ち物・準備",
};
const SUBLINE: Record<string, string> = {
  th: "เช็กลิสต์ก่อนเดินทาง — ปรับตามประเภททริปและระดับ cert ที่ให้ไว้",
  en: "Pre-trip checklist — tuned to your trip type and cert level",
  cn: "出行前检查清单 — 根据行程类型和证书级别调整",
  ja: "出発前のチェックリスト — ツアー種別と認定レベルに最適化",
  ko: "출발 전 체크리스트 — 투어 유형과 자격 레벨에 맞춤",
  de: "Pre-Trip-Checkliste — abgestimmt auf Tourtyp und Cert-Level",
  fr: "Checklist pré-voyage — adaptée au type et au niveau de certification",
  ru: "Чек-лист перед поездкой — с учётом типа тура и уровня сертификата",
};

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
  const headerText = HEADER[lang] || HEADER.en;
  const sublineText = SUBLINE[lang] || SUBLINE.en;

  const rep = useMemo(() => pickRepresentativeTrip(trips), [trips]);
  const tpl = useMemo(() => (rep ? getTripTemplate(rep.type, cert) : null), [rep, cert]);

  if (!tpl) return null;

  return (
    <div style={{
      background: "var(--plan-surface)",
      border: "1px solid var(--plan-border-soft)",
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
          background: "var(--plan-surface-alt)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0,
        }}>
          🎒
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--plan-fg)", margin: 0 }}>
            {headerText}
          </p>
          <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sublineText}
          </p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0, color: "var(--plan-fg-subtle)" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <div style={{ padding: "0 14px 14px" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {tpl.prepare.map((item, i) => (
              <li key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                fontSize: 13, color: "var(--plan-fg-muted)", lineHeight: 1.5,
              }}>
                <span style={{
                  flexShrink: 0, width: 16, height: 16, marginTop: 2,
                  borderRadius: 4, border: "1.5px solid var(--plan-border-soft)",
                  background: "var(--plan-surface-alt)",
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
