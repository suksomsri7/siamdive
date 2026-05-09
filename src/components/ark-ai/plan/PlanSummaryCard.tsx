"use client";

// PlanSummaryCard — collapsible "everything at a glance" panel that sits at
// the very top of the Itinerary tab. Three sections:
//   1. Trip list — boat, date, route, price range from priceMin/priceMax.
//   2. Logistics — pickup, hotel, meeting point extracted from itinerary text.
//   3. Total cost — Σ priceMin × pax  →  Σ priceMax × pax, with a clear note
//      that the figure is an estimate and not a booking confirmation.
//
// Pure read-only — never writes to the plan store. Editing pickup/hotel still
// flows through LogisticsBlock / chat. The card collapses by default after
// first paint so the user lands on the timeline; the open state is persisted
// in sessionStorage so the choice survives tab switches.

import { useState, useEffect } from "react";
import type { PlanTrip, PlanLogistics } from "@/lib/plan-store";

type Props = {
  trips: PlanTrip[];
  logistics?: PlanLogistics;
  headcountAdults?: number;
  headcountKids?: number;
  lang: string;
};

const T: Record<string, Record<string, string>> = {
  title:        { en: "Plan summary",   th: "สรุปรายการทั้งหมด", cn: "行程总览",     ja: "プランの概要",   ko: "플랜 요약",     de: "Plan-Übersicht",  fr: "Récap du plan",   ru: "Сводка плана" },
  trips:        { en: "Trips",           th: "ทริปของผม",        cn: "我的行程",     ja: "トリップ",       ko: "트립",          de: "Trips",            fr: "Excursions",      ru: "Поездки" },
  logistics:    { en: "Logistics",       th: "การเดินทาง",       cn: "出行安排",     ja: "送迎・集合",     ko: "이동",          de: "Logistik",         fr: "Logistique",      ru: "Логистика" },
  total:        { en: "Estimated total", th: "ยอดรวมประมาณ",     cn: "预计费用",     ja: "目安料金",       ko: "예상 합계",     de: "Geschätzte Summe", fr: "Total estimé",    ru: "Примерная сумма" },
  estimate:     { en: "Estimate only — not confirmed by operator. Final price will be quoted on booking.",
                  th: "ราคาประมาณการ ยังไม่ใช่ราคา confirm จาก operator — ราคาจริงจะแจ้งตอนจองครับ",
                  cn: "仅供参考，价格未与运营商确认；最终价格以预订时为准。",
                  ja: "目安料金です（オペレーター未確認）。最終料金は予約時にご案内します。",
                  ko: "예상 가격입니다(운영사 미확인). 최종 가격은 예약 시 안내됩니다.",
                  de: "Nur Schätzung — nicht vom Anbieter bestätigt. Der Endpreis wird bei der Buchung genannt.",
                  fr: "Estimation seulement — non confirmée par l'opérateur. Le prix final sera donné à la réservation.",
                  ru: "Оценка — не подтверждена оператором. Окончательная цена будет указана при бронировании." },
  pickupYes:    { en: "Hotel pickup",    th: "รถรับที่โรงแรม",   cn: "酒店接送",     ja: "ホテル送迎",     ko: "호텔 픽업",     de: "Hotel-Abholung",   fr: "Pickup à l'hôtel", ru: "Трансфер из отеля" },
  pickupNo:     { en: "Self transport",  th: "ไปท่าเรือเอง",     cn: "自行前往",     ja: "現地集合",       ko: "직접 이동",     de: "Eigene Anfahrt",   fr: "Trajet personnel", ru: "Сам(а) до пирса" },
  pickupAsk:    { en: "Pickup not set",  th: "ยังไม่ได้ระบุการเดินทาง", cn: "未设置接送", ja: "送迎未設定",     ko: "픽업 미설정",   de: "Abholung offen",   fr: "Pickup non défini", ru: "Трансфер не указан" },
  hotel:        { en: "Hotel",           th: "โรงแรม",            cn: "酒店",         ja: "ホテル",         ko: "호텔",          de: "Hotel",            fr: "Hôtel",            ru: "Отель" },
  pickup:       { en: "Pickup",           th: "การเดินทาง",       cn: "接送",          ja: "送迎",            ko: "픽업",          de: "Abholung",         fr: "Pickup",           ru: "Трансфер" },
  meetingPoint: { en: "Meeting point",   th: "จุดนัด",            cn: "集合地点",     ja: "集合場所",       ko: "집결 장소",     de: "Treffpunkt",       fr: "Point de RDV",     ru: "Место встречи" },
  perPerson:    { en: "/ person",        th: "/ คน",              cn: "/ 人",          ja: "/ 名",            ko: "/ 인",          de: "/ Person",         fr: "/ pers",           ru: "/ чел" },
  fromPrice:    { en: "From",            th: "เริ่มต้น",           cn: "起",            ja: "〜",              ko: "부터",          de: "ab",                fr: "à partir de",      ru: "от" },
  forPax:       { en: "for",             th: "สำหรับ",            cn: "适用",          ja: "対象",            ko: "대상",          de: "für",               fr: "pour",             ru: "на" },
  ppl:          { en: "people",          th: "คน",                cn: "人",            ja: "名",              ko: "인",            de: "Personen",          fr: "pers",             ru: "чел" },
  noTrips:      { en: "No trips yet",    th: "ยังไม่มีทริปในแผน", cn: "尚无行程",     ja: "まだトリップなし", ko: "아직 트립 없음", de: "Noch keine Trips", fr: "Aucune excursion", ru: "Поездок нет" },
  expand:       { en: "Show summary",    th: "แสดงสรุป",          cn: "展开",          ja: "概要を表示",      ko: "요약 보기",     de: "Zeigen",            fr: "Afficher",         ru: "Показать" },
  collapse:     { en: "Hide summary",    th: "ซ่อนสรุป",          cn: "收起",          ja: "概要を隠す",      ko: "요약 숨기기",   de: "Verbergen",         fr: "Masquer",          ru: "Скрыть" },
};

