"use client";

import { useEffect, useState } from "react";
import { getPlans, addTrip, addTripToPlan, createPlan, checkDateConflicts, suggestPlanName, type PlanTrip, type DateConflict } from "@/lib/plan-store";
import PlanSelectorSheet from "./plan/PlanSelectorSheet";
import DateConflictModal from "./plan/DateConflictModal";

type SchedulePackage = {
  packageId: string;
  isFull: boolean;
  availableSeats: number | null;
  priceTiers: { tier: string; regularPrice: number; salePrice: number | null }[];
};

type SchedTranslation = { lang: string; title: string; excerpt: string; content: string; route: string; itinerary: string };

type Schedule = {
  id: string;
  departureDate: string | null;
  returnDate: string | null;
  status: string;
  packages: SchedulePackage[];
  translations: SchedTranslation[];
};

type PkgTranslation = { lang: string; title: string; excerpt: string };
type Pkg = {
  id: string;
  name: string;
  photos: string[];
  translations: PkgTranslation[];
  priceTiers: { tier: string; regularPrice: number; salePrice: number | null }[];
};

type BoatData = {
  id: string;
  type: string;
  schedules: Schedule[];
  packages: Pkg[];
};

type Props = {
  boatId: string;
  title: string;
  slug: string;
  type: string;
  area: string;
  cover: string | null;
  lang: string;
  onClose: () => void;
  onAdded: (info?: { boatId: string; boatTitle: string; scheduleDate: string; scheduleId: string; area: string; type: string }) => void;
};

