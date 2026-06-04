"use client";

import { useState, useMemo } from "react";
import { t } from "@/lib/ark-ai/i18n";

// CompareSheet works on the minimum trip surface: anything with boatId/title/
// type/area/cover and an optional schedule with departureDate/returnDate/
// route/priceMin/priceMax. PendingPick (sessionStorage staged picks) AND
// PlanTrip (committed trips inside a UserPlan) both satisfy this shape, so a
// single component handles both call sites — pre-build (chat staged picks)
// and post-build (MyPlan trips).
export type ComparableTrip = {
  boatId: string;
  title: string;
  type: string;
  area: string;
  cover: string | null;
  schedule?: {
    scheduleId: string;
    departureDate: string;
    returnDate: string | null;
    route?: string;
    priceMin?: number;
    priceMax?: number;
  };
};

const TYPE_LABEL: Record<string, Record<string, string>> = {
  DAYTRIP:    { th: "Day Trip",   en: "Day Trip" },
  LIVEABOARD: { th: "Liveaboard", en: "Liveaboard" },
  DIVE_RESORT:{ th: "Dive Resort", en: "Dive Resort" },
  FREEDIVE:   { th: "ฟรีไดฟ์",    en: "Freedive" },
  LAND_TOUR:  { th: "Land Tour",  en: "Land Tour" },
  SNORKELING: { th: "Snorkeling", en: "Snorkeling" },
};

const TYPE_EMOJI: Record<string, string> = {
  DAYTRIP: "🤿", LIVEABOARD: "🚢", DIVE_RESORT: "🏨",
  FREEDIVE: "🫧", LAND_TOUR: "🏝", SNORKELING: "🐠",
};

const LOCALE_MAP: Record<string, string> = {
  th: "th-TH", en: "en-US", cn: "zh-CN", de: "de-DE", fr: "fr-FR", ru: "ru-RU", ko: "ko-KR", ja: "ja-JP",
};

const fmtDate = (iso: string | null | undefined, lang: string): string => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] || "en-US", {
    day: "numeric", month: "short", year: "2-digit",
  });
};

const fmtRange = (priceMin?: number, priceMax?: number): string => {
  if (!priceMin) return "-";
  if (priceMax && priceMax > priceMin) {
    return `฿${priceMin.toLocaleString()} — ฿${priceMax.toLocaleString()}`;
  }
  return `฿${priceMin.toLocaleString()}`;
};

const dayCount = (from?: string, to?: string | null): number => {
  if (!from) return 0;
  const start = new Date(from);
  const end = to ? new Date(to) : start;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
};

type Props = {
  /** PendingPick[] (staged in chat) or PlanTrip[] (already in MyPlan) — both work. */
  picks: ComparableTrip[];
  lang: string;
  onClose: () => void;
};

