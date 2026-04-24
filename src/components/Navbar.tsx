"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import ArkAIButton from "./ark-ai/ArkAIButton";
import ArkAIChatPanel from "./ark-ai/ArkAIChatPanel";

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

const NUDGE_TEXT: Record<string, string> = {
  th: "ต้องการให้ช่วยหาทริปไหม?",
  en: "Need help finding a dive trip?",
  cn: "需要帮忙找潜水行程吗？",
  ja: "ダイビングトリップを探すお手伝いが必要ですか？",
  ko: "다이빙 여행을 찾는 데 도움이 필요하세요?",
  de: "Brauchen Sie Hilfe bei der Suche nach einem Tauchtrip?",
  fr: "Besoin d'aide pour trouver un voyage de plongée ?",
  ru: "Нужна помощь в поиске дайвинг-поездки?",
};


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
  const [langOpen,       setLangOpen]       = useState(false);
  const [arkOpen,        setArkOpen]        = useState(false);
  const [showNudge,      setShowNudge]      = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    const handler = () => { setArkOpen(true); setShowNudge(false); };
    window.addEventListener("open-ark-ai", handler);
    return () => window.removeEventListener("open-ark-ai", handler);
  }, []);

  useEffect(() => {
    const nudged = sessionStorage.getItem("ark-nudge-shown");
    if (nudged) return;

    nudgeTimerRef.current = setTimeout(() => {
      if (!arkOpen) {
        setShowNudge(true);
        sessionStorage.setItem("ark-nudge-shown", "1");
      }
    }, 30000);

    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    };
  }, [arkOpen]);

  useEffect(() => {
    if (arkOpen) {
      setShowNudge(false);
      if (nudgeTimerRef.current) { clearTimeout(nudgeTimerRef.current); nudgeTimerRef.current = null; }
    }
  }, [arkOpen]);

  const currentLang = LANGS.find(l => l.code === lang)!;


  return (
    <>
      <style>{`
        @keyframes nudgeFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled ? "rgba(13,13,13,0.97)" : "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
          transition: "background 0.4s, border-color 0.4s",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <nav style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link href={`/${lang}`} style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", flexShrink: 0, zIndex: 1 }}>
            <span style={{ color: "#fff" }}>SIAM</span>
            <span style={{ color: "#3b82f6" }}>DIVE</span>
          </Link>

          {/* Right: Ark AI + lang dropdown */}
          <div ref={langRef} style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <ArkAIButton onClick={() => { setArkOpen(true); setShowNudge(false); }} />

              {/* Nudge tooltip */}
              {showNudge && (
                <div
                  onClick={() => { setArkOpen(true); setShowNudge(false); }}
                  style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0,
                    background: "rgba(30,64,175,0.95)", border: "1px solid rgba(96,165,250,0.3)",
                    borderRadius: 10, padding: "8px 14px", whiteSpace: "nowrap",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    animation: "nudgeFadeIn 0.3s ease-out both",
                    cursor: "pointer", zIndex: 100,
                  }}
                >
                  <p style={{ fontSize: 12, color: "#e5e5e5", fontWeight: 600 }}>
                    {NUDGE_TEXT[lang] || NUDGE_TEXT.en}
                  </p>
                  <div style={{
                    position: "absolute", top: -5, right: 16,
                    width: 10, height: 10, background: "rgba(30,64,175,0.95)",
                    transform: "rotate(45deg)",
                    borderLeft: "1px solid rgba(96,165,250,0.3)",
                    borderTop: "1px solid rgba(96,165,250,0.3)",
                  }} />
                  <button
                    onClick={e => { e.stopPropagation(); setShowNudge(false); }}
                    style={{
                      position: "absolute", top: -6, left: -6,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "#333", border: "none", color: "#999",
                      fontSize: 9, cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    x
                  </button>
                </div>
              )}
            </div>

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
          </div>
        </nav>
      </header>

      <ArkAIChatPanel open={arkOpen} onClose={() => setArkOpen(false)} />
    </>
  );
}
