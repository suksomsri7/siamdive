"use client";

import { useParams } from "next/navigation";

type Props = {
  blogId: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string | null;
};

export default function ChatBlogCard({ title, slug, excerpt, cover }: Props) {
  const lang = (useParams().lang as string) || "en";

  return (
    <a
      href={`/${lang}/blogs/${slug}`}
      target="_blank"
      rel="noopener"
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#161616", border: "1px solid #262626", borderRadius: 10,
        padding: 10, margin: "8px 0", textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#60a5fa")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#262626")}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 56, height: 42, background: "#1a1a2e", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          📖
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>BLOG</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
        {excerpt && <p style={{ fontSize: 10, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{excerpt}</p>}
      </div>
    </a>
  );
}
