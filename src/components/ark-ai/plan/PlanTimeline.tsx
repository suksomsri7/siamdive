"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { type PlanTrip, updateTripNote, updateTripPackages, removeTripByIndex } from "@/lib/plan-store";
import { groupTripsByDay, type DayBucket } from "@/lib/ark-ai/day-grouping";
import { parseItinerary } from "@/lib/ark-ai/itinerary-parser";
import TripIncludedBlock from "./TripIncludedBlock";

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
  onAddPackage?: (slug: string, departureDate?: string) => void;
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

export default function PlanTimeline({ planId, trips, lang, canEdit, onTripRemoved, onAddPackage }: Props) {
  const isTh = lang === "th";

  // Day-grouped buckets — anchored on the longest LIVEABOARD/RESORT, with
  // pre-trips landing on Day 0 / Day -1 etc. Liveaboard continuation days
  // (no separate departure) appear as soft markers under the anchor card.
  const buckets: DayBucket[] = useMemo(() => groupTripsByDay(trips), [trips]);

  // Anchor liveaboard's parsed itinerary, keyed by 0-based day offset (Day 1 = idx 0).
  const anchorItinerary = useMemo(() => {
    const anchor = trips.find(t => (t.type === "LIVEABOARD" || t.type === "DIVE_RESORT") && t.schedule?.itinerary);
    if (!anchor?.schedule?.itinerary) return [];
    return parseItinerary(anchor.schedule.itinerary);
  }, [trips]);

  const unscheduled = trips
    .map((t, idx) => ({ trip: t, originalIdx: idx }))
    .filter(({ trip }) => !trip.schedule?.departureDate);

  // Per-day overlap detection — flag the day if more than one different
  // trip departs on it (rare but possible if user adds a daytrip mid-liveaboard).
  const overlapDays = useMemo(() => {
    const set = new Set<number>();
    for (const b of buckets) {
      const distinctTrips = new Set(b.trips.map(s => s.trip.boatId));
      if (distinctTrips.size > 1) set.add(b.day);
    }
    return set;
  }, [buckets]);

  if (trips.length === 0) return null;

  return (
    <div>
      <style>{`
        @keyframes conflictPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }
      `}</style>

      {buckets.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {buckets.map((bucket, bIdx) => (
            <DayBucketRow
              key={`day-${bucket.day}`}
              bucket={bucket}
              anchorItineraryDay={anchorItinerary[bucket.day - 1]}
              overlap={overlapDays.has(bucket.day)}
              isLast={bIdx === buckets.length - 1}
              planId={planId}
              lang={lang}
              canEdit={canEdit}
              onTripRemoved={onTripRemoved}
              onAddPackage={onAddPackage}
            />
          ))}
        </div>
      )}

      {unscheduled.length > 0 && (
        <div style={{ marginTop: buckets.length > 0 ? 20 : 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            {isTh ? "ยังไม่กำหนดวัน" : "Unscheduled"}
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

// ── Day bucket row ───────────────────────────────────────────────────────────
function DayBucketRow({
  bucket, anchorItineraryDay, overlap, isLast, planId, lang, canEdit, onTripRemoved, onAddPackage,
}: {
  bucket: DayBucket;
  anchorItineraryDay: { heading: string; bodyHtml: string } | undefined;
  overlap: boolean;
  isLast: boolean;
  planId: string;
  lang: string;
  canEdit: boolean;
  onTripRemoved?: () => void;
  onAddPackage?: (slug: string, departureDate?: string) => void;
}) {
  const isTh = lang === "th";
  const [showItinerary, setShowItinerary] = useState(false);

  // Show the operator's itinerary heading next to the day pill if we have one
  // for this day AND the day belongs to the liveaboard span.
  const itineraryHeading = bucket.isLiveaboardContinuation || bucket.trips.length > 0
    ? anchorItineraryDay?.heading
    : undefined;

  return (
    <div>
      {/* Day header band */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "6px 0 8px",
        borderBottom: bucket.trips.length > 0 || bucket.isLiveaboardContinuation
          ? "1px solid #1a1a1a" : "1px dashed #1a1a1a",
        marginBottom: 10,
      }}>
        <div style={{
          minWidth: 56, height: 28, borderRadius: 8, padding: "0 10px",
          background: bucket.day === 1 ? "#1e3a8a" : bucket.day < 1 ? "#1f1f1f" : "#161616",
          border: bucket.day === 1 ? "1px solid #1e40af" : "1px solid #2a2a2a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800,
          color: bucket.day === 1 ? "#fff" : bucket.day < 1 ? "#888" : "#e5e5e5",
          flexShrink: 0,
        }}>
          {bucket.day < 1 ? `Day ${bucket.day}` : `Day ${bucket.day}`}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#bbb", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fmtDayHeader(bucket.date, lang)}
            {itineraryHeading && (
              <span style={{ color: "#666", fontWeight: 500 }}> · {itineraryHeading}</span>
            )}
          </p>
          {bucket.day < 1 && (
            <p style={{ fontSize: 10, color: "#555", margin: "1px 0 0", fontWeight: 600 }}>
              {isTh ? "ก่อนทริปหลัก" : "Before main trip"}
            </p>
          )}
        </div>
        {overlap && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "conflictPulse 1.5s ease-in-out infinite", flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        )}
      </div>

      {/* Day body */}
      {bucket.trips.length === 0 && bucket.isLiveaboardContinuation && (
        <ContinuationCard
          itineraryDay={anchorItineraryDay}
          showItinerary={showItinerary}
          onToggle={() => setShowItinerary(s => !s)}
          lang={lang}
        />
      )}

      {bucket.trips.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bucket.trips.map(({ trip, originalIdx }) => (
            <TripSection
              key={`${trip.boatId}-${trip.schedule!.scheduleId}-${originalIdx}`}
              trip={trip}
              originalIdx={originalIdx}
              planId={planId}
              lang={lang}
              canEdit={canEdit}
              overlap={overlap}
              isLast={isLast}
              onRemoved={onTripRemoved}
              onAddPackage={onAddPackage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Liveaboard continuation card (day spans the anchor but no new departure) ─
function ContinuationCard({
  itineraryDay, showItinerary, onToggle, lang,
}: {
  itineraryDay: { heading: string; bodyHtml: string } | undefined;
  showItinerary: boolean;
  onToggle: () => void;
  lang: string;
}) {
  const isTh = lang === "th";
  const hasBody = !!itineraryDay?.bodyHtml;

  return (
    <div style={{
      borderRadius: 10,
      background: "#0d0d0d",
      border: "1px dashed #222",
      padding: hasBody ? 0 : "10px 14px",
      color: "#666",
      fontSize: 12,
      fontWeight: 500,
    }}>
      {!hasBody ? (
        <span>{isTh ? "อยู่บนเรือต่อเนื่อง" : "Liveaboard continues"}</span>
      ) : (
        <>
          <button
            type="button"
            onClick={onToggle}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              color: "#888",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "inherit",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: showItinerary ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            {showItinerary
              ? (isTh ? "ซ่อนกิจกรรม" : "Hide activities")
              : (isTh ? "กิจกรรมประจำวัน" : "Day activities")}
          </button>
          {showItinerary && (
            <div style={{ padding: "0 14px 12px" }}>
              <style>{`
                .day-itin { font-size: 13px; color: #aaa; line-height: 1.65; }
                .day-itin p { margin: 0 0 8px; }
                .day-itin strong, .day-itin b { color: #ddd; font-weight: 700; }
                .day-itin a { color: #60a5fa; text-decoration: underline; }
              `}</style>
              <div className="day-itin" dangerouslySetInnerHTML={{ __html: itineraryDay!.bodyHtml }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Package row with qty controls ─────────────────────────────────────────────
function PackageRow({ pkg, index, canEdit, onChange, onRemove }: {
  pkg: { name: string; minPrice: number; qty?: number };
  index: number;
  canEdit: boolean;
  onChange: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
}) {
  const qty = pkg.qty || 1;
  const total = pkg.minPrice * qty;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 10px", borderRadius: 8,
      background: "#0f0f0f",
      border: "1px solid #1a1a1a",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e5e5e5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pkg.name}
        </p>
        {pkg.minPrice > 0 && (
          <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0", fontWeight: 500 }}>
            ฿{pkg.minPrice.toLocaleString()} × {qty} = ฿{total.toLocaleString()}
          </p>
        )}
      </div>
      {!canEdit && (
        <span style={{ fontSize: 11, fontWeight: 700, color: "#888", background: "#1a1a1a", padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>
          x{qty}
        </span>
      )}
      {canEdit && (
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
          <button onClick={() => qty > 1 ? onChange(index, qty - 1) : onRemove(index)}
            style={{
              width: 28, height: 28, borderRadius: "6px 0 0 6px",
              border: "1px solid #333", borderRight: "none",
              background: "rgba(255,255,255,0.04)", color: "#aaa",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700,
            }}>
            {qty <= 1 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            ) : "−"}
          </button>
          <div style={{
            width: 32, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid #333", background: "rgba(0,0,0,0.3)",
            fontSize: 13, fontWeight: 800, color: "#fff",
          }}>
            {qty}
          </div>
          <button onClick={() => onChange(index, qty + 1)}
            style={{
              width: 28, height: 28, borderRadius: "0 6px 6px 0",
              border: "1px solid #333", borderLeft: "none",
              background: "rgba(255,255,255,0.04)", color: "#aaa",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700,
            }}>
            +
          </button>
        </div>
      )}
    </div>
  );
}

// ── Trip section (scheduled) ─────────────────────────────────────────────────
function TripSection({ trip, originalIdx, planId, lang, canEdit, overlap, onRemoved, onAddPackage }: {
  trip: PlanTrip; originalIdx: number; planId: string; lang: string; canEdit: boolean;
  overlap: boolean; isLast: boolean; onRemoved?: () => void; onAddPackage?: (slug: string, departureDate?: string) => void;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(trip.note || "");
  const [pkgs, setPkgs] = useState(trip.schedule!.packages);
  const [expanded, setExpanded] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [detail, setDetail] = useState<FetchedDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const isTh = lang === "th";
  const sched = trip.schedule!;
  const dayDates = generateDayDates(sched.departureDate, sched.returnDate);
  const isMultiDay = dayDates.length > 1;
  const isLiveaboard = trip.type === "LIVEABOARD" || trip.type === "DIVE_RESORT";

  // Parse the operator's hour-by-hour itinerary so DAYTRIP/SNORKELING/FREEDIVE/
  // LAND_TOUR cards can show "08:00 pickup → 10:30 dive 1 → 12:00 lunch ..."
  // inline. Liveaboard/Resort cards skip this — their multi-day itinerary is
  // already sliced across the day-bucket continuation cards above, so showing
  // the full thing here would duplicate.
  const itineraryDays = useMemo(
    () => (!isLiveaboard ? parseItinerary(sched.itinerary) : []),
    [sched.itinerary, isLiveaboard],
  );

  const pkgKey = trip.schedule!.packages.map(p => p.name).join(",");
  useState(() => { /* init only */ });
  if (pkgKey !== pkgs.map(p => p.name).join(",")) {
    setPkgs(trip.schedule!.packages);
  }

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

  const handleToggle = () => {
    if (!expanded) fetchDetail();
    setExpanded(!expanded);
  };

  const handleSaveNote = () => {
    updateTripNote(planId, originalIdx, noteValue.trim());
    setEditingNote(false);
  };

  const handleRemove = () => {
    removeTripByIndex(planId, originalIdx);
    onRemoved?.();
  };

  const handlePkgQtyChange = (pkgIdx: number, qty: number) => {
    const next = pkgs.map((p, i) => i === pkgIdx ? { ...p, qty } : p);
    setPkgs(next);
    updateTripPackages(planId, originalIdx, next);
  };

  const handlePkgRemove = (pkgIdx: number) => {
    const next = pkgs.filter((_, i) => i !== pkgIdx);
    if (next.length === 0) {
      removeTripByIndex(planId, originalIdx);
      onRemoved?.();
      return;
    }
    setPkgs(next);
    updateTripPackages(planId, originalIdx, next);
  };

  const handleAddPackage = () => {
    onAddPackage?.(trip.slug, sched.departureDate?.slice(0, 10));
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
          background: "#111",
          border: overlap ? "1px solid rgba(239,68,68,0.35)" : "1px solid #1a1a1a",
          borderRadius: 12, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
            {trip.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={trip.cover} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 48, height: 36, background: "#161616", borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {TYPE_EMOJI[trip.type] || "🤿"}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {trip.area && <p style={{ fontSize: 10, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>{trip.area}</p>}
              <p style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</p>
              <p style={{ fontSize: 12, color: "#555", margin: "2px 0 0" }}>
                {TYPE_LABEL[trip.type] || trip.type}
                {sched.returnDate && ` · ${fmtDate(sched.departureDate, lang)} → ${fmtDate(sched.returnDate, lang)}`}
                {isMultiDay && ` · ${dayDates.length} ${isTh ? "วัน" : "days"}`}
              </p>
            </div>
            {canEdit && (
              <button onClick={handleRemove}
                style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #222", background: "transparent", color: "#555", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                ✕
              </button>
            )}
          </div>

          {/* Route (collapsed) */}
          {!expanded && sched.route && (
            <div style={{ padding: "0 12px 8px", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <p style={{ fontSize: 12, color: "#888", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {sched.route.replace(/<[^>]+>/g, "").slice(0, 80)}
              </p>
            </div>
          )}

          {/* Packages with qty controls */}
          {(pkgs.length > 0 || canEdit) && (
            <div style={{ padding: "0 12px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
              {pkgs.map((pkg, i) => (
                <PackageRow key={i} pkg={pkg} index={i} canEdit={canEdit} onChange={handlePkgQtyChange} onRemove={handlePkgRemove} />
              ))}
              {canEdit && (
                <button onClick={handleAddPackage}
                  style={{
                    padding: "6px 0", borderRadius: 8,
                    border: "1px dashed #333", background: "transparent",
                    color: "#666", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {isLiveaboard ? (isTh ? "เพิ่ม Cabin" : "Add Cabin") : (isTh ? "เพิ่ม Package" : "Add Package")}
                </button>
              )}
            </div>
          )}

          {/* Hour-by-hour itinerary for non-liveaboard trips (operator-written) */}
          {itineraryDays.length > 0 && (
            <div style={{ borderTop: "1px solid #1a1a1a" }}>
              <button
                type="button"
                onClick={() => setShowItinerary(s => !s)}
                style={{
                  width: "100%", padding: "8px 12px",
                  background: "transparent", border: "none",
                  color: "#888", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "inherit",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: showItinerary ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                <span>
                  {showItinerary
                    ? (isTh ? "ซ่อนกำหนดการ" : "Hide schedule")
                    : (isTh ? `กำหนดการ (${itineraryDays.length} ช่วง)` : `Schedule (${itineraryDays.length} stops)`)}
                </span>
              </button>
              {showItinerary && (
                <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <style>{`
                    .trip-itin-body { font-size: 13px; color: #b5b5b5; line-height: 1.65; }
                    .trip-itin-body p { margin: 0 0 6px; }
                    .trip-itin-body p:last-child { margin-bottom: 0; }
                    .trip-itin-body strong, .trip-itin-body b { color: #e5e5e5; font-weight: 700; }
                    .trip-itin-body a { color: #60a5fa; text-decoration: underline; }
                    .trip-itin-body ul, .trip-itin-body ol { margin: 4px 0 6px; padding-left: 18px; }
                    .trip-itin-body li { margin-bottom: 3px; }
                  `}</style>
                  {itineraryDays.map((d, i) => (
                    <div key={i} style={{
                      borderLeft: "2px solid #1e3a8a",
                      paddingLeft: 10,
                    }}>
                      {d.heading && (
                        <p style={{ fontSize: 12, fontWeight: 800, color: "#dbeafe", margin: "0 0 4px" }}>
                          {d.heading}
                        </p>
                      )}
                      {d.bodyHtml && (
                        <div className="trip-itin-body" dangerouslySetInnerHTML={{ __html: d.bodyHtml }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Included / Not included — operator-aware fallback list */}
          <TripIncludedBlock
            tripType={trip.type}
            operatorContentHtml={detail?.schedule?.content}
            lang={lang}
          />

          {/* Expand/collapse toggle */}
          <button
            onClick={handleToggle}
            style={{
              width: "100%", padding: "8px 12px",
              background: "transparent", border: "none", borderTop: "1px solid #1a1a1a",
              color: "#666", fontSize: 11, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            {expanded
              ? (isTh ? "ซ่อนรายละเอียด" : "Hide details")
              : (isTh ? "ดูรายละเอียด" : "View details")}
          </button>

          {/* Expanded schedule detail — fetched from API */}
          {expanded && (
            <div style={{
              overflow: "hidden",
              borderTop: "1px solid #1a1a1a",
              padding: "12px",
            }}>
              <style>{`
                .rich-content { font-size: 15px; color: #bbb; line-height: 1.8; }
                .rich-content p { margin: 0 0 14px; }
                .rich-content p:last-child { margin-bottom: 0; }
                .rich-content h1, .rich-content h2, .rich-content h3, .rich-content h4 {
                  color: #f5f5f5; font-weight: 800; margin: 22px 0 10px; line-height: 1.3;
                }
                .rich-content h1 { font-size: 22px; }
                .rich-content h2 { font-size: 19px; }
                .rich-content h3 { font-size: 16px; }
                .rich-content h4 { font-size: 14px; }
                .rich-content ul, .rich-content ol { margin: 0 0 14px; padding-left: 22px; }
                .rich-content li { margin-bottom: 6px; }
                .rich-content a { color: #60a5fa; text-decoration: underline; }
                .rich-content strong, .rich-content b { color: #e5e5e5; font-weight: 700; }
                .rich-content em, .rich-content i { font-style: italic; }
                .rich-content blockquote {
                  margin: 14px 0; padding: 10px 16px; border-left: 3px solid #3b82f6;
                  background: #1a1a1a; color: #ccc; border-radius: 0 8px 8px 0;
                }
                .rich-content img { max-width: 100%; border-radius: 10px; margin: 12px 0; }
                .rich-content hr { border: none; border-top: 1px solid #262626; margin: 18px 0; }
                @keyframes spin { to { transform: rotate(360deg); } }
              `}</style>
              {detailLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0", gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: "2px solid #333", borderTopColor: "#888", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  <span style={{ fontSize: 12, color: "#666" }}>{isTh ? "กำลังโหลด..." : "Loading..."}</span>
                </div>
              )}

              {!detailLoading && detail && (() => {
                const b = detail.boat;
                const s = detail.schedule;
                const hasAny = !!(b?.excerpt || b?.content || s?.excerpt || s?.route || s?.content);
                if (!hasAny) return (
                  <p style={{ fontSize: 12, color: "#555", textAlign: "center", padding: "8px 0" }}>
                    {isTh ? "ไม่มีรายละเอียดเพิ่มเติม" : "No additional details available"}
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
                        <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                          {label("excerpt")}
                        </p>
                        <div className="rich-content" dangerouslySetInnerHTML={{ __html: s.excerpt }} />
                      </div>
                    )}
                    {s?.route && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                          {label("route")}
                        </p>
                        <div className="rich-content" dangerouslySetInnerHTML={{ __html: s.route }} />
                      </div>
                    )}
                    {s?.content && (
                      <div>
                        <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                          {label("content")}
                        </p>
                        <div className="rich-content" dangerouslySetInnerHTML={{ __html: s.content }} />
                      </div>
                    )}
                  </>
                );
              })()}

              {!detailLoading && !detail && (
                <p style={{ fontSize: 12, color: "#555", textAlign: "center", padding: "8px 0" }}>
                  {isTh ? "ไม่สามารถโหลดรายละเอียดได้" : "Could not load details"}
                </p>
              )}
            </div>
          )}

          {/* Note */}
          {!expanded && (
            <div style={{ padding: "0 12px 10px" }}>
              {editingNote && canEdit ? (
                <input
                  autoFocus
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  onBlur={handleSaveNote}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(); }}
                  placeholder={isTh ? "เพิ่มโน้ต..." : "Add a note..."}
                  style={{
                    width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid #222",
                    borderRadius: 6, color: "#f5f5f5", fontSize: 12, padding: "6px 8px",
                    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              ) : trip.note ? (
                <button
                  onClick={() => canEdit && setEditingNote(true)}
                  style={{ background: "none", border: "none", padding: 0, cursor: canEdit ? "pointer" : "default",
                    display: "flex", alignItems: "center", gap: 4, color: "#888", fontSize: 12, textAlign: "left" }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  {trip.note}
                </button>
              ) : canEdit ? (
                <button
                  onClick={() => setEditingNote(true)}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, color: "#444", fontSize: 12 }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  {isTh ? "เพิ่มโน้ต" : "Add note"}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Unscheduled card ─────────────────────────────────────────────────────────

function UnscheduledCard({ trip, originalIdx, planId, lang, canEdit, onRemoved }: {
  trip: PlanTrip; originalIdx: number; planId: string; lang: string; canEdit: boolean;
  onRemoved?: () => void;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(trip.note || "");
  const isTh = lang === "th";

  const handleSaveNote = () => {
    updateTripNote(planId, originalIdx, noteValue.trim());
    setEditingNote(false);
  };

  const handleRemove = () => {
    removeTripByIndex(planId, originalIdx);
    onRemoved?.();
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12,
    }}>
      {trip.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={trip.cover} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 48, height: 36, background: "#1a1a2e", borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          {TYPE_EMOJI[trip.type] || "🤿"}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {trip.area && <p style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>{trip.area}</p>}
        <p style={{ fontSize: 14, fontWeight: 700, color: "#e5e5e5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</p>
        <p style={{ fontSize: 11, color: "#555", margin: "2px 0 0" }}>{TYPE_LABEL[trip.type] || trip.type}</p>
        {editingNote && canEdit ? (
          <input
            autoFocus
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={handleSaveNote}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(); }}
            placeholder={isTh ? "โน้ต..." : "Note..."}
            style={{
              marginTop: 4, width: "100%",
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(148,163,184,0.12)",
              borderRadius: 6, color: "#f5f5f5", fontSize: 11, padding: "4px 6px",
              outline: "none", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        ) : trip.note ? (
          <button
            onClick={(e) => { e.stopPropagation(); if (canEdit) setEditingNote(true); }}
            style={{
              marginTop: 2, background: "none", border: "none", padding: 0,
              cursor: canEdit ? "pointer" : "default",
              color: "#888", fontSize: 11, display: "flex", alignItems: "center", gap: 3,
              textAlign: "left",
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {trip.note}
          </button>
        ) : canEdit ? (
          <button
            onClick={(e) => { e.stopPropagation(); setEditingNote(true); }}
            style={{
              marginTop: 2, background: "none", border: "none", padding: 0, cursor: "pointer",
              color: "#444", fontSize: 11, display: "flex", alignItems: "center", gap: 3,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {isTh ? "โน้ต" : "Note"}
          </button>
        ) : null}
      </div>
      {canEdit && (
        <button onClick={handleRemove}
          style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #262626", background: "transparent", color: "#555", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          ✕
        </button>
      )}
    </div>
  );
}
