"use client";
import React from "react";

// Shared PADI-style "Full details of what's included and not" renderer.
// Used by BOTH My Plan View Details (PlanTimeline) and the backoffice preview,
// so the two always look identical. Liveaboard only.

export type FullDetailsData = {
  included?: string[];
  excluded?: string[];
  details?: {
    requirements?: string; highlights?: string; marineLife?: string[];
    optionalExtras?: string[]; goodToKnow?: string; paymentTerms?: string;
  };
  logistics?: {
    departurePort?: string; departureTime?: string; departureAirport?: string;
    returnPort?: string; returnTime?: string; returnAirport?: string;
    requiredCert?: string; requiredDives?: number; totalDivesMin?: number; totalDivesMax?: number;
  };
};

const LBL: Record<string, Record<string, string>> = {
  included: { th: "รวมในราคา", en: "What's included", cn: "费用包含", de: "Inklusive", fr: "Inclus", ru: "Включено", ko: "포함 사항", ja: "料金に含まれるもの" },
  notIncluded: { th: "ไม่รวมในราคา", en: "Not included", cn: "费用不含", de: "Nicht inklusive", fr: "Non inclus", ru: "Не включено", ko: "불포함 사항", ja: "料金に含まれないもの" },
  requirements: { th: "เงื่อนไขผู้ร่วมทริป", en: "Requirements", cn: "参加要求", de: "Voraussetzungen", fr: "Prérequis", ru: "Требования", ko: "참가 요건", ja: "参加条件" },
  departure: { th: "ออกเดินทาง", en: "Departure", cn: "出发", de: "Abfahrt", fr: "Départ", ru: "Отправление", ko: "출발", ja: "出発" },
  arrival: { th: "เดินทางกลับ", en: "Return", cn: "返回", de: "Rückkehr", fr: "Retour", ru: "Возвращение", ko: "도착", ja: "帰着" },
  highlights: { th: "ไฮไลต์เส้นทาง", en: "Itinerary highlights", cn: "行程亮点", de: "Highlights", fr: "Points forts", ru: "Особенности маршрута", ko: "일정 하이라이트", ja: "行程ハイライト" },
  marineLife: { th: "สิ่งมีชีวิตที่อาจพบ", en: "Marine life you could encounter", cn: "可能邂逅的海洋生物", de: "Meeresleben", fr: "Vie marine", ru: "Морская жизнь", ko: "만날 수 있는 해양 생물", ja: "出会える海洋生物" },
  optionalExtras: { th: "บริการเสริม (จ่ายเพิ่ม)", en: "Optional extras", cn: "可选附加项", de: "Optionale Extras", fr: "Options en supplément", ru: "Дополнительно", ko: "선택 추가 옵션", ja: "オプション" },
  goodToKnow: { th: "ข้อควรรู้", en: "Good to know", cn: "须知", de: "Gut zu wissen", fr: "Bon à savoir", ru: "Полезно знать", ko: "알아두면 좋은 정보", ja: "知っておくと良いこと" },
  payment: { th: "การชำระเงินและการยกเลิก", en: "Payment & cancellation terms", cn: "付款与取消条款", de: "Zahlung & Stornierung", fr: "Paiement et annulation", ru: "Оплата и отмена", ko: "결제 및 취소 약관", ja: "支払い・キャンセル規定" },
};

export function hasFullDetails(d: FullDetailsData): boolean {
  const det = d.details || {}; const lg = d.logistics || {};
  return !!(det.requirements || det.highlights || det.marineLife?.length || d.included?.length || d.excluded?.length ||
    det.optionalExtras?.length || det.goodToKnow || det.paymentTerms || lg.departurePort || lg.departureTime || lg.returnPort);
}

const cap: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 };

