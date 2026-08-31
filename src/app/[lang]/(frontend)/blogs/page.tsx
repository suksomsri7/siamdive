import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import BlogFloatingNav from "@/components/blogs/BlogFloatingNav";

// ISR: the listing used to run per-request and pull EVERY published blog ×
// all 8 languages (500+ blogs → 4,000+ rows per hit, mostly bot traffic) —
// a top Supabase-egress driver. Cache for 1h and fetch only the languages
// this page can render (requested lang + en fallback).
export const revalidate = 3600;

export default async function BlogsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const listLangs = lang === "en" ? ["en"] : [lang, "en"];
  const blogs = await prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    include: { translations: { where: { lang: { in: listLangs } }, select: { lang: true, title: true, slug: true, excerpt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ background: "#0d0d0d", minHeight: "100vh", paddingTop: 88 }}>
      {/* ปุ่มลอยกลับหน้าหลัก — โผล่เมื่อเลื่อนลง (เหมือน blog view · หน้านี้ไม่ต้องมีปุ่มกลับบทความ) */}
      <BlogFloatingNav lang={lang} articles={false} />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>SIAMDIVE</p>
        <h1 style={{ fontSize: "clamp(1.8rem,5vw,3rem)", fontWeight: 900, color: "#fff", marginBottom: 32 }}>Blog</h1>

        {blogs.length === 0 ? (
          <p style={{ color: "#2a2a2a", fontSize: 14 }}>ยังไม่มีบทความ</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {blogs.map((blog, i) => {
              const trans = blog.translations.find(t => t.lang === lang) || blog.translations.find(t => t.lang === "en") || blog.translations[0];
              if (!trans) return null;
              return (
                <Link key={blog.id} href={`/${lang}/blogs/${trans.slug}`}
                  style={{ background: "#111", borderRadius: 14, overflow: "hidden", border: "1px solid #1a1a1a", textDecoration: "none", display: "block" }}>
                  {blog.covers[0] && (
                    <div style={{ aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
                      <Image src={blog.covers[0]} alt={trans.title} fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        className="hover:scale-105 transition-transform duration-500"
                        priority={i < 3}
                        loading={i < 3 ? "eager" : "lazy"}
                      />
                    </div>
                  )}
                  <div style={{ padding: "16px 18px 20px" }}>
                    <h2 style={{
                      fontSize: 15, fontWeight: 800, lineHeight: 1.35, color: "#e5e5e5", marginBottom: 8,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>{trans.title}</h2>
                    {trans.excerpt && (
                      <p style={{
                        fontSize: 12, color: "#555", lineHeight: 1.6,
                        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>{trans.excerpt}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