export default function CompareSheet({ picks, lang, onClose }: Props) {
  const L = (key: Parameters<typeof t>[1]) => t(lang, key);
  const isTh = lang === "th";

  // When user has more than 2 picks, let them pick which 2 to compare.
  // Default: first two by addedAt.
  const [leftId, setLeftId] = useState(picks[0] ? `${picks[0].boatId}:${picks[0].schedule?.scheduleId || ""}` : "");
  const [rightId, setRightId] = useState(picks[1] ? `${picks[1].boatId}:${picks[1].schedule?.scheduleId || ""}` : "");

  const pickKey = (p: ComparableTrip) => `${p.boatId}:${p.schedule?.scheduleId || ""}`;
  const left = picks.find(p => pickKey(p) === leftId);
  const right = picks.find(p => pickKey(p) === rightId);

  const rows = useMemo(() => {
    const buildRow = (
      label: string,
      a: string | number,
      b: string | number,
      highlight?: "a" | "b" | null,
    ) => ({ label, a, b, highlight });

    if (!left || !right) return [] as ReturnType<typeof buildRow>[];

    const aDays = dayCount(left.schedule?.departureDate, left.schedule?.returnDate);
    const bDays = dayCount(right.schedule?.departureDate, right.schedule?.returnDate);
    const aPrice = left.schedule?.priceMin || 0;
    const bPrice = right.schedule?.priceMin || 0;

    const cheaperHighlight: "a" | "b" | null =
      aPrice && bPrice && aPrice !== bPrice
        ? (aPrice < bPrice ? "a" : "b")
        : null;
    const longerHighlight: "a" | "b" | null =
      aDays !== bDays ? (aDays > bDays ? "a" : "b") : null;

    const dayWord = (n: number) => lang === "en" ? (n === 1 ? "day" : "days") : t(lang, "daysLower");
    return [
      buildRow(
        L("type"),
        `${TYPE_EMOJI[left.type] || "🤿"} ${TYPE_LABEL[left.type]?.[isTh ? "th" : "en"] || left.type}`,
        `${TYPE_EMOJI[right.type] || "🤿"} ${TYPE_LABEL[right.type]?.[isTh ? "th" : "en"] || right.type}`,
      ),
      buildRow(L("area"), left.area || "-", right.area || "-"),
      buildRow(
        L("departure"),
        fmtDate(left.schedule?.departureDate, lang),
        fmtDate(right.schedule?.departureDate, lang),
      ),
      buildRow(
        L("duration"),
        aDays ? `${aDays} ${dayWord(aDays)}` : "-",
        bDays ? `${bDays} ${dayWord(bDays)}` : "-",
        longerHighlight,
      ),
      buildRow(
        L("startingPricePerPerson"),
        fmtRange(left.schedule?.priceMin, left.schedule?.priceMax),
        fmtRange(right.schedule?.priceMin, right.schedule?.priceMax),
        cheaperHighlight,
      ),
      buildRow(
        L("route"),
        (left.schedule?.route || "").replace(/<[^>]+>/g, "").slice(0, 90) || "-",
        (right.schedule?.route || "").replace(/<[^>]+>/g, "").slice(0, 90) || "-",
      ),
    ];
  }, [left, right, lang, isTh, L]);

  if (picks.length < 2) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 640,
          background: "#0a0a0a",
          border: "1px solid #1f1f1f",
          borderRadius: "16px 16px 0 0",
          padding: "16px 16px calc(20px + env(safe-area-inset-bottom, 0px))",
          maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", margin: 0 }}>
            {L("compareTwoTrips")}
          </h3>
          <button
            onClick={onClose}
            aria-label={L("close")}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13,
            }}
          >✕</button>
        </div>

        {picks.length > 2 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {(["left", "right"] as const).map((side) => {
              const value = side === "left" ? leftId : rightId;
              const setter = side === "left" ? setLeftId : setRightId;
              return (
                <div key={side} style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 10, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    {side === "left" ? L("leftTrip") : L("rightTrip")}
                  </label>
                  <select
                    value={value}
                    onChange={e => setter(e.target.value)}
                    style={{
                      width: "100%", background: "#161616", color: "#e5e5e5",
                      border: "1px solid #262626", borderRadius: 8,
                      padding: "7px 10px", fontSize: 13, outline: "none",
                    }}
                  >
                    {picks.map(p => {
                      const k = pickKey(p);
                      return <option key={k} value={k}>{p.title.slice(0, 36)}</option>;
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {!left || !right ? (
          <p style={{ fontSize: 13, color: "#888", textAlign: "center", padding: "20px 0" }}>
            {L("pickTwoToCompare")}
          </p>
        ) : (
          <>
            {/* Header row with covers + titles */}
            <div style={{ display: "grid", gridTemplateColumns: "84px 1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div />
              {[left, right].map((p, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{
                    width: "100%", aspectRatio: "16/10",
                    borderRadius: 10, overflow: "hidden",
                    background: "linear-gradient(160deg, #0f172a, #1e3a5f)",
                    marginBottom: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {p.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 28 }}>{TYPE_EMOJI[p.type] || "🤿"}</span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 12, fontWeight: 700, color: "#e5e5e5",
                    margin: 0, lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}>{p.title}</p>
                </div>
              ))}
            </div>

            {/* Compare rows */}
            <div style={{
              background: "#111", borderRadius: 10,
              border: "1px solid #1a1a1a",
              overflow: "hidden",
            }}>
              {rows.map((r, i) => {
                const cellStyle = (cell: "a" | "b") => ({
                  padding: "10px 10px",
                  fontSize: 12.5,
                  color: r.highlight === cell ? "#86efac" : "#cbd5e1",
                  fontWeight: r.highlight === cell ? 700 : 500,
                  borderBottom: i < rows.length - 1 ? "1px solid #161616" : "none",
                  textAlign: "center" as const,
                  lineHeight: 1.4,
                });
                return (
                  <div key={r.label} style={{ display: "grid", gridTemplateColumns: "84px 1fr 1fr" }}>
                    <div style={{
                      padding: "10px 12px", fontSize: 11, color: "#666", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      borderBottom: i < rows.length - 1 ? "1px solid #161616" : "none",
                      borderRight: "1px solid #161616",
                      display: "flex", alignItems: "center",
                    }}>{r.label}</div>
                    <div style={cellStyle("a")}>{r.a}</div>
                    <div style={{ ...cellStyle("b"), borderLeft: "1px solid #161616" }}>{r.b}</div>
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: 10.5, color: "#555", margin: "10px 0 0", textAlign: "center", lineHeight: 1.5 }}>
              {L("greenIsCheaper")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
