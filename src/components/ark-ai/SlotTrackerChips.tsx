"use client";

// Phase 2 — Slot tracker strip rendered above the chat scroll area. Reflects
// what the AI has extracted via update_slots so far; ghost-chips show the
// required-3 (dates, headcount, region) that remain empty so the user knows
// what to mention next. CTA on the right enables when all required-3 are set.

import type { Slots, SlotField, Region, CertLevel, Style, Headcount, Dates, Budget } from "@/lib/ark-ai/slots";

const LABELS: Record<string, Record<SlotField | "build" | "tapToClear" | "missing", string>> = {
  th: {
    dates: "วันที่",
    headcount: "จำนวนคน",
    region: "ฝั่ง",
    certs: "ใบ cert",
    categories: "ประเภททริป",
    companions: "เพื่อนร่วมทาง",
    budget: "งบ",
    style: "สไตล์",
    interests: "สิ่งที่อยากเจอ",
    build: "สร้าง plan เลย",
    tapToClear: "แตะเพื่อล้าง",
    missing: "ยังไม่ระบุ",
  },
  en: {
    dates: "Dates",
    headcount: "Travelers",
    region: "Region",
    certs: "Cert",
    categories: "Trip type",
    companions: "Companions",
    budget: "Budget",
    style: "Style",
    interests: "Interests",
    build: "Build my plan",
    tapToClear: "Tap to clear",
    missing: "missing",
  },
  cn: {
    dates: "日期", headcount: "人数", region: "海域", certs: "证书", categories: "类型", companions: "同行者", budget: "预算", style: "风格", interests: "兴趣",
    build: "生成行程", tapToClear: "点击清除", missing: "未填",
  },
  ja: {
    dates: "日程", headcount: "人数", region: "エリア", certs: "資格", categories: "種別", companions: "同行者", budget: "予算", style: "スタイル", interests: "興味",
    build: "プランを作成", tapToClear: "タップで消去", missing: "未入力",
  },
  ko: {
    dates: "날짜", headcount: "인원", region: "지역", certs: "자격증", categories: "유형", companions: "동행자", budget: "예산", style: "스타일", interests: "관심사",
    build: "플랜 만들기", tapToClear: "탭하여 삭제", missing: "미입력",
  },
  de: {
    dates: "Datum", headcount: "Personen", region: "Region", certs: "Brevet", categories: "Trip-Typ", companions: "Begleiter", budget: "Budget", style: "Stil", interests: "Interessen",
    build: "Plan erstellen", tapToClear: "Zum Löschen tippen", missing: "fehlt",
  },
  fr: {
    dates: "Dates", headcount: "Voyageurs", region: "Région", certs: "Certif.", categories: "Type", companions: "Accomp.", budget: "Budget", style: "Style", interests: "Intérêts",
    build: "Créer mon plan", tapToClear: "Toucher pour effacer", missing: "manquant",
  },
  ru: {
    dates: "Даты", headcount: "Путешественники", region: "Регион", certs: "Серт.", categories: "Тип", companions: "Спутники", budget: "Бюджет", style: "Стиль", interests: "Интересы",
    build: "Создать план", tapToClear: "Нажмите чтобы очистить", missing: "не указано",
  },
};

const REGION_LABELS: Record<string, Record<Region, string>> = {
  th: { andaman: "อันดามัน", gulf: "อ่าวไทย", both: "ทั้งสองฝั่ง" },
  en: { andaman: "Andaman", gulf: "Gulf", both: "Either coast" },
  cn: { andaman: "安达曼海", gulf: "暹罗湾", both: "两岸" },
  ja: { andaman: "アンダマン", gulf: "タイ湾", both: "両海岸" },
  ko: { andaman: "안다만", gulf: "타이만", both: "양쪽" },
  de: { andaman: "Andamanensee", gulf: "Golf von Thailand", both: "Beide Küsten" },
  fr: { andaman: "Andaman", gulf: "Golfe de Thaïlande", both: "Les deux côtes" },
  ru: { andaman: "Андаманское", gulf: "Сиамский залив", both: "Оба побережья" },
};

const STYLE_LABELS: Record<string, Record<Style, string>> = {
  th: { relaxed: "ชิล", intense: "เข้มข้น", family: "ครอบครัว", photography: "ถ่ายรูป", training: "เรียน cert" },
  en: { relaxed: "Relaxed", intense: "Intense", family: "Family", photography: "Photography", training: "Training" },
  cn: { relaxed: "悠闲", intense: "紧凑", family: "家庭", photography: "摄影", training: "训练" },
  ja: { relaxed: "のんびり", intense: "ハード", family: "ファミリー", photography: "撮影", training: "資格取得" },
  ko: { relaxed: "여유", intense: "집중", family: "가족", photography: "촬영", training: "교육" },
  de: { relaxed: "Entspannt", intense: "Intensiv", family: "Familie", photography: "Fotografie", training: "Ausbildung" },
  fr: { relaxed: "Tranquille", intense: "Intense", family: "Famille", photography: "Photo", training: "Formation" },
  ru: { relaxed: "Спокойный", intense: "Интенсивный", family: "Семья", photography: "Фото", training: "Обучение" },
};

const REQUIRED: SlotField[] = ["dates", "headcount", "region"];

function formatDates(d: Dates, lang: string): string {
  if (d.label) return d.label;
  if (d.to && d.to !== d.from) return lang === "th" ? `${d.from} – ${d.to}` : `${d.from} → ${d.to}`;
  return d.from;
}

