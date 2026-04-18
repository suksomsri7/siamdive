"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

type TripType = "DAYTRIP" | "LIVEABOARD";

type Result = {
  scheduleId: string;
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
};

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

  const [open,    setOpen]    = useState(false);
  const [type,    setType]    = useState<TripType>("DAYTRIP");
  const [date,    setDate]    = useState<string>(todayISO());
  const [month,   setMonth]   = useState<string>(thisMonthISO());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    setResults(null);
    const params = new URLSearchParams({ type, lang });
    if (type === "DAYTRIP") params.set("date", date);
    else params.set("month", month);
    try {
      const res = await fetch(`/api/public/search?${params}`).then(r => r.ok ? r.json() : []);
      setResults(Array.isArray(res) ? res : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [type, date, month, lang]);

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
              width: "min(520px, 100%)",
              background: "#0d0d0d", color: "#e5e5e5",
              borderRadius: "20px 20px 0 0",
              border: "1px solid #1f1f1f", borderBottom: "none",
              maxHeight: "90vh", display: "flex", flexDirection: "column",
              boxShadow: "0 -8px 60px rgba(0,0,0,0.7)",
              animation: "searchSheetUp 0.55s cubic-bezier(0.22,1,0.36,1) both",
            }}>
              <style>{`@keyframes searchSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

              {/* Handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "#3a3a3a" }} />
              </div>

              {/* Header */}
              <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", borderBottom: "1px solid #1a1a1a" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5" }}>ค้นหาทริป</div>
                <div style={{ flex: 1 }} />
                <button onClick={() => setOpen(false)}
                  style={{ background: "#1a1a1a", border: "1px solid #262626", color: "#aaa", width: 28, height: 28, borderRadius: "50%", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>

              {/* Controls */}
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Type toggle */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#161616", padding: 4, borderRadius: 12 }}>
                  {(["DAYTRIP", "LIVEABOARD"] as const).map(t => {
                    const active = type === t;
                    return (
                      <button key={t} onClick={() => setType(t)}
                        style={{
                          padding: "10px 0", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                          background: active ? "#3b82f6" : "transparent", color: active ? "#fff" : "#666",
                        }}>
                        {t === "DAYTRIP" ? "🤿 Day Trip" : "🚢 Liveaboard"}
                      </button>
                    );
                  })}
                </div>

                {/* Date / Month picker */}
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

                {/* Search button */}
                <button onClick={search} disabled={loading}
                  style={{
                    width: "100%", background: "#3b82f6", border: "none", color: "#fff", fontWeight: 700, fontSize: 14,
                    padding: "13px 0", borderRadius: 10, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1,
                  }}>
                  {loading ? "กำลังค้นหา..." : "ค้นหา"}
                </button>
              </div>

              {/* Results */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 28px", minHeight: 120 }}>
                {results === null ? (
                  <p style={{ fontSize: 12, color: "#444", textAlign: "center", padding: "20px 0" }}>
                    เลือก {type === "DAYTRIP" ? "วันที่" : "เดือน"} แล้วกดค้นหา
                  </p>
                ) : results.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    <p style={{ fontSize: 13, color: "#555" }}>ไม่พบทริปในช่วงเวลานี้</p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "16px 0 10px" }}>
                      พบ {results.length} ทริป
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {results.map(r => (
                        <button key={r.scheduleId} onClick={() => openResult(r)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                            background: "#161616", border: "1px solid #1f1f1f", borderRadius: 10,
                            cursor: "pointer", textAlign: "left", width: "100%",
                          }}>
                          {r.boat.cover
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={r.boat.cover} alt="" style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                            : <div style={{ width: 56, height: 42, background: "#222", borderRadius: 6, flexShrink: 0 }} />
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {r.boat.area && (
                              <p style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{r.boat.area}</p>
                            )}
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.boat.title}</p>
                            <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                              {fmtDate(r.departureDate)}{r.returnDate ? ` → ${fmtDate(r.returnDate)}` : ""}
                            </p>
                          </div>
                          {r.boat.minPrice > 0 && (
                            <div style={{ fontSize: 13, fontWeight: 900, color: "#60a5fa", flexShrink: 0 }}>
                              ฿{r.boat.minPrice.toLocaleString()}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
