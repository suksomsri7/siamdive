"use client";

import { useState, useMemo } from "react";

type SearchOffer = {
  provider: string;
  title: string;
  subtitle?: string;
  price: number;
  currency: string;
  startAt: string;
  endAt?: string | null;
  imageUrl?: string;
  externalUrl: string;
  location?: string;
};

const LABELS = {
  th: {
    titleFlight: "ค้นหาเที่ยวบิน",
    titleHotel: "ค้นหาที่พัก",
    from: "จาก (IATA เช่น BKK)",
    to: "ไป (IATA เช่น HKT)",
    cityName: "เมือง / พื้นที่",
    date: "วันที่ออก",
    returnDate: "วันที่กลับ (ไม่บังคับ)",
    checkin: "เช็คอิน",
    checkout: "เช็คเอาท์",
    adults: "ผู้ใหญ่",
    search: "ค้นหา",
    searching: "กำลังค้นหา…",
    pick: "เลือก",
    viewMore: "ดูเพิ่ม",
    cancel: "ยกเลิก",
    noResults: "ไม่พบผลลัพธ์ — ลองวันใหม่หรือสาย/เมืองอื่น",
    rateLimit: "เกินจำนวนค้นหาวันนี้แล้ว (10/วัน) — ลองพรุ่งนี้",
    errorGeneric: "ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง",
    rememberDisclaimer: "ราคา/ตัวเลือกจาก partner API — ของจริงให้คลิก \"ดูเพิ่ม\" เพื่อจอง",
  },
  en: {
    titleFlight: "Search flights",
    titleHotel: "Search hotels",
    from: "From (IATA e.g. BKK)",
    to: "To (IATA e.g. HKT)",
    cityName: "City / area",
    date: "Departure date",
    returnDate: "Return date (optional)",
    checkin: "Check-in",
    checkout: "Check-out",
    adults: "Adults",
    search: "Search",
    searching: "Searching…",
    pick: "Pick",
    viewMore: "See more",
    cancel: "Cancel",
    noResults: "No results — try different dates or route/city",
    rateLimit: "Daily search limit hit (10/day) — try tomorrow",
    errorGeneric: "Search failed — please try again",
    rememberDisclaimer: "Prices from partner API — click \"See more\" to actually book",
  },
} as const;

function L(lang: string) {
  return (LABELS as Record<string, typeof LABELS.en>)[lang] || LABELS.en;
}

function fmtMoney(amount: number, currency: string) {
  if (amount === 0) return "—";
  if (currency === "THB") return `฿${amount.toLocaleString()}`;
  return `${amount.toLocaleString()} ${currency}`;
}

function fmtDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    day: "numeric", month: "short", year: "2-digit",
  });
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function plusDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type Props = {
  planId: string;
  lang: string;
  type: "FLIGHT" | "HOTEL";
  onClose: () => void;
  onPicked: () => void;
};

