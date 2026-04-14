import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ContactBubble from "@/components/ContactBubble";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

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
  contact: {
    en: "Contact", th: "ติดต่อ", cn: "联系", ja: "お問い合わせ", ko: "연락처", de: "Kontakt", fr: "Contact", ru: "Контакт",
  },
  daytrip: {
    en: "Scuba Day Trips", th: "Scuba Day Trips", cn: "一日潜水", ja: "スキューバデイトリップ", ko: "스쿠버 당일치기", de: "Scuba Tagestouren", fr: "Plongée à la journée", ru: "Дневные туры",
  },
  liveaboard: {
    en: "Liveaboard", th: "Liveaboard", cn: "住船游", ja: "リブアボード", ko: "리브어보드", de: "Liveaboard", fr: "Liveaboard", ru: "Живой борт",
  },
  courses: {
    en: "Scuba Courses", th: "คอร์สดำน้ำ", cn: "潜水课程", ja: "スキューバコース", ko: "스쿠버 코스", de: "Scuba-Kurse", fr: "Cours de plongée", ru: "Курсы дайвинга",
  },
  blog: {
    en: "Blog", th: "บทความ", cn: "博客", ja: "ブログ", ko: "블로그", de: "Blog", fr: "Blog", ru: "Блог",
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

  return (
    <>
      <Navbar />
      {children}
      <ContactBubble />
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 40px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 32, marginBottom: 36 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 10, letterSpacing: "-0.02em" }}>
                <span style={{ color: "#fff" }}>SIAM</span><span style={{ color: "#3b82f6" }}>DIVE</span>
              </h3>
              <p style={{ color: "#555", fontSize: 13, maxWidth: 260, lineHeight: 1.6 }}>
                {t("tagline")}
              </p>
            </div>
            <div style={{ display: "flex", gap: 48, fontSize: 13 }}>
              <div>
                <p style={{ color: "#888", fontWeight: 600, marginBottom: 12 }}>{t("trips")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, color: "#555" }}>
                  <Link href={`/${l}/trips/daytrip`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("daytrip")}</Link>
                  <Link href={`/${l}/trips/liveaboard`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("liveaboard")}</Link>
                  <Link href={`/${l}/courses/scuba`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("courses")}</Link>
                  <Link href={`/${l}/blogs`} className="hover-white" style={{ transition: "color 0.15s" }}>{t("blog")}</Link>
                </div>
              </div>
              <div>
                <p style={{ color: "#888", fontWeight: 600, marginBottom: 12 }}>{t("contact")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, color: "#555" }}>
                  <a href="https://lin.ee/wayWuGH" target="_blank" rel="noopener noreferrer" className="hover-white" style={{ transition: "color 0.15s" }}>Line</a>
                  <a href="https://wa.me/66983768135" target="_blank" rel="noopener noreferrer" className="hover-white" style={{ transition: "color 0.15s" }}>WhatsApp</a>
                  <a href="tel:+66983768135" className="hover-white" style={{ transition: "color 0.15s" }}>+66 98 376 8135</a>
                </div>
              </div>
            </div>
          </div>
          <p style={{ color: "#333", fontSize: 12, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 20 }}>
            {t("rights")}
          </p>
        </div>
      </footer>
    </>
  );
}
