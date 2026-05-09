"use client";

// PlanRouteSheet — bottom sheet that asks the user which plan a staged pick
// (or a multi-pick build) should land in. Surfaces a ⭐ recommended plan via
// the scoring in plan-routing.ts, lists the rest, and always offers a
// "create new plan" option as the final card.
//
// Mobile-first portrait layout: full-width sheet anchored to the bottom of
// the viewport with a backdrop. The sheet only opens for the 2+ plans case
// (the chat panel decides when to mount it). For 0/1 plan we route silently
// and surface a toast instead.

import { useEffect, useRef, useState } from "react";
import type { UserPlan } from "@/lib/plan-store";
import type { PendingPick } from "@/lib/pending-picks";
import type { PlanScore } from "@/lib/plan-routing";

type Choice = { type: "existing"; planId: string } | { type: "new" };

type Props = {
  picks: PendingPick[];
  ranked: PlanScore[];
  lang: string;
  onChoose: (c: Choice) => void;
  onClose: () => void;
};

const T: Record<string, Record<string, string>> = {
  title:        { en: "Add to which plan?",          th: "เพิ่มเข้าแผนไหน?",       cn: "添加到哪个行程?",      ja: "どのプランに追加?",       ko: "어떤 플랜에 추가?",      de: "Zu welchem Plan?",      fr: "Ajouter à quel plan ?",   ru: "В какой план добавить?" },
  recommended:  { en: "RECOMMENDED",                  th: "แนะนำ",                 cn: "推荐",                 ja: "おすすめ",                ko: "추천",                  de: "EMPFOHLEN",              fr: "RECOMMANDÉ",              ru: "РЕКОМЕНДУЕТСЯ" },
  others:       { en: "Other plans",                  th: "แผนอื่นๆ",              cn: "其他行程",             ja: "他のプラン",              ko: "다른 플랜",             de: "Andere Pläne",           fr: "Autres plans",            ru: "Другие планы" },
  newPlan:      { en: "+ Create new plan",            th: "+ สร้าง plan ใหม่",      cn: "+ 创建新行程",         ja: "+ 新しいプランを作成",    ko: "+ 새 플랜 만들기",      de: "+ Neuen Plan erstellen", fr: "+ Créer un nouveau plan", ru: "+ Создать новый план" },
  trips:        { en: "trips",                        th: "ทริป",                  cn: "行程",                 ja: "トリップ",                ko: "트립",                  de: "Trips",                  fr: "voyages",                 ru: "поездок" },
  conflictWarn: { en: "Date conflict",                th: "วันชน",                  cn: "日期冲突",             ja: "日程重複",                ko: "날짜 중복",              de: "Datumskonflikt",         fr: "Conflit de date",         ru: "Пересечение дат" },
  cancel:       { en: "Cancel",                       th: "ยกเลิก",                 cn: "取消",                 ja: "キャンセル",              ko: "취소",                  de: "Abbrechen",              fr: "Annuler",                 ru: "Отмена" },
  addingTrip:   { en: "Adding",                       th: "กำลังเพิ่ม",             cn: "添加",                 ja: "追加中",                  ko: "추가 중",               de: "Hinzufügen",             fr: "Ajout de",                ru: "Добавляем" },
  addingTrips:  { en: "Adding {n} trips",             th: "เพิ่ม {n} ทริป",         cn: "添加 {n} 个行程",      ja: "{n} ツアーを追加",        ko: "{n}개 트립 추가",       de: "{n} Trips hinzufügen",   fr: "Ajout de {n} voyages",    ru: "Добавить {n} поездок" },
};

function L(key: keyof typeof T, lang: string): string {
  return T[key][lang] ?? T[key].en;
}

const fmtDate = (iso: string, lang: string) => {
  const locale = lang === "th" ? "th-TH" : lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : lang === "cn" ? "zh-CN" : lang === "de" ? "de-DE" : lang === "fr" ? "fr-FR" : lang === "ru" ? "ru-RU" : "en-GB";
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });
};

