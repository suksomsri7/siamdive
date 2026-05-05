"use client";

// PlanBookBar — sticky bottom CTA on PlanDetail. Replaces the inline budget
// box that used to sit at the top of PlanTimeline. Shows total estimated
// budget + count of trips, plus a primary "Book / Contact" button that
// opens the same ContactChannelSheet as before. Stays pinned to the
// drawer's bottom edge so it's always reachable on long itineraries.
//
// Renders nothing if there are no trips with priced packages — there's
// nothing to book yet, so a CTA would be misleading.

import type { PlanTrip, PlanLogistics } from "@/lib/plan-store";

type Props = {
  trips: PlanTrip[];
  logistics?: PlanLogistics;
  planShortId: string;
  ownerEmail?: string | null;
  lang: string;
  onContact: (message: string) => void;
};

const L = {
  th: {
    estBudget: "งบโดยประมาณ",
    perGroup: "/ กลุ่ม",
    book: "ติดต่อจอง",
    fromHotel: "รับที่",
    transferYes: "รับ-ส่งสนามบิน",
    rent: "เช่าอุปกรณ์",
    needs: "หมายเหตุ",
  },
  en: {
    estBudget: "Est. budget",
    perGroup: "/ group",
    book: "Book / Contact",
    fromHotel: "Pickup at",
    transferYes: "Airport transfer",
    rent: "Rental",
    needs: "Notes",
  },
} as const;

type Labels = typeof L.en;
function getLabels(lang: string): Labels {
  const map = L as unknown as Record<string, Labels>;
  return map[lang] || L.en;
}

function totalBudget(trips: PlanTrip[]): number {
  return trips.reduce((sum, t) => {
    if (!t.schedule?.packages?.length) return sum;
    return sum + t.schedule.packages.reduce((s, p) => s + (p.minPrice > 0 ? p.minPrice * (p.qty || 1) : 0), 0);
  }, 0);
}

function buildBookingMessage(trips: PlanTrip[], logistics: PlanLogistics | undefined, planShortId: string, ownerEmail: string | null | undefined, total: number, t: ReturnType<typeof getLabels>): string {
  const lines: string[] = [];
  lines.push(`Hi, I'd like to book the following trips (Plan: ${planShortId}):`);
  for (const trip of trips) {
    const dep = trip.schedule?.departureDate?.slice(0, 10) || "";
    const ret = trip.schedule?.returnDate?.slice(0, 10);
    const dateLabel = ret && ret !== dep ? `${dep} → ${ret}` : dep;
    const pkgs = trip.schedule?.packages || [];
    const pkgLine = pkgs.length
      ? pkgs.map(p => `${p.name} × ${p.qty || 1}`).join(", ")
      : "";
    lines.push(`- ${trip.title}${dateLabel ? ` (${dateLabel})` : ""}${pkgLine ? ` — ${pkgLine}` : ""}`);
  }
  if (logistics) {
    const lo: string[] = [];
    if (logistics.pickup === "yes") lo.push(`${t.fromHotel}${logistics.hotelName ? ` ${logistics.hotelName}` : ""}`);
    if (logistics.airportTransfer === "yes") lo.push(t.transferYes);
    if (logistics.equipmentRental) lo.push(`${t.rent}: ${logistics.equipmentRental}`);
    if (logistics.specialNeeds) lo.push(`${t.needs}: ${logistics.specialNeeds}`);
    if (lo.length) lines.push("", "Logistics:", ...lo.map(l => `- ${l}`));
  }
  if (total > 0) lines.push("", `Estimated budget: ฿${total.toLocaleString()}`);
  if (ownerEmail) lines.push(`Email: ${ownerEmail}`);
  return lines.join("\n");
}

export default function PlanBookBar({ trips, logistics, planShortId, ownerEmail, lang, onContact }: Props) {
  const t = getLabels(lang);
  const total = totalBudget(trips);
  const scheduledCount = trips.filter(tr => tr.schedule?.departureDate).length;

  if (scheduledCount === 0) return null;

  const handleClick = () => {
    onContact(buildBookingMessage(trips, logistics, planShortId, ownerEmail, total, t));
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
        padding: "10px 12px",
        borderRadius: 14,
        background: "#111",
        border: "1px solid #1f1f1f",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "auto",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {total > 0 ? (
            <>
              <p style={{ fontSize: 9, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                {t.estBudget}
              </p>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#f5f5f5", margin: "1px 0 0", lineHeight: 1.1 }}>
                ฿{total.toLocaleString()}
                <span style={{ fontSize: 10, color: "#666", fontWeight: 600, marginLeft: 4 }}>
                  {t.perGroup}
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
  );
}
