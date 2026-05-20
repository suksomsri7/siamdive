"use client";

// PlanBookBar — floating "Group total" badge. The contact CTA moved out to
// the bottom action row in PlanDetail; this component now only surfaces the
// group breakdown ("3 divers (OW/AOW) ฿X–Y") for users who set headcount
// slots. Renders nothing without scheduled trips or a group total to show.

import type { PlanTrip, PlanLogistics } from "@/lib/plan-store";
import type { Slots } from "@/lib/ark-ai/slots";

type Props = {
  trips: PlanTrip[];
  lang: string;
  /** Sprint 4 B6 — when present, used to render group-aware totals
   *  (divers × per-person × N + non-divers note). Without slots the bar
   *  falls back to the per-person range. */
  slots?: Slots | null;
};

const L = {
  th: {
    fromHotel: "รับที่",
    transferYes: "รับ-ส่งสนามบิน",
    rent: "เช่าอุปกรณ์",
    needs: "หมายเหตุ",
    diverCount: "ดำน้ำ",
    nonDiverCount: "ไม่ดำ",
    groupTotal: "รวมกลุ่ม",
  },
  en: {
    fromHotel: "Pickup at",
    transferYes: "Airport transfer",
    rent: "Rental",
    needs: "Notes",
    diverCount: "divers",
    nonDiverCount: "non-divers",
    groupTotal: "Group total",
  },
} as const;

type Labels = typeof L.en;
function getLabels(lang: string): Labels {
  const map = L as unknown as Record<string, Labels>;
  return map[lang] || L.en;
}

// Sum every trip's per-person price range into a plan-wide range.
// "เริ่ม X — Y บาท/คน" where X = sum of every trip's priceMin and
// Y = sum of every trip's priceMax. Trips without priceMin (legacy plans)
// contribute 0 — the user just sees a lower starting figure.
function priceRange(trips: PlanTrip[]): { min: number; max: number } {
  let min = 0, max = 0;
  for (const t of trips) {
    const lo = t.schedule?.priceMin ?? 0;
    const hi = t.schedule?.priceMax ?? lo;
    min += lo;
    max += hi;
  }
  return { min, max };
}

// Build the contact / booking message used by PlanDetail's Contact button.
// Exposed so the button (now in the bottom action row) can produce the same
// text the floating CTA used to send.
export function buildBookingMessage(
  trips: PlanTrip[],
  logistics: PlanLogistics | undefined,
  planShortId: string,
  ownerEmail: string | null | undefined,
  lang: string,
): string {
  const t = getLabels(lang);
  const range = priceRange(trips);
  const lines: string[] = [];
  lines.push(`Hi, I'd like to book the following trips (Plan: ${planShortId}):`);
  for (const trip of trips) {
    const dep = trip.schedule?.departureDate?.slice(0, 10) || "";
    const ret = trip.schedule?.returnDate?.slice(0, 10);
    const dateLabel = ret && ret !== dep ? `${dep} → ${ret}` : dep;
    lines.push(`- ${trip.title}${dateLabel ? ` (${dateLabel})` : ""}`);
  }
  if (logistics) {
    const lo: string[] = [];
    if (logistics.pickup === "yes") lo.push(`${t.fromHotel}${logistics.hotelName ? ` ${logistics.hotelName}` : ""}`);
    if (logistics.airportTransfer === "yes") lo.push(t.transferYes);
    if (logistics.equipmentRental) lo.push(`${t.rent}: ${logistics.equipmentRental}`);
    if (logistics.specialNeeds) lo.push(`${t.needs}: ${logistics.specialNeeds}`);
    if (lo.length) lines.push("", "Logistics:", ...lo.map(l => `- ${l}`));
  }
  if (range.min > 0) {
    const label = range.max > range.min
      ? `From ฿${range.min.toLocaleString()} — ฿${range.max.toLocaleString()}/person`
      : `From ฿${range.min.toLocaleString()}/person`;
    lines.push("", label);
  }
  if (ownerEmail) lines.push(`Email: ${ownerEmail}`);
  return lines.join("\n");
}

export default function PlanBookBar({ trips, lang, slots }: Props) {
  const t = getLabels(lang);
  const range = priceRange(trips);
  const scheduledCount = trips.filter(tr => tr.schedule?.departureDate).length;

  const totalPeople = slots?.headcount
    ? (slots.headcount.adults || 0) + (slots.headcount.kids || 0)
    : 0;
  const nonDivers = slots?.companions?.nonDivers || 0;
  const divers = Math.max(0, totalPeople - nonDivers);
  const showGroupBreakdown = totalPeople > 0 && range.min > 0;
  const certMix = slots?.certs && slots.certs.length > 1 ? slots.certs : null;
  const groupMin = divers * range.min;
  const groupMax = divers * (range.max || range.min);

  if (scheduledCount === 0 || !showGroupBreakdown) return null;

  return (
    <div style={{
      position: "absolute",
      right: 14,
      bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
      zIndex: 6,
      pointerEvents: "none",
    }}>
      <div style={{
        pointerEvents: "auto",
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 10px",
        background: "var(--plan-surface)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: 999,
        boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
        maxWidth: 280,
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 9, color: "#3b82f6", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t.groupTotal}
        </span>
        <span style={{ fontSize: 11, color: "var(--plan-fg)", fontWeight: 700 }}>
          {divers > 0 && (
            <>
              {divers} {t.diverCount}
              {certMix && <span style={{ color: "#3b82f6", fontWeight: 600 }}> ({certMix.map(c => c.toUpperCase()).join("/")})</span>}
            </>
          )}
          {nonDivers > 0 && divers > 0 && " + "}
          {nonDivers > 0 && <>{nonDivers} {t.nonDiverCount}</>}
        </span>
        {divers > 0 && (
          <span style={{ fontSize: 11, color: "var(--plan-fg)", fontWeight: 800 }}>
            {groupMax > groupMin
              ? `฿${groupMin.toLocaleString()}–฿${groupMax.toLocaleString()}`
              : `฿${groupMin.toLocaleString()}`}
          </span>
        )}
      </div>
    </div>
  );
}
