import { createHash } from "crypto";
import type { Slots } from "@/lib/ark-ai/slots";

// Stable, order-independent hash of the slot fields that define a plan's
// identity. Two builds with the same slot fingerprint should resolve to the
// same UserPlan — clicking "Build my plan" twice on the same chat must not
// produce duplicate plans (user-reported bug 2026-05-09: 3 dup plans from
// repeat clicks on a stale chat thread).
//
// We deliberately omit cosmetic fields (dates.label, free-text interests) so
// "next month" and the resolved ISO range produce the same signature, and so
// AI-extracted interests don't churn the hash.
export function buildPlanSignature(slots: Slots): string {
  const norm = {
    dates: slots.dates
      ? { from: slots.dates.from, to: slots.dates.to ?? slots.dates.from }
      : null,
    headcount: slots.headcount
      ? { adults: slots.headcount.adults, kids: slots.headcount.kids ?? 0 }
      : null,
    region: slots.region ?? null,
    certs: slots.certs ? [...slots.certs].sort() : null,
    categories: slots.categories ? [...slots.categories].sort() : null,
    companions: slots.companions
      ? { nonDivers: slots.companions.nonDivers, activity: slots.companions.activity ?? null }
      : null,
  };
  return createHash("sha256").update(JSON.stringify(norm)).digest("hex").slice(0, 32);
}

// Trip-set signature for the fast path (staged picks). The slot signature
// only matches when chat extraction produces identical slots — clicking "+"
// on three boats and then "Build my plan" never goes through slot extraction
// at all, so we also fingerprint the actual (boatId, scheduleId) set so the
// fast path can be deduped the same way.
export type TripFingerprint = { boatId: string; scheduleId?: string | null };

export function buildTripSignature(trips: TripFingerprint[]): string | null {
  const pairs = trips
    .map(t => `${t.boatId || ""}:${t.scheduleId || ""}`)
    .filter(s => s !== ":")
    .sort();
  if (pairs.length === 0) return null;
  return createHash("sha256").update(pairs.join("|")).digest("hex").slice(0, 32);
}
