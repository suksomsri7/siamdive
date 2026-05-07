"use client";

import { useState, useMemo } from "react";
import { getTripTemplate, type CertLevel } from "@/lib/ark-ai/trip-prep-templates";
import { t } from "@/lib/ark-ai/i18n";

type Props = {
  tripType: string;
  cert?: CertLevel;
  /** Operator-written content HTML (schedule.translations.content). When this
   *  contains explicit "รวม" / "ไม่รวม" sections, we suppress the template
   *  fallback so we never duplicate operator copy. */
  operatorContentHtml?: string | null;
  lang: string;
};

const HEADER_INCLUDED: Record<string, string> = {
  th: "รวมในราคา", en: "Included", cn: "包含", de: "Im Preis", fr: "Inclus", ru: "Включено", ko: "포함사항", ja: "含まれるもの",
};
const HEADER_NOT_INCLUDED: Record<string, string> = {
  th: "ไม่รวม", en: "Not Included", cn: "不包含", de: "Nicht inbegriffen", fr: "Non inclus", ru: "Не включено", ko: "불포함", ja: "含まれないもの",
};
const TOGGLE_HIDE: Record<string, string> = {
  th: "ซ่อน", en: "Hide", cn: "隐藏", ja: "隠す", ko: "숨기기", de: "Ausblenden", fr: "Masquer", ru: "Скрыть",
};
const FALLBACK_NOTE: Record<string, string> = {
  th: "* รายการมาตรฐาน — ผู้ประกอบการอาจปรับตามทริปจริง",
  en: "* Standard list — operator may adjust per trip",
  cn: "* 标准清单 — 经营者可能根据实际行程调整",
  ja: "* 標準リスト — 事業者が実際のツアーに合わせて調整する場合があります",
  ko: "* 기본 목록 — 운영사가 실제 투어에 맞춰 조정할 수 있습니다",
  de: "* Standardliste — Anbieter kann je nach Tour anpassen",
  fr: "* Liste standard — l'opérateur peut ajuster selon le voyage",
  ru: "* Стандартный список — оператор может корректировать",
};

function operatorMentionsIncluded(html: string | null | undefined): boolean {
  if (!html) return false;
  // Heuristic: operator already lists "รวม" / "ไม่รวม" / "Included" / "Not Included"
  // somewhere in the schedule content body — skip the fallback template.
  return /รวม|ไม่รวม|included|not\s+included|what'?s\s+included/i.test(html);
}

export default function TripIncludedBlock({ tripType, cert = "ow", operatorContentHtml, lang }: Props) {
  // Expanded by default — user feedback round 2: "include / exclude ให้
  // expand เลยไม่ต้องย่อ". The list is part of trip planning, not a detail
  // they hunt for behind a toggle.
  const [expanded, setExpanded] = useState(true);
  const isTh = lang === "th";
  const L = (key: Parameters<typeof t>[1]) => t(lang, key);
  const headerIncluded = HEADER_INCLUDED[lang] || HEADER_INCLUDED.en;
  const headerNotIncluded = HEADER_NOT_INCLUDED[lang] || HEADER_NOT_INCLUDED.en;
  const toggleHide = TOGGLE_HIDE[lang] || TOGGLE_HIDE.en;
  const fallbackNote = FALLBACK_NOTE[lang] || FALLBACK_NOTE.en;

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
            ? `${toggleHide} ${L("includedNotIncluded")}`
            : L("whatsIncludedTitle")}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
          <ChecklistGroup
            title={headerIncluded}
            items={tpl.included.map(i => isTh ? i.th : i.en)}
            tone="included"
          />
          <ChecklistGroup
            title={headerNotIncluded}
            items={tpl.notIncluded.map(i => isTh ? i.th : i.en)}
            tone="excluded"
          />
          <p style={{ fontSize: 10, color: "#555", margin: 0, fontStyle: "italic" }}>
            {fallbackNote}
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
