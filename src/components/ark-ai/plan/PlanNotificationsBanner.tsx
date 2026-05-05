"use client";

import { useEffect, useState } from "react";

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

const TYPE_TONE: Record<Notification["type"], { bg: string; border: string; fg: string }> = {
  NEAR_FULL: { bg: "rgba(239,68,68,0.10)", border: "#7f1d1d", fg: "#fecaca" },
  NEW_BLOG: { bg: "rgba(96,165,250,0.10)", border: "#1e3a8a", fg: "#bfdbfe" },
  PRICE_DROP: { bg: "rgba(34,197,94,0.10)", border: "#14532d", fg: "#bbf7d0" },
  DATE_REMINDER: { bg: "rgba(250,204,21,0.10)", border: "#713f12", fg: "#fef08a" },
};

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

  const isTh = lang === "th";

  return (
    <div style={{ padding: "0 16px", marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(n => {
        const tone = TYPE_TONE[n.type];
        const icon = TYPE_ICON[n.type];
        const link = n.type === "NEW_BLOG" && n.payload && typeof (n.payload as { slug?: string }).slug === "string"
          ? `/${lang}/blog/${(n.payload as { slug: string }).slug}`
          : null;
        return (
          <div
            key={n.id}
            style={{
              display: "flex",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              alignItems: "flex-start",
            }}
          >
            <div style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: tone.fg, lineHeight: 1.4 }}>
                {n.title}
              </p>
              <p style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2, lineHeight: 1.5 }}>
                {n.body}
              </p>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#60a5fa", marginTop: 4, display: "inline-block", textDecoration: "underline" }}
                >
                  {isTh ? "อ่านบทความ →" : "Read article →"}
                </a>
              )}
            </div>
            <button
              onClick={() => dismiss(n.id)}
              aria-label={isTh ? "ปิด" : "Dismiss"}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                padding: 2,
                fontSize: 16,
                lineHeight: 1,
                flexShrink: 0,
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
