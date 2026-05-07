"use client";

import { usePlanTheme } from "@/lib/plan-theme";

// Sun/moon switch — reads + writes the global plan theme via usePlanTheme.
// Used in both MyPlanScreen "My Plans" header and PlanDetail header.
export default function ThemeToggle() {
  const { mode, toggle } = usePlanTheme();
  const isLight = mode === "light";
  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Light mode" : "Dark mode"}
      style={{
        position: "relative",
        width: 50, height: 26, borderRadius: 999,
        background: isLight ? "#e5e7eb" : "#1f2937",
        border: `1px solid ${isLight ? "#d1d5db" : "#374151"}`,
        cursor: "pointer", padding: 0,
        transition: "background 0.2s, border-color 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: isLight ? 26 : 2,
          width: 20, height: 20, borderRadius: "50%",
          background: isLight ? "#fff" : "#0a0a0a",
          boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.18)" : "0 1px 3px rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "left 0.2s ease, background 0.2s",
        }}
      >
        {isLight ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" /><line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
            <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" /><line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </span>
    </button>
  );
}
