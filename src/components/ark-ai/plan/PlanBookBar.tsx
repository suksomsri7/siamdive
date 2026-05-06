"use client";

// PlanBookBar — sticky bottom CTA on PlanDetail. Shows the schedule-wide
// price range ("เริ่ม X — Y บาท/คน") summed across every trip in the plan,
// plus a primary "Book / Contact" button that opens ContactChannelSheet.
// Renders nothing if there are no scheduled trips — a CTA would be
// misleading.

import type { PlanTrip, PlanLogistics } from "@/lib/plan-store";
import type { Slots } from "@/lib/ark-ai/slots";

type Props = {
  trips: PlanTrip[];
  logistics?: PlanLogistics;
  planShortId: string;
  ownerEmail?: string | null;
  lang: string;
  /** Sprint 4 B6 — when present, used to render group-aware totals
   *  (divers × per-person × N + non-divers note). Without slots the bar
   *  falls back to the per-person range. */
  slots?: Slots | null;
  onContact: (message: string) => void;
};

const L = {
  th: {
    estBudget: "ราคาเริ่มต้น",
    perPerson: "/คน",
    book: "ติดต่อจอง",
    fromHotel: "รับที่",
    transferYes: "รับ-ส่งสนามบิน",
    rent: "เช่าอุปกรณ์",
    needs: "หมายเหตุ",
    diverCount: "ดำน้ำ",
    nonDiverCount: "ไม่ดำ",
    groupTotal: "รวมกลุ่ม",
    person: "คน",
    confirmAtBooking: "ราคา non-diver ยืนยันตอนจอง",
  },
  en: {
    estBudget: "Starting price",
    perPerson: "/person",
    book: "Book / Contact",
    fromHotel: "Pickup at",
    transferYes: "Airport transfer",
    rent: "Rental",
    needs: "Notes",
    diverCount: "divers",
    nonDiverCount: "non-divers",
    groupTotal: "Group total",
    person: "pax",
    confirmAtBooking: "Non-diver price confirmed at booking",
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

function buildBookingMessage(trips: PlanTrip[], logistics: PlanLogistics | undefined, planShortId: string, ownerEmail: string | null | undefined, range: { min: number; max: number }, t: ReturnType<typeof getLabels>): string {
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

export default function PlanBookBar({ trips, logistics, planShortId, ownerEmail, lang, slots, onContact }: Props) {
  const t = getLabels(lang);
  const range = priceRange(trips);
  const scheduledCount = trips.filter(tr => tr.schedule?.departureDate).length;

  // Sprint 4 B6 — derive group breakdown from slots. divers = adults + kids
  // (kids old enough to dive will already be inside adults; if not, the user
  // should have updated slots) MINUS the explicit non-diver count.
  // certs slot is a hint only — we don't have per-cert pricing in the schema
  // (price tiers are SEASONS not certs), so we surface the cert mix as a
  // labelled annotation rather than splitting numbers we can't trust.
  const totalPeople = slots?.headcount
    ? (slots.headcount.adults || 0) + (slots.headcount.kids || 0)
    : 0;
  const nonDivers = slots?.companions?.nonDivers || 0;
  const divers = Math.max(0, totalPeople - nonDivers);
  const showGroupBreakdown = totalPeople > 0 && range.min > 0;
  const certMix = slots?.certs && slots.certs.length > 1 ? slots.certs : null;
  const groupMin = divers * range.min;
  const groupMax = divers * (range.max || range.min);

  if (scheduledCount === 0) return null;

  const handleClick = () => {
    onContact(buildBookingMessage(trips, logistics, planShortId, ownerEmail, range, t));
  };

  return (
    <div style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 5,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      background: "linear-gradient(to top, #0a0a0a 70%, rgba(10,10,10,0))",
      pointerEvents: "none",
    }}>
      <div style={{
        margin: "20px 12px 10px",
        padding: showGroupBreakdown ? "8px 12px 10px" : "10px 12px",
        borderRadius: 14,
        background: "#111",
        border: "1px solid #1f1f1f",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        pointerEvents: "auto",
      }}>
        {showGroupBreakdown && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 10px", marginBottom: 8,
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.18)",
            borderRadius: 8,
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 10, color: "#93c5fd", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t.groupTotal}
            </span>
            <span style={{ fontSize: 12, color: "#dbeafe", fontWeight: 700 }}>
              {divers > 0 && (
                <>
                  {divers} {t.diverCount}
                  {certMix && <span style={{ color: "#93c5fd", fontWeight: 600 }}> ({certMix.map(c => c.toUpperCase()).join("/")})</span>}
                </>
              )}
              {nonDivers > 0 && divers > 0 && " + "}
              {nonDivers > 0 && <>{nonDivers} {t.nonDiverCount}</>}
            </span>
            {divers > 0 && (
              <span style={{ fontSize: 12, color: "#fff", fontWeight: 800, marginLeft: "auto" }}>
                {groupMax > groupMin
                  ? `฿${groupMin.toLocaleString()} — ฿${groupMax.toLocaleString()}`
                  : `฿${groupMin.toLocaleString()}`}
              </span>
            )}
            {nonDivers > 0 && (
              <span style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic", flexBasis: "100%" }}>
                {t.confirmAtBooking}
              </span>
            )}
          </div>
        )}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {range.min > 0 ? (
            <>
              <p style={{ fontSize: 9, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                {t.estBudget}
              </p>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#f5f5f5", margin: "1px 0 0", lineHeight: 1.1 }}>
                {range.max > range.min
                  ? `฿${range.min.toLocaleString()} — ฿${range.max.toLocaleString()}`
                  : `฿${range.min.toLocaleString()}`}
                <span style={{ fontSize: 10, color: "#666", fontWeight: 600, marginLeft: 4 }}>
                  {t.perPerson}
                </span>
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, fontWeight: 700, color: "#bbb", margin: 0 }}>
              {scheduledCount} {lang === "th" ? "ทริปพร้อมจอง" : "trips ready"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleClick}
          style={{
            padding: "11px 18px",
            borderRadius: 10,
            background: "#1e40af",
            border: "none",
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {t.book}
        </button>
      </div>
      </div>
    </div>
  );
}