export default function ScheduleFullDetails({ data, lang = "th", fg = "#222", subtle = "#777", chipBg = "rgba(0,0,0,0.05)", border = "#e5e5e5" }: {
  data: FullDetailsData; lang?: string; fg?: string; subtle?: string; chipBg?: string; border?: string;
}) {
  const L = (k: string) => LBL[k]?.[lang] || LBL[k]?.en || k;
  const d = data.details || {}; const lg = data.logistics || {};
  if (!hasFullDetails(data)) return null;
  const li = (x: string, i: number, color: string) => (
    <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: fg, marginBottom: 6, lineHeight: 1.45 }}>
      <span style={{ color, flexShrink: 0, fontWeight: 700 }}>▪</span><span>{x}</span></li>
  );
  const Section = ({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) => (
    <details open={open} style={{ borderTop: `1px solid ${border}`, padding: "12px 0" }}>
      <summary style={{ listStyle: "none", cursor: "pointer", ...cap, marginBottom: 0, color: fg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {title}<span style={{ color: subtle, fontWeight: 400 }}>⌄</span></summary>
      <div style={{ marginTop: 10 }}>{children}</div>
    </details>
  );
  const row = (icon: string, parts: (string | number | undefined)[]) => { const v = parts.filter(Boolean).join(" · "); return v ? <div style={{ fontSize: 13, color: fg, marginBottom: 4 }}>{icon} {v}</div> : null; };
  return (
    <div>
      {(d.requirements || lg.requiredCert || lg.requiredDives || lg.totalDivesMin) && (
        <div style={{ background: chipBg, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <p style={{ ...cap, color: subtle }}>{L("requirements")}</p>
          {(lg.requiredCert || lg.requiredDives || lg.totalDivesMin || lg.totalDivesMax) && (
            <div style={{ fontSize: 13, color: fg, marginBottom: d.requirements ? 4 : 0 }}>
              {[lg.requiredDives ? `${lg.requiredDives}+ dives` : null, lg.requiredCert, (lg.totalDivesMin || lg.totalDivesMax) ? `≈ ${lg.totalDivesMin ?? ""}–${lg.totalDivesMax ?? ""} dives` : null].filter(Boolean).join(" · ")}
            </div>)}
          {d.requirements && <div className="rich-content trip-rich" style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: d.requirements }} />}
        </div>
      )}
      {(lg.departurePort || lg.departureTime || lg.returnPort || lg.returnTime) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 12 }}>
          <div><p style={{ ...cap, color: subtle }}>{L("departure")}</p>{row("🛳️", [lg.departurePort, lg.departureTime])}{row("✈️", [lg.departureAirport])}</div>
          <div><p style={{ ...cap, color: subtle }}>{L("arrival")}</p>{row("🛳️", [lg.returnPort, lg.returnTime])}{row("✈️", [lg.returnAirport])}</div>
        </div>
      )}
      {d.highlights && (<div style={{ marginBottom: 12 }}><p style={{ ...cap, color: subtle }}>{L("highlights")}</p><div className="rich-content trip-rich" dangerouslySetInnerHTML={{ __html: d.highlights }} /></div>)}
      {(d.marineLife?.length ?? 0) > 0 && (<div style={{ marginBottom: 12 }}><p style={{ ...cap, color: subtle }}>{L("marineLife")}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{d.marineLife!.map((m, i) => <span key={i} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: chipBg, color: fg }}>{m}</span>)}</div></div>)}
      {(data.included?.length ?? 0) > 0 && (<Section title={L("included")} open><ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{data.included!.map((x, i) => li(x, i, "#dc2626"))}</ul></Section>)}
      {(data.excluded?.length ?? 0) > 0 && (<Section title={L("notIncluded")}><ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{data.excluded!.map((x, i) => li(x, i, "#9ca3af"))}</ul></Section>)}
      {(d.optionalExtras?.length ?? 0) > 0 && (<Section title={L("optionalExtras")}><ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{d.optionalExtras!.map((x, i) => li(x, i, "#2563eb"))}</ul></Section>)}
      {d.goodToKnow && (<Section title={L("goodToKnow")}><div className="rich-content trip-rich" style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: d.goodToKnow }} /></Section>)}
      {d.paymentTerms && (<Section title={L("payment")}><div className="rich-content trip-rich" style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: d.paymentTerms }} /></Section>)}
    </div>
  );
}
