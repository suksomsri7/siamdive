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
  /** Optional — when provided, renders an "Invite friends" button next to
   *  the contact button so the user can share the plan link without leaving
   *  the plan page. The handler should resolve any email gate before
   *  triggering the share sheet. */
  onInvite?: () => void;
};

const L = {
  th: {
    book: "ติดต่อจอง",
    invite: "ชวนเพื่อน",
    fromHotel: "รับที่",
    transferYes: "รับ-ส่งสนามบิน",
    rent: "เช่าอุปกรณ์",
    needs: "หมายเหตุ",
    diverCount: "ดำน้ำ",
    nonDiverCount: "ไม่ดำ",
    groupTotal: "รวมกลุ่ม",
  },
  en: {
    book: "Book / Contact",
    invite: "Invite friends",
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

export default function PlanBookBar({ trips, logistics, planShortId, ownerEmail, lang, slots, onContact, onInvite }: Props) {
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

  // Stack of floating circular actions, anchored bottom-right above the
  // home-style PlanBottomNav. The nav reserves ~70px + iOS safe-area, so we
  // offset by `calc(80px + env(safe-area-inset-bottom))` to clear it.
  return (
    <div style={{
      position: "absolute",
      right: 14,
      bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
      zIndex: 6,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 10,
      pointerEvents: "none",
    }}>
      {showGroupBreakdown && (
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
      )}

      {onInvite && (
        <button
          type="button"
          onClick={onInvite}
          aria-label={t.invite}
          title={t.invite}
          style={{
            pointerEvents: "auto",
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--plan-surface)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--plan-border)",
            color: "var(--plan-fg-muted)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            transition: "transform 0.15s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={handleClick}
        aria-label={t.book}
        title={t.book}
        style={{
          pointerEvents: "auto",
          width: 46, height: 46, borderRadius: "50%",
          background: "linear-gradient(135deg, #1e40af, #3b82f6)",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 6px 18px rgba(59,130,246,0.4)",
          transition: "transform 0.15s",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </button>
    </div>
  );
}
