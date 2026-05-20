"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { type PlanTrip, removeTripByIndex } from "@/lib/plan-store";
import { parseItinerary, extractScheduleFromContent, stripScheduleFromContent } from "@/lib/ark-ai/itinerary-parser";
import { ScheduleDetailSkeleton } from "../Skeletons";
import TripSchedulePicker from "../TripSchedulePicker";
import { t, dayLabel } from "@/lib/ark-ai/i18n";
import type { PlanItem } from "./PlanItemsBlock";

type FetchedDetail = {
  boat: { title: string; excerpt: string; content: string } | null;
  schedule: { title: string; excerpt: string; content: string; route: string } | null;
};

type Props = {
  planId: string;
  trips: PlanTrip[];
  items?: PlanItem[];
  lang: string;
  canEdit: boolean;
  onTripRemoved?: () => void;
  onItemRemove?: (id: string) => void;
  onItemEdit?: (item: PlanItem) => void;
  onContactClick?: (message: string) => void;
};

const TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Day Trip", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive", LAND_TOUR: "Land Tour", SNORKELING: "Snorkeling",
};

const TYPE_EMOJI: Record<string, string> = {
  DAYTRIP: "🤿", LIVEABOARD: "🚢", DIVE_RESORT: "🏨",
  FREEDIVE: "🫧", LAND_TOUR: "🏝", SNORKELING: "🐠",
};

const LOCALE_MAP: Record<string, string> = {
  th: "th-TH", en: "en-US", cn: "zh-CN", de: "de-DE", fr: "fr-FR", ru: "ru-RU", ko: "ko-KR", ja: "ja-JP",
};

const fmtDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(LOCALE_MAP[lang] || "en-US", { day: "numeric", month: "short", year: "2-digit" });

