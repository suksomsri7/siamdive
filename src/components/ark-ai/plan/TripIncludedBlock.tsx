"use client";

import { useState, useMemo } from "react";
import { getTripTemplate, type CertLevel } from "@/lib/ark-ai/trip-prep-templates";

type Props = {
  tripType: string;
  cert?: CertLevel;
  /** Operator-written content HTML (schedule.translations.content). When this
   *  contains explicit "รวม" / "ไม่รวม" sections, we suppress the template
   *  fallback so we never duplicate operator copy. */
  operatorContentHtml?: string | null;
  lang: string;
};

const HEADER_INCLUDED = {
  th: "รวมในราคา", en: "Included", cn: "包含", de: "Im Preis", fr: "Inclus", ru: "Включено", ko: "포함사항", ja: "含まれるもの",
};
const HEADER_NOT_INCLUDED = {
  th: "ไม่รวม", en: "Not Included", cn: "不包含", de: "Nicht inbegriffen", fr: "Non inclus", ru: "Не включено", ko: "불포함", ja: "含まれないもの",
};
const TOGGLE_HIDE = { th: "ซ่อน", en: "Hide" };
const TOGGLE_SHOW = { th: "ดู", en: "Show" };
const FALLBACK_NOTE = {
  th: "* รายการมาตรฐาน — ผู้ประกอบการอาจปรับตามทริปจริง",
  en: "* Standard list — operator may adjust per trip",
};

function operatorMentionsIncluded(html: string | null | undefined): boolean {
  if (!html) return false;
  // Heuristic: operator already lists "รวม" / "ไม่รวม" / "Included" / "Not Included"
  // somewhere in the schedule content body — skip the fallback template.
  return /รวม|ไม่รวม|included|not\s+included|what'?s\s+included/i.test(html);
}

export default function TripIncludedBlock({ tripType, cert = "ow", operatorContentHtml, lang }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isTh = lang === "th";

  const showFallback = !operatorMentionsIncluded(operatorContentHtml);
  const tpl = useMemo(() => (showFallback ? getTripTemplate(tripType, cert) : null), [showFallback, tripType, cert]);

  if (!tpl) return null;

  return (
    <div style={{
      borderTop: "1px solid #1a1a1a",
      background: "#0c0c0c",
    }}>
      <button
        type="button"
        onClick={() => setExpanded(s => !s)}
        style={{
          width: "100%", padding: "9px 12px",
          background: "transparent", border: "none",
          color: "#a3e635", fontSize: 12, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: "inherit",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <span>
          {expanded
            ? `${isTh ? TOGGLE_HIDE.th : TOGGLE_HIDE.en} ${isTh ? "รวม / ไม่รวม" : "Included / Not Included"}`
            : (isTh ? "รวม / ไม่รวมอะไรบ้าง" : "What's Included / Not Included")}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
          <ChecklistGroup
            title={isTh ? HEADER_INCLUDED.th : HEADER_INCLUDED.en}
            items={tpl.included.map(i => isTh ? i.th : i.en)}
            tone="included"
          />
          <ChecklistGroup
            title={isTh ? HEADER_NOT_INCLUDED.th : HEADER_NOT_INCLUDED.en}
            items={tpl.notIncluded.map(i => isTh ? i.th : i.en)}
            tone="excluded"
          />
          <p style={{ fontSize: 10, color: "#555", margin: 0, fontStyle: "italic" }}>
            {isTh ? FALLBACK_NOTE.th : FALLBACK_NOTE.en}
          </p>
        </div>
      )}
    </div>
  );
}

function ChecklistGroup({ title, items, tone }: { title: string; items: string[]; tone: "included" | "excluded" }) {
  const accent = tone === "included" ? "#a3e635" : "#f87171";
  return (
    <div>
      <p style={{
        fontSize: 11, fontWeight: 800, color: accent,
        textTransform: "uppercase", letterSpacing: "0.06em",
        margin: "0 0 8px",
      }}>
        {title}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map((item, i) => (
          <li key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 7,
            fontSize: 12, color: "#cfcfcf", lineHeight: 1.5,
          }}>
            <span style={{
              flexShrink: 0, width: 14, height: 14, marginTop: 2,
              borderRadius: "50%", background: `${accent}1f`, color: accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800,
            }}>
              {tone === "included" ? "✓" : "✕"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
