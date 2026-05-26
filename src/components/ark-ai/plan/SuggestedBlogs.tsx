"use client";

type BlogSuggestion = {
  blogId: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string | null;
  category: string;
};

type Props = {
  blogs: BlogSuggestion[];
  lang: string;
};

const SECTION_LABELS: Record<string, string> = {
  th: "บทความเตรียมตัว", en: "Recommended reading", cn: "推荐阅读",
  ja: "おすすめ記事", ko: "추천 기사", de: "Empfohlene Artikel",
  fr: "Lectures recommandées", ru: "Рекомендуемые статьи",
};

const READ_LABELS: Record<string, string> = {
  th: "อ่าน →", en: "Read →", cn: "阅读 →",
  ja: "読む →", ko: "읽기 →", de: "Lesen →",
  fr: "Lire →", ru: "Читать →",
};

export default function SuggestedBlogs({ blogs, lang }: Props) {
  if (blogs.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <p style={{
        fontSize: 13, fontWeight: 800, color: "var(--plan-fg)",
        marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
        {SECTION_LABELS[lang] || SECTION_LABELS.en}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
      }}>
        {blogs.map((blog) => (
          <a
            key={blog.blogId}
            href={`/${lang}/blogs/${blog.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none", color: "inherit",
              background: "var(--plan-surface)",
              border: "1px solid var(--plan-border-soft)",
              borderRadius: 10, overflow: "hidden",
              display: "flex", flexDirection: "column",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{
              width: "100%", aspectRatio: "16/10",
              background: "var(--plan-surface-alt)",
              overflow: "hidden",
            }}>
              {blog.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blog.cover}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              )}
            </div>
            <div style={{ padding: "8px 10px 10px" }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: "var(--plan-fg)",
                margin: 0, lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {blog.title}
              </p>
              <p style={{
                fontSize: 10, color: "#60a5fa", fontWeight: 600,
                margin: "6px 0 0",
              }}>
                {READ_LABELS[lang] || READ_LABELS.en}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
