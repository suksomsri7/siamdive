"use client";

import { useMemo, useState } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { formatMoney, resolveItemCurrency } from "@/lib/currency";

// PADI-style booking configurator for a dive resort: pick nights × room ×
// dive package × meal plan → live estimated total. Prices that the operator
// hasn't filled in (null) degrade gracefully to "สอบถามราคา" instead of 0.
// Prices are stored native (room/dive/meal may differ, e.g. USD room + MYR dive)
// and converted to the viewer's currency before summing. Self-contained + only
// rendered for DIVE_RESORT boats, so it can't affect liveaboard / daytrip views.

type Room = {
  id: string; name: string;
  translations: { lang: string; title: string }[];
  bedType?: string | null; occupancyMin?: number | null; occupancyMax?: number | null;
  roomSizeSqm?: number | null; amenities?: string[]; pricePerNight?: number | null; currency?: string | null;
};
type DivePackage = { id: string; numberOfDives: number; price: number | null; currency?: string | null };
type MealPlan = { id: string; name: string; price: number | null; included: boolean; description: string; currency?: string | null };

type Resort = {
  currency?: string;
  stars?: number | null;
  ecoLabels?: string[];
  tripadvisorRating?: number | null;
  packages: Room[];
  divePackages?: DivePackage[];
  mealPlans?: MealPlan[];
};

const T = {
  th: { configure: "จัดแพ็กเกจของคุณ", nights: "จำนวนคืน", room: "ห้องพัก", dives: "แพ็กเกจดำน้ำ", meal: "มื้ออาหาร",
    divesUnit: "ไดฟ์", included: "รวมในราคา", estTotal: "ราคาประมาณการ", perStay: "ต่อการเข้าพัก", ask: "สอบถามราคา",
    askNote: "ราคาบางส่วนยังไม่ระบุ — กดติดต่อเพื่อขอใบเสนอราคา", bed: "เตียง", occ: "พักได้", guests: "ท่าน", sqm: "ตร.ม.",
    perNight: "/คืน", amenities: "สิ่งอำนวยความสะดวก", eco: "เป็นมิตรกับสิ่งแวดล้อม", note: "ราคาประมาณการ แปลงค่าเงินโดยประมาณ ยืนยันอีกครั้งเมื่อติดต่อจอง" },
  en: { configure: "Build your package", nights: "Nights", room: "Room", dives: "Dive package", meal: "Meal plan",
    divesUnit: "dives", included: "included", estTotal: "Estimated total", perStay: "per stay", ask: "Ask for price",
    askNote: "Some prices aren't set yet — contact us for a quote", bed: "Bed", occ: "Sleeps", guests: "guests", sqm: "m²",
    perNight: "/night", amenities: "Amenities", eco: "Eco-friendly", note: "Indicative estimate — currency approximate, confirmed on enquiry" },
};

function tr(arr: { lang: string; title: string }[], lang: string) {
  return (arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0])?.title || "";
}

