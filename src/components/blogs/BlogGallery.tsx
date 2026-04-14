"use client";

import { useEffect, useRef, useState } from "react";

type Props = { images: string[]; alt: string };

const AUTO_MS = 10000;
const SWIPE_THRESHOLD = 40; // px before a swipe counts

export default function BlogGallery({ images, alt }: Props) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = images.length;

  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const pausedRef = useRef(false);

  // Auto-advance loop. Pauses while user is touching or lightbox is open.
  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      if (pausedRef.current || lightbox) return;
      setIdx(i => (i + 1) % total);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [total, lightbox]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % total);
      if (e.key === "ArrowLeft") setIdx(i => (i - 1 + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, total]);

  if (total === 0) return null;

  const next = () => setIdx(i => (i + 1) % total);
  const prev = () => setIdx(i => (i - 1 + total) % total);

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
    <>
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 16px" }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>Gallery</h2>
        <div
          style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #1a1a1a", background: "#0a0a0a", aspectRatio: "16/9", touchAction: "pan-y", cursor: "zoom-in" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => setLightbox(true)}
        >
          {images.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`${alt} — image ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: i === idx ? 1 : 0,
                transition: "opacity 0.8s ease-in-out",
                userSelect: "none",
              }}
            />
          ))}

          {/* Dots */}
          {total > 1 && (
            <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, zIndex: 2 }}>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                  aria-label={`Go to image ${i + 1}`}
                  style={{
                    width: i === idx ? 22 : 8,
                    height: 8,
                    borderRadius: 4,
                    border: "none",
                    background: i === idx ? "#fff" : "rgba(255,255,255,0.45)",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.3s ease, background 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            touchAction: "pan-y",
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            aria-label="Close"
            style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: 20, fontSize: 22, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>

          {total > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous"
                style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 44, height: 44, borderRadius: 22, fontSize: 22, cursor: "pointer", lineHeight: 1 }}
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next"
                style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 44, height: 44, borderRadius: 22, fontSize: 22, cursor: "pointer", lineHeight: 1 }}
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[idx]}
            alt={`${alt} — image ${idx + 1}`}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", userSelect: "none" }}
          />

          <div style={{ position: "absolute", bottom: 22, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600 }}>
            {idx + 1} / {total}
          </div>
        </div>
      )}
    </>
  );
}
