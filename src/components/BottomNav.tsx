"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { planCount } from "@/lib/plan-store";

// v2-style bottom bar (matches www.siamdive.com): calendar (My Plan) + an
// Ark input pill + Send. The input/Send hand the visitor over to the v2 chat —
// v1 keeps serving content while the planner lives on www. Search stays
// available via the SearchFab.
type L = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";

const PLACEHOLDER: Record<L, string> = {
  en: "Message Ark…", th: "คุยกับ Ark…", cn: "和 Ark 聊聊…", ja: "Arkに相談…",
  ko: "Ark에게 문의…", de: "Ark fragen…", fr: "Parler à Ark…", ru: "Спросить Ark…",
};

const V2_CHAT = "https://www.siamdive.com/";

export default function BottomNav() {
  const pathname = usePathname();
  const rawLang = pathname?.split("/")[1] || "en";
  const lang: L = (["en", "th", "cn", "ja", "ko", "de", "fr", "ru"].includes(rawLang) ? rawLang : "en") as L;
  const [planBadge, setPlanBadge] = useState(0);

  useEffect(() => {
    setPlanBadge(planCount());
    const handler = () => setPlanBadge(planCount());
    window.addEventListener("myplan-change", handler);
    return () => window.removeEventListener("myplan-change", handler);
  }, []);
  useEffect(() => { setPlanBadge(planCount()); }, [pathname]);

  // version นี้ยังไม่ใช้แถบ Ark ล่างบนหน้า blog (list + view) — เจ้าของสั่งเอาออก 31 ส.ค. 2026
  // ([1]=lang · [2]=blogs ⇒ ครอบทั้ง /:lang/blogs และ /:lang/blogs/:slug · หน้าอื่นยังมีแถบปกติ)
  if (pathname?.split("/")[2] === "blogs") return null;

  return (
    <>
      <style>{`
        @keyframes bottomNavIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1099,
        display: "flex", justifyContent: "center",
        animation: "bottomNavIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <div style={{
          width: "100%", maxWidth: 480,
          display: "flex", alignItems: "center", gap: 8,
          background: "#0a0a0a",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "10px 12px",
          paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
        }}>
          {/* My Plan — calendar button, same as the v2 bar */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-myplan"))}
            aria-label="My Plan"
            style={{
              position: "relative", width: 40, height: 40, flexShrink: 0,
              borderRadius: "50%", border: "1px solid rgba(255,255,255,0.18)",
              background: "transparent", color: "rgba(255,255,255,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {planBadge > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                minWidth: 16, height: 16, borderRadius: 8,
                background: "#2563eb", color: "#fff", fontSize: 9, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
              }}>{planBadge}</span>
            )}
          </button>

          {/* Ark input pill → the v2 chat */}
          <a href={V2_CHAT} style={{
            flex: 1, display: "block", textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.18)", borderRadius: 18,
            background: "#141414", color: "rgba(255,255,255,0.4)",
            padding: "10px 16px", fontSize: 15, whiteSpace: "nowrap", overflow: "hidden",
          }}>
            {PLACEHOLDER[lang] ?? PLACEHOLDER.en}
          </a>

          <a href={V2_CHAT} style={{
            flexShrink: 0, borderRadius: 999, background: "#f5f5f5", color: "#0a0a0a",
            padding: "10px 16px", fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}>
            Send
          </a>
        </div>
      </nav>
    </>
  );
}
