// Phase 2 — Slot extraction for guided trip planning.
// The AI calls `update_slots` (Anthropic tool use) whenever the user reveals
// new trip-planning info. Slots persist in AiPlanSession.slots so the user can
// resume across refreshes. Required-3 (dates + headcount + region) unlocks the
// "Build my plan" CTA which Phase 3 wires to /api/ark-ai/build-plan.

export type Region = "andaman" | "gulf" | "both";
export type CertLevel = "none" | "ow" | "aow" | "rescue+";
export type Style = "relaxed" | "intense" | "family" | "photography" | "training";
export type TripCategory = "liveaboard" | "daytrip" | "snorkeling" | "land_tour";

export type Dates = { from: string; to?: string; label?: string };
export type Headcount = { adults: number; kids?: number };
export type Budget = { min?: number; max?: number; currency?: string };

export type Slots = {
  dates?: Dates;
  headcount?: Headcount;
  region?: Region;
  certs?: CertLevel[];
  /** Which kind(s) of trip the user wants. Empty/missing = unknown — AI should
   *  ask before recommending. Multiple allowed (e.g. liveaboard + a daytrip
   *  add-on). */
  categories?: TripCategory[];
  budget?: Budget;
  style?: Style;
  interests?: string[];
};

export type SlotField = keyof Slots;

export const REQUIRED_FIELDS: SlotField[] = ["dates", "headcount", "region"];

export function isComplete(slots: Slots | null | undefined): boolean {
  if (!slots) return false;
  return REQUIRED_FIELDS.every(f => {
    const v = slots[f];
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REGIONS: Region[] = ["andaman", "gulf", "both"];
const CERTS: CertLevel[] = ["none", "ow", "aow", "rescue+"];
const STYLES: Style[] = ["relaxed", "intense", "family", "photography", "training"];
const TRIP_CATEGORIES: TripCategory[] = ["liveaboard", "daytrip", "snorkeling", "land_tour"];

function cleanString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

function asPositiveInt(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v) && v > 0 && v < 1000) return Math.floor(v);
  return undefined;
}

function asNonNegInt(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1000) return Math.floor(v);
  return undefined;
}

function asNonNegNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  return undefined;
}

// Validate+normalize tool call input. Drops fields that fail validation
// rather than rejecting the whole call — partial extractions are still useful.
export function applyToolCall(
  current: Slots,
  input: unknown,
): { merged: Slots; changed: SlotField[] } {
  const merged: Slots = { ...current };
  const changed: SlotField[] = [];
  if (!input || typeof input !== "object") return { merged, changed };
  const raw = input as Record<string, unknown>;

  // dates
  if (raw.dates && typeof raw.dates === "object") {
    const d = raw.dates as Record<string, unknown>;
    const from = cleanString(d.from);
    if (from && ISO_DATE.test(from)) {
      const next: Dates = { from };
      const to = cleanString(d.to);
      if (to && ISO_DATE.test(to)) next.to = to;
      const label = cleanString(d.label);
      if (label) next.label = label;
      if (JSON.stringify(merged.dates) !== JSON.stringify(next)) {
        merged.dates = next;
        changed.push("dates");
      }
    }
  }

  // headcount
  if (raw.headcount && typeof raw.headcount === "object") {
    const h = raw.headcount as Record<string, unknown>;
    const adults = asPositiveInt(h.adults);
    if (adults !== undefined) {
      const next: Headcount = { adults };
      const kids = asNonNegInt(h.kids);
      if (kids !== undefined) next.kids = kids;
      if (JSON.stringify(merged.headcount) !== JSON.stringify(next)) {
        merged.headcount = next;
        changed.push("headcount");
      }
    }
  }

  // region
  if (typeof raw.region === "string") {
    const r = raw.region.trim().toLowerCase() as Region;
    if (REGIONS.includes(r) && merged.region !== r) {
      merged.region = r;
      changed.push("region");
    }
  }

  // certs
  if (Array.isArray(raw.certs)) {
    const next = raw.certs
      .map(c => (typeof c === "string" ? c.trim().toLowerCase() : ""))
      .filter((c): c is CertLevel => CERTS.includes(c as CertLevel));
    if (next.length && JSON.stringify(merged.certs) !== JSON.stringify(next)) {
      merged.certs = next;
      changed.push("certs");
    }
  }

  // categories — what type of trip the user wants. Required for sensible
  // recommendations: "อยากดำน้ำ" alone shouldn't surface only daytrips when
  // the user might want a liveaboard, or a snorkel-focused day, or a land
  // tour add-on. AI must ask before pitching.
  if (Array.isArray(raw.categories)) {
    const next = Array.from(new Set(
      raw.categories
        .map(c => (typeof c === "string" ? c.trim().toLowerCase().replace(/\s/g, "_") : ""))
        .filter((c): c is TripCategory => TRIP_CATEGORIES.includes(c as TripCategory))
    ));
    if (next.length && JSON.stringify(merged.categories) !== JSON.stringify(next)) {
      merged.categories = next;
      changed.push("categories");
    }
  }

  // budget
  if (raw.budget && typeof raw.budget === "object") {
    const b = raw.budget as Record<string, unknown>;
    const next: Budget = {};
    const min = asNonNegNumber(b.min);
    if (min !== undefined) next.min = min;
    const max = asNonNegNumber(b.max);
    if (max !== undefined) next.max = max;
    const currency = cleanString(b.currency);
    if (currency) next.currency = currency.toUpperCase().slice(0, 3);
    if (Object.keys(next).length && JSON.stringify(merged.budget) !== JSON.stringify(next)) {
      merged.budget = next;
      changed.push("budget");
    }
  }

  // style
  if (typeof raw.style === "string") {
    const s = raw.style.trim().toLowerCase() as Style;
    if (STYLES.includes(s) && merged.style !== s) {
      merged.style = s;
      changed.push("style");
    }
  }

  // interests
  if (Array.isArray(raw.interests)) {
    const next = Array.from(new Set(
      raw.interests
        .map(i => (typeof i === "string" ? i.trim() : ""))
        .filter(i => i.length > 0 && i.length < 60)
        .map(i => i.toLowerCase())
    )).slice(0, 8);
    if (next.length && JSON.stringify(merged.interests) !== JSON.stringify(next)) {
      merged.interests = next;
      changed.push("interests");
    }
  }

  return { merged, changed };
}

