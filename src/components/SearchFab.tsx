"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

type TripType = "DAYTRIP" | "LIVEABOARD";

type Pkg = {
  id: string;
  title: string;
  availableSeats: number | null;
  isFull: boolean;
  minPrice: number;
};

type Result = {
  scheduleId: string;
  scheduleTitle: string | null;
  departureDate: string | null;
  returnDate: string | null;
  status: string;
  boat: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    type: string;
    cover: string | null;
    area: string;
    minPrice: number;
  };
  packages: Pkg[];
};

type Area = { id: string; name: string };

const todayISO = () => new Date().toISOString().slice(0, 10);
const thisMonthISO = () => new Date().toISOString().slice(0, 7);

const fmtDate = (iso: string | null) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

export default function SearchFab() {
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname?.split("/")[1] || "en";

  const [open,         setOpen]         = useState(false);
  const [type,         setType]         = useState<TripType>("DAYTRIP");
  const [date,         setDate]         = useState<string>(todayISO());
  const [month,        setMonth]        = useState<string>(thisMonthISO());
  const [areaId,       setAreaId]       = useState<string>("");
  const [areas,        setAreas]        = useState<Area[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [results,      setResults]      = useState<Result[] | null>(null);
  const [resultsType,  setResultsType]  = useState<TripType | null>(null);
  const [collapsed,    setCollapsed]    = useState(false);
  const [contactFor,   setContactFor]   = useState<string | null>(null);

  const switchType = (t: TripType) => {
    if (t === type) return;
    setType(t);
    setResults(null);
    setResultsType(null);
    setCollapsed(false);
  };

  // Fetch service areas once when modal opens
  useEffect(() => {
    if (!open || areas.length) return;
    fetch(`/api/public/service-areas?lang=${lang}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Area[]) => setAreas(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [open, lang, areas.length]);

  const search = useCallback(async () => {
    setLoading(true);
    setResults(null);
    const params = new URLSearchParams({ type, lang });
    if (type === "DAYTRIP") {
      params.set("date", date);
      if (areaId) params.set("serviceAreaId", areaId);
    } else {
      params.set("month", month);
    }
    try {
      const res = await fetch(`/api/public/search?${params}`).then(r => r.ok ? r.json() : []);
      const arr = Array.isArray(res) ? res : [];
      setResults(arr);
      setResultsType(type);
      // Collapse the form after a successful search to free up result space.
      // Keep expanded when no results so user can tweak query.
      if (arr.length > 0) setCollapsed(true);
    } catch {
      setResults([]);
      setResultsType(type);
    } finally {
      setLoading(false);
    }
  }, [type, date, month, areaId, lang]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onEsc); };
  }, [open]);

  const openResult = (r: Result) => {
    const dateParam = r.departureDate ? r.departureDate.slice(0, 10) : "";
    const q = dateParam ? `?date=${dateParam}` : "";
    router.push(`/${lang}/trips/${r.boat.slug}${q}`);
    setOpen(false);
  };

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Search trips"
        style={{
          position: "fixed", bottom: 24, left: 24, zIndex: 100,
          width: 56, height: 56, borderRadius: "50%",
          background: "#3b82f6", border: "none", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 28px rgba(59,130,246,0.45)", cursor: "pointer",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <>
          <div onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />

          <div style={{
            position: "fixed", inset: 0, zIndex: 1201,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              pointerEvents: "auto",
              width: "min(560px, 100%)",
              background: "#0d0d0d", color: "#e5e5e5",
              borderRadius: "20px 20px 0 0",
              border: "1px solid #1f1f1f", borderBottom: "none",
              maxHeight: "90vh", display: "flex", flexDirection: "column",
              boxShadow: "0 -8px 60px rgba(0,0,0,0.7)",
              animation: "searchSheetUp 0.55s cubic-bezier(0.22,1,0.36,1) both",
            }}>
              <style>{`@keyframes searchSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "#3a3a3a" }} />
              </div>

              <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", borderBottom: "1px solid #1a1a1a" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5" }}>ค้นหาทริป</div>
                <div style={{ flex: 1 }} />
                <button onClick={() => setOpen(false)}
                  style={{ background: "#1a1a1a", border: "1px solid #262626", color: "#aaa", width: 28, height: 28, borderRadius: "50%", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>

              {/* Collapsed summary — compact bar with expand button */}
              {collapsed && (
                <button onClick={() => setCollapsed(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 20px", margin: "14px 20px 0",
                    background: "#161616", border: "1px solid #262626", borderRadius: 10,
                    color: "#aaa", fontSize: 13, cursor: "pointer", textAlign: "left",
                  }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16} style={{ flexShrink: 0, color: "#60a5fa" }}>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {type === "DAYTRIP"
                      ? `Scuba Day Trips · ${date}${areaId ? ` · ${areas.find(a => a.id === areaId)?.name || ""}` : ""}`
                      : `Liveaboard · ${month}`}
                  </span>
                  <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, flexShrink: 0 }}>ค้นหาใหม่ ▾</span>
                </button>
              )}

              {/* Controls — hidden when collapsed */}
              {!collapsed && (
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#161616", padding: 4, borderRadius: 12 }}>
                  {(["DAYTRIP", "LIVEABOARD"] as const).map(t => {
                    const active = type === t;
                    return (
                      <button key={t} onClick={() => switchType(t)}
                        style={{
                          padding: "10px 0", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                          background: active ? "#3b82f6" : "transparent", color: active ? "#fff" : "#666",
                        }}>
                        {t === "DAYTRIP" ? "🤿 Scuba Day Trips" : "🚢 Liveaboard"}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    {type === "DAYTRIP" ? "วันที่" : "เดือน / ปี"}
                  </label>
                  {type === "DAYTRIP" ? (
                    <input type="date" value={date} min={todayISO()} onChange={e => setDate(e.target.value)}
                      style={{ width: "100%", background: "#161616", border: "1px solid #262626", borderRadius: 10, color: "#f5f5f5", fontSize: 14, padding: "10px 14px", outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
                  ) : (
                    <input type="month" value={month} min={thisMonthISO()} onChange={e => setMonth(e.target.value)}
                      style={{ width: "100%", background: "#161616", border: "1px solid #262626", borderRadius: 10, color: "#f5f5f5", fontSize: 14, padding: "10px 14px", outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
                  )}
                </div>

                {/* Location filter — Scuba Day Trips only */}
                {type === "DAYTRIP" && (
                  <div>
                    <label style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Location (พื้นที่ให้บริการ)
                    </label>
                    <select value={areaId} onChange={e => setAreaId(e.target.value)}
                      style={{ width: "100%", background: "#161616", border: "1px solid #262626", borderRadius: 10, color: "#f5f5f5", fontSize: 14, padding: "10px 14px", outline: "none", colorScheme: "dark", boxSizing: "border-box" }}>
                      <option value="">— ทุกพื้นที่ —</option>
                      {areas.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button onClick={search} disabled={loading}
                  style={{
                    width: "100%", background: "#3b82f6", border: "none", color: "#fff", fontWeight: 700, fontSize: 14,
                    padding: "13px 0", borderRadius: 10, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1,
                  }}>
                  {loading ? "กำลังค้นหา..." : "ค้นหา"}
                </button>
              </div>
              )}

              {/* Results */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 28px", minHeight: 120 }}>
                {results === null ? (
                  <p style={{ fontSize: 12, color: "#444", textAlign: "center", padding: "20px 0" }}>
                    เลือก{type === "DAYTRIP" ? "วันที่" : "เดือน"} แล้วกดค้นหา
                  </p>
                ) : results.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    <p style={{ fontSize: 13, color: "#555" }}>ไม่พบทริปในช่วงเวลานี้</p>
                  </div>
                ) : resultsType === "LIVEABOARD" ? (
                  <LiveaboardResults results={results} openResult={openResult} onContact={(id) => setContactFor(id)} />
                ) : (
                  <>
                    <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "16px 0 10px" }}>
                      พบ {results.length} เรือ
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {results.map(r => (
                        <div key={r.scheduleId}
                          style={{
                            background: "#161616", border: "1px solid #1f1f1f", borderRadius: 12,
                            overflow: "hidden",
                          }}>
                          {/* Boat header — clickable */}
                          <button onClick={() => openResult(r)}
                            style={{
                              display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                              background: "transparent", border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                            }}>
                            {r.boat.cover
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={r.boat.cover} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                              : <div style={{ width: 64, height: 48, background: "#222", borderRadius: 6, flexShrink: 0 }} />
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {r.boat.area && (
                                <p style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{r.boat.area}</p>
                              )}
                              <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.boat.title}</p>
                              {r.scheduleTitle && (
                                <p style={{ fontSize: 11, color: "#aaa", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {r.scheduleTitle}
                                </p>
                              )}
                              <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                                {fmtDate(r.departureDate)}{r.returnDate ? ` → ${fmtDate(r.returnDate)}` : ""}
                              </p>
                            </div>
                            {r.boat.minPrice > 0 && (
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <p style={{ fontSize: 9, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>เริ่ม</p>
                                <p style={{ fontSize: 14, fontWeight: 900, color: "#60a5fa" }}>฿{r.boat.minPrice.toLocaleString()}</p>
                              </div>
                            )}
                          </button>

                          {/* Packages */}
                          {r.packages.length > 0 && (
                            <div style={{ borderTop: "1px solid #1f1f1f", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                              {r.packages.map(p => {
                                const interactive = !p.isFull;
                                const row = (
                                  <>
                                    <span style={{ fontSize: 11, color: "#888", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
                                      📦 {p.title}
                                      {p.availableSeats != null && (
                                        <span style={{ color: "#444", fontSize: 10, marginLeft: 6 }}>
                                          ({p.availableSeats} ที่นั่ง)
                                        </span>
                                      )}
                                    </span>
                                    {p.isFull ? (
                                      <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24" }}>FULL</span>
                                    ) : p.minPrice > 0 ? (
                                      <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", flexShrink: 0 }}>
                                        ฿{p.minPrice.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 6, padding: "3px 10px", flexShrink: 0 }}>
                                        Contact
                                      </span>
                                    )}
                                  </>
                                );
                                const sharedStyle: React.CSSProperties = {
                                  display: "flex", alignItems: "center", gap: 10,
                                  padding: "6px 8px", background: "#0d0d0d", borderRadius: 7,
                                  opacity: p.isFull ? 0.5 : 1,
                                  width: "100%", textAlign: "left",
                                  border: "none", cursor: interactive ? "pointer" : "default",
                                };
                                return interactive ? (
                                  <button key={p.id} onClick={(e) => { e.stopPropagation(); setContactFor(p.id); }} style={sharedStyle}>
                                    {row}
                                  </button>
                                ) : (
                                  <div key={p.id} style={sharedStyle}>{row}</div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {contactFor && <ContactSheet onClose={() => setContactFor(null)} />}
        </>
      )}
    </>
  );
}

// ── Liveaboard results: group by boat, show date ranges + min price ─────────
function LiveaboardResults({
  results, openResult, onContact,
}: {
  results: Result[];
  openResult: (r: Result) => void;
  onContact: (id: string) => void;
}) {
  // Group schedules by boat id; within each boat, dedupe by schedule id.
  const groups = new Map<string, { boat: Result["boat"]; schedules: Result[] }>();
  for (const r of results) {
    const g = groups.get(r.boat.id);
    if (g) g.schedules.push(r);
    else groups.set(r.boat.id, { boat: r.boat, schedules: [r] });
  }
  const boats = Array.from(groups.values());

  return (
    <>
      <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "16px 0 10px" }}>
        พบ {boats.length} เรือ · {results.length} รอบ
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {boats.map(({ boat, schedules }) => {
          // Boat-level min price = lowest across all its schedules/packages.
          const pkgPrices = schedules.flatMap(s => s.packages.map(p => p.minPrice).filter(x => x > 0));
          const boatMin = pkgPrices.length ? Math.min(...pkgPrices) : 0;

          return (
            <div key={boat.id} style={{ background: "#161616", border: "1px solid #1f1f1f", borderRadius: 12, overflow: "hidden" }}>
              {/* Boat header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
                {boat.cover
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={boat.cover} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                  : <div style={{ width: 64, height: 48, background: "#222", borderRadius: 6, flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  {boat.area && (
                    <p style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{boat.area}</p>
                  )}
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{boat.title}</p>
                  <p style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{schedules.length} รอบในเดือนนี้</p>
                </div>
                {boatMin > 0 ? (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 9, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>เริ่ม</p>
                    <p style={{ fontSize: 14, fontWeight: 900, color: "#60a5fa" }}>฿{boatMin.toLocaleString()}</p>
                  </div>
                ) : (
                  <button onClick={() => onContact(boat.id)}
                    style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", flexShrink: 0 }}>
                    Contact
                  </button>
                )}
              </div>

              {/* Date ranges */}
              <div style={{ borderTop: "1px solid #1f1f1f", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                {schedules.map(s => {
                  const schedPkgPrices = s.packages.map(p => p.minPrice).filter(x => x > 0);
                  const schedMin = schedPkgPrices.length ? Math.min(...schedPkgPrices) : 0;
                  const handleClick = schedMin > 0 ? () => openResult(s) : () => onContact(s.scheduleId);
                  return (
                    <button key={s.scheduleId} onClick={handleClick}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "#0d0d0d", border: "none", borderRadius: 7, cursor: "pointer", textAlign: "left", width: "100%" }}>
                      <span style={{ fontSize: 12, color: "#bbb", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📅 {fmtDate(s.departureDate)}{s.returnDate ? ` → ${fmtDate(s.returnDate)}` : ""}
                      </span>
                      {schedMin > 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", flexShrink: 0 }}>฿{schedMin.toLocaleString()}</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 6, padding: "3px 10px", flexShrink: 0 }}>
                          Contact
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Contact popup (LINE / WhatsApp / Messenger / WeChat) ─────────────────────
function ContactSheet({ onClose }: { onClose: () => void }) {
  const channels = [
    {
      label: "LINE",
      href:  "https://lin.ee/wayWuGH",
      bg:    "#06C755",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={26} height={26}>
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.494.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
      ),
    },
    {
      label: "WhatsApp",
      href:  "https://wa.me/66983768135",
      bg:    "#25D366",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={26} height={26}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      label: "Messenger",
      href:  "https://m.me/siamdive",
      bg:    "#0084FF",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={26} height={26}>
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/>
        </svg>
      ),
    },
    {
      label: "WeChat",
      href:  "weixin://dl/moments",
      bg:    "#07C160",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={26} height={26}>
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.49.49 0 01.177-.554C22.922 18.487 24 16.866 24 15.054c0-3.227-2.993-5.988-7.062-6.196zM14 12.271c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982zm4.943 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
        </svg>
      ),
    },
  ];
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(0,0,0,0.55)" }} />
      <div style={{
        position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 1301,
        background: "#1a1a1a", border: "1px solid #262626", borderRadius: 16,
        padding: "18px 22px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        animation: "contactUp 0.25s ease both",
      }}>
        <style>{`@keyframes contactUp { from { opacity:0; transform: translate(-50%, 16px); } to { opacity:1; transform: translate(-50%, 0); } }`}</style>
        <p style={{ fontSize: 11, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, textAlign: "center" }}>Booking</p>
        <div style={{ display: "flex", gap: 14 }}>
          {channels.map(c => (
            <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" title={c.label}
              style={{ width: 56, height: 56, borderRadius: "50%", background: c.bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
              {c.icon}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
