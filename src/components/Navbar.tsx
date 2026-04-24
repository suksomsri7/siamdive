"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";

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
    // Persist choice in a cookie so proxy.ts prefers it over Accept-Language
    // for any future URL without a lang prefix (e.g. sitemap entry points).
    document.cookie = `NEXT_LOCALE=${newLang};path=/;max-age=31536000;samesite=lax`;
    // Replace /xx at the start of pathname with /newLang
    const newPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, `/${newLang}$1`);
    // replace (not push): switching language shouldn't add a back-button trap
    // where pressing Back returns the user to the previous language.
    router.replace(newPath);
    setLangOpen(false);
  };

  const [scrolled,       setScrolled]       = useState(false);
  const [langOpen,       setLangOpen]       = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // close lang dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const currentLang = LANGS.find(l => l.code === lang)!;


  return (
    <>
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

          {/* Right: lang dropdown */}
          <div ref={langRef} style={{ display: "flex", alignItems: "center" }}>
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

    </>
  );
}
