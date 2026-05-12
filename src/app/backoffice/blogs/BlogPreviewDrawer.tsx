"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const ShareDrawer = dynamic(() => import("@/components/social/ShareDrawer"), { ssr: false });

type LangKey = "en" | "th" | "cn" | "de" | "fr" | "ru" | "ko" | "ja";
const LANG_LABELS: Record<LangKey, string> = {
  en: "EN", th: "TH", cn: "中文",
  de: "DE", fr: "FR", ru: "RU", ko: "한국어", ja: "日本語",
};
const ALL_LANGS: LangKey[] = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];

type Translation = {
  lang: string; title: string; slug: string; excerpt: string; content: string;
  keywords: string[]; ogTitle: string; ogDescription: string; ogImage: string;
};
type BlogStatusUpper = "DRAFT" | "APPROVED" | "PUBLISHED";
type BlogFull = {
  id: string;
  status: BlogStatusUpper;
  covers: string[];
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
};

type Props = {
  open: boolean;
  blogId: string | null;
  onClose: () => void;
  onStatusChanged: () => void;
};

// Allowed transitions (mirrors src/lib/blogStatus.ts)
const ALLOWED: Record<BlogStatusUpper, BlogStatusUpper[]> = {
  DRAFT: ["APPROVED"],
  APPROVED: ["DRAFT", "PUBLISHED"],
  PUBLISHED: [],
};

const STATUS_STYLE: Record<BlogStatusUpper, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Draft" },
  APPROVED: { bg: "rgba(59,130,246,0.18)", color: "#60a5fa", label: "Approved" },
  PUBLISHED: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Live" },
};

