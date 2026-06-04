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
  cn: {
    titleFlight: "搜索航班",
    titleHotel: "搜索住宿",
    from: "出发地（IATA 如 BKK）",
    to: "目的地（IATA 如 HKT）",
    cityName: "城市 / 地区",
    date: "出发日期",
    returnDate: "返程日期（选填）",
    checkin: "入住",
    checkout: "退房",
    adults: "成人",
    search: "搜索",
    searching: "搜索中…",
    pick: "选择",
    viewMore: "查看更多",
    cancel: "取消",
    noResults: "未找到结果 — 请尝试其他日期或航线/城市",
    rateLimit: "已超过今日搜索次数（10/天）— 请明天再试",
    errorGeneric: "搜索失败，请重试",
    rememberDisclaimer: "价格/选项来自合作伙伴 API — 点击\"查看更多\"进行实际预订",
  },
  ja: {
    titleFlight: "フライトを検索",
    titleHotel: "宿泊を検索",
    from: "出発地（IATA 例 BKK）",
    to: "到着地（IATA 例 HKT）",
    cityName: "都市 / エリア",
    date: "出発日",
    returnDate: "帰着日（任意）",
    checkin: "チェックイン",
    checkout: "チェックアウト",
    adults: "大人",
    search: "検索",
    searching: "検索中…",
    pick: "選択",
    viewMore: "もっと見る",
    cancel: "キャンセル",
    noResults: "結果が見つかりません — 別の日付や路線・都市をお試しください",
    rateLimit: "本日の検索回数を超えました（10/日）— 明日お試しください",
    errorGeneric: "検索に失敗しました。もう一度お試しください",
    rememberDisclaimer: "価格・内容はパートナーAPIによるものです —「もっと見る」をクリックして実際に予約してください",
  },
  ko: {
    titleFlight: "항공편 검색",
    titleHotel: "숙소 검색",
    from: "출발지 (IATA 예: BKK)",
    to: "도착지 (IATA 예: HKT)",
    cityName: "도시 / 지역",
    date: "출발일",
    returnDate: "귀국일 (선택)",
    checkin: "체크인",
    checkout: "체크아웃",
    adults: "성인",
    search: "검색",
    searching: "검색 중…",
    pick: "선택",
    viewMore: "더 보기",
    cancel: "취소",
    noResults: "결과 없음 — 다른 날짜나 노선/도시를 시도해 보세요",
    rateLimit: "오늘 검색 횟수를 초과했습니다 (10/일) — 내일 다시 시도하세요",
    errorGeneric: "검색에 실패했습니다. 다시 시도하세요",
    rememberDisclaimer: "가격/옵션은 파트너 API 제공 — 실제 예약은 \"더 보기\"를 클릭하세요",
  },
  de: {
    titleFlight: "Flüge suchen",
    titleHotel: "Unterkünfte suchen",
    from: "Von (IATA z. B. BKK)",
    to: "Nach (IATA z. B. HKT)",
    cityName: "Stadt / Gebiet",
    date: "Abflugdatum",
    returnDate: "Rückflugdatum (optional)",
    checkin: "Check-in",
    checkout: "Check-out",
    adults: "Erwachsene",
    search: "Suchen",
    searching: "Suche läuft…",
    pick: "Auswählen",
    viewMore: "Mehr ansehen",
    cancel: "Abbrechen",
    noResults: "Keine Ergebnisse — andere Daten oder Route/Stadt versuchen",
    rateLimit: "Tägliches Suchlimit erreicht (10/Tag) — morgen erneut versuchen",
    errorGeneric: "Suche fehlgeschlagen — bitte erneut versuchen",
    rememberDisclaimer: "Preise/Optionen von Partner-API — auf \"Mehr ansehen\" klicken, um tatsächlich zu buchen",
  },
  fr: {
    titleFlight: "Rechercher des vols",
    titleHotel: "Rechercher un hébergement",
    from: "De (IATA ex. BKK)",
    to: "À (IATA ex. HKT)",
    cityName: "Ville / zone",
    date: "Date de départ",
    returnDate: "Date de retour (facultatif)",
    checkin: "Arrivée",
    checkout: "Départ",
    adults: "Adultes",
    search: "Rechercher",
    searching: "Recherche…",
    pick: "Choisir",
    viewMore: "Voir plus",
    cancel: "Annuler",
    noResults: "Aucun résultat — essayez d'autres dates ou un autre trajet/ville",
    rateLimit: "Limite de recherches du jour atteinte (10/jour) — réessayez demain",
    errorGeneric: "Échec de la recherche — veuillez réessayer",
    rememberDisclaimer: "Prix/options issus de l'API partenaire — cliquez sur \"Voir plus\" pour réserver réellement",
  },
  ru: {
    titleFlight: "Поиск рейсов",
    titleHotel: "Поиск проживания",
    from: "Откуда (IATA напр. BKK)",
    to: "Куда (IATA напр. HKT)",
    cityName: "Город / район",
    date: "Дата вылета",
    returnDate: "Дата возврата (необязательно)",
    checkin: "Заезд",
    checkout: "Выезд",
    adults: "Взрослые",
    search: "Найти",
    searching: "Поиск…",
    pick: "Выбрать",
    viewMore: "Подробнее",
    cancel: "Отмена",
    noResults: "Ничего не найдено — попробуйте другие даты или маршрут/город",
    rateLimit: "Достигнут дневной лимит поиска (10/день) — попробуйте завтра",
    errorGeneric: "Поиск не удался — попробуйте ещё раз",
    rememberDisclaimer: "Цены/варианты из API партнёра — нажмите \"Подробнее\", чтобы оформить бронь",
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

const LOCALE_MAP: Record<string, string> = {
  th: "th-TH", en: "en-US", cn: "zh-CN", ja: "ja-JP",
  ko: "ko-KR", de: "de-DE", fr: "fr-FR", ru: "ru-RU",
};

function fmtDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] || "en-US", {
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

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type Props = {
  planId: string;
  deviceId: string;
  lang: string;
  type: "FLIGHT" | "HOTEL";
  /** Earliest trip departure (yyyy-mm-dd) — prefills the start date. */
  tripStartDate?: string;
  /** Latest trip return (yyyy-mm-dd) — prefills hotel checkout. */
  tripEndDate?: string;
  onClose: () => void;
  onPicked: () => void;
};

export default function SearchResultModal({ planId, deviceId, lang, type, tripStartDate, tripEndDate, onClose, onPicked }: Props) {
  const labels = L(lang);
  const [from, setFrom] = useState("BKK");
  const [to, setTo] = useState("HKT");
  const [cityName, setCityName] = useState("Phuket");
  // Prefer the selected trip's dates so the search starts from the actual
  // trip window; fall back to tomorrow / +3 days when the plan has no dated
  // trips yet.
  const [date, setDate] = useState(tripStartDate || tomorrowISO());
  const [returnDate, setReturnDate] = useState("");
  const [checkin, setCheckin] = useState(tripStartDate || tomorrowISO());
  const [checkout, setCheckout] = useState(
    tripEndDate || (tripStartDate ? addDaysISO(tripStartDate, 3) : plusDaysISO(3)),
  );
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
        ? { deviceId, type: "FLIGHT", from: from.toUpperCase(), to: to.toUpperCase(), date, returnDate: returnDate || undefined, adults }
        : { deviceId, type: "HOTEL", cityName, countryCode: "TH", checkin, checkout, adults };
      const res = await fetch(`/api/plans/${planId}/items/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 429) {
        setError(labels.rateLimit);
      } else if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[SearchResultModal] search failed", res.status, detail);
        setError(labels.errorGeneric);
      } else {
        const data = await res.json();
        setOffers(data.offers || []);
        if ((data.offers || []).length === 0) setError(labels.noResults);
      }
    } catch (err) {
      console.error("[SearchResultModal] search error", err);
      setError(labels.errorGeneric);
    }
    setLoading(false);
  };

  const handlePick = async (offer: SearchOffer, idx: number) => {
    setSavingId(`${idx}`);
    try {
      const payload = {
        deviceId,
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
