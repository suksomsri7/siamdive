"use client";

import { useEffect, useState } from "react";
import { addTrip, hasTripInPlan } from "@/lib/plan-store";

type SchedulePackage = {
  packageId: string;
  isFull: boolean;
  availableSeats: number | null;
  priceTiers: { tier: string; regularPrice: number; salePrice: number | null }[];
};

type SchedTranslation = { lang: string; title: string; excerpt: string; route: string };

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
  onAdded: () => void;
};

const pick = <T extends { lang: string }>(arr: T[], lang: string) =>
  arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TripSchedulePicker({ boatId, title, slug, type, area, cover, lang, onClose, onAdded }: Props) {
  const [boat, setBoat] = useState<BoatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [inPlan, setInPlan] = useState(() => hasTripInPlan(boatId));

  const usesDatePicker = type === "DAYTRIP" || type === "SNORKELING";
  const isTh = lang === "th";

  const tomorrowISO = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
  const currentMonthISO = () => new Date().toISOString().slice(0, 7);

  const [filterDate, setFilterDate] = useState(() => usesDatePicker ? tomorrowISO() : "");
  const [filterMonth, setFilterMonth] = useState(() => usesDatePicker ? "" : currentMonthISO());

  useEffect(() => {
    fetch(`/api/public/boats/${boatId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setBoat(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [boatId]);

  const handleAdd = () => {
    const added = addTrip({ boatId, title, slug, type, area, cover });
    if (added) { setInPlan(true); onAdded(); }
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

  const selSched = schedules.find(s => s.id === selectedSchedule);
  const packages = selSched && boat ? boat.packages.filter(p =>
    selSched.packages.some(sp => sp.packageId === p.id)
  ) : (boat?.packages || []);

  const getScheduleMinPrice = (s: Schedule) => {
    const prices = s.packages.flatMap(sp => {
      const overrides = sp.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
      if (overrides.length) return overrides;
      const pkg = boat?.packages.find(p => p.id === sp.packageId);
      return pkg ? pkg.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0) : [];
    });
    return prices.length ? Math.min(...prices) : 0;
  };

  const getPackageInfo = (pkg: Pkg) => {
    const sp = selSched?.packages.find(p => p.packageId === pkg.id);
    const isFull = sp?.isFull ?? false;
    const tiers = sp?.priceTiers?.length ? sp.priceTiers : pkg.priceTiers;
    const prices = tiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    return { isFull, minPrice, seats: sp?.availableSeats };
  };

  return (
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
          transition: "background 0.2s",
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
                  setSelectedSchedule(null);
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
                  const isSel = selectedSchedule === s.id;
                  const allFull = s.status === "FULL" || (s.packages.length > 0 && s.packages.every(p => p.isFull));
                  const st = pick(s.translations, lang);
                  const minPrice = getScheduleMinPrice(s);
                  return (
                    <div
                      key={s.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 0,
                        borderRadius: 14,
                        border: `1px solid ${isSel ? "rgba(96,165,250,0.35)" : "rgba(148,163,184,0.08)"}`,
                        background: isSel
                          ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.06))"
                          : "rgba(255,255,255,0.03)",
                        opacity: allFull ? 0.45 : 1,
                        transition: "all 0.25s ease",
                        boxShadow: isSel
                          ? "0 4px 16px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
                          : "inset 0 1px 0 rgba(255,255,255,0.03)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                      }}
                    >
                      <button
                        onClick={() => setSelectedSchedule(isSel ? null : s.id)}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: isSel ? "#93c5fd" : "rgba(255,255,255,0.88)", margin: 0, letterSpacing: "-0.01em" }}>
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
                      </button>

                      {/* + Add to plan */}
                      <button
                        onClick={handleAdd}
                        disabled={inPlan}
                        style={{
                          width: 32, height: 32,
                          borderRadius: "50%",
                          background: inPlan
                            ? "rgba(34,197,94,0.15)"
                            : "linear-gradient(135deg, #3b82f6, #2563eb)",
                          border: inPlan ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(147,197,253,0.2)",
                          color: inPlan ? "#4ade80" : "#fff",
                          cursor: inPlan ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          marginRight: 8,
                          transition: "all 0.2s ease",
                          boxShadow: inPlan ? "none" : "0 2px 8px rgba(59,130,246,0.3)",
                        }}
                      >
                        {inPlan ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        )}
                      </button>
                    </div>
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

          {/* Packages */}
          {selSched && packages.length > 0 && (
            <div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                Packages · {packages.length}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {packages.map(pkg => {
                  const pt = pick(pkg.translations, lang);
                  const { isFull, minPrice, seats } = getPackageInfo(pkg);
                  return (
                    <div key={pkg.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 10px",
                      borderRadius: 12,
                      background: isFull ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(148,163,184,0.06)",
                      opacity: isFull ? 0.4 : 1,
                      backdropFilter: "blur(4px)",
                      WebkitBackdropFilter: "blur(4px)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                      transition: "opacity 0.2s",
                    }}>
                      {pkg.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pkg.photos[0]} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.06)" }} />
                      ) : (
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(255,255,255,0.04)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: "1px solid rgba(255,255,255,0.04)" }}>
                          📦
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {pt?.title || pkg.name}
                        </p>
                        {pt?.excerpt && (
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {pt.excerpt.replace(/<[^>]+>/g, "").slice(0, 60)}
                          </p>
                        )}
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        {isFull ? (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.1)", padding: "2px 8px", borderRadius: 6 }}>FULL</span>
                        ) : minPrice > 0 ? (
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#93c5fd" }}>
                            ฿{minPrice.toLocaleString()}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 6 }}>Contact</span>
                        )}
                        {seats != null && !isFull && (
                          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", margin: 0 }}>{seats} seats</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
