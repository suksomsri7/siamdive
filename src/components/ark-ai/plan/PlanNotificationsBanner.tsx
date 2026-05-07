"use client";

import { useEffect, useState } from "react";
import {
  t,
  notifLowSeatsBody,
  notifReminderDaysTitle,
  notifReminderDaysBody,
} from "@/lib/ark-ai/i18n";

// Sprint 3 B5 — surface auto-improve cron findings as a small banner stack
// above the trip timeline. Each banner is dismissible (POST /dismiss). Read
// is unauthenticated so the public shared view also benefits.

type Notification = {
  id: string;
  type: "NEAR_FULL" | "NEW_BLOG" | "PRICE_DROP" | "DATE_REMINDER";
  title: string;
  body: string;
  payload?: Record<string, unknown> | null;
  scheduleId?: string | null;
  blogId?: string | null;
  createdAt: string;
};

const TYPE_ICON: Record<Notification["type"], string> = {
  NEAR_FULL: "⚠️",
  NEW_BLOG: "📰",
  PRICE_DROP: "🏷️",
  DATE_REMINDER: "⏰",
};

// Solid, high-contrast palette. The previous design used 10% alpha tints
// over the plan surface — that washed out on light mode and read as flat
// "rgb(244, 235, 235)" pastels even in dark mode. fix7 already moved the
// date-conflict warning to solid red; we extend the same approach here so
// every banner pops in both themes.
const TYPE_TONE: Record<Notification["type"], { bg: string; border: string; fg: string; subFg: string; linkFg: string }> = {
  NEAR_FULL: { bg: "#dc2626", border: "#991b1b", fg: "#ffffff", subFg: "#fee2e2", linkFg: "#fff" },
  NEW_BLOG: { bg: "#1d4ed8", border: "#1e3a8a", fg: "#ffffff", subFg: "#dbeafe", linkFg: "#fff" },
  PRICE_DROP: { bg: "#16a34a", border: "#14532d", fg: "#ffffff", subFg: "#dcfce7", linkFg: "#fff" },
  DATE_REMINDER: { bg: "#d97706", border: "#92400e", fg: "#ffffff", subFg: "#fef3c7", linkFg: "#fff" },
};

// Render localized title/body from notification type + payload. The cron
// stores Thai-only strings in the DB (legacy from before multilang); we
// override here so cn/ja/ko/de/fr/ru users see their language. We fall
// back to the DB strings whenever the type / payload combination doesn't
// have a known template (future types, missing fields).
function localizedTitle(n: Notification, lang: string): string {
  const p = (n.payload || {}) as Record<string, unknown>;
  if (n.type === "NEAR_FULL") {
    return p.status === "FULL" ? t(lang, "notifSoldOutTitle") : t(lang, "notifLowSeatsTitle");
  }
  if (n.type === "DATE_REMINDER") {
    const days = typeof p.daysOut === "number" ? p.daysOut : NaN;
    if (days === 1) return t(lang, "notifReminderTomorrowTitle");
    if (Number.isFinite(days)) return notifReminderDaysTitle(lang, days);
  }
  if (n.type === "NEW_BLOG") return t(lang, "notifNewBlogTitle");
  return n.title;
}

function localizedBody(n: Notification, lang: string): string {
  const p = (n.payload || {}) as Record<string, unknown>;
  if (n.type === "NEAR_FULL") {
    if (p.status === "FULL") return t(lang, "notifSoldOutBody");
    if (typeof p.seats === "number") return notifLowSeatsBody(lang, p.seats);
  }
  if (n.type === "DATE_REMINDER") {
    const days = typeof p.daysOut === "number" ? p.daysOut : NaN;
    if (days === 1) return t(lang, "notifReminderTomorrowBody");
    if (Number.isFinite(days)) return notifReminderDaysBody(lang, days);
  }
  // NEW_BLOG body is the actual blog title (in TH from cron) — we leave as
  // is so the user reads the real article name; clicking opens the lang
  // route which is fully localized.
  return n.body;
}

export default function PlanNotificationsBanner({
  planId,
  lang,
}: {
  planId: string;
  lang: string;
}) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/plans/${encodeURIComponent(planId)}/notifications`)
      .then(r => r.ok ? r.json() : { notifications: [] })
      .then(d => { if (alive) { setItems(d.notifications || []); setLoaded(true); } })
      .catch(() => alive && setLoaded(true));
    return () => { alive = false; };
  }, [planId]);

  const dismiss = async (id: string) => {
    setItems(curr => curr.filter(n => n.id !== id));
    fetch(`/api/plans/notifications/${encodeURIComponent(id)}/dismiss`, { method: "POST" })
      .catch(() => {});
  };

  if (!loaded || items.length === 0) return null;

  const L = (key: Parameters<typeof t>[1]) => t(lang, key);

  return (
    <div style={{ padding: "0 16px", marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(n => {
        const tone = TYPE_TONE[n.type];
        const icon = TYPE_ICON[n.type];
        const title = localizedTitle(n, lang);
        const body = localizedBody(n, lang);
        const link = n.type === "NEW_BLOG" && n.payload && typeof (n.payload as { slug?: string }).slug === "string"
          ? `/${lang}/blog/${(n.payload as { slug: string }).slug}`
          : null;
        return (
          <div
            key={n.id}
            style={{
              display: "flex",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 10,
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              alignItems: "flex-start",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: tone.fg, lineHeight: 1.4, margin: 0 }}>
                {title}
              </p>
              <p style={{ fontSize: 12, color: tone.subFg, marginTop: 3, lineHeight: 1.5, margin: "3px 0 0" }}>
                {body}
              </p>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: tone.linkFg, marginTop: 6, display: "inline-block", textDecoration: "underline", fontWeight: 700 }}
                >
                  {L("readArticle")}
                </a>
              )}
            </div>
            <button
              onClick={() => dismiss(n.id)}
              aria-label={L("dismiss")}
              style={{
                background: "rgba(0,0,0,0.18)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: tone.fg,
                cursor: "pointer",
                padding: "2px 8px",
                fontSize: 14,
                lineHeight: 1,
                flexShrink: 0,
                borderRadius: 6,
                fontWeight: 700,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
