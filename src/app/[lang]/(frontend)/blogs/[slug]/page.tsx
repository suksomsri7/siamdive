import type { Metadata } from "next";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import BlogGallery from "@/components/blogs/BlogGallery";
import RelatedBlogsSlider from "@/components/blogs/RelatedBlogsSlider";
import BlogReadTracker from "@/components/analytics/BlogReadTracker";
import BlogFloatingNav from "@/components/blogs/BlogFloatingNav";

// ── ISR: cache each blog URL for 6h ─────────────────────────────────────────
// The page used to be fully dynamic (a server-side cookies() read for the
// currency picker) → EVERY hit — overwhelmingly bots crawling ~4k blog URLs —
// ran 5+ Prisma queries incl. all-language full bodies. That alone blew the
// Supabase egress quota (51GB/3 days with zero human sessions). The currency-
// dependent "Recommended trips" section is now a client component, so the page
// is static + revalidated; bots hit the Vercel cache, not the database.
export const revalidate = 21600;

// Collapse a repeated trailing language suffix (legacy bad slugs like
// "...-de-de-de-de" → "...-de"), so an old malformed URL still resolves and the
// page's slug-mismatch guard 301s it to the normalised slug.
const collapseLangSuffix = (slug: string, lang: string) =>
  slug.replace(new RegExp(`(?:-${lang})+$`), `-${lang}`);

// Blog uploads live on the v1 deployment. This page is served UNDER www via the
// v2 proxy, where a relative "/uploads/..." would be double-hopped (www → v1),
// adding latency and occasional timeouts when many images load at once. Point
// image <img> srcs DIRECTLY at the v1 origin so the browser hits v1's CDN once.
const V1_ORIGIN = "https://siamdive.vercel.app";
const assetUrl = (u: string | null | undefined): string =>
  !u ? "" : u.startsWith("/") ? `${V1_ORIGIN}${u}` : u;

