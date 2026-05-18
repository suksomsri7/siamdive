"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlanTrip } from "@/lib/plan-store";
import type { PlanItem } from "./PlanItemsBlock";

const LOCALE_MAP: Record<string, string> = {
  th: "th-TH", en: "en-US", cn: "zh-CN", de: "de-DE", fr: "fr-FR", ru: "ru-RU", ko: "ko-KR", ja: "ja-JP",
};

const TRIP_EMOJI: Record<string, string> = {
  DAYTRIP: "🤿", LIVEABOARD: "🚢", DIVE_RESORT: "🏨",
  FREEDIVE: "🫧", LAND_TOUR: "🏝", SNORKELING: "🐠",
};

const ITEM_EMOJI: Record<string, string> = {
  FLIGHT: "✈️", HOTEL: "🏨", ACTIVITY: "🎯", TRANSFER: "🚗", NOTE: "📝",
};

const LABELS = {
  th: { title: "แชร์แผนทริป", copy: "คัดลอก", copied: "คัดลอกแล้ว ✓", share: "แชร์", close: "ปิด", line: "ส่ง LINE", powered: "วางแผนกับ SiamDive" },
  en: { title: "Share itinerary", copy: "Copy", copied: "Copied ✓", share: "Share", close: "Close", line: "Send via LINE", powered: "Planned with SiamDive" },
} as const;

function L(lang: string) { return (LABELS as Record<string, typeof LABELS.en>)[lang] || LABELS.en; }

function fmtDayHeader(iso: string, lang: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(LOCALE_MAP[lang] || "en-US", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function fmtTime(iso: string, lang: string) {
  return new Date(iso).toLocaleTimeString(LOCALE_MAP[lang] || "en-US", { hour: "2-digit", minute: "2-digit" });
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

type Props = {
  planId: string;
  planName: string;
  trips: PlanTrip[];
  lang: string;
  onClose: () => void;
};

export default function ItineraryShareCard({ planId, planName, trips, lang, onClose }: Props) {
  const labels = L(lang);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/plans/${planId}/items`).then((r) => r.ok ? r.json() : { items: [] }).then((d) => setItems(d.items || [])).catch(() => {});
  }, [planId]);

  const text = useMemo(() => buildItineraryText({ planName, trips, items, lang, labels }), [planName, trips, items, lang, labels]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
      try { await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({ title: planName, text }); } catch {}
    } else {
      handleCopy();
    }
  };

  const handleLine = () => {
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") window.open(url, "_blank");
  };

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
          <p style={{ fontSize: 16, fontWeight: 800, color: "var(--plan-fg)", margin: 0 }}>{labels.title}</p>
          <button onClick={onClose} aria-label={labels.close} style={{ background: "none", border: "none", color: "var(--plan-fg-subtle)", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        <pre style={{
          background: "var(--plan-bg)", border: "1px solid var(--plan-border-soft)",
          borderRadius: 10, padding: 12,
          fontSize: 12, lineHeight: 1.6, color: "var(--plan-fg)",
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          maxHeight: "50vh", overflowY: "auto", margin: 0, fontFamily: "inherit",
        }}>{text}</pre>

        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button onClick={handleCopy} style={btnPrimaryStyle}>
            {copied ? labels.copied : `📋 ${labels.copy}`}
          </button>
          <button onClick={handleLine} style={btnSecondaryStyle}>
            💬 {labels.line}
          </button>
          <button onClick={handleShare} style={btnSecondaryStyle}>
            🔗 {labels.share}
          </button>
        </div>
      </div>
    </>
  );
}

function buildItineraryText({
  planName, trips, items, lang, labels,
}: {
  planName: string; trips: PlanTrip[]; items: PlanItem[]; lang: string; labels: ReturnType<typeof L>;
}): string {
  const lines: string[] = [];
  lines.push(`🌊 ${planName}`);
  lines.push("━━━━━━━━━━━━━━━━━━");

  // Group everything into days
  const byDay = new Map<string, string[]>();

  // Trips
  for (const trip of trips) {
    const dep = trip.schedule?.departureDate;
    if (!dep) continue;
    const ret = trip.schedule?.returnDate || dep;
    const start = new Date(dep);
    const end = new Date(ret);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const emoji = TRIP_EMOJI[trip.type as string] || "📍";
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      const dayLabel = days > 1 ? `${emoji} ${trip.title} (Day ${i + 1}/${days})` : `${emoji} ${trip.title}`;
      const list = byDay.get(k) || [];
      list.push(dayLabel);
      byDay.set(k, list);
    }
  }

  // Items (flight, hotel, etc)
  for (const it of items) {
    const k = dayKey(it.startAt);
    const emoji = ITEM_EMOJI[it.type] || "📍";
    const timeStr = fmtTime(it.startAt, lang);
    const endStr = it.endAt && dayKey(it.endAt) === k ? `-${fmtTime(it.endAt, lang)}` : "";
    const line = `${emoji} ${timeStr}${endStr}  ${it.title}${it.location ? ` · ${it.location}` : ""}`;
    const list = byDay.get(k) || [];
    list.push(line);
    byDay.set(k, list);
  }

  const sortedDays = Array.from(byDay.keys()).sort();
  for (const k of sortedDays) {
    lines.push("");
    lines.push(fmtDayHeader(k, lang));
    for (const entry of byDay.get(k)!) {
      lines.push(`  ${entry}`);
    }
  }

  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push(`✨ ${labels.powered}`);
  lines.push("https://siamdive.com");
  return lines.join("\n");
}

const btnPrimaryStyle: React.CSSProperties = {
  flex: 1, minWidth: 110, padding: "11px", borderRadius: 10,
  background: "#1e40af", border: "1px solid #1e3a8a", color: "#fff",
  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

const btnSecondaryStyle: React.CSSProperties = {
  flex: 1, minWidth: 110, padding: "11px", borderRadius: 10,
  background: "var(--plan-surface-alt)", border: "1px solid var(--plan-border-soft)",
  color: "var(--plan-fg)",
  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