function formatHeadcount(h: Headcount, lang: string): string {
  if (lang === "th") return h.kids ? `${h.adults} ผู้ใหญ่ + ${h.kids} เด็ก` : `${h.adults} คน`;
  if (lang === "en") return h.kids ? `${h.adults} adults + ${h.kids} kids` : `${h.adults} ${h.adults === 1 ? "person" : "people"}`;
  return h.kids ? `${h.adults}+${h.kids}` : `${h.adults}`;
}

function formatBudget(b: Budget): string {
  const cur = b.currency || "THB";
  if (b.min != null && b.max != null) return `${b.min.toLocaleString()}–${b.max.toLocaleString()} ${cur}`;
  if (b.min != null) return `≥${b.min.toLocaleString()} ${cur}`;
  if (b.max != null) return `≤${b.max.toLocaleString()} ${cur}`;
  return cur;
}

function formatCerts(c: CertLevel[]): string {
  return c.map(x => x.toUpperCase()).join(" / ");
}

type ChipProps = {
  label: string;
  value?: string;
  ghost?: boolean;
  required?: boolean;
  onClear?: () => void;
  tapToClear: string;
  missing: string;
};

function Chip({ label, value, ghost, required, onClear, tapToClear, missing }: ChipProps) {
  const filled = !ghost && !!value;
  return (
    <button
      type="button"
      onClick={filled && onClear ? onClear : undefined}
      title={filled ? tapToClear : undefined}
      disabled={!filled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        border: filled ? "1px solid #1e40af" : "1px dashed #333",
        background: filled ? "rgba(30,64,175,0.15)" : "transparent",
        color: filled ? "#93c5fd" : required ? "#666" : "#444",
        cursor: filled && onClear ? "pointer" : "default",
        flexShrink: 0,
      }}
    >
      <span style={{ opacity: filled ? 1 : 0.7, fontWeight: 500 }}>{label}</span>
      <span style={{ opacity: filled ? 1 : 0.6 }}>
        {filled ? value : `· ${missing}`}
      </span>
      {filled && onClear && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      )}
    </button>
  );
}

export default function SlotTrackerChips({
  slots,
  complete,
  lang,
  onClear,
  onBuild,
}: {
  slots: Slots;
  complete: boolean;
  lang: string;
  onClear?: (field: SlotField) => void;
  onBuild?: () => void;
}) {
  const L = LABELS[lang] || LABELS.en;
  const RL = REGION_LABELS[lang] || REGION_LABELS.en;
  const SL = STYLE_LABELS[lang] || STYLE_LABELS.en;

  const renderRequired = (field: SlotField, value: string | undefined) => (
    <Chip
      key={field}
      label={L[field]}
      value={value}
      ghost={!value}
      required
      onClear={value ? () => onClear?.(field) : undefined}
      tapToClear={L.tapToClear}
      missing={L.missing}
    />
  );

  const optional: Array<[SlotField, string | undefined]> = [
    ["certs", slots.certs?.length ? formatCerts(slots.certs) : undefined],
    ["budget", slots.budget ? formatBudget(slots.budget) : undefined],
    ["style", slots.style ? SL[slots.style] : undefined],
    ["interests", slots.interests?.length ? slots.interests.slice(0, 2).join(", ") + (slots.interests.length > 2 ? ` +${slots.interests.length - 2}` : "") : undefined],
  ];

  const anyOptional = optional.some(([, v]) => v);
  const anySlot = !!slots.dates || !!slots.headcount || !!slots.region || anyOptional;

  if (!anySlot) {
    // Cold-start: show ghost required-3 only so the user sees what's needed.
    return (
      <div
        role="region"
        aria-label={lang === "th" ? "สรุปแผนทริปจากบทสนทนา" : "Trip planning summary"}
        style={{
          display: "flex", gap: 6, padding: "8px 16px",
          overflowX: "auto", overscrollBehavior: "contain",
          borderBottom: "1px solid #1a1a1a", flexShrink: 0,
          scrollbarWidth: "none",
        }}
      >
        {REQUIRED.map(f => renderRequired(f, undefined))}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={lang === "th" ? "สรุปแผนทริปจากบทสนทนา" : "Trip planning summary"}
      style={{
        display: "flex", gap: 6, padding: "8px 16px", alignItems: "center",
        overflowX: "auto", overscrollBehavior: "contain",
        borderBottom: "1px solid #1a1a1a", flexShrink: 0,
        scrollbarWidth: "none",
      }}
    >
      {renderRequired("dates", slots.dates ? formatDates(slots.dates, lang) : undefined)}
      {renderRequired("headcount", slots.headcount ? formatHeadcount(slots.headcount, lang) : undefined)}
      {renderRequired("region", slots.region ? RL[slots.region] : undefined)}
      {optional.map(([field, value]) =>
        value ? (
          <Chip
            key={field}
            label={L[field]}
            value={value}
            onClear={() => onClear?.(field)}
            tapToClear={L.tapToClear}
            missing={L.missing}
          />
        ) : null,
      )}
      {complete && onBuild && (
        <button
          type="button"
          onClick={onBuild}
          style={{
            marginLeft: "auto",
            padding: "6px 14px",
            borderRadius: 999,
            border: "none",
            background: "linear-gradient(135deg, #1e40af, #3b82f6)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(30,64,175,0.5)",
          }}
        >
          ✨ {L.build}
        </button>
      )}
    </div>
  );
}