// ── Shared loader (React cache → generateMetadata + page = ONE set of queries)
// Translations come back WITHOUT the content column: the 8-language full bodies
// are the heaviest rows in the DB and the metadata/hreflang/fallback logic only
// needs slugs/titles/og fields. The single body actually rendered is fetched
// separately by id (one small row) in the page component.
const getBlogLight = cache(async (slug: string, lang: string) => {
  let slugTrans = await prisma.blogTranslation.findUnique({
    where: { slug_lang: { slug, lang } },
    select: { blogId: true },
  });
  // fallback: ลอง slug กับ lang อื่น (กรณี share link ข้ามภาษา)
  if (!slugTrans) {
    slugTrans = await prisma.blogTranslation.findFirst({
      where: { slug },
      select: { blogId: true },
    });
  }
  // legacy malformed slug (repeated -lang) → resolve via the normalised form so
  // the slug-mismatch guard below 301s it to the clean slug (no broken old URLs)
  if (!slugTrans) {
    const norm = collapseLangSuffix(slug, lang);
    if (norm !== slug) slugTrans = await prisma.blogTranslation.findFirst({ where: { slug: norm }, select: { blogId: true } });
  }
  if (!slugTrans) return null;

  return prisma.blog.findUnique({
    where: { id: slugTrans.blogId },
    include: {
      translations: {
        select: { id: true, lang: true, slug: true, title: true, excerpt: true, ogTitle: true, ogDescription: true, ogImage: true },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const blog = await getBlogLight(decodedSlug, lang);
  if (!blog || blog.status !== "PUBLISHED") return {};

  const trans = blog.translations.find(t => t.lang === lang)
    ?? blog.translations.find(t => t.slug === decodedSlug)
    ?? blog.translations[0];
  if (!trans) return {};

  const title = trans.ogTitle || trans.title;
  const description = trans.ogDescription || trans.excerpt;
  const SITE = "https://www.siamdive.com";
  const abs = (u: string) => (u.startsWith("http") ? u : `${SITE}${u}`);
  const ogImage = abs(trans.ogImage || blog.covers[0] || "");

  // hreflang: every translation shares the public /[lang]/blogs/[slug] shape.
  const languages: Record<string, string> = {};
  for (const t of blog.translations) if (t.slug) languages[t.lang] = `${SITE}/${t.lang}/blogs/${t.slug}`;
  const enSlug = blog.translations.find(t => t.lang === "en")?.slug;
  if (enSlug) languages["x-default"] = `${SITE}/en/blogs/${enSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE}/${lang}/blogs/${trans.slug}`,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${SITE}/${lang}/blogs/${trans.slug}`,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
      locale: lang,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  // หา blog (shared cache กับ generateMetadata → query ชุดเดียวต่อ request)
  const blog = await getBlogLight(slug, lang);
  if (!blog || blog.status !== "PUBLISHED") return notFound();

  // หา translation ของ lang ที่ร้องขอ
  const langTrans = blog.translations.find(t => t.lang === lang);

  // ถ้ามี translation ภาษานั้น และ slug ไม่ตรง → 308 ไป slug ที่ถูก (canonical
  // slug ย้ายถาวร → ดี SEO, ส่ง link equity; ครอบคลุม legacy malformed slug ด้วย)
  if (langTrans && langTrans.slug !== slug) {
    permanentRedirect(`/${lang}/blogs/${langTrans.slug}`);
  }

  // ใช้ translation ของ lang ที่ขอ หรือ fallback ไป slug ที่ส่งมา
  const trans = langTrans ?? blog.translations.find(t => t.slug === slug) ?? blog.translations[0];
  if (!trans) return notFound();

  // ดึงเนื้อหาเต็มเฉพาะภาษาที่จะเรนเดอร์จริง (1 แถวเล็ก แทนที่จะแบก 8 ภาษาเต็ม)
  const contentRow = await prisma.blogTranslation.findUnique({
    where: { id: trans.id },
    select: { content: true },
  });
  const content = contentRow?.content ?? "";

  // ── Related blogs: up to 12 random PUBLISHED, excluding current ────────────
  // ORDER BY RANDOM() is acceptable here because with ISR this runs once per
  // URL per revalidate window (not per request). Translations are trimmed to
  // the languages this page can actually display.
  const relatedLangs = lang === "en" ? ["en"] : [lang, "en"];
  const randomBlogs = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Blog"
    WHERE status = 'PUBLISHED' AND id != ${blog.id}
    ORDER BY RANDOM()
    LIMIT 12
  `;
  const relatedBlogs = randomBlogs.length
    ? await prisma.blog.findMany({
        where: { id: { in: randomBlogs.map(r => r.id) } },
        include: { translations: { where: { lang: { in: relatedLangs } }, select: { lang: true, title: true, slug: true, excerpt: true } } },
      })
    : [];
  // Restore the random order from the SQL query (findMany doesn't preserve it)
  const relatedBlogsOrdered = randomBlogs
    .map(r => relatedBlogs.find(b => b.id === r.id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);

  // Project for the slider client component
  const relatedForSlider = relatedBlogsOrdered.map(rb => {
    const rt = rb.translations.find(t => t.lang === lang) || rb.translations.find(t => t.lang === "en") || rb.translations[0];
    return {
      id: rb.id,
      cover: assetUrl(rb.covers[0]) || null,
      title: rt?.title ?? "",
      excerpt: rt?.excerpt ?? "",
      slug: rt?.slug ?? "",
    };
  }).filter(r => r.title && r.slug);

  const dateStr = new Date(blog.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const isTH = lang === "th";

  // BlogPosting structured data (absolute URLs; www/uploads is proxied to v1).
  const SITE = "https://www.siamdive.com";
  const absUrl = (u: string) => (u.startsWith("http") ? u : `${SITE}${u}`);
  const pageUrl = `${SITE}/${lang}/blogs/${trans.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: (trans.title || "").slice(0, 110),
    description: trans.excerpt || trans.ogDescription || undefined,
    image: blog.covers.length ? blog.covers.map(absUrl) : undefined,
    datePublished: new Date(blog.createdAt).toISOString(),
    dateModified: new Date((blog as { updatedAt?: Date }).updatedAt ?? blog.createdAt).toISOString(),
    inLanguage: lang,
    mainEntityOfPage: pageUrl,
    url: pageUrl,
    author: { "@type": "Organization", name: "SiamDive", url: SITE },
    publisher: { "@type": "Organization", name: "SiamDive", url: SITE },
  };

  return (
    <main style={{ background: "#0d0d0d", minHeight: "100vh", color: "#e5e5e5" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogReadTracker blogId={blog.id} lang={lang} />
      {/* ปุ่มลอย: กลับหน้าหลัก / กลับบทความ — โผล่เมื่อเลื่อนพ้น hero (แถบบนหด) */}
      <BlogFloatingNav lang={lang} />

      {/* ── Hero: full-bleed cover with title + date overlaid ─────────────── */}
      {blog.covers[0] ? (
        <header style={{ position: "relative", minHeight: "min(64vh, 560px)", display: "flex", alignItems: "flex-end" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetUrl(blog.covers[0])} alt={trans.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0d0d0d 6%, rgba(13,13,13,0.55) 45%, rgba(13,13,13,0.15) 100%)" }} />
          {/* ไอคอน < มุมบนซ้าย → กลับหน้ารวมบทความ (เลื่อนหายไปกับ hero แล้วปุ่มลอยรับช่วงต่อ) */}
          <Link href={`/${lang}/blogs`} aria-label="Blog" style={{ position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)", left: 14, zIndex: 3, width: 38, height: 38, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(10,10,10,0.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", width: "100%", padding: "0 24px 44px" }}>
            <Link href={`/${lang}/blogs`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#cfcfcf", textDecoration: "none", marginBottom: 18 }}>
              ← Blog
            </Link>
            <h1 style={{ fontSize: "clamp(1.7rem,4.5vw,3rem)", fontWeight: 900, lineHeight: 1.12, color: "#fff", margin: 0, textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}>
              {trans.title}
            </h1>
            <p style={{ fontSize: 12.5, color: "#b8b8b8", margin: "14px 0 0" }}>{dateStr}</p>
          </div>
        </header>
      ) : (
        <header style={{ maxWidth: 820, margin: "0 auto", padding: "96px 24px 0" }}>
          <Link href={`/${lang}/blogs`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666", textDecoration: "none", marginBottom: 18 }}>← Blog</Link>
          <h1 style={{ fontSize: "clamp(1.7rem,4.5vw,3rem)", fontWeight: 900, lineHeight: 1.12, color: "#fff", margin: 0 }}>{trans.title}</h1>
          <p style={{ fontSize: 12.5, color: "#555", margin: "14px 0 0" }}>{dateStr}</p>
        </header>
      )}

      {/* ── Article ───────────────────────────────────────────────────────── */}
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "44px 24px 72px" }}>
        {trans.excerpt && (
          <p style={{ fontSize: 18, color: "#9a9a9a", lineHeight: 1.75, margin: "0 0 36px", paddingBottom: 30, borderBottom: "1px solid #1c1c1c", fontWeight: 400 }}>
            {trans.excerpt}
          </p>
        )}
        {content && (
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: content }} />
        )}
        <div style={{ marginTop: 52, paddingTop: 26, borderTop: "1px solid #1c1c1c" }}>
          <Link href={`/${lang}/blogs`} style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>
            ← {isTH ? "กลับไปหน้า Blog" : "Back to Blog"}
          </Link>
        </div>
      </article>

      {/* ── Image gallery (if multiple covers) ───────────────────────────── */}
      {blog.covers.length > 1 && <BlogGallery images={blog.covers.map(assetUrl)} alt={trans.title} />}

      {/* ── Related articles ──────────────────────────────────────────────── */}
      <RelatedBlogsSlider blogs={relatedForSlider} lang={lang} />
    </main>
  );
}
