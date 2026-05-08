"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { tripCount } from "@/lib/plan-store";

type L = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";

const NAV_T = {
  search: { en: "Search", th: "ค้นหา", cn: "搜索",   ja: "検索",   ko: "검색",     de: "Suchen", fr: "Recherche", ru: "Поиск" },
  myPlan: { en: "My Plan", th: "แผนของฉัน", cn: "我的行程", ja: "マイプラン", ko: "내 여정", de: "Mein Plan", fr: "Mon plan", ru: "Мой план" },
} as const;

export default function BottomNav() {
  const pathname = usePathname();
  const rawLang = pathname?.split("/")[1] || "en";
  const lang: L = (["en","th","cn","ja","ko","de","fr","ru"].includes(rawLang) ? rawLang : "en") as L;
  const [planBadge, setPlanBadge] = useState(0);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    setPlanBadge(tripCount());
    const handler = () => setPlanBadge(tripCount());
    window.addEventListener("myplan-change", handler);
    return () => window.removeEventListener("myplan-change", handler);
  }, []);

  const handleTap = (id: string, action: () => void) => {
    setActive(id);
    action();
    setTimeout(() => setActive(null), 300);
  };

  return (
    <>
      <style>{`
        @keyframes bottomNavIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes navPulse {
          0% { transform: scale(1); }
          50% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
      `}</style>
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1099,
        display: "flex", justifyContent: "center",
        animation: "bottomNavIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <div style={{
          width: "100%", maxWidth: 480,
          display: "flex", alignItems: "stretch",
          background: "linear-gradient(to top, rgba(8,8,8,0.98), rgba(13,13,13,0.95))",
          backdropFilter: "blur(20px) saturate(1.5)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          <NavItem
            id="search"
            label={NAV_T.search[lang] ?? NAV_T.search.en}
            active={active === "search"}
            onClick={() => handleTap("search", () => window.dispatchEvent(new CustomEvent("open-search")))}
            icon={
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button
              onClick={() => handleTap("ai", () => window.dispatchEvent(new CustomEvent("open-ark-ai")))}
              style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                border: "none",
                color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
                transform: "translateY(-12px)",
                animation: active === "ai" ? "navPulse 0.3s ease" : "none",
                transition: "box-shadow 0.2s",
                position: "relative",
              }}
            >
              <img src="/ai-mask.png" alt="AI" width={28} height={28} style={{ filter: "brightness(1.1)" }} />
            </button>
          </div>

          <NavItem
            id="plan"
            label={NAV_T.myPlan[lang] ?? NAV_T.myPlan.en}
            badge={planBadge}
            active={active === "plan"}
            onClick={() => handleTap("plan", () => window.dispatchEvent(new CustomEvent("open-myplan")))}
            icon={
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            }
          />
        </div>
      </nav>
    </>
  );
}

function NavItem({ id, label, icon, badge, active, onClick }: {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 3,
        padding: "10px 0 8px", border: "none", background: "transparent",
        color: "rgba(255,255,255,0.4)",
        cursor: "pointer", position: "relative",
        animation: active ? "navPulse 0.3s ease" : "none",
        transition: "color 0.15s",
      }}
    >
      <div style={{ position: "relative" }}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -10,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "#ef4444", color: "#fff",
            fontSize: 9, fontWeight: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
          }}>{badge}</span>
        )}
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.01em" }}>{label}</span>
    </button>
  );
}
