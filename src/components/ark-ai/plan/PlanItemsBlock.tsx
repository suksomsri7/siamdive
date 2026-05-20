"use client";

import { useState, useEffect, useCallback } from "react";

export type PlanItem = {
  id: string;
  type: "FLIGHT" | "HOTEL" | "BOAT" | "ACTIVITY" | "TRANSFER" | "NOTE";
  title: string;
  location: string | null;
  startAt: string;
  endAt: string | null;
  externalUrl: string | null;
  bookingRef: string | null;
  cost: number | null;
  currency: string | null;
  source: string;
  notes: string | null;
  order: number;
};

const TYPE_ICON: Record<string, string> = {
  FLIGHT: "✈️",
  HOTEL: "🏨",
  ACTIVITY: "🎯",
  TRANSFER: "🚗",
  NOTE: "📝",
};

const LOCALE_MAP: Record<string, string> = {
  th: "th-TH", en: "en-US", cn: "zh-CN", de: "de-DE", fr: "fr-FR", ru: "ru-RU", ko: "ko-KR", ja: "ja-JP",
};

const LABELS = {
  th: {
    title: "เที่ยวบินและที่พัก",
    subtitle: "เพิ่มข้อมูลเที่ยวบิน/โรงแรมเพื่อให้แผนสมบูรณ์",
    flightOut: "เที่ยวบินไป",
    flightReturn: "เที่ยวบินกลับ",
    hotel: "ที่พัก",
    askAi: "ขอคำแนะนำจาก AI",
    askAiSoon: "ขอคำแนะนำ",
    enterManually: "กรอกเอง",
    notNeeded: "ไม่ต้องการ",
    remove: "ลบ",
    edit: "แก้ไข",
    bookingRef: "เลขที่จอง",
    confirmRemove: "ลบรายการนี้ใช่ไหม?",
  },
  en: {
    title: "Flights & Hotels",
    subtitle: "Add flight and hotel info to complete your trip",
    flightOut: "Outbound flight",
    flightReturn: "Return flight",
    hotel: "Hotel",
    askAi: "Ask AI for suggestions",
    askAiSoon: "Ask AI",
    enterManually: "Enter manually",
    notNeeded: "Not needed",
    remove: "Remove",
    edit: "Edit",
    bookingRef: "Booking ref",
    confirmRemove: "Remove this item?",
  },
} as const;

function L(lang: string) {
  return (LABELS as Record<string, typeof LABELS.en>)[lang] || LABELS.en;
}

