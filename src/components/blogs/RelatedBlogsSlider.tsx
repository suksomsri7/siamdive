"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type RelatedBlog = {
  id: string;
  cover: string | null;
  title: string;
  excerpt: string;
  slug: string;
};

type Props = { blogs: RelatedBlog[]; lang: string };

const PAGE_SIZE = 4; // 2 columns × 2 rows
const AUTO_MS = 15000;
const SWIPE_THRESHOLD = 40;

export default function RelatedBlogsSlider({ blogs, lang }: Props) {
  const totalPages = Math.max(1, Math.ceil(blogs.length / PAGE_SIZE));
  const [page, setPage] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (totalPages <= 1) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setPage(p => (p + 1) % totalPages);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [totalPages]);

  if (blogs.length === 0) return null;

  const next = () => setPage(p => (p + 1) % totalPages);
  const prev = () => setPage(p => (p - 1 + totalPages) % totalPages);

  const onTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > SWIPE_THRESHOLD) {
      if (touchDeltaX.current < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    pausedRef.current = false;
  };

  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 16px" }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>บทความแนะนำ</h2>

      <div
        style={{ overflow: "hidden", borderRadius: 12, touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          style={{
            display: "flex",
            width: `${totalPages * 100}%`,
            transform: `translateX(-${page * (100 / totalPages)}%)`,
            transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {Array.from({ length: totalPages }).map((_, p) => {
            const slice = blogs.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE);
            return (
              <div
                key={p}
                style={{
                  flex: `0 0 ${100 / totalPages}%`,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 14,
                  paddingRight: 2,
                }}
              >
                {slice.map(rb => (
                  <Link
                    key={rb.id}
                    href={`/${lang}/blogs/${rb.slug}`}
                    draggable={false}
                    style={{ background: "#111", borderRadius: 12, overflow: "hidden", border: "1px solid #1a1a1a", textDecoration: "none", display: "block" }}
                  >
                    {rb.cover && (
                      <div style={{ aspectRatio: "16/9", overflow: "hidden", background: "linear-gradient(135deg,#16263f,#0d1422)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rb.cover}
                          alt={rb.title}
                          draggable={false}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover", userSelect: "none" }}
                          onError={e => { e.currentTarget.style.display = "none"; }}
                        />
                      </div>
                    )}
                    <div style={{ padding: "12px 14px 16px" }}>
                      <h3 style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.35, color: "#e5e5e5", marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{rb.title}</h3>
                      {rb.excerpt && (
                        <p style={{ fontSize: 11, color: "#555", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{rb.excerpt}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination dots */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {Array.from({ length: totalPages }).map((_, p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              aria-label={`Go to page ${p + 1}`}
              style={{
                width: p === page ? 22 : 8,
                height: 8,
                borderRadius: 4,
                border: "none",
                background: p === page ? "#3b82f6" : "#222",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
