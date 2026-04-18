import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import BlogGallery from "@/components/blogs/BlogGallery";
import RelatedBlogsSlider from "@/components/blogs/RelatedBlogsSlider";
import BlogReadTracker from "@/components/analytics/BlogReadTracker";

// Map boat type → frontend trip listing segment
const BOAT_TYPE_SEGMENT: Record<string, string> = {
  DAYTRIP: "daytrip",
  SNORKELING: "snorkeling",
  LAND_TOUR: "land-tour",
  LIVEABOARD: "liveaboard",
  DIVE_RESORT: "dive-resort",
  FREEDIVE: "freedive",
  SCUBA_COURSES: "scuba-courses",
  FREEDIVE_COURSES: "freedive-courses",
  SCUBA_INSTRUCTOR: "scuba-instructor",
  FREEDIVE_INSTRUCTOR: "freedive-instructor",
};

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
      cover: rb.covers[0] ?? null,
      title: rt?.title ?? "",
      excerpt: rt?.excerpt ?? "",
      slug: rt?.slug ?? "",
    };
  }).filter(r => r.title && r.slug);

  // ── Recommended trips (featured + published boats, fallback to latest) ──────
  let recommendedBoats = await prisma.boat.findMany({
    where: { status: "PUBLISHED", featured: true, NOT: { covers: { isEmpty: true } } },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
      priceTiers: { select: { regularPrice: true, salePrice: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  if (recommendedBoats.length < 4) {
    const fillerCount = 4 - recommendedBoats.length;
    const filler = await prisma.boat.findMany({
      where: { status: "PUBLISHED", id: { notIn: recommendedBoats.map(b => b.id) }, NOT: { covers: { isEmpty: true } } },
      include: {
        translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
        priceTiers: { select: { regularPrice: true, salePrice: true } },
      },
      orderBy: { createdAt: "desc" },
      take: fillerCount,
    });
    recommendedBoats = [...recommendedBoats, ...filler];
  }

  // หา translation ของ lang ที่ร้องขอ
  const langTrans = blog.translations.find(t => t.lang === lang);

  // ถ้ามี translation ภาษานั้น และ slug ไม่ตรง → redirect ไป slug ที่ถูก
  if (langTrans && langTrans.slug !== slug) {
    redirect(`/${lang}/blogs/${langTrans.slug}`);
  }

  // ใช้ translation ของ lang ที่ขอ หรือ fallback ไป slug ที่ส่งมา
  const trans = langTrans ?? blog.translations.find(t => t.slug === slug) ?? blog.translations[0];
  if (!trans) return notFound();

  return (
    <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
      <BlogReadTracker blogId={blog.id} lang={lang} />
      {/* Hero */}
      {blog.covers[0] && (
        <div style={{ position: "relative", height: "50vh", minHeight: 280 }}>
          <Image src={blog.covers[0]} alt={trans.title} fill priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0d0d0d 0%, rgba(13,13,13,0.3) 55%, transparent 100%)" }} />
        </div>
      )}

      {/* Article */}
      <article style={{
        maxWidth: 760, margin: "0 auto",
        padding: blog.covers[0] ? "0 24px 80px" : "100px 24px 80px",
        marginTop: blog.covers[0] ? -110 : 0,
        position: "relative",
      }}>
        <Link href={`/${lang}/blogs`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#444", textDecoration: "none", marginBottom: 24 }}>
          ← Blog
        </Link>

        <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.6rem)", fontWeight: 900, lineHeight: 1.15, color: "#fff", marginBottom: 14 }}>
          {trans.title}
        </h1>

        <p style={{ fontSize: 11, color: "#333", marginBottom: 24 }}>
          {new Date(blog.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        {trans.excerpt && (
          <p style={{ fontSize: 16, color: "#666", lineHeight: 1.8, marginBottom: 36, borderBottom: "1px solid #1a1a1a", paddingBottom: 28 }}>
            {trans.excerpt}
          </p>
        )}

        {trans.content && (
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: trans.content }}
          />
        )}

        <div style={{ marginTop: 56, padding: "28px 0 0", borderTop: "1px solid #1a1a1a" }}>
          <Link href={`/${lang}/blogs`} style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>
            ← กลับไปหน้า Blog
          </Link>
        </div>
      </article>

      {/* ── Image gallery (auto-slide every 6s) ──────────────────────────── */}
      {blog.covers.length > 1 && (
        <BlogGallery images={blog.covers} alt={trans.title} />
      )}

      {/* ── Related articles (random 20, slide 4 per page every 8s) ──────── */}
      <RelatedBlogsSlider blogs={relatedForSlider} lang={lang} />

      {/* ── Recommended trips ────────────────────────────────────────────── */}
      {recommendedBoats.length > 0 && (
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>ทริปแนะนำ</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {recommendedBoats.map(b => {
              const bt = b.translations.find(t => t.lang === lang) || b.translations.find(t => t.lang === "en") || b.translations[0];
              const segment = BOAT_TYPE_SEGMENT[b.type] ?? "daytrip";
              const prices = b.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
              const minPrice = prices.length ? Math.min(...prices) : 0;
              return (
                <Link key={b.id} href={`/${lang}/trips/${segment}`}
                  style={{ background: "#111", borderRadius: 12, overflow: "hidden", border: "1px solid #1a1a1a", textDecoration: "none", display: "block" }}>
                  {b.covers[0] && (
                    <div style={{ aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
                      <Image src={b.covers[0]} alt={bt?.title || b.name} fill loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                      {minPrice > 0 && (
                        <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 6 }}>
                          ฿{minPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ padding: "12px 14px 16px" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.1em", textTransform: "uppercase" }}>{segment.replace("-", " ")}</span>
                    <h3 style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.35, color: "#e5e5e5", margin: "4px 0 6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{bt?.title || b.name}</h3>
                    {bt?.excerpt && <p style={{ fontSize: 11, color: "#555", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{bt.excerpt}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
