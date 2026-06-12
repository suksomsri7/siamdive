"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import ArkAIChatPanel from "./ark-ai/ArkAIChatPanel";
import MyPlanScreen from "./ark-ai/MyPlanScreen";
import { initPlanStore } from "@/lib/plan-store";

type LangCode = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";

const LANGS: { code: LangCode; label: string; flag: string; native: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧", native: "English"    },
  { code: "th", label: "TH", flag: "🇹🇭", native: "ภาษาไทย"    },
  { code: "cn", label: "CN", flag: "🇨🇳", native: "中文"        },
  { code: "ja", label: "JA", flag: "🇯🇵", native: "日本語"      },
  { code: "ko", label: "KO", flag: "🇰🇷", native: "한국어"      },
  { code: "de", label: "DE", flag: "🇩🇪", native: "Deutsch"    },
  { code: "fr", label: "FR", flag: "🇫🇷", native: "Français"   },
  { code: "ru", label: "RU", flag: "🇷🇺", native: "Русский"    },
];

// ── Language Dropdown ─────────────────────────────────────────────────────────
function LangDropdown({ lang, setLang, onClose }: { lang: LangCode; setLang: (c: LangCode) => void; onClose: () => void }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", right: 0,
      background: "rgba(13,13,13,0.98)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12, padding: "6px", minWidth: 160,
      boxShadow: "0 16px 40px rgba(0,0,0,0.6)", zIndex: 200,
    }}>
      {LANGS.map(l => (
        <button key={l.code} onClick={() => { setLang(l.code); onClose(); }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8, background: lang === l.code ? "rgba(59,130,246,0.15)" : "transparent",
            border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s",
          }}
          onMouseEnter={e => { if (lang !== l.code) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={e => { if (lang !== l.code) e.currentTarget.style.background = "transparent"; }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>{l.flag}</span>
          <span style={{ fontSize: 13, color: lang === l.code ? "#60a5fa" : "#999", fontWeight: lang === l.code ? 700 : 400 }}>{l.native}</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#444", fontWeight: 700 }}>{l.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const params   = useParams();
  const pathname = usePathname();
  const router   = useRouter();

  const urlLang = params.lang as string | undefined;
  const lang: LangCode = (LANGS.find(l => l.code === urlLang) ? urlLang : "en") as LangCode;

  const switchLang = (newLang: LangCode) => {
    document.cookie = `NEXT_LOCALE=${newLang};path=/;max-age=31536000;samesite=lax`;
    const newPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, `/${newLang}$1`);
    router.replace(newPath);
    setLangOpen(false);
  };

  const [scrolled,       setScrolled]       = useState(false);
  const [hidden,         setHidden]         = useState(false);
  const [langOpen,       setLangOpen]       = useState(false);
  const [arkOpen,        setArkOpen]        = useState(false);
  const [planOpen,       setPlanOpen]       = useState(false);
  const [planInitialId,  setPlanInitialId]  = useState<string | null>(null);
  const [planBuilding,   setPlanBuilding]   = useState(false);
  const [contactOpen,    setContactOpen]    = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);
  // Refs that mirror the open-dropdown states so the scroll handler can read
  // the latest value without re-attaching the listener on every state change.
  const langOpenRef = useRef(false);
  const contactOpenRef = useRef(false);
  useEffect(() => { langOpenRef.current = langOpen; }, [langOpen]);
  useEffect(() => { contactOpenRef.current = contactOpen; }, [contactOpen]);

  useEffect(() => { initPlanStore(); }, []);

  // Scroll-driven nav state:
  // - `scrolled` controls the glass background once past the hero band
  // - `hidden` slides the bar out of view when the user is scrolling down,
  //   and back in when they scroll up. We always reveal it near the top,
  //   and never hide while a dropdown is open (would orphan its popover).
  // The 6px direction-delta threshold absorbs the natural jitter from
  // momentum scrolling on iOS, preventing the bar from flickering.
  useEffect(() => {
    const onScroll = () => {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY);
        const delta = y - lastScrollY.current;
        setScrolled(y > 40);
        if (langOpenRef.current || contactOpenRef.current) {
          setHidden(false);
        } else if (y < 80) {
          setHidden(false);
        } else if (delta > 6) {
          setHidden(true);
        } else if (delta < -6) {
          setHidden(false);
        }
        lastScrollY.current = y;
        scrollTicking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) {
        setLangOpen(false);
        setContactOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    const handler = () => { setArkOpen(true); setPlanOpen(false); };
    window.addEventListener("open-ark-ai", handler);
    return () => window.removeEventListener("open-ark-ai", handler);
  }, []);

  // Cross-page nudge: pages that send the user home with the intent of
  // landing them in MyPlan (e.g. the join-plan flow) drop a flag in
  // sessionStorage. The value is the planId to open into — passing it
  // as `detail.planId` makes MyPlanScreen drill straight into PlanDetail
  // for that plan instead of showing the list. "1" remains a valid
  // legacy sentinel meaning "open the list".
  useEffect(() => {
    try {
      const flag = sessionStorage.getItem("siamdive:openMyPlanOnNext");
      if (!flag) return;
      sessionStorage.removeItem("siamdive:openMyPlanOnNext");
      const detail = flag === "1" ? {} : { planId: flag };
      // setTimeout 0 so MyPlanScreen finishes mounting before we ask it
      // to open. Without this it can miss the event in dev StrictMode.
      const t = window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("open-myplan", { detail }));
      }, 0);
      return () => clearTimeout(t);
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ planId?: string; building?: boolean }>).detail;
      setPlanInitialId(detail?.planId ?? null);
      setPlanBuilding(!!detail?.building);
      setPlanOpen(true);
      setArkOpen(false);
    };
    window.addEventListener("open-myplan", handler);
    // Build resolved (or failed) — clear the parent-level building flag
    // so MyPlanScreen falls back to its normal state instead of being
    // stuck in the progress overlay.
    const onResolved = () => setPlanBuilding(false);
    window.addEventListener("myplan-build-done", onResolved);
    window.addEventListener("myplan-build-error", onResolved);
    return () => {
      window.removeEventListener("open-myplan", handler);
      window.removeEventListener("myplan-build-done", onResolved);
      window.removeEventListener("myplan-build-error", onResolved);
    };
  }, []);

  const currentLang = LANGS.find(l => l.code === lang)!;


  return (
    <>
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled ? "rgba(13,13,13,0.97)" : "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
          transform: hidden ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1), background 0.4s, border-color 0.4s",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          willChange: "transform",
        }}
      >
        <nav style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo — same Ark AI mask icon used in the BottomNav center button. */}
          <Link href={`/${lang}`} aria-label="SIAMDIVE" style={{ display: "flex", alignItems: "center", flexShrink: 0, zIndex: 1 }}>
            <img src="/ai-mask.png" alt="SIAMDIVE" width={36} height={36} style={{ filter: "brightness(1.1)" }} />
          </Link>

          {/* Right: lang dropdown + chat icon */}
          <div ref={langRef} style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setLangOpen(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#ccc" }}>{currentLang.label}</span>
                <svg width="9" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: "transform 0.2s", transform: langOpen ? "rotate(180deg)" : "none" }}>
                  <path d="M1 1l4 4 4-4" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {langOpen && <LangDropdown lang={lang} setLang={switchLang} onClose={() => setLangOpen(false)} />}
            </div>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setContactOpen(v => !v)}
                aria-label="Menu"
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ccc", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              >
                {/* hamburger — same menu as v2 (www.siamdive.com) */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {contactOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: "rgba(13,13,13,0.98)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: 6, minWidth: 210,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6)", zIndex: 200,
                  animation: "dropIn 0.2s ease-out both",
                }}>
                  {/* page links — mirrors the v2 hamburger */}
                  {[
                    { label: lang === "th" ? "เกี่ยวกับเรา" : "About us", href: `/${lang}/about` },
                    { label: lang === "th" ? "นโยบายความเป็นส่วนตัว" : "Privacy policy", href: `/${lang}/privacy` },
                    { label: lang === "th" ? "ข้อกำหนดการใช้บริการ" : "Terms of service", href: `/${lang}/terms` },
                    { label: "Site map", href: "/sitemap.xml" },
                    { label: "Blog", href: `/${lang}/blogs` },
                  ].map(m => (
                    <a key={m.label} href={m.href}
                      onClick={() => setContactOpen(false)}
                      style={{ display: "block", padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, color: "#ddd", fontWeight: 500, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >{m.label}</a>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "6px 4px 2px", paddingTop: 8, paddingLeft: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#777", textTransform: "uppercase" }}>
                    {lang === "th" ? "ติดต่อ" : "Contact"}
                  </div>
                  {[
                    { label: "Line", href: "https://lin.ee/wayWuGH", icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ccc">
                        <path d="M12 2C6.48 2 2 5.82 2 10.44c0 4.16 3.69 7.64 8.67 8.3.34.08.8.22.91.5.1.27.07.68.03.94l-.15.9c-.05.25.13.5.39.5.09 0 .18-.03.27-.08.97-.53 5.22-3.07 7.12-5.27C22.02 13.77 22 12.15 22 10.44 22 5.82 17.52 2 12 2z"/>
                      </svg>
                    )},
                    { label: "WhatsApp", href: "https://wa.me/66983768135", icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ccc">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.25.7-1.48 1.35-2.03 1.39-.5.04-.96.23-3.24-.68-2.76-1.1-4.52-3.93-4.66-4.12-.13-.19-1.1-1.47-1.1-2.8 0-1.33.7-1.99.95-2.26.25-.27.54-.34.72-.34.18 0 .36 0 .52.01.17.01.39-.06.61.47.23.54.77 1.89.84 2.02.07.14.12.3.02.47-.09.18-.14.3-.27.46-.14.16-.29.35-.41.47-.14.14-.28.29-.12.56.16.27.71 1.18 1.53 1.91 1.05.94 1.94 1.23 2.22 1.37.27.14.43.12.59-.07.16-.19.69-.8.87-1.08.18-.27.36-.23.61-.14.25.1 1.58.74 1.85.88.27.14.46.2.52.31.07.11.07.66-.18 1.35z"/>
                      </svg>
                    )},
                    { label: "Messenger", href: "https://m.me/siamdive", icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ccc">
                        <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.15.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.1.55-.06.91.25 1.88.38 2.89.38 5.64 0 10-4.13 10-9.68S17.64 2 12 2zm5.89 7.43l-2.7 4.28c-.43.68-1.34.86-2.01.38l-2.14-1.61a.8.8 0 00-.96 0l-2.89 2.19c-.39.29-.89-.17-.64-.59l2.7-4.28c.43-.68 1.34-.86 2.01-.38l2.14 1.6a.8.8 0 00.96 0l2.89-2.19c.39-.29.89.17.64.6z"/>
                      </svg>
                    )},
                    { label: "WeChat", href: "https://siamdive.com/wechat", icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ccc">
                        <path d="M8.5 4C4.91 4 2 6.69 2 10c0 1.87 1.01 3.54 2.58 4.61L4 16.74l2.38-1.18c.66.2 1.37.31 2.12.31.24 0 .47-.01.7-.04A5.77 5.77 0 019 14c0-3.31 2.91-6 6.5-6 .53 0 1.04.05 1.53.15C16.14 5.75 12.6 4 8.5 4zM6.5 8a1 1 0 110 2 1 1 0 010-2zm4 0a1 1 0 110 2 1 1 0 010-2z"/>
                        <path d="M22 14c0-2.76-2.69-5-6-5s-6 2.24-6 5 2.69 5 6 5c.73 0 1.43-.1 2.07-.3l1.93 1.05-.42-1.57C21.13 16.99 22 15.58 22 14zm-8-1a.75.75 0 110 1.5.75.75 0 010-1.5zm4 0a.75.75 0 110 1.5.75.75 0 010-1.5z"/>
                      </svg>
                    )},
                    { label: "Kakao", href: "https://pf.kakao.com/_siamdive", icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ccc">
                        <path d="M12 3C7.03 3 3 6.14 3 10c0 2.49 1.66 4.68 4.14 5.93-.13.47-.82 3.02-.85 3.21 0 0-.02.14.07.19.09.06.2.02.2.02.27-.04 3.12-2.04 3.56-2.34.93.13 1.89.2 2.88.2 4.97 0 9-3.14 9-7s-4.03-7-9-7z"/>
                      </svg>
                    )},
                    { label: "Email", href: "mailto:admin@siamdive.com", icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>
                      </svg>
                    )},
                  ].map(c => (
                    <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
                      onClick={() => setContactOpen(false)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 12px", borderRadius: 8, textDecoration: "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ display: "flex", alignItems: "center" }}>{c.icon}</span>
                      <span style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{c.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      <ArkAIChatPanel open={arkOpen} onClose={() => setArkOpen(false)} />
      <MyPlanScreen open={planOpen} onClose={() => { setPlanOpen(false); setPlanInitialId(null); setPlanBuilding(false); }} lang={lang} initialPlanId={planInitialId} buildingPlan={planBuilding} />
    </>
  );
}