const pick = <T extends { lang: string }>(arr: T[], lang: string) =>
  arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TripSchedulePicker({ boatId, title, slug, type, area, cover, lang, onClose, onAdded }: Props) {
  const [boat, setBoat] = useState<BoatData | null>(null);
  const [loading, setLoading] = useState(true);

  const usesDatePicker = type === "DAYTRIP" || type === "SNORKELING";
  const isTh = lang === "th";

  const tomorrowISO = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
  const currentMonthISO = () => new Date().toISOString().slice(0, 7);

  const [filterDate, setFilterDate] = useState(() => usesDatePicker ? tomorrowISO() : "");
  const [filterMonth, setFilterMonth] = useState(() => usesDatePicker ? "" : currentMonthISO());

  const [addedScheduleIds, setAddedScheduleIds] = useState<Set<string>>(() => {
    const plans = getPlans();
    const ids = new Set<string>();
    for (const plan of plans) {
      for (const trip of plan.trips) {
        if (trip.boatId === boatId && trip.schedule?.scheduleId) {
          ids.add(trip.schedule.scheduleId);
        }
      }
    }
    return ids;
  });

  const [pendingTrip, setPendingTrip] = useState<Omit<PlanTrip, "addedAt"> | null>(null);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [conflicts, setConflicts] = useState<DateConflict[]>([]);
  const [targetPlanId, setTargetPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/boats/${boatId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setBoat(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [boatId]);

  const buildEnrichedTrip = (schedule: Schedule): Omit<PlanTrip, "addedAt"> => {
    const st = pick(schedule.translations, lang);
    const pkgInfo = schedule.packages.map(sp => {
      const pkg = boat?.packages.find(p => p.id === sp.packageId);
      const pt = pkg ? pick(pkg.translations, lang) : null;
      const tiers = sp.priceTiers?.length ? sp.priceTiers : (pkg?.priceTiers || []);
      const prices = tiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      return { name: pt?.title || pkg?.name || "Package", minPrice };
    });

    return {
      boatId, title, slug, type, area, cover,
      schedule: {
        scheduleId: schedule.id,
        departureDate: schedule.departureDate!,
        returnDate: schedule.returnDate,
        title: st?.title || "",
        route: st?.route || "",
        itinerary: st?.itinerary || "",
        excerpt: st?.excerpt || "",
        content: st?.content || "",
        packages: pkgInfo,
      },
    };
  };

  const buildAddedInfo = (trip: Omit<PlanTrip, "addedAt">) =>
    trip.schedule?.scheduleId
      ? { boatId: trip.boatId, boatTitle: trip.title, scheduleDate: trip.schedule.departureDate, scheduleId: trip.schedule.scheduleId, area: trip.area, type: trip.type }
      : undefined;

  const doAdd = (planId: string, trip: Omit<PlanTrip, "addedAt">) => {
    const added = addTripToPlan(planId, trip);
    if (added && trip.schedule?.scheduleId) {
      setAddedScheduleIds(prev => new Set(prev).add(trip.schedule!.scheduleId));
      onAdded(buildAddedInfo(trip));
    }
    setPendingTrip(null);
    setTargetPlanId(null);
    setConflicts([]);
  };

  const handleAddSchedule = (schedule: Schedule) => {
    const trip = buildEnrichedTrip(schedule);
    const plans = getPlans();

    if (plans.length === 0) {
      addTrip(trip);
      if (trip.schedule?.scheduleId) {
        setAddedScheduleIds(prev => new Set(prev).add(trip.schedule!.scheduleId));
      }
      onAdded(buildAddedInfo(trip));
      return;
    }

    if (plans.length === 1) {
      const planId = plans[0].id;
      if (schedule.departureDate) {
        const c = checkDateConflicts(planId, schedule.departureDate, schedule.returnDate);
        if (c.length > 0) {
          setPendingTrip(trip);
          setTargetPlanId(planId);
          setConflicts(c);
          return;
        }
      }
      doAdd(planId, trip);
      return;
    }

    setPendingTrip(trip);
    setShowPlanSelector(true);
  };

  const handlePlanSelected = (planId: string) => {
    setShowPlanSelector(false);
    if (!pendingTrip) return;

    if (pendingTrip.schedule?.departureDate) {
      const c = checkDateConflicts(planId, pendingTrip.schedule.departureDate, pendingTrip.schedule.returnDate);
      if (c.length > 0) {
        setTargetPlanId(planId);
        setConflicts(c);
        return;
      }
    }
    doAdd(planId, pendingTrip);
  };

  const handleConflictConfirm = () => {
    if (targetPlanId && pendingTrip) {
      doAdd(targetPlanId, pendingTrip);
    }
  };

  const handleConflictNewPlan = () => {
    if (!pendingTrip) return;
    const name = suggestPlanName(pendingTrip);
    const plan = createPlan(name);
    doAdd(plan.id, pendingTrip);
  };

  const handleAddWithoutSchedule = () => {
    const trip: Omit<PlanTrip, "addedAt"> = { boatId, title, slug, type, area, cover };
    const plans = getPlans();
    if (plans.length === 0) {
      addTrip(trip);
      onAdded();
      return;
    }
    if (plans.length === 1) {
      doAdd(plans[0].id, trip);
      return;
    }
    setPendingTrip(trip);
    setShowPlanSelector(true);
  };

  const allSchedules = boat?.schedules?.filter(s =>
    s.departureDate && new Date(s.departureDate) >= new Date()
  ) || [];

  const schedules = allSchedules.filter(s => {
    if (!s.departureDate) return false;
    if (usesDatePicker && filterDate) {
      return s.departureDate.slice(0, 10) === filterDate;
    }
    if (!usesDatePicker && filterMonth) {
      return s.departureDate.slice(0, 7) === filterMonth;
    }
    return true;
  });

  const getScheduleMinPrice = (s: Schedule) => {
    const prices = s.packages.flatMap(sp => {
      const overrides = sp.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
      if (overrides.length) return overrides;
      const pkg = boat?.packages.find(p => p.id === sp.packageId);
      return pkg ? pkg.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0) : [];
    });
    return prices.length ? Math.min(...prices) : 0;
  };

  return (
    <>
      <div style={{
        margin: "4px 0 2px",
        background: "rgba(15,23,42,0.65)",
        backdropFilter: "blur(24px) saturate(1.6)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid rgba(148,163,184,0.08)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10, color: "#93c5fd", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Select Schedule & Package
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 26, height: 26, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, flexShrink: 0,
          }}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <div style={{ width: 20, height: 20, border: "2px solid rgba(148,163,184,0.15)", borderTopColor: "#60a5fa", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : !boat ? (
          <div style={{ padding: "20px 16px", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
            ไม่สามารถโหลดข้อมูลได้
          </div>
        ) : (
          <div style={{ padding: "10px 12px 12px" }}>
            {/* Date / Month picker */}
            {allSchedules.length > 0 && (
              <div style={{
                marginBottom: 10, padding: "10px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(148,163,184,0.1)",
                borderRadius: 12,
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}>
                <label style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {usesDatePicker
                    ? (isTh ? "เลือกวันที่" : "Select date")
                    : (isTh ? "เลือกเดือน" : "Select month")}
                </label>
                <input
                  type={usesDatePicker ? "date" : "month"}
                  value={usesDatePicker ? filterDate : filterMonth}
                  min={usesDatePicker ? todayISO() : todayISO().slice(0, 7)}
                  onChange={e => {
                    if (usesDatePicker) setFilterDate(e.target.value);
                    else setFilterMonth(e.target.value);
                  }}
                  style={{
                    background: "rgba(0,0,0,0.25)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 8,
                    color: "rgba(255,255,255,0.85)", fontSize: 12, padding: "7px 10px",
                    outline: "none", colorScheme: "dark", flex: 1, minWidth: 120,
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                  }}
                />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                  {schedules.length} {isTh ? "รอบ" : "trips"}
                </span>
              </div>
            )}

            {/* Schedules */}
            {schedules.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                  Departures · {schedules.length} trips
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 240, overflowY: "auto", scrollbarWidth: "thin" }}>
                  {schedules.slice(0, 20).map(s => {
                    const allFull = s.status === "FULL" || (s.packages.length > 0 && s.packages.every(p => p.isFull));
                    const isAdded = addedScheduleIds.has(s.id);
                    const st = pick(s.translations, lang);
                    const minPrice = getScheduleMinPrice(s);
                    const rowDisabled = isAdded || allFull;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => !rowDisabled && handleAddSchedule(s)}
                        disabled={rowDisabled}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 12px",
                          borderRadius: 14,
                          border: "1px solid rgba(148,163,184,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          opacity: allFull ? 0.45 : 1,
                          cursor: rowDisabled ? "default" : "pointer",
                          textAlign: "left",
                          minWidth: 0,
                          transition: "all 0.25s ease",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          fontFamily: "inherit",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.88)", margin: 0, letterSpacing: "-0.01em" }}>
                            {fmtDate(s.departureDate!)}
                            {s.returnDate ? ` → ${fmtDate(s.returnDate)}` : ""}
                          </p>
                          {st?.title && (
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {st.title}
                            </p>
                          )}
                          {st?.route && (
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
                              <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                              </svg>
                              {st.route.replace(/<[^>]+>/g, "").slice(0, 50)}
                            </p>
                          )}
                        </div>
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          {allFull ? (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "2px 8px", borderRadius: 6 }}>FULL</span>
                          ) : minPrice > 0 ? (
                            <>
                              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>from</p>
                              <p style={{ fontSize: 15, fontWeight: 900, color: "#93c5fd", margin: 0 }}>฿{minPrice.toLocaleString()}</p>
                            </>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 6 }}>Contact</span>
                          )}
                        </div>
                        <div
                          aria-hidden
                          style={{
                            width: 32, height: 32,
                            borderRadius: "50%",
                            background: isAdded
                              ? "rgba(34,197,94,0.15)"
                              : "linear-gradient(135deg, #3b82f6, #2563eb)",
                            border: isAdded ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(147,197,253,0.2)",
                            color: isAdded ? "#4ade80" : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 0.2s ease",
                            boxShadow: isAdded ? "none" : "0 2px 8px rgba(59,130,246,0.3)",
                          }}
                        >
                          {isAdded ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {schedules.length === 0 && (
              <div style={{
                textAlign: "center", padding: "18px 0", color: "rgba(255,255,255,0.3)", fontSize: 12,
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(148,163,184,0.1)", borderRadius: 12, marginBottom: 8,
              }}>
                {(filterDate || filterMonth)
                  ? (isTh ? "ไม่มี Schedule ในช่วงที่เลือก" : "No schedules for selected period")
                  : (isTh ? "ไม่มี Schedule ที่กำลังจะมา" : "No upcoming schedules")}
              </div>
            )}

            {/* General add button — shown when no schedule rows are visible */}
            {schedules.length === 0 && (() => {
              const anyAdded = getPlans().some(p => p.trips.some(t => t.boatId === boatId && !t.schedule?.scheduleId));
              return (
                <button
                  onClick={() => !anyAdded && handleAddWithoutSchedule()}
                  disabled={anyAdded}
                  style={{
                    width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
                    background: anyAdded
                      ? "rgba(34,197,94,0.1)"
                      : "linear-gradient(135deg, #1e40af, #3b82f6)",
                    color: anyAdded ? "#4ade80" : "#fff",
                    fontSize: 13, fontWeight: 700, cursor: anyAdded ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    marginBottom: 8,
                    boxShadow: anyAdded ? "none" : "0 2px 8px rgba(59,130,246,0.25)",
                  }}
                >
                  {anyAdded ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {isTh ? "เพิ่มลง My Plan แล้ว" : "Added to My Plan"}
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      {isTh ? "เพิ่มลง My Plan" : "Add to My Plan"}
                    </>
                  )}
                </button>
              );
            })()}

          </div>
        )}
      </div>

      {showPlanSelector && (
        <PlanSelectorSheet
          lang={lang}
          suggestedName={pendingTrip ? suggestPlanName(pendingTrip) : undefined}
          onSelect={handlePlanSelected}
          onClose={() => { setShowPlanSelector(false); setPendingTrip(null); }}
        />
      )}

      {conflicts.length > 0 && (
        <DateConflictModal
          conflicts={conflicts}
          lang={lang}
          onConfirm={handleConflictConfirm}
          onCreateNewPlan={handleConflictNewPlan}
          onClose={() => { setConflicts([]); setPendingTrip(null); setTargetPlanId(null); }}
        />
      )}
    </>
  );
}
