"use client";

// LangSwitch — small dropdown for changing the URL's lang prefix. Used in
// MyPlanScreen + PlanDetail headers so the user can switch language while
// inside the MyPlan drawer (which covers the main Navbar).

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

type LangCode = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";

const LANGS: { code: LangCode; label: string; flag: string; native: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧", native: "English"  },
  { code: "th", label: "TH", flag: "🇹🇭", native: "ภาษาไทย"   },
  { code: "cn", label: "CN", flag: "🇨🇳", native: "中文"      },
  { code: "ja", label: "JA", flag: "🇯🇵", native: "日本語"    },
  { code: "ko", label: "KO", flag: "🇰🇷", native: "한국어"    },
  { code: "de", label: "DE", flag: "🇩🇪", native: "Deutsch"  },
  { code: "fr", label: "FR", flag: "🇫🇷", native: "Français" },
  { code: "ru", label: "RU", flag: "🇷🇺", native: "Русский"  },
];

export default function LangSwitch() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const urlLang = params?.lang as string | undefined;
  const lang: LangCode = (LANGS.find(l => l.code === urlLang) ? urlLang : "en") as LangCode;

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fn = () => setOpen(false);
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const switchLang = (next: LangCode) => {
    if (next === lang) { setOpen(false); return; }
    try { document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`; } catch {}
    const newPath = (pathname || "/").replace(/^\/[a-z]{2}(\/|$)/, `/${next}$1`);
    router.replace(newPath);
    setOpen(false);
  };

  const current = LANGS.find(l => l.code === lang)!;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }} aria-label="Language"
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "var(--plan-surface-alt)",
          border: "1px solid var(--plan-border-soft)",
          borderRadius: 8, padding: "5px 9px", cursor: "pointer",
          fontFamily: "inherit",
        }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--plan-fg-muted)" }}>{current.label}</span>
        <svg width="8" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--plan-fg-subtle)" }}/>
        </svg>
      </button>
      {open && (
        <div onClick={(e) => e.stopPropagation()} style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "var(--plan-bg, #0d0d0d)",
          border: "1px solid var(--plan-border-soft)",
          borderRadius: 12, padding: 6, minWidth: 170,
          boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 200,
        }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => switchLang(l.code)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8,
                background: lang === l.code ? "rgba(59,130,246,0.15)" : "transparent",
                border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                fontFamily: "inherit",
              }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{l.flag}</span>
              <span style={{ fontSize: 13, color: lang === l.code ? "#60a5fa" : "var(--plan-fg-muted)", fontWeight: lang === l.code ? 700 : 400 }}>{l.native}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--plan-fg-subtle)", fontWeight: 700 }}>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
