"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";

// ── Menu structure (mirrors backoffice nav) ────────────────────────────────────
type LangCode = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";

type MenuItem = { icon: string; label: Record<LangCode, string>; href: string };
type MenuGroup = { group: Record<LangCode, string>; items: MenuItem[] };

const MENU_GROUPS: MenuGroup[] = [
  {
    group: { en: "Dive Trips", th: "ทริปดำน้ำ", cn: "潜水行程", ja: "ダイブトリップ", ko: "다이브 트립", de: "Tauchtrips", fr: "Excursions", ru: "Дайв-туры" },
    items: [
      { icon: "", label: { en: "Scuba Day Trips",  th: "Scuba Day Trips",  cn: "一日潜水",    ja: "スキューバデイトリップ", ko: "스쿠버 당일치기", de: "Scuba Tagestouren", fr: "Plongée à la journée", ru: "Дневные туры" }, href: "/trips/daytrip"    },
      { icon: "", label: { en: "Snorkeling",        th: "Snorkeling",       cn: "浮潜",        ja: "シュノーケリング",       ko: "스노클링",           de: "Schnorcheln",      fr: "Snorkeling",           ru: "Снорклинг"   }, href: "/trips/snorkeling" },
      { icon: "", label: { en: "Land Tour",          th: "Land Tour",        cn: "陆地游",      ja: "陸上ツアー",             ko: "육지 투어",           de: "Landausflug",      fr: "Excursion terrestre",  ru: "Наземный тур"}, href: "/trips/land-tour"  },
      { icon: "", label: { en: "Liveaboard",         th: "Liveaboard",       cn: "住船游",      ja: "リブアボード",           ko: "리브어보드",          de: "Liveaboard",       fr: "Liveaboard",           ru: "Живой борт"  }, href: "/trips/liveaboard" },
      { icon: "", label: { en: "Maldives Liveaboards",    th: "Liveaboards มัลดีฟส์",  cn: "马尔代夫住船游",   ja: "モルディブ リブアボード", ko: "몰디브 리브어보드",    de: "Malediven Liveaboards",  fr: "Liveaboards Maldives",      ru: "Ливборды Мальдивы"          }, href: "/trips/liveaboard-maldives"    },
      { icon: "", label: { en: "Red Sea Liveaboards",     th: "Liveaboards ทะเลแดง",  cn: "红海住船游",      ja: "紅海 リブアボード",     ko: "홍해 리브어보드",      de: "Rotes Meer Liveaboards", fr: "Liveaboards Mer Rouge",     ru: "Ливборды Красное море"      }, href: "/trips/liveaboard-red-sea"     },
      { icon: "", label: { en: "Indonesia Liveaboards",   th: "Liveaboards อินโดนีเซีย", cn: "印度尼西亚住船游", ja: "インドネシア リブアボード", ko: "인도네시아 리브어보드", de: "Indonesien Liveaboards", fr: "Liveaboards Indonésie",     ru: "Ливборды Индонезия"         }, href: "/trips/liveaboard-indonesia"   },
      { icon: "", label: { en: "Palau Liveaboards",       th: "Liveaboards ปาเลา",    cn: "帕劳住船游",      ja: "パラオ リブアボード",   ko: "팔라우 리브어보드",    de: "Palau Liveaboards",      fr: "Liveaboards Palaos",        ru: "Ливборды Палау"             }, href: "/trips/liveaboard-palau"       },
      { icon: "", label: { en: "Philippines Liveaboards", th: "Liveaboards ฟิลิปปินส์", cn: "菲律宾住船游",    ja: "フィリピン リブアボード", ko: "필리핀 리브어보드",    de: "Philippinen Liveaboards",fr: "Liveaboards Philippines",   ru: "Ливборды Филиппины"         }, href: "/trips/liveaboard-philippines" },
      { icon: "", label: { en: "Dive Resort",         th: "Dive Resort",      cn: "潜水度假村",  ja: "ダイブリゾート",         ko: "다이브 리조트",        de: "Dive Resort",      fr: "Resort de plongée",    ru: "Дайв-курорт" }, href: "/trips/dive-resort"},
      { icon: "", label: { en: "Freedive Trips",     th: "Freedive Trips",   cn: "自由潜水行程",ja: "フリーダイブトリップ",   ko: "프리다이빙 트립",      de: "Freitauch-Trips",  fr: "Apnée en voyage",      ru: "Фридайвинг"  }, href: "/trips/freedive"   },
    ],
  },
  {
    group: { en: "Courses", th: "คอร์สดำน้ำ", cn: "潜水课程", ja: "コース", ko: "강좌", de: "Kurse", fr: "Cours", ru: "Курсы" },
    items: [
      { icon: "", label: { en: "Scuba Courses",    th: "Scuba Courses",    cn: "水肺课程",   ja: "スキューバコース",   ko: "스쿠버 코스",    de: "Scuba-Kurse",     fr: "Cours de plongée",  ru: "Курсы дайвинга"   }, href: "/courses/scuba"    },
      { icon: "", label: { en: "Freedive Courses", th: "Freedive Courses", cn: "自由潜课程", ja: "フリーダイブコース", ko: "프리다이빙 코스", de: "Freitauch-Kurse", fr: "Cours d'apnée",     ru: "Курсы фридайвинга"}, href: "/courses/freedive" },
    ],
  },
  {
    group: { en: "Content", th: "คอนเทนต์", cn: "内容", ja: "コンテンツ", ko: "콘텐츠", de: "Inhalte", fr: "Contenu", ru: "Контент" },
    items: [
      { icon: "", label: { en: "Blog", th: "บทความ", cn: "博客", ja: "ブログ", ko: "블로그", de: "Blog", fr: "Blog", ru: "Блог" }, href: "/blogs" },
    ],
  },
];

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
  const current = LANGS.find(l => l.code === lang)!;
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
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [langOpen,       setLangOpen]       = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
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

  // lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

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

          {/* Right: lang dropdown + hamburger (all screen sizes) */}
          <div ref={langRef} style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
            <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5, width: 36 }}>
              <span style={{ display: "block", height: 2, background: "#fff", borderRadius: 1, transition: "transform 0.25s", transform: mobileOpen ? "rotate(45deg) translateY(7px)" : "none" }} />
              <span style={{ display: "block", height: 2, background: "#fff", borderRadius: 1, transition: "opacity 0.25s", opacity: mobileOpen ? 0 : 1 }} />
              <span style={{ display: "block", height: 2, background: "#fff", borderRadius: 1, transition: "transform 0.25s", transform: mobileOpen ? "rotate(-45deg) translateY(-7px)" : "none" }} />
            </button>
          </div>
        </nav>
      </header>

      {/* Fullscreen menu */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 49,
        background: "rgba(8,8,8,0.98)",
        backdropFilter: "blur(16px)",
        flexDirection: "column",
        transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflowY: "auto",
      }}>
        {/* top spacer for header */}
        <div style={{ height: 64, flexShrink: 0 }} />

        <div style={{ padding: "12px 20px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>

          {MENU_GROUPS.map(group => {
            const key = group.group.en;
            const isExpanded = mobileExpanded === key;
            const isSingle = group.items.length === 1;

            // Single item — render as direct link
            if (isSingle) {
              return (
                <Link key={key} href={`/${lang}${group.items[0].href}`} onClick={() => setMobileOpen(false)}
                  style={{ display: "block", padding: "14px 4px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#ccc", fontSize: 16, fontWeight: 600 }}>
                  {group.items[0].label[lang]}
                </Link>
              );
            }

            return (
              <div key={key}>
                {/* Group header (accordion toggle) */}
                <button
                  onClick={() => setMobileExpanded(isExpanded ? null : key)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 4px", borderBottom: `1px solid ${isExpanded ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)"}`, background: "none", border: "none", cursor: "pointer", color: isExpanded ? "#60a5fa" : "#ccc" }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{group.group[lang]}</span>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transition: "transform 0.25s", transform: isExpanded ? "rotate(180deg)" : "none", flexShrink: 0 }}>
                    <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Items (accordion body) */}
                <div style={{ overflow: "hidden", maxHeight: isExpanded ? group.items.length * 52 : 0, transition: "max-height 0.28s ease", background: "rgba(255,255,255,0.02)", borderRadius: "0 0 8px 8px" }}>
                  {group.items.map(item => (
                    <Link key={item.href} href={`/${lang}${item.href}`} onClick={() => setMobileOpen(false)}
                      style={{ display: "block", padding: "13px 16px", color: "#777", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      {item.label[lang]}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </>
  );
}
