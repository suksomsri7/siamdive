"use client";

import { useEffect } from "react";

/**
 * Reads `?menu=search|ai|myplan` on first mount and dispatches the matching
 * `open-*` event so the existing panel listeners (BottomNav targets) take it
 * from there. Used by LINE OA rich-menu deep links — the rich-menu buttons
 * point at siamdive.com/{lang}?menu={target} so a tap from LINE opens the
 * intended panel without rebuilding any UI.
 *
 * Removes the param from the URL after dispatch so reload/back doesn't re-fire.
 */
export default function MenuDeepLink() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const menu = url.searchParams.get("menu");
    if (!menu) return;

    const evt: Record<string, string> = {
      search: "open-search",
      ai:     "open-ark-ai",
      myplan: "open-myplan",
    };
    const eventName = evt[menu];
    if (!eventName) return;

    const t = setTimeout(() => {
      window.dispatchEvent(new CustomEvent(eventName));
    }, 80);

    url.searchParams.delete("menu");
    url.searchParams.delete("ref");
    const cleaned = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "") + url.hash;
    window.history.replaceState({}, "", cleaned);

    return () => clearTimeout(t);
  }, []);

  return null;
}
