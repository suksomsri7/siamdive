"use client";

// Light/dark theme for the MyPlan surface — minimal clean white/black/gray
// in light mode, current dark palette in dark mode. Implemented as CSS
// variables on <html data-plan-theme="…"> so inline-styled components can
// opt in via `var(--plan-bg)` etc. without prop drilling.

import { useState, useEffect, useCallback } from "react";

export type PlanThemeMode = "light" | "dark";

const STORAGE_KEY = "siamdive-plan-theme";

function readStoredMode(): PlanThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {}
  return "dark";
}

function applyMode(mode: PlanThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.planTheme = mode;
}

export function usePlanTheme() {
  const [mode, setModeState] = useState<PlanThemeMode>("dark");

  useEffect(() => {
    const initial = readStoredMode();
    setModeState(initial);
    applyMode(initial);
  }, []);

  const setMode = useCallback((m: PlanThemeMode) => {
    setModeState(m);
    applyMode(m);
    try { window.localStorage.setItem(STORAGE_KEY, m); } catch {}
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: PlanThemeMode = prev === "dark" ? "light" : "dark";
      applyMode(next);
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  return { mode, toggle, setMode };
}
