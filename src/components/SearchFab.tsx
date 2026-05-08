"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { trackSearch, trackSearchResultClick } from "@/lib/analytics/client";

type TripType = "DAYTRIP" | "LIVEABOARD";
type L = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";

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

const DATE_LOCALE: Record<L, string> = {
  en: "en", th: "th", cn: "zh-CN", ja: "ja", ko: "ko", de: "de", fr: "fr", ru: "ru",
};

const fmtDate = (iso: string | null, lang: L) => {
  if (!iso) return "";
  const locale = DATE_LOCALE[lang] ?? "en";
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "2-digit" });
};

const T = {
  searchTrips:    { en: "Search Trips",      th: "ค้นหาทริป",     cn: "搜索行程",        ja: "ツアーを検索",       ko: "투어 검색",        de: "Touren suchen",      fr: "Rechercher",            ru: "Поиск туров" },
  scubaDay:       { en: "Scuba Day Trips",   th: "ดำน้ำลึกแบบวันเดียว", cn: "潜水一日游",      ja: "デイトリップ",       ko: "당일 다이빙",       de: "Tagestauchtouren",   fr: "Plongée à la journée",  ru: "Дайв-туры на день" },
  liveaboard:     { en: "Liveaboard",        th: "เรือนอน",        cn: "船宿",            ja: "リブアボード",       ko: "라이브어보드",      de: "Tauchsafari",        fr: "Croisière plongée",     ru: "Дайв-сафари" },
  searchAgain:    { en: "Edit search ▾",     th: "ค้นหาใหม่ ▾",   cn: "重新搜索 ▾",      ja: "再検索 ▾",          ko: "다시 검색 ▾",      de: "Neu suchen ▾",       fr: "Modifier ▾",            ru: "Изменить ▾" },
  date:           { en: "Date",              th: "วันที่",         cn: "日期",            ja: "日付",               ko: "날짜",              de: "Datum",              fr: "Date",                  ru: "Дата" },
  monthYear:      { en: "Month / Year",      th: "เดือน / ปี",     cn: "月份 / 年",       ja: "月 / 年",           ko: "월 / 년",          de: "Monat / Jahr",       fr: "Mois / année",          ru: "Месяц / год" },
  location:       { en: "Location",          th: "พื้นที่ให้บริการ", cn: "服务区域",       ja: "エリア",             ko: "지역",              de: "Servicegebiet",      fr: "Zone de service",       ru: "Регион" },
  allAreas:       { en: "— All areas —",     th: "— ทุกพื้นที่ —",  cn: "— 全部区域 —",   ja: "— すべての地域 —",  ko: "— 전체 지역 —",   de: "— Alle Gebiete —",   fr: "— Toutes les zones —",  ru: "— Все регионы —" },
  searching:      { en: "Searching...",      th: "กำลังค้นหา...",  cn: "搜索中...",       ja: "検索中...",          ko: "검색 중...",        de: "Suche läuft...",     fr: "Recherche...",          ru: "Поиск..." },
  search:         { en: "Search",            th: "ค้นหา",         cn: "搜索",            ja: "検索",               ko: "검색",              de: "Suchen",             fr: "Rechercher",            ru: "Найти" },
  opening:        { en: "Opening trip...",   th: "กำลังเปิดข้อมูลทริป...", cn: "正在打开行程...", ja: "ツアーを開いています...", ko: "여정 정보 여는 중...", de: "Tour wird geöffnet...", fr: "Ouverture du voyage...", ru: "Открываем поездку..." },
  pickDateThenSearch:  { en: "Pick a date, then search.",   th: "เลือกวันที่ แล้วกดค้นหา",   cn: "选择日期后搜索",       ja: "日付を選んで検索",        ko: "날짜를 선택 후 검색",      de: "Datum wählen, dann suchen",     fr: "Choisissez une date, puis cherchez",  ru: "Выберите дату и нажмите поиск" },
  pickMonthThenSearch: { en: "Pick a month, then search.",  th: "เลือกเดือน แล้วกดค้นหา",   cn: "选择月份后搜索",       ja: "月を選んで検索",          ko: "월을 선택 후 검색",        de: "Monat wählen, dann suchen",     fr: "Choisissez un mois, puis cherchez",  ru: "Выберите месяц и нажмите поиск" },
  noTripsFound:   { en: "No trips found for this period.", th: "ไม่พบทริปในช่วงเวลานี้", cn: "此时段未找到行程", ja: "この期間のツアーは見つかりません", ko: "해당 기간에 투어가 없습니다", de: "Keine Touren für diesen Zeitraum.", fr: "Aucun voyage pour cette période.", ru: "Туров на этот период нет." },
  foundBoats:     { en: "Found",             th: "พบ",            cn: "找到",            ja: "見つかりました",     ko: "발견",              de: "Gefunden",           fr: "Trouvé",                ru: "Найдено" },
  boats:          { en: "boats",             th: "เรือ",          cn: "艘船",            ja: "隻",                 ko: "척",                de: "Boote",              fr: "bateaux",               ru: "лодок" },
  trips:          { en: "trips",             th: "รอบ",           cn: "班次",            ja: "便",                 ko: "회차",              de: "Fahrten",            fr: "départs",               ru: "рейсов" },
  tripsThisMonth: { en: "trips this month",  th: "รอบในเดือนนี้",  cn: "本月班次",        ja: "今月の便",            ko: "이번 달 회차",       de: "Fahrten in diesem Monat", fr: "départs ce mois-ci",     ru: "рейсов в этом месяце" },
  startsFrom:     { en: "From",              th: "เริ่ม",          cn: "起",              ja: "から",                ko: "부터",              de: "Ab",                 fr: "Dès",                   ru: "от" },
  seats:          { en: "seats",             th: "ที่นั่ง",        cn: "座位",            ja: "席",                  ko: "좌석",              de: "Plätze",             fr: "places",                ru: "мест" },
} as const;

