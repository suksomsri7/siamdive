"use client";

import { useCurrency } from "@/components/CurrencyProvider";

// Dive-resort package panel — bundle-first. PADI sells these resorts as all-in
// packages (accommodation + dives + meals), NOT per-night rooms (their API
// returns showRates:false / minPrice:null). So we present the real starting
// "from" price plus what the package includes, and defer exact pricing of other
// night/room/dive combinations to enquiry — no fabricated per-night math.
// Self-contained + only rendered for DIVE_RESORT boats.

type Room = {
  id: string; name: string;
  translations: { lang: string; title: string }[];
  bedType?: string | null; occupancyMin?: number | null; occupancyMax?: number | null;
  roomSizeSqm?: number | null; amenities?: string[];
};
type DivePackage = { id: string; numberOfDives: number };
type MealPlan = { id: string; name: string; included: boolean };
type PriceTier = { tier: string; regularPrice: number; salePrice: number | null };

type Resort = {
  currency?: string;
  stars?: number | null;
  ecoLabels?: string[];
  tripadvisorRating?: number | null;
  priceTiers?: PriceTier[];
  packages: Room[];
  divePackages?: DivePackage[];
  mealPlans?: MealPlan[];
};

const T = {
  th: { heading: "แพ็กเกจดำน้ำเหมารวม", from: "เริ่มต้น", allIn: "ที่พัก + ดำน้ำ + อาหาร รวมในแพ็กเกจเดียว",
    includes: "รวมในแพ็กเกจ", rooms: "ห้องพัก", dives: "แพ็กเกจดำน้ำ", meal: "อาหาร", divesUnit: "ไดฟ์",
    guests: "พักได้สูงสุด", guestsUnit: "ท่าน",
    note: "ราคาขึ้นกับจำนวนคืน ห้อง และจำนวนไดฟ์ที่เลือก — ติดต่อขอใบเสนอราคาสำหรับแพ็กเกจที่ต้องการ" },
  en: { heading: "All-inclusive dive package", from: "From", allIn: "Accommodation + diving + meals in one package",
    includes: "Package includes", rooms: "Rooms", dives: "Dive packages", meal: "Meals", divesUnit: "dives",
    guests: "Sleeps up to", guestsUnit: "guests",
    note: "Price depends on nights, room, and number of dives — contact us for a quote on your preferred package" },
};

function tr(arr: { lang: string; title: string }[], lang: string) {
  return (arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0])?.title || "";
}

export default function ResortConfigurator({ resort, lang }: { resort: Resort; lang: string }) {
  const t = (T as Record<string, typeof T.th>)[lang] || T.en;
  const { display } = useCurrency();
  const boatCur = resort.currency || "USD";
  const rooms = resort.packages || [];
  const dps = (resort.divePackages || []).slice().sort((a, b) => a.numberOfDives - b.numberOfDives);
  const mps = (resort.mealPlans || []);

  // From-price = lowest live tier price (sale wins), in the boat's currency.
  const fromPrice = (() => {
    const prices = (resort.priceTiers || [])
      .map(t => (t.salePrice ?? t.regularPrice))
      .filter(p => typeof p === "number" && p > 0);
    return prices.length ? Math.min(...prices) : null;
  })();

  if (rooms.length === 0 && dps.length === 0 && fromPrice == null) return null;

  return (
    <div style={{ border: "1px solid #1d2a1d", borderRadius: 14, padding: 18, background: "linear-gradient(180deg,#0f140f,#0c0c0c)", marginBottom: 24 }}>
      {/* badges */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {resort.stars ? <span style={badge("#f59e0b")}>{"★".repeat(resort.stars)}</span> : null}
        {resort.tripadvisorRating ? <span style={badge("#34d399")}>TripAdvisor {resort.tripadvisorRating}</span> : null}
        {(resort.ecoLabels || []).map(e => <span key={e} style={badge("#6cc26c")}>🌿 {e}</span>)}
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{t.heading}</h2>
      <p style={{ fontSize: 12, color: "#7fae7f", margin: "0 0 14px" }}>{t.allIn}</p>

      {/* from-price headline (converted to viewer currency) */}
      {fromPrice != null && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t.from} </span>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>{display(fromPrice, boatCur)}</span>
        </div>
      )}

      {/* what's included */}
      <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 14 }}>
        <div style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{t.includes}</div>

        {rooms.length > 0 && (
          <Row icon="🛏" label={t.rooms}>
            {rooms.map(r => {
              const occ = r.occupancyMax ? ` (${t.guests} ${r.occupancyMax} ${t.guestsUnit})` : "";
              return (tr(r.translations, lang) || r.name) + occ;
            }).join(" · ")}
          </Row>
        )}

        {dps.length > 0 && (
          <Row icon="🤿" label={t.dives}>
            {dps.map(d => `${d.numberOfDives} ${t.divesUnit}`).join(" · ")}
          </Row>
        )}

        {mps.length > 0 && (
          <Row icon="🍽" label={t.meal}>
            {mps.map(m => m.name).join(" · ")}
          </Row>
        )}
      </div>

      <p style={{ fontSize: 11, color: "#777", lineHeight: 1.6, marginTop: 14, marginBottom: 0 }}>* {t.note}</p>
    </div>
  );
}

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 9, fontSize: 13, lineHeight: 1.5 }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <div>
        <span style={{ color: "#9a9a9a", fontWeight: 700 }}>{label}: </span>
        <span style={{ color: "#ddd" }}>{children}</span>
      </div>
    </div>
  );
}

function badge(color: string): React.CSSProperties {
  return { fontSize: 11, fontWeight: 700, color, background: `${color}1a`, border: `1px solid ${color}40`, borderRadius: 20, padding: "4px 11px" };
}