export default function ResortConfigurator({ resort, lang }: { resort: Resort; lang: string }) {
  const t = (T as Record<string, typeof T.th>)[lang] || T.en;
  const { display, convert, currency } = useCurrency();
  const boatCur = resort.currency || "USD";
  const rooms = resort.packages || [];
  const dps = resort.divePackages || [];
  const mps = resort.mealPlans || [];

  const [nights, setNights] = useState(7);
  const [roomId, setRoomId] = useState(rooms[0]?.id || "");
  const [dpId, setDpId] = useState(dps[0]?.id || "");
  const [mpId, setMpId] = useState((mps.find(m => m.included) || mps[0])?.id || "");

  const room = rooms.find(r => r.id === roomId);
  const dp = dps.find(d => d.id === dpId);
  const mp = mps.find(m => m.id === mpId);

  // Convert each line into the viewer's currency BEFORE summing (lines may be
  // in different native currencies). A null line (price unset OR no FX rate)
  // makes the whole total unknown → "ask for price".
  const calc = useMemo(() => {
    const line = (amountNative: number | null | undefined, itemCcy: string): number | null => {
      if (amountNative == null) return null;
      if (amountNative === 0) return 0;
      return convert(amountNative, itemCcy);
    };
    const roomCost = line(room?.pricePerNight != null ? room.pricePerNight * nights : null, resolveItemCurrency(room, boatCur));
    const diveCost = dp ? line(dp.price, resolveItemCurrency(dp, boatCur)) : 0;
    const mealCost = mp ? (mp.included ? 0 : line(mp.price, resolveItemCurrency(mp, boatCur))) : 0;
    const known = roomCost != null && diveCost != null && mealCost != null;
    const total = known ? (roomCost as number) + (diveCost as number) + (mealCost as number) : null;
    return { total };
  }, [room, dp, mp, nights, convert, boatCur]);

  const sel: React.CSSProperties = { width: "100%", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#eee", fontSize: 14, padding: "10px 12px", outline: "none" };
  const lbl: React.CSSProperties = { fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };

  if (rooms.length === 0 && dps.length === 0) return null;

  return (
    <div style={{ border: "1px solid #1d2a1d", borderRadius: 14, padding: 18, background: "linear-gradient(180deg,#0f140f,#0c0c0c)", marginBottom: 24 }}>
      {/* badges */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {resort.stars ? <span style={badge("#f59e0b")}>{"★".repeat(resort.stars)}</span> : null}
        {resort.tripadvisorRating ? <span style={badge("#34d399")}>TripAdvisor {resort.tripadvisorRating}</span> : null}
        {(resort.ecoLabels || []).map(e => <span key={e} style={badge("#6cc26c")}>🌿 {e}</span>)}
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 14px" }}>{t.configure}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={lbl}>{t.nights}</label>
          <input type="number" min={1} max={30} value={nights} onChange={e => setNights(Math.max(1, Number(e.target.value) || 1))} style={sel} />
        </div>
        {rooms.length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>{t.room}</label>
            <select value={roomId} onChange={e => setRoomId(e.target.value)} style={sel}>
              {rooms.map(r => <option key={r.id} value={r.id}>{tr(r.translations, lang) || r.name}{r.pricePerNight != null ? ` — ${display(r.pricePerNight, resolveItemCurrency(r, boatCur))}${t.perNight}` : ""}</option>)}
            </select>
          </div>
        )}
        {dps.length > 0 && (
          <div>
            <label style={lbl}>{t.dives}</label>
            <select value={dpId} onChange={e => setDpId(e.target.value)} style={sel}>
              {dps.map(d => <option key={d.id} value={d.id}>{d.numberOfDives} {t.divesUnit}{d.price != null ? ` — ${display(d.price, resolveItemCurrency(d, boatCur))}` : ""}</option>)}
            </select>
          </div>
        )}
        {mps.length > 0 && (
          <div>
            <label style={lbl}>{t.meal}</label>
            <select value={mpId} onChange={e => setMpId(e.target.value)} style={sel}>
              {mps.map(m => <option key={m.id} value={m.id}>{m.name}{m.included ? ` (${t.included})` : m.price != null ? ` — ${display(m.price, resolveItemCurrency(m, boatCur))}` : ""}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* selected room details */}
      {room && (
        <div style={{ fontSize: 12, color: "#9a9a9a", marginBottom: 14, lineHeight: 1.7 }}>
          {room.bedType ? `${t.bed}: ${room.bedType} · ` : ""}
          {room.occupancyMax ? `${t.occ} ${room.occupancyMin || 1}–${room.occupancyMax} ${t.guests} · ` : ""}
          {room.roomSizeSqm ? `${room.roomSizeSqm} ${t.sqm}` : ""}
          {room.amenities?.length ? <div style={{ marginTop: 6 }}>{t.amenities}: {room.amenities.join(" · ")}</div> : null}
        </div>
      )}

      {/* total */}
      <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t.estTotal}</div>
          {calc.total != null ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{formatMoney(calc.total, currency, { approx: true })}</div>
              <div style={{ fontSize: 11, color: "#777" }}>{t.perStay} · {nights} {t.nights.toLowerCase()} · {t.note}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>{t.ask}</div>
              <div style={{ fontSize: 11, color: "#777" }}>{t.askNote}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function badge(color: string): React.CSSProperties {
  return { fontSize: 11, fontWeight: 700, color, background: `${color}1a`, border: `1px solid ${color}40`, borderRadius: 20, padding: "4px 11px" };
}