export default function SearchFab() {
  const router = useRouter();
  const pathname = usePathname();
  const rawLang = pathname?.split("/")[1] || "en";
  const lang: L = (["en","th","cn","ja","ko","de","fr","ru"].includes(rawLang) ? rawLang : "en") as L;
  const t = (key: keyof typeof T) => T[key][lang] ?? T[key].en;

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
  const [navigating,  setNavigating]   = useState<Result | null>(null);

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
      trackSearch(
        type === "DAYTRIP" ? `${type} ${date}${areaId ? ` area:${areaId}` : ""}` : `${type} ${month}`,
        arr.length,
        { type, date, month, areaId: areaId || null, lang },
      );
      // Collapse the form after a successful search to free up result space.
      // Keep expanded when no results so user can tweak query.
      if (arr.length > 0) setCollapsed(true);
    } catch {
      setResults([]);
      setResultsType(type);
      trackSearch(`${type} (error)`, 0, { type, date, month, areaId: areaId || null, lang, error: true });
    } finally {
      setLoading(false);
    }
  }, [type, date, month, areaId, lang]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-search", handler);
    return () => window.removeEventListener("open-search", handler);
  }, []);

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
    const rank = (results ?? []).findIndex((x) => x.scheduleId === r.scheduleId) + 1;
    trackSearchResultClick("SCHEDULE", r.scheduleId, rank || 1);
    setNavigating(r);
    router.push(`/${lang}/trips/${r.boat.slug}${q}`);
  };

  useEffect(() => {
    if (navigating) { setNavigating(null); setOpen(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
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
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5" }}>{t("searchTrips")}</div>
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
                      ? `${t("scubaDay")} · ${date}${areaId ? ` · ${areas.find(a => a.id === areaId)?.name || ""}` : ""}`
                      : `${t("liveaboard")} · ${month}`}
                  </span>
                  <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, flexShrink: 0 }}>{t("searchAgain")}</span>
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
                        {t === "DAYTRIP" ? `🤿 ${T.scubaDay[lang] ?? T.scubaDay.en}` : `🚢 ${T.liveaboard[lang] ?? T.liveaboard.en}`}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    {type === "DAYTRIP" ? t("date") : t("monthYear")}
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
                      {t("location")}
                    </label>
                    <select value={areaId} onChange={e => setAreaId(e.target.value)}
                      style={{ width: "100%", background: "#161616", border: "1px solid #262626", borderRadius: 10, color: "#f5f5f5", fontSize: 14, padding: "10px 14px", outline: "none", colorScheme: "dark", boxSizing: "border-box" }}>
                      <option value="">{t("allAreas")}</option>
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
                  {loading ? t("searching") : t("search")}
                </button>
              </div>
              )}

              {/* Navigating overlay */}
              {navigating && (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "40px 20px", gap: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", maxWidth: 360 }}>
                    {navigating.boat.cover
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={navigating.boat.cover} alt="" style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                      : <div style={{ width: 56, height: 42, background: "#222", borderRadius: 8, flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                        {navigating.boat.title}
                      </p>
                      <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>
                        {fmtDate(navigating.departureDate, lang)}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    width: 28, height: 28,
                    border: "2.5px solid #333", borderTopColor: "#3b82f6",
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                  <p style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>{t("opening")}</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {/* Results */}
              {!navigating && <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 28px", minHeight: 120 }}>
                {results === null ? (
                  <p style={{ fontSize: 12, color: "#444", textAlign: "center", padding: "20px 0" }}>
                    {type === "DAYTRIP" ? t("pickDateThenSearch") : t("pickMonthThenSearch")}
                  </p>
                ) : results.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    <p style={{ fontSize: 13, color: "#555" }}>{t("noTripsFound")}</p>
                  </div>
                ) : resultsType === "LIVEABOARD" ? (
                  <LiveaboardResults results={results} openResult={openResult} lang={lang} />
                ) : (
                  <>
                    <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "16px 0 10px" }}>
                      {t("foundBoats")} {results.length} {t("boats")}
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
                                {fmtDate(r.departureDate, lang)}{r.returnDate ? ` → ${fmtDate(r.returnDate, lang)}` : ""}
                              </p>
                            </div>
                            {r.boat.minPrice > 0 && (
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <p style={{ fontSize: 9, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("startsFrom")}</p>
                                <p style={{ fontSize: 14, fontWeight: 900, color: "#60a5fa" }}>฿{r.boat.minPrice.toLocaleString()}</p>
                              </div>
                            )}
                          </button>

                          {/* Packages */}
                          {r.packages.length > 0 && (
                            <div style={{ borderTop: "1px solid #1f1f1f", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                              {r.packages.map(p => {
                                const rowStyle: React.CSSProperties = {
                                  display: "flex", alignItems: "center", gap: 10,
                                  padding: "6px 8px", background: "#0d0d0d", borderRadius: 7,
                                  opacity: p.isFull ? 0.5 : 1,
                                  width: "100%", textAlign: "left",
                                  border: "none", cursor: p.isFull ? "default" : "pointer",
                                };
                                const inner = (
                                  <>
                                    <span style={{ fontSize: 11, color: "#888", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      📦 {p.title}
                                      {p.availableSeats != null && (
                                        <span style={{ color: "#444", fontSize: 10, marginLeft: 6 }}>
                                          ({p.availableSeats} {t("seats")})
                                        </span>
                                      )}
                                    </span>
                                    {p.isFull ? (
                                      <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24" }}>FULL</span>
                                    ) : p.minPrice > 0 ? (
                                      <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", flexShrink: 0 }}>
                                        ฿{p.minPrice.toLocaleString()}
                                      </span>
                                    ) : null}
                                  </>
                                );
                                return p.isFull ? (
                                  <div key={p.id} style={rowStyle}>{inner}</div>
                                ) : (
                                  <button key={p.id} onClick={() => openResult(r)} style={rowStyle}>{inner}</button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>}
            </div>
          </div>

        </>
      )}
    </>
  );
}

// ── Liveaboard results: group by boat, show date ranges + min price ─────────
function LiveaboardResults({
  results, openResult, lang,
}: {
  results: Result[];
  openResult: (r: Result) => void;
  lang: L;
}) {
  const t = (key: keyof typeof T) => T[key][lang] ?? T[key].en;
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
        {t("foundBoats")} {boats.length} {t("boats")} · {results.length} {t("trips")}
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
                  <p style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{schedules.length} {t("tripsThisMonth")}</p>
                </div>
                {boatMin > 0 && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 9, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("startsFrom")}</p>
                    <p style={{ fontSize: 14, fontWeight: 900, color: "#60a5fa" }}>฿{boatMin.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Date ranges */}
              <div style={{ borderTop: "1px solid #1f1f1f", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                {schedules.map(s => {
                  const schedPkgPrices = s.packages.map(p => p.minPrice).filter(x => x > 0);
                  const schedMin = schedPkgPrices.length ? Math.min(...schedPkgPrices) : 0;
                  const isFull   = s.status === "FULL" || (s.packages.length > 0 && s.packages.every(p => p.isFull));
                  return (
                    <button key={s.scheduleId} onClick={() => openResult(s)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#0d0d0d", border: "none", borderRadius: 7, cursor: "pointer", textAlign: "left", width: "100%", opacity: isFull ? 0.55 : 1 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={15} height={15}
                        style={{ color: "#fff", flexShrink: 0, opacity: 0.9 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 12, color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {fmtDate(s.departureDate, lang)}{s.returnDate ? ` → ${fmtDate(s.returnDate, lang)}` : ""}
                        </span>
                        {s.scheduleTitle && (
                          <span style={{ display: "block", fontSize: 11, color: "#666", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.scheduleTitle}
                          </span>
                        )}
                      </span>
                      {isFull ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)", borderRadius: 6, padding: "3px 8px", flexShrink: 0 }}>
                          FULL
                        </span>
                      ) : schedMin > 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", flexShrink: 0 }}>
                          ฿{schedMin.toLocaleString()}
                        </span>
                      ) : null}
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