function fmtDateTime(iso: string, lang: string) {
  return new Date(iso).toLocaleString(LOCALE_MAP[lang] || "en-US", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function fmtMoney(amount: number, currency: string | null) {
  const cur = currency || "THB";
  if (cur === "THB") return `฿${amount.toLocaleString()}`;
  return `${amount.toLocaleString()} ${cur}`;
}

type Props = {
  planId: string;
  lang: string;
  canEdit: boolean;
  onAddManual: (type: "FLIGHT" | "HOTEL") => void;
  onAskAi: (type: "FLIGHT" | "HOTEL") => void;
  onEdit: (item: PlanItem) => void;
  refreshSignal?: number;
};

export default function PlanItemsBlock({ planId, lang, canEdit, onAddManual, onAskAi, onEdit, refreshSignal }: Props) {
  const labels = L(lang);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans/${planId}/items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {}
    setLoading(false);
  }, [planId]);

  useEffect(() => { load(); }, [load, refreshSignal]);

  const flights = items.filter((i) => i.type === "FLIGHT");
  const hotels = items.filter((i) => i.type === "HOTEL");

  const handleRemove = async (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(labels.confirmRemove)) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/plans/${planId}/items/${id}`, { method: "DELETE" });
    } catch {}
  };

  const hideSlot = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {flights.map((f) => (
          <ItemCard key={f.id} item={f} lang={lang} labels={labels} canEdit={canEdit}
            onEdit={() => onEdit(f)} onRemove={() => handleRemove(f.id)} />
        ))}
        {hotels.map((h) => (
          <ItemCard key={h.id} item={h} lang={lang} labels={labels} canEdit={canEdit}
            onEdit={() => onEdit(h)} onRemove={() => handleRemove(h.id)} />
        ))}

        {!loading && canEdit && !hidden.has("flight") && flights.length === 0 && (
          <EmptySlot
            icon="✈️" label={labels.flightOut} labels={labels}
            onAi={() => onAskAi("FLIGHT")}
            onManual={() => onAddManual("FLIGHT")}
            onSkip={() => hideSlot("flight")}
          />
        )}
        {!loading && canEdit && !hidden.has("hotel") && hotels.length === 0 && (
          <EmptySlot
            icon="🏨" label={labels.hotel} labels={labels}
            onAi={() => onAskAi("HOTEL")}
            onManual={() => onAddManual("HOTEL")}
            onSkip={() => hideSlot("hotel")}
          />
        )}
      </div>
    </div>
  );
}

function ItemCard({ item, lang, labels, canEdit, onEdit, onRemove }: {
  item: PlanItem; lang: string; labels: ReturnType<typeof L>; canEdit: boolean;
  onEdit: () => void; onRemove: () => void;
}) {
  const icon = TYPE_ICON[item.type] || "📍";
  return (
    <div style={{
      background: "var(--plan-surface)", border: "1px solid var(--plan-border-soft)",
      borderRadius: 10, padding: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--plan-fg)", margin: 0 }}>
            {item.title}
          </p>
          <p style={{ fontSize: 12, color: "var(--plan-fg-subtle)", margin: "2px 0 0" }}>
            {fmtDateTime(item.startAt, lang)}
            {item.endAt && ` → ${fmtDateTime(item.endAt, lang)}`}
          </p>
          {item.location && (
            <p style={{ fontSize: 12, color: "var(--plan-fg-muted)", margin: "2px 0 0" }}>
              📍 {item.location}
            </p>
          )}
          {item.cost != null && (
            <p style={{ fontSize: 12, color: "var(--plan-fg-muted)", margin: "2px 0 0", fontWeight: 600 }}>
              {fmtMoney(item.cost, item.currency)}
            </p>
          )}
          {item.bookingRef && (
            <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", margin: "2px 0 0" }}>
              {labels.bookingRef}: {item.bookingRef}
            </p>
          )}
          {item.notes && (
            <p style={{ fontSize: 12, color: "var(--plan-fg-muted)", margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
              {item.notes}
            </p>
          )}
        </div>
        {canEdit && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <button onClick={onEdit} aria-label={labels.edit} style={iconBtnStyle}>✏️</button>
            <button onClick={onRemove} aria-label={labels.remove} style={iconBtnStyle}>🗑</button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptySlot({ icon, label, labels, onAi, onManual, onSkip }: {
  icon: string; label: string; labels: ReturnType<typeof L>;
  onAi: () => void; onManual: () => void; onSkip: () => void;
}) {
  return (
    <div style={{
      background: "var(--plan-surface-alt)", border: "1px dashed var(--plan-border-soft)",
      borderRadius: 10, padding: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--plan-fg)" }}>{label}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <button onClick={onAi} style={ctaPrimaryStyle}>
          ✨ {labels.askAi}
        </button>
        <button onClick={onManual} style={ctaSecondaryStyle({ disabled: false })}>
          + {labels.enterManually}
        </button>
        <button onClick={onSkip} style={ctaGhostStyle}>
          ✕ {labels.notNeeded}
        </button>
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 6,
  border: "1px solid var(--plan-border-soft)", background: "var(--plan-surface-alt)",
  cursor: "pointer", fontSize: 13, color: "var(--plan-fg-muted)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const ctaPrimaryStyle: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 8,
  background: "#1e40af", border: "1px solid #1e3a8a", color: "#fff",
  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

function ctaSecondaryStyle({ disabled }: { disabled?: boolean }): React.CSSProperties {
  return {
    padding: "8px 12px", borderRadius: 8,
    background: "var(--plan-surface)", border: "1px solid var(--plan-border-soft)",
    color: disabled ? "var(--plan-fg-subtle)" : "var(--plan-fg)",
    fontSize: 12, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
    opacity: disabled ? 0.7 : 1,
  };
}

const ctaGhostStyle: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 8,
  background: "transparent", border: "1px solid var(--plan-border-soft)",
  color: "var(--plan-fg-muted)",
  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