export default function SearchResultModal({ planId, lang, type, onClose, onPicked }: Props) {
  const labels = L(lang);
  const [from, setFrom] = useState("BKK");
  const [to, setTo] = useState("HKT");
  const [cityName, setCityName] = useState("Phuket");
  const [date, setDate] = useState(tomorrowISO());
  const [returnDate, setReturnDate] = useState("");
  const [checkin, setCheckin] = useState(tomorrowISO());
  const [checkout, setCheckout] = useState(plusDaysISO(3));
  const [adults, setAdults] = useState(type === "FLIGHT" ? 1 : 2);
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<SearchOffer[]>([]);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const titleText = type === "FLIGHT" ? labels.titleFlight : labels.titleHotel;

  const handleSearch = async () => {
    setError("");
    setLoading(true);
    setOffers([]);
    try {
      const body = type === "FLIGHT"
        ? { type: "FLIGHT", from: from.toUpperCase(), to: to.toUpperCase(), date, returnDate: returnDate || undefined, adults }
        : { type: "HOTEL", cityName, countryCode: "TH", checkin, checkout, adults };
      const res = await fetch(`/api/plans/${planId}/items/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 429) {
        setError(labels.rateLimit);
      } else if (!res.ok) {
        setError(labels.errorGeneric);
      } else {
        const data = await res.json();
        setOffers(data.offers || []);
        if ((data.offers || []).length === 0) setError(labels.noResults);
      }
    } catch {
      setError(labels.errorGeneric);
    }
    setLoading(false);
  };

  const handlePick = async (offer: SearchOffer, idx: number) => {
    setSavingId(`${idx}`);
    try {
      const payload = {
        type,
        title: offer.title,
        location: offer.location || (type === "HOTEL" ? cityName : `${from.toUpperCase()} → ${to.toUpperCase()}`),
        startAt: new Date(offer.startAt).toISOString(),
        endAt: offer.endAt ? new Date(offer.endAt).toISOString() : undefined,
        externalUrl: offer.externalUrl,
        cost: offer.price || undefined,
        currency: offer.currency,
        source: "AI_SUGGEST",
        searchQuery: type === "FLIGHT"
          ? { from: from.toUpperCase(), to: to.toUpperCase(), date, returnDate, adults }
          : { cityName, checkin, checkout, adults },
        alternatives: offers,
      };
      const res = await fetch(`/api/plans/${planId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onPicked();
        onClose();
      } else {
        setError(labels.errorGeneric);
      }
    } catch {
      setError(labels.errorGeneric);
    }
    setSavingId(null);
  };

  const formRows = useMemo(() => (
    type === "FLIGHT" ? (
      <>
        <div style={rowStyle}>
          <Field label={labels.from}>
            <input value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} maxLength={3} style={inputStyle} />
          </Field>
          <Field label={labels.to}>
            <input value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} maxLength={3} style={inputStyle} />
          </Field>
        </div>
        <div style={rowStyle}>
          <Field label={labels.date}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </Field>
          <Field label={labels.returnDate}>
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label={labels.adults}>
          <input type="number" min={1} max={9} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))} style={{ ...inputStyle, maxWidth: 100 }} />
        </Field>
      </>
    ) : (
      <>
        <Field label={labels.cityName}>
          <input value={cityName} onChange={(e) => setCityName(e.target.value)} style={inputStyle} placeholder="Phuket / Krabi / Khao Lak" />
        </Field>
        <div style={rowStyle}>
          <Field label={labels.checkin}>
            <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} style={inputStyle} />
          </Field>
          <Field label={labels.checkout}>
            <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label={labels.adults}>
          <input type="number" min={1} max={9} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))} style={{ ...inputStyle, maxWidth: 100 }} />
        </Field>
      </>
    )
  ), [type, from, to, date, returnDate, cityName, checkin, checkout, adults, labels]);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.75)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1501,
        background: "var(--plan-surface)", borderRadius: "16px 16px 0 0",
        padding: "18px 16px",
        paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "var(--plan-fg)", margin: 0 }}>
            {type === "FLIGHT" ? "✈️" : "🏨"} {titleText}
          </p>
          <button onClick={onClose} aria-label={labels.cancel} style={{ background: "none", border: "none", color: "var(--plan-fg-subtle)", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        {formRows}

        <button onClick={handleSearch} disabled={loading} style={{ ...btnPrimaryStyle, width: "100%", marginTop: 10 }}>
          {loading ? labels.searching : `🔍 ${labels.search}`}
        </button>

        {error && (
          <p style={{ fontSize: 12, color: "#dc2626", margin: "10px 0 0" }}>{error}</p>
        )}

        {offers.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", marginBottom: 8 }}>
              {labels.rememberDisclaimer}
            </p>
            {offers.slice(0, 5).map((offer, i) => (
              <div key={i} style={{
                background: "var(--plan-bg)", border: "1px solid var(--plan-border-soft)",
                borderRadius: 10, padding: 10, marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--plan-fg)", margin: 0 }}>
                      {offer.title}
                    </p>
                    {offer.subtitle && (
                      <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", margin: "2px 0 0" }}>
                        {offer.subtitle}
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: "var(--plan-fg-muted)", margin: "2px 0 0" }}>
                      📅 {fmtDate(offer.startAt, lang)}
                      {offer.endAt && ` → ${fmtDate(offer.endAt, lang)}`}
                    </p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#1e40af", margin: 0, whiteSpace: "nowrap" }}>
                    {fmtMoney(offer.price, offer.currency)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => handlePick(offer, i)} disabled={savingId === `${i}`} style={pickBtnStyle}>
                    {savingId === `${i}` ? "…" : `✓ ${labels.pick}`}
                  </button>
                  <a href={offer.externalUrl} target="_blank" rel="noopener noreferrer" style={moreBtnStyle}>
                    🌐 {labels.viewMore}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10, flex: 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--plan-fg-subtle)", display: "block", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const rowStyle: React.CSSProperties = { display: "flex", gap: 8 };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  background: "var(--plan-bg)", border: "1px solid var(--plan-border-soft)",
  color: "var(--plan-fg)", fontSize: 14, outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: "11px", borderRadius: 10,
  background: "#1e40af", border: "1px solid #1e3a8a", color: "#fff",
  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

const pickBtnStyle: React.CSSProperties = {
  flex: 1, padding: "8px", borderRadius: 8,
  background: "#16a34a", border: "1px solid #15803d", color: "#fff",
  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

const moreBtnStyle: React.CSSProperties = {
  flex: 1, padding: "8px", borderRadius: 8,
  background: "var(--plan-surface-alt)", border: "1px solid var(--plan-border-soft)",
  color: "var(--plan-fg)",
  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center",
};
