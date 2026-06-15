import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import BlogGallery from "@/components/blogs/BlogGallery";
import RelatedBlogsSlider from "@/components/blogs/RelatedBlogsSlider";
import BlogReadTracker from "@/components/analytics/BlogReadTracker";
import { getUserCurrency } from "@/lib/userCurrency";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let slugTrans = await prisma.blogTranslation.findUnique({
    where: { slug_lang: { slug: decodedSlug, lang } },
    select: { blogId: true },
  });
  if (!slugTrans) {
    slugTrans = await prisma.blogTranslation.findFirst({
      where: { slug: decodedSlug },
      select: { blogId: true },
    });
  }
  if (!slugTrans) {
    const norm = collapseLangSuffix(decodedSlug, lang);
    if (norm !== decodedSlug) slugTrans = await prisma.blogTranslation.findFirst({ where: { slug: norm }, select: { blogId: true } });
  }
  if (!slugTrans) return {};

  const blog = await prisma.blog.findUnique({
    where: { id: slugTrans.blogId },
    include: { translations: true },
  });
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

  // หา blog จาก slug + lang (ทุกภาษาใช้ slug เดียวกันได้)
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
  if (!slugTrans) return notFound();

  // ดึง blog พร้อม translations ทุกภาษา
  const blog = await prisma.blog.findUnique({
    where: { id: slugTrans.blogId },
    include: { translations: true },
  });
  if (!blog || blog.status !== "PUBLISHED") return notFound();

  // ── Related blogs: pull up to 20 random PUBLISHED, excluding current ────────
  // Postgres ORDER BY RANDOM() is fine for this scale (a few hundred blogs).
  const randomBlogs = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Blog"
    WHERE status = 'PUBLISHED' AND id != ${blog.id}
    ORDER BY RANDOM()
    LIMIT 20
  `;
  const relatedBlogs = randomBlogs.length
    ? await prisma.blog.findMany({
        where: { id: { in: randomBlogs.map(r => r.id) } },
        include: { translations: { select: { lang: true, title: true, slug: true, excerpt: true } } },
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

  // ── Recommended trips: top-rated liveaboards/resorts from the v2 explore KB ──
  // (the live product; replaces the legacy v1 boat catalog). Public, cached feed.
  type FeaturedTrip = {
    id: string; name: string; slug: string; catSlug: string; path: string;
    area: string | null; country: string | null;
    priceFrom: number | null; priceCurrency: string | null; coverImage: string | null; rating: number | null;
  };
  // Pass the visitor's chosen currency so the trip prices convert to match the
  // currency picker (the v2 feed converts server-side via its FX rates).
  const userCurrency = await getUserCurrency().catch(() => "THB");
  let featuredTrips: FeaturedTrip[] = [];
  try {
    const res = await fetch(`https://www.siamdive.com/api/public/featured-explore?take=6&currency=${userCurrency}`, { next: { revalidate: 1800 } });
    if (res.ok) featuredTrips = (await res.json()).items ?? [];
  } catch { /* feed unavailable → just hide the section */ }
  // v2 explore is EN + TH; link Thai readers to /th/explore, everyone else to /explore.
  const tripHref = (path: string) => (lang === "th" ? `/th${path}` : path);

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

      {/* ── Hero: full-bleed cover with title + date overlaid ─────────────── */}
      {blog.covers[0] ? (
        <header style={{ position: "relative", minHeight: "min(64vh, 560px)", display: "flex", alignItems: "flex-end" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetUrl(blog.covers[0])} alt={trans.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0d0d0d 6%, rgba(13,13,13,0.55) 45%, rgba(13,13,13,0.15) 100%)" }} />
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
        {trans.content && (
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: trans.content }} />
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

      {/* ── Recommended trips — real top-rated items from the explore KB ──── */}
      {featuredTrips.length > 0 && (
        <section style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 24px 28px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
              {isTH ? "ทริปแนะนำ" : "Recommended trips"}
            </h2>
            <Link href={isTH ? "/th/explore" : "/explore"} style={{ fontSize: 12, color: "#777", textDecoration: "none" }}>
              {isTH ? "ดูทั้งหมด →" : "See all →"}
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
            {featuredTrips.map(t => (
              <Link key={t.id} href={tripHref(t.path)}
                style={{ background: "#121212", borderRadius: 14, overflow: "hidden", border: "1px solid #1c1c1c", textDecoration: "none", display: "block" }}>
                <div style={{ aspectRatio: "16/10", overflow: "hidden", position: "relative", background: "#1a1a1a" }}>
                  {t.coverImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={t.coverImage} alt={t.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  {t.rating ? (
                    <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.7)", color: "#fbbf24", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                      ★ {Math.round(t.rating * 10) / 10}
                    </span>
                  ) : null}
                </div>
                <div style={{ padding: "12px 14px 16px" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {t.catSlug === "dive-resort" ? (isTH ? "รีสอร์ตดำน้ำ" : "Dive resort") : (isTH ? "เรือไลฟ์อะบอร์ด" : "Liveaboard")}
                  </span>
                  <h3 style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, color: "#ededed", margin: "4px 0 4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.name}</h3>
                  <p style={{ fontSize: 11.5, color: "#666", margin: "0 0 8px" }}>{[t.area, t.country].filter(Boolean).join(", ")}</p>
                  {t.priceFrom != null && (
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", margin: 0 }}>
                      {isTH ? "เริ่ม" : "from"} {t.priceCurrency} {Math.round(t.priceFrom).toLocaleString()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Closing CTA → AI planner ──────────────────────────────────────── */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 24px 80px" }}>
        <div style={{ background: "linear-gradient(135deg,#0f1f3d,#0b1322)", border: "1px solid #1e2c47", borderRadius: 18, padding: "34px 28px", textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
            {isTH ? "พร้อมวางแผนทริปดำน้ำแล้วหรือยัง?" : "Ready to plan your dive trip?"}
          </h2>
          <p style={{ fontSize: 14, color: "#9fb3d1", margin: "0 0 20px", lineHeight: 1.6 }}>
            {isTH ? "บอก AI ของเราว่าอยากไปไหน ช่วงไหน แล้วเราจัดแผน + เช็กราคา/ที่ว่างให้" : "Tell our AI where and when — we build the plan and check prices & availability."}
          </p>
          <Link href="/" style={{ display: "inline-block", background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, padding: "13px 28px", borderRadius: 12, textDecoration: "none" }}>
            {isTH ? "วางแผนกับ AI →" : "Plan with AI →"}
          </Link>
        </div>
      </section>
    </main>
  );
}