function generateDayDates(departure: string, returnDate: string | null): string[] {
  const start = new Date(departure);
  const end = returnDate ? new Date(returnDate) : start;
  const days = Math.round((end.getTime() - start.getTime()) / (86400000)) + 1;
  return Array.from({ length: Math.max(days, 1) }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const LOCALE_LONG: Record<string, string> = LOCALE_MAP;

const fmtDayHeader = (iso: string, lang: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString(LOCALE_LONG[lang] || "en-US", {
    weekday: "short", day: "numeric", month: "short",
  });

// Minimal white-line icon set for the itinerary timeline. Lucide-inspired,
// stroke="currentColor" so the parent (white) controls fill colour.
const ICON_PROPS = {
  width: 15, height: 15, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.8,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};
const ITIN_ICON = {
  car:    <svg {...ICON_PROPS}><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>,
  dive:   <svg {...ICON_PROPS}><circle cx="7" cy="11" r="3"/><circle cx="17" cy="11" r="3"/><path d="M10 11h4"/><path d="M5 8 3 6"/><path d="M19 8l2-2"/></svg>,
  meal:   <svg {...ICON_PROPS}><path d="M3 2v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2"/><path d="M5 11v11"/><path d="M19 2c-1.5 1.3-2.5 3.9-2.5 6.5v3c0 .55.45 1 1 1H19v9"/></svg>,
  boat:   <svg {...ICON_PROPS}><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.4 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.9 5.3 2.8 7.8"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>,
  bed:    <svg {...ICON_PROPS}><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v3"/></svg>,
  pin:    <svg {...ICON_PROPS}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  beach:  <svg {...ICON_PROPS}><path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4"/><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3"/><path d="M5.9 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-2-1.96-5.3-1.8-7.42.35"/><path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14"/></svg>,
  bag:    <svg {...ICON_PROPS}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  plane:  <svg {...ICON_PROPS}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>,
};

// Pick a minimal icon for an itinerary row by keyword. Returns null when no
// activity type is hinted — the timeline falls back to a dot/number marker.
function pickItineraryIcon(text: string): React.ReactNode {
  const s = text.toLowerCase();
  if (/รับ\s*(ที่|จาก)?|pickup|pick.?up|รับลูกค้า|รับท่าน|ส่ง\s*(ที่|กลับ)?|drop.?off|กลับโรงแรม|กลับฝั่ง|กลับถึง|return\s+to\s+hotel/.test(s)) return ITIN_ICON.car;
  if (/ดำน้ำ|dive\b|diving|ดำผิวน้ำ|snorkel|scuba|ฟรีไดฟ์|freedive/.test(s)) return ITIN_ICON.dive;
  if (/อาหาร|ข้าว|มื้อ|lunch|dinner|breakfast|กลางวัน|เย็น|เช้า\s*ทาน|brunch|buffet/.test(s)) return ITIN_ICON.meal;
  if (/ออกเรือ|board\b|boarding|embark|set\s+sail|sail\b|cruise|เรือออก/.test(s)) return ITIN_ICON.boat;
  if (/พัก|hotel|resort|stay|check.?in|check.?out|รีสอร์ท|ที่พัก/.test(s)) return ITIN_ICON.bed;
  if (/ถึง|arrive|arrival|reach\b|มาถึง/.test(s)) return ITIN_ICON.pin;
  if (/ชายหาด|beach|เกาะ|island|snorkeling\s+spot|จุดดำน้ำ|reef/.test(s)) return ITIN_ICON.beach;
  if (/ช้อป|shop|ตลาด|market|souvenir|ของฝาก/.test(s)) return ITIN_ICON.bag;
  if (/บินกลับ|flight|สนามบิน|airport/.test(s)) return ITIN_ICON.plane;
  return null;
}

export default function PlanTimeline({ planId, trips, items = [], lang, canEdit, onTripRemoved, onItemRemove, onItemEdit }: Props) {
  const L = (key: Parameters<typeof t>[1]) => t(lang, key);

  // Trip-first rendering — one card per trip in chronological order. The
  // earlier "Day 1 / Day 2 / ..." outer-bucket structure proved confusing for
  // liveaboards (a 4-day cruise rendered as one anchor + 3 dashed continuation
  // cards, with the actual trip card buried under "Day 1"). Each TripSection
  // now owns its own day-by-day timeline internally:
  //  - LIVEABOARD/DIVE_RESORT → Day 1..N sub-timeline of the parsed itinerary
  //    sits inside the trip card
  //  - DAYTRIP/SNORKEL/etc → hour-by-hour Schedule section inside the card
  const sortedScheduled = useMemo(() => {
    return trips
      .map((t, idx) => ({ trip: t, originalIdx: idx }))
      .filter(({ trip }) => !!trip.schedule?.departureDate)
      .sort((a, b) =>
        a.trip.schedule!.departureDate.localeCompare(b.trip.schedule!.departureDate),
      );
  }, [trips]);

  const unscheduled = trips
    .map((t, idx) => ({ trip: t, originalIdx: idx }))
    .filter(({ trip }) => !trip.schedule?.departureDate);

  // Detect calendar overlap between trips so we can warn the user when two
  // trips would happen the same day. Compares date ranges (departure→return
  // for liveaboard, single date for daytrip). Returns a map of trip-idx →
  // names of the OTHER trips it conflicts with, so the inline warning can
  // say exactly "ชนกับ <ชื่อทริป> (<ช่วงวัน>)".
  const conflictsByTripIdx = useMemo(() => {
    const conflicts = new Map<number, { title: string; from: string; to: string }[]>();
    const ranges = sortedScheduled.map(({ trip, originalIdx }) => ({
      originalIdx,
      title: trip.title,
      from: (trip.schedule!.departureDate || "").slice(0, 10),
      to: (trip.schedule!.returnDate || trip.schedule!.departureDate || "").slice(0, 10),
    }));
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        if (ranges[i].from <= ranges[j].to && ranges[j].from <= ranges[i].to) {
          const li = conflicts.get(ranges[i].originalIdx) || [];
          li.push({ title: ranges[j].title, from: ranges[j].from, to: ranges[j].to });
          conflicts.set(ranges[i].originalIdx, li);
          const lj = conflicts.get(ranges[j].originalIdx) || [];
          lj.push({ title: ranges[i].title, from: ranges[i].from, to: ranges[i].to });
          conflicts.set(ranges[j].originalIdx, lj);
        }
      }
    }
    return conflicts;
  }, [sortedScheduled]);

  // Build a single date-sorted entry list mixing trips and plan items
  // (flights/hotels). Items are positioned relative to trips by their startAt
  // date so adding a "BKK→HKT flight at 08:00 on Day-of-trip" lands above the
  // trip it precedes. Trips with no date and items don't mix (items always
  // have startAt).
  const mixedEntries = useMemo(() => {
    type Entry =
      | { kind: "trip"; sortKey: string; trip: PlanTrip; originalIdx: number }
      | { kind: "item"; sortKey: string; item: PlanItem };
    const entries: Entry[] = [];
    for (const { trip, originalIdx } of sortedScheduled) {
      entries.push({
        kind: "trip",
        sortKey: trip.schedule!.departureDate,
        trip,
        originalIdx,
      });
    }
    for (const item of items) {
      entries.push({ kind: "item", sortKey: item.startAt, item });
    }
    entries.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    return entries;
  }, [sortedScheduled, items]);

  if (trips.length === 0 && items.length === 0) return null;

  return (
    <div>
      <style>{`
        @keyframes conflictPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }
      `}</style>

      {mixedEntries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mixedEntries.map((entry, idx) => {
            if (entry.kind === "trip") {
              return (
                <TripSection
                  key={`trip-${entry.trip.boatId}-${entry.trip.schedule!.scheduleId}-${entry.originalIdx}`}
                  trip={entry.trip}
                  originalIdx={entry.originalIdx}
                  planId={planId}
                  lang={lang}
                  canEdit={canEdit}
                  overlap={conflictsByTripIdx.has(entry.originalIdx)}
                  conflicts={conflictsByTripIdx.get(entry.originalIdx)}
                  isLast={idx === mixedEntries.length - 1}
                  onRemoved={onTripRemoved}
                />
              );
            }
            return (
              <ItemEntryCard
                key={`item-${entry.item.id}`}
                item={entry.item}
                lang={lang}
                canEdit={canEdit}
                onRemove={() => onItemRemove?.(entry.item.id)}
                onEdit={() => onItemEdit?.(entry.item)}
              />
            );
          })}
        </div>
      )}

      {unscheduled.length > 0 && (
        <div style={{ marginTop: sortedScheduled.length > 0 ? 20 : 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--plan-fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            {L("unscheduled")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {unscheduled.map(({ trip, originalIdx }) => (
              <UnscheduledCard
                key={`${trip.boatId}-unsched-${originalIdx}`}
                trip={trip}
                originalIdx={originalIdx}
                planId={planId}
                lang={lang}
                canEdit={canEdit}
                onRemoved={onTripRemoved}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Trip section (scheduled) ─────────────────────────────────────────────────
function TripSection({ trip, originalIdx, planId, lang, canEdit, overlap, conflicts, onRemoved }: {
  trip: PlanTrip; originalIdx: number; planId: string; lang: string; canEdit: boolean;
  overlap: boolean;
  conflicts?: { title: string; from: string; to: string }[];
  isLast: boolean; onRemoved?: () => void;
}) {
  // The per-trip day timeline is the primary surface and stays expanded.
  // The "ดูรายละเอียด" tab starts COLLAPSED — user feedback: it duplicated
  // the timeline and pushed real info below the fold. They open it on demand.
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<FetchedDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const L = (key: Parameters<typeof t>[1]) => t(lang, key);
  const sched = trip.schedule!;
  const dayDates = generateDayDates(sched.departureDate, sched.returnDate);
  const isMultiDay = dayDates.length > 1;
  const isLiveaboard = trip.type === "LIVEABOARD" || trip.type === "DIVE_RESORT";

  // Parse the operator's itinerary into day blocks. The same parser handles:
  //  - DAYTRIP/SNORKEL/FREEDIVE: hour-by-hour timeline inside a single day
  //    (e.g. "08:00 pickup → 10:30 dive 1 → 12:00 lunch")
  //  - LIVEABOARD/RESORT: day-by-day cruise timeline (e.g. "Day 1 — Boarding /
  //    Day 2 — Bon Island / ...") — operator writes one <h3> block per day
  // For multi-day trips we ALSO compute a per-block date stamp (departureDate
  // + index) so the user sees "Day 2 · 11 มิ.ย." not just "Day 2".
  //
  // NEVER fabricate. Source priority:
  //  1) schedule.itinerary HTML (operators write `<h3>Day N</h3><p>...</p>`
  //     here — common for liveaboards)
  //  2) schedule.content "<h2>กำหนดการ</h2><ul><li>...</li></ul>" — daytrip
  //     operators put hour-by-hour here (100% of prod daytrips have this in
  //     content, 0% have it in itinerary)
  //  3) detail.schedule.content (same field, fetched async if not present
  //     in the local plan trip)
  // Empty across all three → section hides cleanly. No invented times.
  const itineraryDays = useMemo(() => {
    // Prefer freshly-fetched detail (current lang) over local cached fields,
    // which may be in a stale language from the original add-time fetch.
    const fromDetailContent = extractScheduleFromContent(detail?.schedule?.content);
    if (fromDetailContent.length > 0) return fromDetailContent;
    const parsed = parseItinerary(sched.itinerary);
    if (parsed.length > 0) return parsed;
    return extractScheduleFromContent(sched.content);
  }, [sched.itinerary, sched.content, detail]);
  const itineraryDayDates = useMemo(() => {
    if (!isMultiDay) return [];
    return itineraryDays.map((_, i) => dayDates[i] || dayDates[dayDates.length - 1]);
  }, [itineraryDays, dayDates, isMultiDay]);

  const fetchDetail = useCallback(async () => {
    if (detail) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/public/schedules/${sched.scheduleId}?lang=${lang}`);
      if (res.ok) {
        const data = await res.json();
        if (data.boat || data.schedule) {
          setDetail({ boat: data.boat, schedule: data.schedule });
        }
      }
    } catch {}
    setDetailLoading(false);
  }, [sched.scheduleId, lang, detail]);

  useEffect(() => {
    setDetail(null);
  }, [lang]);

  // Always (re)fetch on mount and whenever lang changes. Local cached
  // sched.itinerary/content/route may be in a stale language from the
  // original add-time fetch — pulling detail in the current lang lets the
  // timeline + collapsed route preview render in the user's chosen lang.
  useEffect(() => {
    if (!detail && !detailLoading) fetchDetail();
  }, [detail, detailLoading, fetchDetail]);

  const handleToggle = () => {
    if (!expanded) fetchDetail();
    setExpanded(!expanded);
  };

  // Lock body scroll + listen for Escape while the detail modal is open.
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const handleRemove = () => {
    removeTripByIndex(planId, originalIdx);
    onRemoved?.();
  };

  const SECTION_LABEL: Record<string, Record<string, string>> = {
    excerpt: { th: "สรุป", en: "Summary", cn: "摘要", de: "Zusammenfassung", fr: "Résumé", ru: "Описание", ko: "요약", ja: "概要" },
    route:   { th: "เส้นทาง", en: "Route", cn: "路线", de: "Route", fr: "Itinéraire", ru: "Маршрут", ko: "경로", ja: "ルート" },
    content: { th: "รายละเอียด", en: "Details", cn: "详情", de: "Details", fr: "Détails", ru: "Детали", ko: "상세정보", ja: "詳細" },
  };
  const label = (key: string) => SECTION_LABEL[key]?.[lang] || SECTION_LABEL[key]?.en || key;

  return (
    <div>
      {/* Main trip card — date column dropped; the day-bucket header above this card carries the date. */}
      <div style={{ position: "relative" }}>
        <div style={{
          background: "var(--plan-surface)",
          border: overlap ? "2px solid #dc2626" : "1px solid var(--plan-border-soft)",
          borderRadius: 12, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
            {trip.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={trip.cover} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 48, height: 36, background: "var(--plan-surface-alt)", borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {TYPE_EMOJI[trip.type] || "🤿"}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {trip.area && <p style={{ fontSize: 10, color: "var(--plan-fg-subtle)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>{trip.area}</p>}
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--plan-fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</p>
              <p style={{ fontSize: 12, color: "var(--plan-fg-subtle)", margin: "2px 0 0" }}>
                {TYPE_LABEL[trip.type] || trip.type}
                {sched.departureDate && (
                  canEdit ? (
                    <>
                      {' · '}
                      <button
                        onClick={() => setPickerOpen(true)}
                        title={L("clickToChangeDate")}
                        style={{
                          background: "transparent", border: "none", padding: 0, margin: 0,
                          font: "inherit", color: "var(--plan-fg)",
                          cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2,
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}
                      >
                        {sched.returnDate && sched.returnDate !== sched.departureDate
                          ? `${fmtDate(sched.departureDate, lang)} → ${fmtDate(sched.returnDate, lang)}`
                          : fmtDate(sched.departureDate, lang)}
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                      </button>
                    </>
                  ) : (
                    sched.returnDate && sched.returnDate !== sched.departureDate
                      ? ` · ${fmtDate(sched.departureDate, lang)} → ${fmtDate(sched.returnDate, lang)}`
                      : ` · ${fmtDate(sched.departureDate, lang)}`
                  )
                )}
                {isMultiDay && ` · ${dayDates.length} ${L("daysLower")}`}
              </p>
            </div>
            {canEdit && (
              <button onClick={handleRemove}
                style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--plan-surface-alt)", background: "transparent", color: "var(--plan-fg-subtle)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                ✕
              </button>
            )}
          </div>

          {/* Date conflict warning — names the colliding trip(s) explicitly */}
          {conflicts && conflicts.length > 0 && (
            <div style={{
              margin: "0 12px 10px",
              padding: "10px 12px",
              borderRadius: 8,
              background: "#dc2626",
              border: "1px solid #991b1b",
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
                  {L("dateConflictTitle")}
                </p>
                {conflicts.map((c, ci) => {
                  const range = c.from === c.to
                    ? fmtDate(c.from, lang)
                    : `${fmtDate(c.from, lang)} → ${fmtDate(c.to, lang)}`;
                  return (
                    <p key={ci} style={{ fontSize: 12, color: "#fee2e2", margin: "0 0 2px", lineHeight: 1.4 }}>
                      • <strong style={{ color: "#fff" }}>{c.title}</strong> ({range})
                    </p>
                  );
                })}
                <p style={{ fontSize: 11, color: "#fecaca", margin: "6px 0 0", lineHeight: 1.4 }}>
                  {L("cantBeOnTwoTrips")}
                </p>
              </div>
              {canEdit && (
                <button onClick={handleRemove}
                  style={{
                    padding: "4px 10px", borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.4)",
                    background: "rgba(0,0,0,0.2)",
                    color: "#fff", fontSize: 11, fontWeight: 700,
                    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                  {L("remove")}
                </button>
              )}
            </div>
          )}

          {/* Route preview + View Details — single row. Route on the left
              (truncated, with pin icon), Details pill anchored to the right.
              The pill is the user's entry into the fullscreen edit modal. */}
          {(() => {
            const routeText = detail?.schedule?.route || sched.route;
            return (
              <div style={{ padding: "0 12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                {routeText ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, flex: 1 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--plan-fg-subtle)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <p style={{ fontSize: 12, color: "var(--plan-fg-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {routeText.replace(/<[^>]+>/g, "").slice(0, 80)}
                    </p>
                  </div>
                ) : (
                  <div style={{ flex: 1 }} />
                )}
                <button
                  type="button"
                  onClick={handleToggle}
                  style={{
                    padding: "5px 10px 5px 12px",
                    borderRadius: 999,
                    background: "rgba(59,130,246,0.14)",
                    border: "1px solid rgba(96,165,250,0.30)",
                    color: "#93c5fd",
                    fontSize: 11, fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 3,
                    fontFamily: "inherit",
                    letterSpacing: "0.01em",
                    flexShrink: 0,
                  }}
                >
                  {L("viewDetails")}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            );
          })()}

          {/* Price range — schedule-wide (lowest tier → highest tier across all
               packages). User no longer picks a package; SiamDive confirms the
               final price after the booking inquiry goes through. */}
          {(sched.priceMin ?? 0) > 0 && (
            <div style={{ padding: "0 12px 10px" }}>
              <p style={{ fontSize: 11, color: "var(--plan-fg-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>
                {L("startingPrice")}
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--plan-fg)", margin: 0 }}>
                {sched.priceMax && sched.priceMax > (sched.priceMin ?? 0)
                  ? `฿${sched.priceMin!.toLocaleString()} — ฿${sched.priceMax.toLocaleString()}`
                  : `฿${sched.priceMin!.toLocaleString()}`}
                <span style={{ fontSize: 11, color: "var(--plan-fg-subtle)", fontWeight: 600, marginLeft: 4 }}>
                  {L("perPerson")}
                </span>
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Itinerary timeline — no card frame, no collapse. Per user feedback:
          design only the schedule, no border container, always visible. */}
      {itineraryDays.length > 0 && (
        <div style={{ marginTop: 18, padding: "4px 6px 4px 4px", position: "relative" }}>
          <style>{`
            .trip-itin-body { font-size: 12.5px; color: var(--plan-fg-muted); line-height: 1.6; }
            .trip-itin-body p { margin: 0 0 4px; }
            .trip-itin-body p:last-child { margin-bottom: 0; }
            .trip-itin-body strong, .trip-itin-body b { color: var(--plan-fg-muted); font-weight: 500; }
            .trip-itin-body a { color: #60a5fa; text-decoration: underline; }
            .trip-itin-body ul, .trip-itin-body ol { margin: 2px 0 4px; padding-left: 16px; }
            .trip-itin-body li { margin-bottom: 2px; }
            .itin-row {
              display: grid;
              grid-template-columns: 62px 36px 1fr;
              gap: 10px;
              align-items: start;
              padding: 14px 0;
              position: relative;
              z-index: 1;
            }
            .itin-row:first-of-type { padding-top: 4px; }
            .itin-row:last-of-type { padding-bottom: 4px; }
            .itin-time { text-align: right; padding-top: 4px; font-variant-numeric: tabular-nums; }
            .itin-mid { display: flex; justify-content: center; padding-top: 5px; }
            .itin-circle {
              width: 32px; height: 32px; border-radius: 50%;
              background: #3b82f6;
              border: none;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0; position: relative; z-index: 2;
              color: #ffffff;
              box-shadow: 0 0 0 4px var(--plan-bg);
            }
            .itin-line {
              position: absolute;
              /* Centred on the icon column: padding-left (4) + time col (62)
                 + gap (10) + half icon col (18) = 94. Translate -50% to sit
                 the line on the centre rather than to its right. */
              left: 94px;
              transform: translateX(-50%);
              top: 24px; bottom: 24px;
              width: 2px;
              background: #3b82f6;
              z-index: 0;
            }
          `}</style>
          {/* Continuous timeline thread that runs behind all circles. */}
          {itineraryDays.length > 1 && <div className="itin-line" />}

          {itineraryDays.map((d, i) => {
            const dayDate = itineraryDayDates[i];
            // Parse "08:00 — รับที่โรงแรม" → time + body. Strip "Day N — " for
            // liveaboards so the day badge isn't repeated in the title.
            let time: string | null = null;
            let text = d.heading || "";
            if (isMultiDay) {
              const m = text.match(/^Day\s+\d+\s*[—–\-:]?\s*(.+)$/i);
              if (m) text = m[1].trim();
            } else {
              const m = text.match(/^(\d{1,2}[:.]\d{2})\s*[—–\-:]?\s*(.+)$/);
              if (m) { time = m[1]; text = m[2].trim(); }
            }

            // Pick a glyph from the activity keywords. Falls back to a clean
            // dot when nothing matches — keeps the timeline readable rather
            // than aggressively guessing.
            const icon = pickItineraryIcon(text + " " + (d.bodyHtml || ""));

            return (
              <div key={i} className="itin-row">
                {/* Time / day label */}
                <div className="itin-time">
                  {isMultiDay ? (
                    <>
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#60a5fa", margin: 0, letterSpacing: "0.06em" }}>
                        {dayLabel(lang, i + 1)}
                      </p>
                      {dayDate && (
                        <p style={{ fontSize: 10.5, color: "var(--plan-fg-subtle)", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                          {fmtDayHeader(dayDate, lang)}
                        </p>
                      )}
                    </>
                  ) : time ? (
                    <p style={{ fontSize: 17, fontWeight: 800, color: "var(--plan-fg)", margin: 0, letterSpacing: "-0.02em" }}>
                      {time}
                    </p>
                  ) : null}
                </div>

                {/* Icon circle on the thread */}
                <div className="itin-mid">
                  <div className="itin-circle">
                    {icon ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{icon}</span>
                    ) : isMultiDay ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>{i + 1}</span>
                    ) : (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff" }} />
                    )}
                  </div>
                </div>

                {/* Right column: title + body */}
                <div style={{ minWidth: 0, paddingTop: 5 }}>
                  {text && (
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--plan-fg)", margin: 0, lineHeight: 1.4 }}>
                      {text}
                    </p>
                  )}
                  {d.bodyHtml && (
                    <div className="trip-itin-body" style={{ marginTop: text ? 3 : 0 }}
                      dangerouslySetInnerHTML={{ __html: d.bodyHtml }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pickerOpen && (
        <div
          onClick={() => setPickerOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
          >
            <TripSchedulePicker
              boatId={trip.boatId}
              title={trip.title}
              slug={trip.slug}
              type={trip.type}
              area={trip.area}
              cover={trip.cover}
              lang={lang}
              defaultDate={sched.departureDate?.slice(0, 10)}
              swap={{ planId, tripIndex: originalIdx }}
              onClose={() => setPickerOpen(false)}
              onAdded={() => setPickerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Detail modal — fullscreen overlay opened from the bottom-right
          "View details" pill. Replaces the inline pull-down panel so the
          boat/schedule write-up gets the whole viewport. */}
      {expanded && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1100,
            background: "var(--plan-bg, #0d0d0d)",
            overflowY: "auto",
            animation: "tripDetailIn 0.32s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <style>{`
            @keyframes tripDetailIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            .trip-rich { font-size: 15px; color: var(--plan-fg-muted); line-height: 1.75; }
            .trip-rich p { margin: 0 0 14px; }
            .trip-rich p:last-child { margin-bottom: 0; }
            .trip-rich h1, .trip-rich h2, .trip-rich h3, .trip-rich h4 {
              color: var(--plan-fg); font-weight: 800; margin: 22px 0 10px; line-height: 1.3;
            }
            .trip-rich h1 { font-size: 22px; }
            .trip-rich h2 { font-size: 19px; }
            .trip-rich h3 { font-size: 16px; }
            .trip-rich h4 { font-size: 14px; }
            .trip-rich ul, .trip-rich ol { margin: 0 0 14px; padding-left: 22px; }
            .trip-rich li { margin-bottom: 6px; }
            .trip-rich a { color: #60a5fa; text-decoration: underline; }
            .trip-rich strong, .trip-rich b { color: var(--plan-fg); font-weight: 700; }
            .trip-rich em, .trip-rich i { font-style: italic; }
            .trip-rich blockquote {
              margin: 14px 0; padding: 10px 16px; border-left: 3px solid #3b82f6;
              background: var(--plan-surface-alt); color: var(--plan-fg-muted); border-radius: 0 8px 8px 0;
            }
            .trip-rich img { max-width: 100%; border-radius: 10px; margin: 12px 0; }
            .trip-rich hr { border: none; border-top: 1px solid var(--plan-border-soft); margin: 18px 0; }
          `}</style>

          {/* Sticky top bar with back arrow + trip title */}
          <div style={{
            position: "sticky", top: 0, zIndex: 2,
            background: "var(--plan-bg, #0d0d0d)",
            borderBottom: "1px solid var(--plan-border-soft)",
            padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <button onClick={() => setExpanded(false)} aria-label="Close"
              style={{ width: 34, height: 34, borderRadius: "50%", background: "transparent", border: "1px solid var(--plan-border-soft)", color: "var(--plan-fg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--plan-fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</p>
              <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {TYPE_LABEL[trip.type] || trip.type}
                {sched.departureDate && ` · ${
                  sched.returnDate && sched.returnDate !== sched.departureDate
                    ? `${fmtDate(sched.departureDate, lang)} → ${fmtDate(sched.returnDate, lang)}`
                    : fmtDate(sched.departureDate, lang)
                }`}
              </p>
            </div>
            {canEdit && (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => { setExpanded(false); setPickerOpen(true); }}
                  title={L("clickToChangeDate")}
                  style={{
                    padding: "6px 10px", borderRadius: 8,
                    background: "var(--plan-surface-alt)", border: "1px solid var(--plan-border-soft)",
                    color: "var(--plan-fg)", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                  </svg>
                  {lang === "th" ? "เปลี่ยนวัน" : "Change date"}
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined" && !window.confirm(lang === "th" ? "ลบทริปนี้ออกจากแพลน?" : "Remove this trip from plan?")) return;
                    setExpanded(false);
                    handleRemove();
                  }}
                  title={L("remove")}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "transparent", border: "1px solid var(--plan-border-soft)",
                    color: "var(--plan-fg-subtle)", cursor: "pointer", fontFamily: "inherit",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Scrollable detail body */}
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 20px 60px" }}>
            {detailLoading && <ScheduleDetailSkeleton lang={lang} />}

            {!detailLoading && detail && (() => {
              const b = detail.boat;
              const s = detail.schedule;
              const sContentTrimmed = stripScheduleFromContent(s?.content);
              const hasAny = !!(b?.excerpt || b?.content || s?.excerpt || s?.route || sContentTrimmed);
              if (!hasAny) return (
                <p style={{ fontSize: 13, color: "var(--plan-fg-subtle)", textAlign: "center", padding: "16px 0" }}>
                  {L("noAdditionalDetails")}
                </p>
              );
              return (
                <>
                  {b?.excerpt && (
                    <div className="trip-rich" style={{ marginBottom: 14 }}
                      dangerouslySetInnerHTML={{ __html: b.excerpt }} />
                  )}
                  {b?.content && (
                    <div className="trip-rich" style={{ marginBottom: (s?.excerpt || s?.route || sContentTrimmed) ? 18 : 0 }}
                      dangerouslySetInnerHTML={{ __html: b.content }} />
                  )}
                  {s?.excerpt && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label("excerpt")}</p>
                      <div className="trip-rich" dangerouslySetInnerHTML={{ __html: s.excerpt }} />
                    </div>
                  )}
                  {s?.route && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label("route")}</p>
                      <div className="trip-rich" dangerouslySetInnerHTML={{ __html: s.route }} />
                    </div>
                  )}
                  {sContentTrimmed && (
                    <div>
                      <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label("content")}</p>
                      <div className="trip-rich" dangerouslySetInnerHTML={{ __html: sContentTrimmed }} />
                    </div>
                  )}
                </>
              );
            })()}

            {!detailLoading && !detail && (
              <p style={{ fontSize: 13, color: "var(--plan-fg-subtle)", textAlign: "center", padding: "16px 0" }}>
                {L("cantLoadDetails")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Unscheduled card ─────────────────────────────────────────────────────────

function UnscheduledCard({ trip, originalIdx, planId, canEdit, onRemoved }: {
  trip: PlanTrip; originalIdx: number; planId: string; lang: string; canEdit: boolean;
  onRemoved?: () => void;
}) {
  const handleRemove = () => {
    removeTripByIndex(planId, originalIdx);
    onRemoved?.();
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "var(--plan-surface)", border: "1px solid var(--plan-border-soft)", borderRadius: 12, padding: 12,
    }}>
      {trip.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={trip.cover} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 48, height: 36, background: "var(--plan-surface-alt)", borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          {TYPE_EMOJI[trip.type] || "🤿"}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {trip.area && <p style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>{trip.area}</p>}
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--plan-fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</p>
        <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", margin: "2px 0 0" }}>{TYPE_LABEL[trip.type] || trip.type}</p>
      </div>
      {canEdit && (
        <button onClick={handleRemove}
          style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--plan-border)", background: "transparent", color: "var(--plan-fg-subtle)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          ✕
        </button>
      )}
    </div>
  );
}

// ── ItemEntryCard ────────────────────────────────────────────────────────────
// Flight / hotel card rendered inline with trip sections, ordered by item
// startAt so the entry lands at the right point on the calendar. Click body
// → onEdit (the same edit modal also functions as "view details"). X → onRemove.
const ITEM_TYPE_LABEL: Record<string, Record<string, string>> = {
  FLIGHT:   { th: "เที่ยวบิน", en: "Flight" },
  HOTEL:    { th: "ที่พัก",     en: "Hotel" },
  ACTIVITY: { th: "กิจกรรม",   en: "Activity" },
  TRANSFER: { th: "การเดินทาง", en: "Transfer" },
  NOTE:     { th: "บันทึก",    en: "Note" },
};
const ITEM_TYPE_EMOJI: Record<string, string> = {
  FLIGHT: "✈️", HOTEL: "🏨", ACTIVITY: "🎯", TRANSFER: "🚗", NOTE: "📝",
};

function ItemEntryCard({ item, lang, canEdit, onRemove, onEdit }: {
  item: PlanItem; lang: string; canEdit: boolean;
  onRemove: () => void; onEdit: () => void;
}) {
  const typeLabel = (ITEM_TYPE_LABEL[item.type]?.[lang]) || ITEM_TYPE_LABEL[item.type]?.en || item.type;
  const icon = ITEM_TYPE_EMOJI[item.type] || "📍";
  const locale = LOCALE_MAP[lang] || "en-US";
  const start = new Date(item.startAt);
  const end = item.endAt ? new Date(item.endAt) : null;
  const dateLabel = start.toLocaleDateString(locale, { day: "numeric", month: "short", year: "2-digit" });
  const timeLabel = start.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  // Hotels list a date range (check in → check out); everything else (flights
  // mostly) shows a single date + time.
  const isHotel = item.type === "HOTEL";
  const checkInLabel  = lang === "th" ? "เช็คอิน"   : "Check in";
  const checkOutLabel = lang === "th" ? "เช็คเอาท์" : "Check out";
  const endDateLabel = end?.toLocaleDateString(locale, { day: "numeric", month: "short", year: "2-digit" });

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && !window.confirm(lang === "th" ? "ลบรายการนี้ใช่ไหม?" : "Remove this item?")) return;
    onRemove();
  };

  return (
    <div
      onClick={onEdit}
      style={{
        background: "var(--plan-surface)",
        border: "1px solid var(--plan-border-soft)",
        borderRadius: 12,
        padding: 12,
        cursor: "pointer",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: "rgba(59,130,246,0.10)",
        border: "1px solid rgba(96,165,250,0.30)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: 18,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          {typeLabel}
        </p>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--plan-fg)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.title}
        </p>
        {isHotel && end ? (
          <p style={{ fontSize: 12, color: "var(--plan-fg-subtle)", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <span>{checkInLabel}: {dateLabel}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>{checkOutLabel}: {endDateLabel}</span>
            <EditHint />
          </p>
        ) : (
          <p style={{ fontSize: 12, color: "var(--plan-fg-subtle)", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <span>{dateLabel} · {timeLabel}</span>
            {item.location && <span>· {item.location}</span>}
            <EditHint />
          </p>
        )}
      </div>
      {canEdit && (
        <button onClick={handleRemoveClick} aria-label="Remove"
          style={{
            width: 24, height: 24, borderRadius: 6,
            border: "1px solid var(--plan-surface-alt)", background: "transparent",
            color: "var(--plan-fg-subtle)", fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
          ✕
        </button>
      )}
    </div>
  );
}

// Tiny pencil icon appended after the date — a quiet hint that the row is
// editable. The whole card is clickable; this just makes the affordance
// visible to the user.
function EditHint() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55, marginLeft: 2 }}>
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
    </svg>
  );
}