function L(key: keyof typeof T, lang: string): string {
  return T[key][lang] ?? T[key].en;
}

const fmtMoney = (n: number) => `฿${n.toLocaleString()}`;

const fmtDate = (iso: string, lang: string) => {
  const locale = lang === "th" ? "th-TH" : lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : lang === "cn" ? "zh-CN" : lang === "de" ? "de-DE" : lang === "fr" ? "fr-FR" : lang === "ru" ? "ru-RU" : "en-GB";
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "2-digit" });
};

// Extract a meeting point from the schedule's itinerary or route. Picks the
// first "<HH:MM> ... pier|ท่าเรือ|码头|港|부두|hafen|môle|пирс" line if present;
// otherwise falls back to the route text. Itinerary often comes as HTML
// (<p>08:00 ออกจาก Chalong Pier</p>...) so we strip tags first.
function extractMeetingPoint(itinerary: string, route: string): string | null {
  const stripped = (itinerary || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (stripped) {
    const pierWord = /(pier|ท่าเรือ|ท่า|码头|港|부두|hafen|môle|пирс)/i;
    // Look for "HH:MM ... pier name" within first 240 chars where the pier
    // word lands. Returns up to ~80 chars surrounding the time/pier match.
    const timeMatch = stripped.match(/\b\d{1,2}[:.]\d{2}\b[^.\n;]{0,80}/);
    if (timeMatch && pierWord.test(timeMatch[0])) return timeMatch[0].trim();
    // No time match — try just the pier name in the first 200 chars.
    const head = stripped.slice(0, 200);
    const pierMatch = head.match(new RegExp(`[^,;.\\n]*${pierWord.source}[^,;.\\n]*`, "i"));
    if (pierMatch) return pierMatch[0].trim();
  }
  if (route) return route.replace(/<[^>]+>/g, "").trim() || null;
  return null;
}

export default function PlanSummaryCard({ trips, logistics, headcountAdults, headcountKids, lang }: Props) {
  // Persist collapsed state per session — collapsed by default so the user
  // sees the timeline first when opening the plan.
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("siamdive:plan-summary-open") === "1";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("siamdive:plan-summary-open", open ? "1" : "0");
  }, [open]);

  const pax = (headcountAdults ?? 0) + (headcountKids ?? 0);

  // Total cost: sum priceMin × pax → priceMax × pax across all trips that
  // expose a price. If pax is unknown, show per-person ranges instead.
  const tripsWithPrice = trips.filter(t => (t.schedule?.priceMin ?? 0) > 0 || (t.schedule?.priceMax ?? 0) > 0);
  const sumMinPerPax = tripsWithPrice.reduce((s, t) => s + (t.schedule?.priceMin ?? 0), 0);
  const sumMaxPerPax = tripsWithPrice.reduce((s, t) => s + (t.schedule?.priceMax ?? t.schedule?.priceMin ?? 0), 0);
  const showTotal = tripsWithPrice.length > 0;
  const totalMin = sumMinPerPax * Math.max(pax, 1);
  const totalMax = sumMaxPerPax * Math.max(pax, 1);

  // Pickup/Hotel — single global value (current LogisticsBlock model). Displayed
  // once at the top of the Logistics section, then per-trip meeting points.
  const pickupLabel = logistics?.pickup === "yes"
    ? L("pickupYes", lang)
    : logistics?.pickup === "no"
    ? L("pickupNo", lang)
    : L("pickupAsk", lang);

  return (
    <div
      style={{
        marginBottom: 14,
        background: "var(--plan-bg-card, #14161c)",
        border: "1px solid var(--plan-border, rgba(255,255,255,0.06))",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* Header — toggles open/closed */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px",
          background: "transparent",
          border: "none",
          color: "var(--plan-fg, #e5e5e5)",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, letterSpacing: "0.01em" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#60a5fa" }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          {L("title", lang)}
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--plan-fg-subtle, #888)", marginLeft: 4 }}>
            · {trips.length} {L("trips", lang)}
            {showTotal && pax > 0 && ` · ${fmtMoney(totalMin)}${totalMax !== totalMin ? `–${fmtMoney(totalMax)}` : ""}`}
          </span>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "var(--plan-fg-subtle, #888)" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Trips section */}
          <SectionHeading label={L("trips", lang)} />
          {trips.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--plan-fg-subtle, #888)", margin: 0 }}>{L("noTrips", lang)}</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {trips.map((t, i) => {
                const dep = t.schedule?.departureDate ? fmtDate(t.schedule.departureDate, lang) : null;
                const ret = t.schedule?.returnDate && t.schedule.returnDate !== t.schedule.departureDate
                  ? fmtDate(t.schedule.returnDate, lang) : null;
                const dateLabel = dep ? (ret ? `${dep} → ${ret}` : dep) : null;
                const min = t.schedule?.priceMin ?? 0;
                const max = t.schedule?.priceMax ?? min;
                return (
                  <li key={`${t.boatId}-${i}`} style={{ display: "flex", gap: 10, padding: "8px 10px", borderRadius: 10, background: "var(--plan-bg-row, rgba(255,255,255,0.03))" }}>
                    {t.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.cover} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(59,130,246,0.15)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤿</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--plan-fg, #e5e5e5)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                      {dateLabel && (
                        <p style={{ fontSize: 11, color: "#93c5fd", margin: "2px 0 0", fontWeight: 600 }}>{dateLabel}</p>
                      )}
                      {t.area && (
                        <p style={{ fontSize: 11, color: "var(--plan-fg-subtle, #888)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.area}</p>
                      )}
                    </div>
                    {min > 0 && (
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <p style={{ fontSize: 9, color: "var(--plan-fg-subtle, #888)", textTransform: "uppercase", fontWeight: 700, margin: 0 }}>
                          {L("fromPrice", lang)}
                        </p>
                        <p style={{ fontSize: 12, fontWeight: 800, color: "#93c5fd", margin: "1px 0 0" }}>
                          {fmtMoney(min)}{max !== min ? `–${fmtMoney(max)}` : ""}
                        </p>
                        <p style={{ fontSize: 9, color: "var(--plan-fg-subtle, #888)", margin: 0 }}>{L("perPerson", lang)}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Logistics section */}
          <SectionHeading label={L("logistics", lang)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 10px", borderRadius: 10, background: "var(--plan-bg-row, rgba(255,255,255,0.03))" }}>
            <KV k={L("pickup", lang)} v={pickupLabel} />
            {logistics?.pickup === "yes" && logistics?.hotelName && (
              <KV k={L("hotel", lang)} v={logistics.hotelName} />
            )}
            {trips.map((t, i) => {
              const mp = extractMeetingPoint(t.schedule?.itinerary || "", t.schedule?.route || "");
              if (!mp) return null;
              return (
                <KV
                  key={`mp-${i}`}
                  k={`${L("meetingPoint", lang)} · ${t.title}`}
                  v={mp}
                />
              );
            })}
          </div>

          {/* Total cost section */}
          {showTotal && (
            <>
              <SectionHeading label={L("total", lang)} />
              <div style={{
                padding: "10px 12px", borderRadius: 10,
                background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(96,165,250,0.06))",
                border: "1px solid rgba(96,165,250,0.18)",
              }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#bfdbfe", margin: 0, letterSpacing: "-0.01em" }}>
                    {pax > 0
                      ? `${fmtMoney(totalMin)}${totalMax !== totalMin ? ` – ${fmtMoney(totalMax)}` : ""}`
                      : `${fmtMoney(sumMinPerPax)}${sumMaxPerPax !== sumMinPerPax ? ` – ${fmtMoney(sumMaxPerPax)}` : ""} ${L("perPerson", lang)}`}
                  </p>
                  {pax > 0 && (
                    <p style={{ fontSize: 11, color: "var(--plan-fg-subtle, #888)", margin: 0, fontWeight: 600 }}>
                      {L("forPax", lang)} {pax} {L("ppl", lang)}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "var(--plan-fg-subtle, #888)", margin: "6px 0 0", lineHeight: 1.5 }}>
                  ⚠ {L("estimate", lang)}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--plan-fg-subtle, #888)", margin: 0 }}>
      {label}
    </p>
  );
}

function KV({ k, v, fallback }: { k: string; v: string; fallback?: string }) {
  const display = v || fallback || "—";
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: 1.5 }}>
      <span style={{ color: "var(--plan-fg-subtle, #888)", flexShrink: 0, minWidth: 90, fontWeight: 600 }}>{k}</span>
      <span style={{ color: "var(--plan-fg, #e5e5e5)", flex: 1 }}>{display}</span>
    </div>
  );
}