// Anthropic tool definition. Sent on every Anthropic provider turn.
// Shape conforms to the Messages API tool spec.
export const UPDATE_SLOTS_TOOL = {
  name: "update_slots",
  description:
    `Silently record trip-planning info that the user has revealed. Call this whenever the user mentions trip dates, group size (headcount), region, certification level, budget, style/vibe, or interests — even casually. You may call it alongside your normal text reply (multiple content blocks per turn). Only include fields the user just revealed or updated; omit fields you've already recorded unchanged. Required-3 (dates, headcount, region) unlocks the user's 'Build my plan' button.

# Headcount few-shot — the AI must NOT miss these phrasings:

User says: "ไป 2 คนครับ" → call update_slots with {"headcount":{"adults":2}}
User says: "เราสองคน" → {"headcount":{"adults":2}}
User says: "two of us" / "the two of us" / "we are two" → {"headcount":{"adults":2}}
User says: "couple" / "ไปเป็นคู่" / "ไปกับแฟน" / "คู่รัก" → {"headcount":{"adults":2}}
User says: "solo" / "alone" / "ไปคนเดียว" → {"headcount":{"adults":1}}
User says: "พวกเรา 4 คน" / "we are 4 people" / "4 ppl" / "4 pax" → {"headcount":{"adults":4}}
User says: "พ่อแม่ลูก" → {"headcount":{"adults":2,"kids":1}}
User says: "เรา 3 คนกับลูก 1" / "3 adults + 1 kid" → {"headcount":{"adults":3,"kids":1}}
User says: "ครอบครัว 4 คน 2 เด็ก" → {"headcount":{"adults":2,"kids":2}}

# Region few-shot:
User says: "ภูเก็ต" / "Phi Phi" / "Similan" / "Krabi" / "Andaman" → {"region":"andaman"}
User says: "Koh Tao" / "เกาะเต่า" / "Pha Ngan" / "Samui" → {"region":"gulf"}
User says: "ที่ไหนก็ได้" / "either coast" / "open" → {"region":"both"}

# Cert few-shot:
User says: "OW 2 คน" → {"certs":["ow","ow"]}
User says: "ผม OW แฟน AOW" → {"certs":["ow","aow"]}
User says: "ไม่มีใบ" / "no cert" / "uncertified" → {"certs":["none"]}
User says: "Discover Scuba" / "DSD" / "first time diving" → {"certs":["none"]}
User says: "snorkel only" / "ดำผิวน้ำ" → {"certs":["none"]}

# Date few-shot (resolve relative phrases to ISO using today as anchor):
User says: "เดือนหน้า" → if today is 2026-05-05, dates.from="2026-06-01", label="เดือนหน้า"
User says: "Songkran" → dates.from="2026-04-13", dates.to="2026-04-15", label="Songkran"
User says: "this weekend" → next Sat–Sun ISO

# Anti-pattern: NEVER omit headcount when user said any of the phrases above. NEVER force the user to repeat themselves — extract on first mention.`,
  input_schema: {
    type: "object" as const,
    properties: {
      dates: {
        type: "object",
        description: "Trip dates. Resolve relative phrasing ('next month', 'Songkran', 'mid-July') to ISO dates using today's date as anchor.",
        properties: {
          from: { type: "string", description: "Start date in YYYY-MM-DD. Required if dates field is included." },
          to: { type: "string", description: "End date in YYYY-MM-DD, if user mentioned a range." },
          label: { type: "string", description: "Original phrasing the user used, kept for chip display (e.g. 'next month', 'Songkran week')." },
        },
        required: ["from"],
      },
      headcount: {
        type: "object",
        properties: {
          adults: { type: "integer", description: "Number of adult travelers (18+). Must be at least 1." },
          kids: { type: "integer", description: "Number of children (under 18), if mentioned. Default 0." },
        },
        required: ["adults"],
      },
      region: {
        type: "string",
        enum: ["andaman", "gulf", "both"],
        description: "andaman = Phuket/Krabi/Phi Phi/Similan/Surin/Lipe. gulf = Koh Tao/Pha Ngan/Samui/Chumphon. both = user is open to either coast.",
      },
      certs: {
        type: "array",
        items: { type: "string", enum: ["none", "ow", "aow", "rescue+"] },
        description: "Certification per person, one entry per traveler. 'none' = snorkel only, 'ow' = Open Water (max 18m), 'aow' = Advanced (max 30m), 'rescue+' = Rescue or higher.",
      },
      categories: {
        type: "array",
        items: { type: "string", enum: ["liveaboard", "daytrip", "snorkeling", "land_tour"] },
        description: "Type(s) of trip the user wants. liveaboard = multi-day boat trip with onboard accommodation. daytrip = single-day dive trip returning same evening. snorkeling = snorkel-only day trip (no scuba). land_tour = land-based sightseeing (Big Buddha / Old Town / island hopping by speedboat). Multiple values OK if user wants to combine. Set this whenever the user names a category OR when they confirm one via a $$ASK$$ button.",
      },
      budget: {
        type: "object",
        properties: {
          min: { type: "number", description: "Lower bound." },
          max: { type: "number", description: "Upper bound." },
          currency: { type: "string", description: "ISO code (THB, USD, EUR). Default THB." },
        },
      },
      style: {
        type: "string",
        enum: ["relaxed", "intense", "family", "photography", "training"],
        description: "Trip vibe based on what the user described.",
      },
      interests: {
        type: "array",
        items: { type: "string" },
        description: "Marine life or features the user wants (e.g. 'whale shark', 'wreck', 'macro', 'manta', 'reef'). Lowercase, deduplicated, max 8.",
      },
    },
  },
} as const;