const planRange = (plan: UserPlan, lang: string): string | null => {
  const dates = plan.trips
    .map(t => t.schedule?.departureDate?.slice(0, 10))
    .filter((d): d is string => !!d)
    .sort();
  if (!dates.length) return null;
  const first = fmtDate(dates[0], lang);
  const last  = fmtDate(dates[dates.length - 1], lang);
  return first === last ? first : `${first} – ${last}`;
};

export default function PlanRouteSheet({ picks, ranked, lang, onChoose, onClose }: Props) {
  const [enter, setEnter] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setEnter(true)));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const headerSubtitle = picks.length === 1
    ? `${L("addingTrip", lang)} "${picks[0].title}"`
    : L("addingTrips", lang).replace("{n}", String(picks.length));

  const recommended = ranked[0];
  const others = ranked.slice(1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={L("title", lang)}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100000,
        background: enter ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
        transition: "background 0.2s ease",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#0f0f0f",
          borderTop: "1px solid #222",
          borderRadius: "20px 20px 0 0",
          padding: "10px 16px 24px",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
          maxHeight: "82vh",
          overflowY: "auto",
          transform: enter ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#333", margin: "4px auto 14px" }} />

        {/* Header */}
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", margin: 0 }}>
            {L("title", lang)}
          </h3>
          <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {headerSubtitle}
          </p>
        </div>

        {/* Recommended */}
        {recommended && (
          <>
            <SectionLabel label={`⭐ ${L("recommended", lang)}`} color="#f59e0b" />
            <PlanCard
              score={recommended}
              lang={lang}
              highlight
              onClick={() => onChoose({ type: "existing", planId: recommended.plan.id })}
            />
          </>
        )}

        {/* Other plans */}
        {others.length > 0 && (
          <>
            <SectionLabel label={L("others", lang)} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {others.map(s => (
                <PlanCard
                  key={s.plan.id}
                  score={s}
                  lang={lang}
                  onClick={() => onChoose({ type: "existing", planId: s.plan.id })}
                />
              ))}
            </div>
          </>
        )}

        {/* Create new */}
        <button
          type="button"
          onClick={() => onChoose({ type: "new" })}
          style={{
            width: "100%", marginTop: 14,
            padding: "14px 16px",
            borderRadius: 14,
            border: "1px dashed #333",
            background: "transparent",
            color: "#60a5fa",
            fontSize: 14, fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "center",
          }}
        >
          {L("newPlan", lang)}
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%", marginTop: 8,
            padding: "10px 16px",
            borderRadius: 12,
            border: "none",
            background: "transparent",
            color: "#666",
            fontSize: 13, fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {L("cancel", lang)}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ label, color }: { label: string; color?: string }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
      color: color || "#666", margin: "12px 0 8px",
    }}>{label}</p>
  );
}

function PlanCard({ score, lang, onClick, highlight }: { score: PlanScore; lang: string; onClick: () => void; highlight?: boolean }) {
  const range = planRange(score.plan, lang);
  const tripCount = score.plan.trips.length;
  const hasConflict = score.conflicts.length > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 14,
        border: highlight ? "1.5px solid #f59e0b" : "1px solid #1f1f1f",
        background: highlight ? "linear-gradient(180deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)" : "#141414",
        color: "#e5e5e5",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        display: "flex", flexDirection: "column", gap: 4,
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 800, color: "#f5f5f5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        🤿 {score.plan.name}
      </p>
      <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
        {tripCount} {T.trips[lang] ?? T.trips.en}
        {range && ` · ${range}`}
      </p>
      {(score.reasons.length > 0 || hasConflict) && (
        <p style={{ fontSize: 11, color: "#93c5fd", margin: "2px 0 0", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {score.reasons.map(r => (
            <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {r}
            </span>
          ))}
          {hasConflict && (
            <span style={{ color: "#fbbf24", display: "inline-flex", alignItems: "center", gap: 3 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {T.conflictWarn[lang] ?? T.conflictWarn.en} · {fmtDate(score.conflicts[0].existingFrom, lang)}
            </span>
          )}
        </p>
      )}
    </button>
  );
}
