import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SearchFab from "@/components/SearchFab";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import CurrencySelector from "@/components/CurrencySelector";
import { getUserCurrency } from "@/lib/userCurrency";
import { getConversionTable } from "@/lib/fx";

const VALID_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

const getSiteSeo = unstable_cache(
  (lang: string) => prisma.siteSeo.findUnique({ where: { lang } }),
  ["site-seo"],
  { revalidate: 300 },
);

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> }
): Promise<Metadata> {
  const { lang } = await params;
  const l = VALID_LANGS.includes(lang) ? lang : "en";
  const seo = await getSiteSeo(l);

  const title       = seo?.title       || "SIAMDIVE — ทริปดำน้ำในประเทศไทย";
  const description = seo?.description || "ทริปดำน้ำ Scuba Daytrip และ Liveaboard คัดสรรสถานที่ดีที่สุดในประเทศไทย";
  const ogTitle     = seo?.ogTitle     || title;
  const ogDesc      = seo?.ogDescription || description;
  const ogImage     = seo?.ogImage     || "";

  return {
    title,
    description,
    keywords: seo?.keywords ?? [],
    alternates: {
      languages: Object.fromEntries(
        VALID_LANGS.map(code => [code, `/${code}`])
      ),
    },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
      locale: l,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDesc,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

const FOOTER_T = {
  tagline: {
    en: "Scuba day trips and liveaboards — the best dive sites in Thailand.",
    th: "ทริปดำน้ำ Scuba ทั้ง Daytrip และ Liveaboard คัดสรรจุดดำน้ำที่ดีที่สุดในประเทศไทย",
    cn: "精选泰国最佳潜水点——一日潜水及住船游。",
    ja: "タイ最高のダイブサイトを厳選した、スキューバデイトリップとリブアボード。",
    ko: "태국 최고의 다이브 사이트를 엄선한 스쿠버 당일치기와 리브어보드.",
    de: "Scuba-Tagestouren und Liveaboards – die besten Tauchplätze Thailands.",
    fr: "Plongée à la journée et liveaboards – les meilleurs sites de plongée en Thaïlande.",
    ru: "Дайв-туры и живые борты — лучшие места для дайвинга в Таиланде.",
  },
  trips: {
    en: "Trips", th: "ทริป", cn: "行程", ja: "トリップ", ko: "트립", de: "Trips", fr: "Excursions", ru: "Туры",
  },
  coursesHead: {
    en: "Courses", th: "คอร์ส", cn: "课程", ja: "コース", ko: "코스", de: "Kurse", fr: "Cours", ru: "Курсы",
  },
  company: {
    en: "Company", th: "บริษัท", cn: "公司", ja: "会社情報", ko: "회사", de: "Unternehmen", fr: "Entreprise", ru: "Компания",
  },
  contact: {
    en: "Contact", th: "ติดต่อ", cn: "联系", ja: "お問い合わせ", ko: "연락처", de: "Kontakt", fr: "Contact", ru: "Контакт",
  },
  daytrip: {
    en: "Scuba Day Trips", th: "Scuba Day Trips", cn: "一日潜水", ja: "スキューバデイトリップ", ko: "스쿠버 당일치기", de: "Scuba Tagestouren", fr: "Plongée à la journée", ru: "Дневные туры",
  },
  snorkeling: {
    en: "Snorkeling", th: "ดำน้ำตื้น", cn: "浮潜", ja: "シュノーケリング", ko: "스노클링", de: "Schnorcheln", fr: "Snorkeling", ru: "Сноркелинг",
  },
  liveaboard: {
    en: "Liveaboard", th: "Liveaboard", cn: "住船游", ja: "リブアボード", ko: "리브어보드", de: "Liveaboard", fr: "Liveaboard", ru: "Живой борт",
  },
  diveResort: {
    en: "Dive Resort", th: "Dive Resort", cn: "潜水度假村", ja: "ダイブリゾート", ko: "다이브 리조트", de: "Tauchresort", fr: "Resort de plongée", ru: "Дайв-курорт",
  },
  freedive: {
    en: "Freedive", th: "ฟรีไดฟ์", cn: "自由潜水", ja: "フリーダイビング", ko: "프리다이빙", de: "Freediving", fr: "Apnée", ru: "Фридайвинг",
  },
  scubaCourses: {
    en: "Scuba Courses", th: "คอร์สดำน้ำ", cn: "水肺课程", ja: "スキューバコース", ko: "스쿠버 코스", de: "Scuba-Kurse", fr: "Cours de plongée", ru: "Курсы дайвинга",
  },
  freediveCourses: {
    en: "Freedive Courses", th: "คอร์สฟรีไดฟ์", cn: "自由潜课程", ja: "フリーダイビングコース", ko: "프리다이빙 코스", de: "Freediving-Kurse", fr: "Cours d'apnée", ru: "Курсы фридайвинга",
  },
  blog: {
    en: "Blog", th: "บทความ", cn: "博客", ja: "ブログ", ko: "블로그", de: "Blog", fr: "Blog", ru: "Блог",
  },
  about: {
    en: "About Us", th: "เกี่ยวกับเรา", cn: "关于我们", ja: "当社について", ko: "회사 소개", de: "Über uns", fr: "À propos", ru: "О нас",
  },
  privacy: {
    en: "Privacy Policy", th: "นโยบายความเป็นส่วนตัว", cn: "隐私政策", ja: "プライバシーポリシー", ko: "개인정보 처리방침", de: "Datenschutz", fr: "Confidentialité", ru: "Конфиденциальность",
  },
  terms: {
    en: "Terms of Service", th: "ข้อกำหนดการใช้บริการ", cn: "服务条款", ja: "利用規約", ko: "이용약관", de: "Nutzungsbedingungen", fr: "Conditions d'utilisation", ru: "Условия использования",
  },
  rights: {
    en: "© 2025 SIAMDIVE. All rights reserved.",
    th: "© 2025 SIAMDIVE. สงวนลิขสิทธิ์.",
    cn: "© 2025 SIAMDIVE. 版权所有。",
    ja: "© 2025 SIAMDIVE. 無断複写・転載を禁じます。",
    ko: "© 2025 SIAMDIVE. 판권 소유.",
    de: "© 2025 SIAMDIVE. Alle Rechte vorbehalten.",
    fr: "© 2025 SIAMDIVE. Tous droits réservés.",
    ru: "© 2025 SIAMDIVE. Все права защищены.",
  },
} as const;

type FooterLang = keyof typeof FOOTER_T.tagline;

export default async function FrontendLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const l = (VALID_LANGS.includes(lang) ? lang : "en") as FooterLang;
  const t = (key: keyof typeof FOOTER_T) => FOOTER_T[key][l] ?? FOOTER_T[key]["en"];

  const currency = await getUserCurrency();
  const table = await getConversionTable(currency);

  return (
    <CurrencyProvider
      currency={currency}
      factor={table?.factor ?? {}}
      date={table?.date ? table.date.toISOString().slice(0, 10) : null}
    >
      <Navbar />
      {children}
      <SearchFab />
      <BottomNav />
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 40px 80px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 32, marginBottom: 36 }}>
            <div style={{ minWidth: 200 }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 10, letterSpacing: "-0.02em" }}>
                <span style={{ color: "#fff" }}>SIAM</span><span style={{ color: "#3b82f6" }}>DIVE</span>
              </h3>
              <p style={{ color: "#555", fontSize: 13, maxWidth: 260, lineHeight: 1.6 }}>
                {t("tagline")}
              </p>
            </div>
            <div style={{ display: "flex", gap: 40, fontSize: 13, flexWrap: "wrap" }}>
              <div>
                <p style={{ color: "#888", fontWeight: 600, marginBottom: 12 }}>{t("trips")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, color: "#555" }}>
                  <Link href={`/${l}/trips/daytrip`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("daytrip")}</Link>
                  <Link href={`/${l}/trips/snorkeling`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("snorkeling")}</Link>
                  <Link href={`/${l}/trips/liveaboard`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("liveaboard")}</Link>
                  <Link href={`/${l}/trips/dive-resort`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("diveResort")}</Link>
                  <Link href={`/${l}/trips/freedive`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("freedive")}</Link>
                </div>
              </div>
              <div>
                <p style={{ color: "#888", fontWeight: 600, marginBottom: 12 }}>{t("coursesHead")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, color: "#555" }}>
                  <Link href={`/${l}/courses/scuba`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("scubaCourses")}</Link>
                  <Link href={`/${l}/courses/freedive`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("freediveCourses")}</Link>
                  <Link href={`/${l}/blogs`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("blog")}</Link>
                </div>
              </div>
              <div>
                <p style={{ color: "#888", fontWeight: 600, marginBottom: 12 }}>{t("company")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, color: "#555" }}>
                  <Link href={`/${l}/about`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("about")}</Link>
                  <Link href={`/${l}/privacy`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("privacy")}</Link>
                  <Link href={`/${l}/terms`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("terms")}</Link>
                </div>
              </div>
              <div>
                <p style={{ color: "#888", fontWeight: 600, marginBottom: 12 }}>{t("contact")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, color: "#555" }}>
                  <a href="https://lin.ee/wayWuGH" target="_blank" rel="noopener noreferrer" className="hover-white" style={{ transition: "color 0.15s" }}>Line</a>
                  <a href="https://wa.me/66983768135" target="_blank" rel="noopener noreferrer" className="hover-white" style={{ transition: "color 0.15s" }}>WhatsApp</a>
                  <a href="https://m.me/siamdive" target="_blank" rel="noopener noreferrer" className="hover-white" style={{ transition: "color 0.15s" }}>Messenger</a>
                  <a href="tel:+66983768135" className="hover-white" style={{ transition: "color 0.15s" }}>+66 98 376 8135</a>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 20 }}>
            <p style={{ color: "#333", fontSize: 12 }}>
              {t("rights")}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <CurrencySelector compact />
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" style={{ color: "#444", fontSize: 11, transition: "color 0.15s" }} className="hover-white">
                Sitemap
              </a>
            </div>
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "SIAMDIVE",
            url: "https://siamdive.com",
            logo: "https://siamdive.com/logo.png",
            description: "Thailand's curated scuba diving platform — day trips, liveaboards, dive resorts, and courses.",
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+66-98-376-8135",
              contactType: "customer service",
              availableLanguage: ["Thai", "English", "Chinese", "Japanese", "Korean", "German", "French", "Russian"],
            },
            sameAs: [
              "https://lin.ee/wayWuGH",
              "https://wa.me/66983768135",
              "https://m.me/siamdive",
            ],
          }) }}
        />
      </footer>
    </CurrencyProvider>
  );
}