// Render slots as a compact line for system prompt injection so the AI knows
// what's already filled and avoids redundant tool calls. Empty → null.
export function formatSlotsForPrompt(slots: Slots | null | undefined): string | null {
  if (!slots || Object.keys(slots).length === 0) return null;
  const parts: string[] = [];
  if (slots.dates) {
    const d = slots.dates;
    const range = d.to && d.to !== d.from ? `${d.from} → ${d.to}` : d.from;
    parts.push(`dates=${range}${d.label ? ` ("${d.label}")` : ""}`);
  }
  if (slots.headcount) {
    const h = slots.headcount;
    parts.push(`headcount=${h.adults} adults${h.kids ? ` + ${h.kids} kids` : ""}`);
  }
  if (slots.region) parts.push(`region=${slots.region}`);
  if (slots.categories?.length) parts.push(`categories=[${slots.categories.join(",")}]`);
  if (slots.certs?.length) parts.push(`certs=[${slots.certs.join(",")}]`);
  if (slots.budget) {
    const b = slots.budget;
    const cur = b.currency || "THB";
    const range = b.min != null && b.max != null ? `${b.min}-${b.max}` : b.min != null ? `≥${b.min}` : `≤${b.max}`;
    parts.push(`budget=${range} ${cur}`);
  }
  if (slots.style) parts.push(`style=${slots.style}`);
  if (slots.interests?.length) parts.push(`interests=[${slots.interests.join(",")}]`);
  return parts.join("; ");
}
