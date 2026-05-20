"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { type PlanTrip, removeTripByIndex } from "@/lib/plan-store";
import { parseItinerary, extractScheduleFromContent, stripScheduleFromContent } from "@/lib/ark-ai/itinerary-parser";
import { ScheduleDetailSkeleton } from "../Skeletons";
import TripSchedulePicker from "../TripSchedulePicker";
import { t, dayLabel, schedulesDailyLabel, schedulesStopsLabel } from "@/lib/ark-ai/i18n";

type FetchedDetail = {
  boat: { title: string; excerpt: string; content: string } | null;
  schedule: { title: string; excerpt: string; content: string; route: string } | null;
};

type Props = {
  planId: string;
  trips: PlanTrip[];
  lang: string;
  canEdit: boolean;
  onTripRemoved?: () => void;
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

export default function PlanTimeline({ planId, trips, lang, canEdit, onTripRemoved }: Props) {
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

  if (trips.length === 0) return null;

  return (
    <div>
      <style>{`
        @keyframes conflictPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }
      `}</style>

      {sortedScheduled.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sortedScheduled.map(({ trip, originalIdx }, idx) => (
            <TripSection
              key={`${trip.boatId}-${trip.schedule!.scheduleId}-${originalIdx}`}
              trip={trip}
              originalIdx={originalIdx}
              planId={planId}
              lang={lang}
              canEdit={canEdit}
              overlap={conflictsByTripIdx.has(originalIdx)}
              conflicts={conflictsByTripIdx.get(originalIdx)}
              isLast={idx === sortedScheduled.length - 1}
              onRemoved={onTripRemoved}
            />
          ))}
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
  const [showItinerary, setShowItinerary] = useState(true);
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
                        }}
                      >
                        {sched.returnDate && sched.returnDate !== sched.departureDate
                          ? `${fmtDate(sched.departureDate, lang)} → ${fmtDate(sched.returnDate, lang)}`
                          : fmtDate(sched.departureDate, lang)}
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

          {/* Route (collapsed) — prefer fresh detail (current lang) over cached */}
          {(() => {
            const routeText = detail?.schedule?.route || sched.route;
            if (expanded || !routeText) return null;
            return (
              <div style={{ padding: "0 12px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--plan-fg-subtle)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <p style={{ fontSize: 12, color: "var(--plan-fg-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {routeText.replace(/<[^>]+>/g, "").slice(0, 80)}
                </p>
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

          {/* Expand/collapse toggle */}
          <button
            onClick={handleToggle}
            style={{
              width: "100%", padding: "8px 12px",
              background: "transparent", border: "none", borderTop: "1px solid var(--plan-border-soft)",
              color: "var(--plan-fg-subtle)", fontSize: 11, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            {expanded
              ? L("hideDetails")
              : L("viewDetails")}
          </button>

          {/* Expanded schedule detail — fetched from API */}
          {expanded && (
            <div style={{
              overflow: "hidden",
              borderTop: "1px solid var(--plan-border-soft)",
              padding: "12px",
            }}>
              <style>{`
                .rich-content { font-size: 15px; color: var(--plan-fg-muted); line-height: 1.8; }
                .rich-content p { margin: 0 0 14px; }
                .rich-content p:last-child { margin-bottom: 0; }
                .rich-content h1, .rich-content h2, .rich-content h3, .rich-content h4 {
                  color: var(--plan-fg); font-weight: 800; margin: 22px 0 10px; line-height: 1.3;
                }
                .rich-content h1 { font-size: 22px; }
                .rich-content h2 { font-size: 19px; }
                .rich-content h3 { font-size: 16px; }
                .rich-content h4 { font-size: 14px; }
                .rich-content ul, .rich-content ol { margin: 0 0 14px; padding-left: 22px; }
                .rich-content li { margin-bottom: 6px; }
                .rich-content a { color: #60a5fa; text-decoration: underline; }
                .rich-content strong, .rich-content b { color: var(--plan-fg); font-weight: 700; }
                .rich-content em, .rich-content i { font-style: italic; }
                .rich-content blockquote {
                  margin: 14px 0; padding: 10px 16px; border-left: 3px solid #3b82f6;
                  background: var(--plan-border-soft); color: var(--plan-fg-muted); border-radius: 0 8px 8px 0;
                }
                .rich-content img { max-width: 100%; border-radius: 10px; margin: 12px 0; }
                .rich-content hr { border: none; border-top: 1px solid var(--plan-border); margin: 18px 0; }
                @keyframes spin { to { transform: rotate(360deg); } }
              `}</style>
              {detailLoading && <ScheduleDetailSkeleton lang={lang} />}

              {!detailLoading && detail && (() => {
                const b = detail.boat;
                const s = detail.schedule;
                // The schedule content already feeds the day-by-day timeline
                // above. Strip its "กำหนดการ" / "Itinerary" section here so
                // the detail panel surfaces the OTHER info (price/included/
                // contact/notes) without duplicating what the timeline shows.
                const sContentTrimmed = stripScheduleFromContent(s?.content);
                const hasAny = !!(b?.excerpt || b?.content || s?.excerpt || s?.route || sContentTrimmed);
                if (!hasAny) return (
                  <p style={{ fontSize: 12, color: "var(--plan-fg-subtle)", textAlign: "center", padding: "8px 0" }}>
                    {L("noAdditionalDetails")}
                  </p>
                );
                return (
                  <>
                    {/* Boat-level content (main description from backoffice liveaboard detail) */}
                    {b?.excerpt && (
                      <div className="rich-content" style={{ marginBottom: 12 }}
                        dangerouslySetInnerHTML={{ __html: b.excerpt }} />
                    )}
                    {b?.content && (
                      <div className="rich-content" style={{ marginBottom: (s?.excerpt || s?.route || s?.content) ? 16 : 0 }}
                        dangerouslySetInnerHTML={{ __html: b.content }} />
                    )}

                    {/* Schedule-specific content (per-departure info) */}
                    {s?.excerpt && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                          {label("excerpt")}
                        </p>
                        <div className="rich-content" dangerouslySetInnerHTML={{ __html: s.excerpt }} />
                      </div>
                    )}
                    {s?.route && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                          {label("route")}
                        </p>
                        <div className="rich-content" dangerouslySetInnerHTML={{ __html: s.route }} />
                      </div>
                    )}
                    {sContentTrimmed && (
                      <div>
                        <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                          {label("content")}
                        </p>
                        <div className="rich-content" dangerouslySetInnerHTML={{ __html: sContentTrimmed }} />
                      </div>
                    )}
                  </>
                );
              })()}

              {!detailLoading && !detail && (
                <p style={{ fontSize: 12, color: "var(--plan-fg-subtle)", textAlign: "center", padding: "8px 0" }}>
                  {L("cantLoadDetails")}
                </p>
              )}

              {/* Bottom collapse — saves the user a long scroll back up
                  after reading a multi-screen operator description. */}
              {!detailLoading && (
                <button
                  onClick={handleToggle}
                  style={{
                    width: "100%", marginTop: 14, padding: "8px 12px",
                    background: "transparent", border: "1px solid var(--plan-border-soft)", borderRadius: 8,
                    color: "var(--plan-fg-subtle)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    fontFamily: "inherit",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: "rotate(180deg)" }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  {L("hideDetails")}
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Itinerary timeline — extracted out of the trip card so the schedule
          reads as its own sibling container. Per user feedback the day-by-day
          itinerary belongs in a separate block, not nested inside the boat
          card. */}
      {itineraryDays.length > 0 && (
        <div style={{
          marginTop: 10,
          background: "var(--plan-surface)",
          border: "1px solid var(--plan-border-soft)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          <button
            type="button"
            onClick={() => setShowItinerary(s => !s)}
            style={{
              width: "100%", padding: "10px 12px",
              background: showItinerary ? "rgba(30,58,138,0.12)" : "transparent",
              border: "none",
              color: showItinerary ? "#dbeafe" : "var(--plan-fg-muted)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "inherit",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: showItinerary ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span>
              {showItinerary
                ? L("hideItinerary")
                : (isMultiDay
                    ? schedulesDailyLabel(lang, itineraryDays.length)
                    : schedulesStopsLabel(lang, itineraryDays.length))}
            </span>
          </button>
          {showItinerary && (
            <div style={{ padding: "4px 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
              <style>{`
                .trip-itin-body { font-size: 13px; color: var(--plan-fg-muted); line-height: 1.65; }
                .trip-itin-body p { margin: 0 0 6px; }
                .trip-itin-body p:last-child { margin-bottom: 0; }
                .trip-itin-body strong, .trip-itin-body b { color: var(--plan-fg); font-weight: 700; }
                .trip-itin-body a { color: #60a5fa; text-decoration: underline; }
                .trip-itin-body ul, .trip-itin-body ol { margin: 4px 0 6px; padding-left: 18px; }
                .trip-itin-body li { margin-bottom: 3px; }
              `}</style>
              {itineraryDays.map((d, i) => {
                const dayDate = itineraryDayDates[i];
                return (
                  <div key={i} style={{ position: "relative", paddingLeft: 22 }}>
                    {/* Timeline dot + connector for multi-day */}
                    <div style={{
                      position: "absolute", left: 0, top: 4,
                      width: 16, height: 16, borderRadius: "50%",
                      background: isMultiDay ? "#1e3a8a" : "#3b82f6",
                      border: "2px solid var(--plan-bg)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 900, color: "#dbeafe",
                      zIndex: 2,
                    }}>
                      {isMultiDay ? i + 1 : ""}
                    </div>
                    {i < itineraryDays.length - 1 && (
                      <div style={{
                        position: "absolute", left: 7, top: 22, bottom: -12,
                        width: 2, background: "#1e3a8a", opacity: 0.5,
                        zIndex: 1,
                      }} />
                    )}
                    {isMultiDay ? (
                      <p style={{ fontSize: 11, fontWeight: 800, color: "#60a5fa", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {dayLabel(lang, i + 1)}
                        {dayDate && <span style={{ color: "var(--plan-fg-subtle)", fontWeight: 600 }}> · {fmtDayHeader(dayDate, lang)}</span>}
                      </p>
                    ) : null}
                    {d.heading && (() => {
                      const timeMatch = !isMultiDay
                        ? d.heading.match(/^(\s*\d{1,2}[:.]\d{2}\s*[—–\-:]?\s*)(.+)$/)
                        : null;
                      return (
                        <p style={{
                          fontSize: isMultiDay ? 13 : 12,
                          fontWeight: isMultiDay ? 800 : 500,
                          color: "var(--plan-fg)",
                          margin: "0 0 4px",
                        }}>
                          {timeMatch ? (
                            <>
                              <span style={{ fontWeight: 800 }}>{timeMatch[1].trim()}</span>{" "}
                              <span style={{ fontWeight: 400 }}>{timeMatch[2]}</span>
                            </>
                          ) : (
                            d.heading
                          )}
                        </p>
                      );
                    })()}
                    {d.bodyHtml && (
                      <div className="trip-itin-body" dangerouslySetInnerHTML={{ __html: d.bodyHtml }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
