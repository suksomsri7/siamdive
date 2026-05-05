"use client";

import {
  PLAN_TEMPLATES,
  templateCopy,
  templatePrimer,
  templateCtaHint,
  type PlanTemplate,
} from "@/lib/ark-ai/plan-templates";

// Sprint 3 B10 — three-card "starter pack" picker shown on first chat open
// when no slots are filled yet. Click → fires onPick with the chosen
// template; the chat panel handles slot pre-fill + analytics + sending the
// primer text as the user's first message.

type Props = {
  lang: string;
  onPick: (template: PlanTemplate) => void;
};

export default function TemplatePicker({ lang, onPick }: Props) {
  return (
    <div style={{ padding: "12px 0 6px", margin: "8px 0 6px" }}>
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 8,
        padding: "0 4px",
      }}>
        {templateCtaHint(lang)}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {PLAN_TEMPLATES.map(t => {
          const c = templateCopy(t, lang);
          return (
            <button
              key={t.id}
              onClick={() => onPick(t)}
              style={{
                background: "linear-gradient(180deg, #1a1a1a 0%, #111 100%)",
                border: "1px solid #2a2a2a",
                borderRadius: 10,
                padding: "10px 9px 11px",
                cursor: "pointer",
                color: "#e5e5e5",
                fontFamily: "inherit",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3a3a3a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2a2a2a";
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{t.emoji}</span>
              <p style={{ fontSize: 11.5, fontWeight: 800, color: "#f5f5f5", lineHeight: 1.25 }}>
                {c.title}
              </p>
              <p style={{ fontSize: 10, color: "#888", lineHeight: 1.35 }}>{c.tagline}</p>
              <p style={{ fontSize: 9.5, color: "#555", lineHeight: 1.4, marginTop: 2 }}>
                {c.whatYouGet}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
