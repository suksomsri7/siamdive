"use client";

import { useState } from "react";
import { addTripToPlan } from "@/lib/plan-store";
import { t } from "@/lib/ark-ai/i18n";

type SuggestedTrip = {
  boatId: string;
  title: string;
  slug: string;
  type: string;
  area: string;
  cover: string | null;
  schedule: {
    scheduleId: string;
    departureDate: string;
    returnDate: string | null;
    title: string;
    route: string;
    itinerary: string;
    priceMin: number;
    priceMax: number;
  };
};

type GapData = {
  start: string;
  end: string;
  days: number;
  trips: SuggestedTrip[];
};

type Props = {
  planId: string;
  gaps: GapData[];
  lang: string;
  onTripAdded?: () => void;
};

const LOCALE_MAP: Record<string, string> = {
  th: "th-TH", en: "en-US", cn: "zh-CN", de: "de-DE", fr: "fr-FR",
  ru: "ru-RU", ko: "ko-KR", ja: "ja-JP",
};

const TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Day Trip", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive", LAND_TOUR: "Land Tour", SNORKELING: "Snorkeling",
};

const fmtDate = (iso: string, lang: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString(LOCALE_MAP[lang] || "en-US", {
    day: "numeric", month: "short",
  });

const fmtPrice = (n: number) =>
  n > 0 ? n.toLocaleString() : "";

const GAP_LABELS: Record<string, (days: number) => string> = {
  th: (d) => `ว่าง ${d} วัน`,
  en: (d) => `${d}-day gap`,
  cn: (d) => `${d}天空闲`,
  ja: (d) => `${d}日間空き`,
  ko: (d) => `${d}일 공백`,
  de: (d) => `${d} freie Tage`,
  fr: (d) => `${d} jours libres`,
  ru: (d) => `${d} свободных дней`,
};

const ADD_LABELS: Record<string, string> = {
  th: "เพิ่มลงแผน", en: "Add to plan", cn: "加入计划",
  ja: "プランに追加", ko: "플랜에 추가", de: "Zum Plan",
  fr: "Ajouter", ru: "Добавить",
};

const ADDED_LABELS: Record<string, string> = {
  th: "เพิ่มแล้ว ✓", en: "Added ✓", cn: "已添加 ✓",
  ja: "追加済 ✓", ko: "추가됨 ✓", de: "Hinzugefügt ✓",
  fr: "Ajouté ✓", ru: "Добавлено ✓",
};

const SUGGESTED_TRIPS_LABELS: Record<string, string> = {
  th: "ทริปแนะนำ", en: "Suggested trips", cn: "推荐行程",
  ja: "おすすめツアー", ko: "추천 투어", de: "Vorgeschlagene Touren",
  fr: "Voyages suggérés", ru: "Рекомендуемые туры",
};

export default function GapSuggestions({ planId, gaps, lang, onTripAdded }: Props) {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  if (gaps.length === 0) return null;

  const handleAdd = (trip: SuggestedTrip) => {
    const ok = addTripToPlan(planId, {
      boatId: trip.boatId,
      title: trip.title,
      slug: trip.slug,
      type: trip.type,
      area: trip.area,
      cover: trip.cover,
      schedule: trip.schedule,
    });
    if (ok) {
      setAddedIds((prev) => new Set(prev).add(trip.schedule.scheduleId));
      onTripAdded?.();
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <p style={{
        fontSize: 13, fontWeight: 800, color: "var(--plan-fg)",
        marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        {SUGGESTED_TRIPS_LABELS[lang] || SUGGESTED_TRIPS_LABELS.en}
      </p>

      {gaps.map((gap, gi) => (
        <div key={gi} style={{ marginBottom: 16 }}>
          {/* Gap label */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          }}>
            <div style={{
              width: 2, height: 20,
              background: "linear-gradient(to bottom, transparent, var(--plan-border), transparent)",
            }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: "var(--plan-fg-subtle)",
              background: "var(--plan-surface-alt)",
              padding: "3px 10px", borderRadius: 999,
              border: "1px solid var(--plan-border-soft)",
            }}>
              {fmtDate(gap.start, lang)} — {fmtDate(gap.end, lang)}
              {" · "}
              {(GAP_LABELS[lang] || GAP_LABELS.en)(gap.days)}
            </span>
          </div>

          {/* Horizontal scroll of suggestions */}
          <div style={{
            display: "flex", gap: 10, overflowX: "auto",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 4,
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}>
            {gap.trips.map((trip) => {
              const isAdded = addedIds.has(trip.schedule.scheduleId);
              return (
                <div
                  key={trip.schedule.scheduleId}
                  style={{
                    minWidth: 200, maxWidth: 200,
                    scrollSnapAlign: "start",
                    background: "var(--plan-surface)",
                    border: "1px solid var(--plan-border-soft)",
                    borderRadius: 12, overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {/* Cover image */}
                  <div style={{
                    width: "100%", aspectRatio: "16/9",
                    background: "var(--plan-surface-alt)",
                    position: "relative", overflow: "hidden",
                  }}>
                    {trip.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={trip.cover}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        loading="lazy"
                      />
                    )}
                    <span style={{
                      position: "absolute", top: 6, left: 6,
                      fontSize: 9, fontWeight: 700,
                      background: "rgba(0,0,0,0.6)", color: "#fff",
                      padding: "2px 6px", borderRadius: 4,
                      backdropFilter: "blur(4px)",
                    }}>
                      {TYPE_LABEL[trip.type] || trip.type}
                    </span>
                  </div>

                  <div style={{ padding: "8px 10px 10px" }}>
                    <p style={{
                      fontSize: 12, fontWeight: 700, color: "var(--plan-fg)",
                      margin: 0, lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {trip.title}
                    </p>
                    <p style={{
                      fontSize: 10, color: "var(--plan-fg-subtle)", margin: "2px 0 0",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {trip.area}
                      {trip.schedule.departureDate && ` · ${fmtDate(trip.schedule.departureDate, lang)}`}
                    </p>

                    {(trip.schedule.priceMin > 0) && (
                      <p style={{
                        fontSize: 11, fontWeight: 700, color: "#60a5fa",
                        margin: "4px 0 0",
                      }}>
                        {fmtPrice(trip.schedule.priceMin)}
                        {trip.schedule.priceMax > trip.schedule.priceMin && ` — ${fmtPrice(trip.schedule.priceMax)}`}
                        {" "}
                        <span style={{ fontWeight: 500, fontSize: 9, color: "var(--plan-fg-subtle)" }}>
                          {t(lang, "perPerson")}
                        </span>
                      </p>
                    )}

                    <button
                      onClick={() => !isAdded && handleAdd(trip)}
                      disabled={isAdded}
                      style={{
                        width: "100%", marginTop: 8,
                        padding: "7px 0", borderRadius: 8,
                        border: isAdded
                          ? "1px solid var(--plan-border-soft)"
                          : "1px solid #1e3a8a",
                        background: isAdded ? "var(--plan-surface-alt)" : "#1e40af",
                        color: isAdded ? "var(--plan-fg-subtle)" : "#fff",
                        fontSize: 11, fontWeight: 700,
                        cursor: isAdded ? "default" : "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                      }}
                    >
                      {isAdded
                        ? (ADDED_LABELS[lang] || ADDED_LABELS.en)
                        : (ADD_LABELS[lang] || ADD_LABELS.en)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