export default function BlogPreviewDrawer({ open, blogId, onClose, onStatusChanged }: Props) {
  const [blog, setBlog] = useState<BlogFull | null>(null);
  const [lang, setLang] = useState<LangKey>("th");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/blogs/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BlogFull = await res.json();
      setBlog(data);
      const have = new Set(data.translations.map((t) => t.lang));
      setLang(have.has("th") ? "th" : have.has("en") ? "en" : (data.translations[0]?.lang as LangKey) ?? "en");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && blogId) load(blogId);
  }, [open, blogId, load]);

  // Lock body scroll while open (matches MyPlanScreen pattern)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const changeStatus = async (next: BlogStatusUpper) => {
    if (!blog) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/blogs/${blog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setBlog((b) => b ? { ...b, status: next } : b);
      onStatusChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Status change failed");
    } finally {
      setBusy(false);
    }
  };

  const trans = blog?.translations.find((t) => t.lang === lang) ?? blog?.translations[0];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 70,
          background: "rgba(0,0,0,0.7)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 71,
        width: "min(880px, 100vw)",
        background: "#0d0d0d",
        borderLeft: "1px solid #1a1a1a",
        transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Sticky toolbar */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 10,
          padding: "12px 16px",
          background: "rgba(13,13,13,0.97)",
          borderBottom: "1px solid #1a1a1a",
          backdropFilter: "blur(8px)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: "0.08em", textTransform: "uppercase" }}>Preview</span>
            {blog && (
              <span style={{
                fontSize: 10, fontWeight: 800,
                padding: "3px 9px", borderRadius: 20,
                background: STATUS_STYLE[blog.status].bg,
                color: STATUS_STYLE[blog.status].color,
              }}>{STATUS_STYLE[blog.status].label}</span>
            )}
            <div style={{ flex: 1 }} />
            {blog && trans && (
              <button
                onClick={() => setShareOpen(true)}
                disabled={blog.status !== "PUBLISHED"}
                title={blog.status !== "PUBLISHED" ? "ต้อง publish ก่อนถึงโพสได้" : "Share to Facebook"}
                style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "5px 12px", borderRadius: 6, border: "none",
                  cursor: blog.status === "PUBLISHED" ? "pointer" : "not-allowed",
                  background: blog.status === "PUBLISHED" ? "#1877f2" : "#1a1a1a",
                  color: blog.status === "PUBLISHED" ? "#fff" : "#444",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                📤 โพส FB
              </button>
            )}
            {blog?.status === "PUBLISHED" && trans?.slug && (
              <a
                href={`/${lang}/blogs/${trans.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}
              >
                เปิดในเว็บ ↗
              </a>
            )}
            <button onClick={onClose} aria-label="Close"
              style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
          </div>

          {/* Lang chips */}
          {blog && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {ALL_LANGS.map((l) => {
                const has = blog.translations.some((t) => t.lang === l);
                const active = lang === l;
                return (
                  <button key={l}
                    onClick={() => has && setLang(l)}
                    disabled={!has}
                    style={{
                      fontSize: 10, fontWeight: 700,
                      padding: "4px 10px", borderRadius: 14, border: "none",
                      cursor: has ? "pointer" : "not-allowed",
                      background: active ? "#3b82f6" : has ? "#1a1a1a" : "#0e0e0e",
                      color: active ? "#fff" : has ? "#ccc" : "#333",
                      opacity: has ? 1 : 0.5,
                      transition: "all 0.15s",
                    }}>
                    {LANG_LABELS[l]}
                  </button>
                );
              })}
            </div>
          )}

          {/* Status actions */}
          {blog && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#444", marginRight: 2 }}>เปลี่ยนสถานะ:</span>
              {ALLOWED[blog.status].length === 0 && (
                <span style={{ fontSize: 10, color: "#444", fontStyle: "italic" }}>ล็อก (PUBLISHED ไม่เปลี่ยนได้)</span>
              )}
              {ALLOWED[blog.status].map((target) => {
                const s = STATUS_STYLE[target];
                return (
                  <button key={target} onClick={() => changeStatus(target)} disabled={busy}
                    style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "5px 12px", borderRadius: 6, border: "none",
                      cursor: busy ? "wait" : "pointer",
                      background: s.bg, color: s.color,
                      opacity: busy ? 0.5 : 1,
                      transition: "all 0.15s",
                    }}>
                    → {s.label}
                  </button>
                );
              })}
            </div>
          )}

          {err && (
            <p style={{ fontSize: 10, color: "#ef4444", margin: 0 }}>❌ {err}</p>
          )}
        </div>

        {/* Body — frontend-style preview */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#444", fontSize: 13 }}>กำลังโหลด...</div>
          )}
          {!loading && blog && trans && (
            <main style={{ background: "#0d0d0d", minHeight: "100%" }}>
              {/* Hero */}
              {blog.covers[0] && (
                <div style={{ position: "relative", height: "40vh", minHeight: 220, background: "#000" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={blog.covers[0]} alt={trans.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0d0d0d 0%, rgba(13,13,13,0.3) 55%, transparent 100%)" }} />
                </div>
              )}

              <article style={{
                maxWidth: 760, margin: "0 auto",
                padding: blog.covers[0] ? "0 24px 60px" : "60px 24px 60px",
                marginTop: blog.covers[0] ? -90 : 0,
                position: "relative",
              }}>
                <h1 style={{ fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)", fontWeight: 900, lineHeight: 1.18, color: "#fff", marginBottom: 12 }}>
                  {trans.title}
                </h1>
                <p style={{ fontSize: 11, color: "#333", marginBottom: 22 }}>
                  {new Date(blog.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                  {trans.slug && <span style={{ marginLeft: 12, fontFamily: "monospace", color: "#2a2a2a" }}>/{lang}/blogs/{trans.slug}</span>}
                </p>
                {trans.excerpt && (
                  <p style={{ fontSize: 15, color: "#666", lineHeight: 1.75, marginBottom: 28, borderBottom: "1px solid #1a1a1a", paddingBottom: 22 }}>
                    {trans.excerpt}
                  </p>
                )}
                {trans.content && (
                  <div className="blog-content" dangerouslySetInnerHTML={{ __html: trans.content }} />
                )}
                {!trans.content && (
                  <p style={{ fontSize: 13, color: "#444", fontStyle: "italic" }}>(ภาษานี้ยังไม่มีเนื้อหา)</p>
                )}
              </article>

              {/* Extra covers gallery */}
              {blog.covers.length > 1 && (
                <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>
                  <h3 style={{ fontSize: 10, fontWeight: 800, color: "#3b82f6", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>รูปภาพอื่น ๆ</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                    {blog.covers.slice(1).map((c, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={c} alt={`cover ${i + 2}`}
                        style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 6, border: "1px solid #1a1a1a" }} />
                    ))}
                  </div>
                </section>
              )}
            </main>
          )}
        </div>
      </div>
      {shareOpen && blog && trans && (
        <ShareDrawer
          blogId={blog.id}
          language={lang}
          defaultImage={trans.ogImage || blog.covers[0] || ""}
          blogTitle={trans.title}
          blogExcerpt={trans.excerpt}
          blogSlug={trans.slug}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
