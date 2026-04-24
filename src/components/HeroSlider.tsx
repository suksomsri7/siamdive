"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { InfoModal, ScheduleSheet, ReelViewer, type Trip } from "./TripPullUp";

const BOAT_TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Scuba Day Trips", SNORKELING: "Snorkeling", LAND_TOUR: "Land Tour",
  LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort", FREEDIVE: "Freedive",
  SCUBA_COURSES: "Scuba Courses", FREEDIVE_COURSES: "Freedive Courses",
  SCUBA_INSTRUCTOR: "Scuba Dive Instructor", FREEDIVE_INSTRUCTOR: "Freedive Instructor",
};

type Slide = {
  slug: string;
  title: string;
  description: string;
  duration: string;
  destinationName: string;
  imageUrl: string;
  covers?: string[];
  type: "DAYTRIP" | "LIVEABOARD";
  price: number;
  boatId?: string;
  boatType?: string;
  hasVideos?: boolean;
};

export default function HeroSlider({ slides, lang = "en" }: { slides: Slide[]; lang?: string }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReel, setShowReel] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Pick a random cover per slide once on mount (client-side, runs every page load)
  const [randomCovers, setRandomCovers] = useState<string[]>(() => slides.map(s => s.imageUrl));
  useEffect(() => {
    setRandomCovers(slides.map(s => {
      const pool = s.covers && s.covers.length ? s.covers : [s.imageUrl];
      return pool[Math.floor(Math.random() * pool.length)] || s.imageUrl;
    }));
  }, [slides]);

  // Pause auto-slide while a modal is open so the displayed data matches what
  // the user clicked.
  const paused = showInfo || showSchedule || showReel;
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setFading(false);
      }, 400);
    }, 10000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const goTo = (i: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(i);
      setFading(false);
    }, 300);
  };

  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;
    touchRef.current = null;
    if (dt > 500 || Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) goTo((current + 1) % slides.length);
    else goTo((current - 1 + slides.length) % slides.length);
  }, [current, slides.length]);

  const slide = slides[current];
  const slideImage = randomCovers[current] || slide.imageUrl;

  const currentTrip: Trip = {
    slug: slide.slug,
    title: slide.title,
    description: slide.description,
    duration: slide.duration,
    destinationName: slide.destinationName,
    imageUrl: slideImage || slide.imageUrl,
    type: slide.type,
    price: slide.price ?? 0,
    boatId: slide.boatId,
  };

  return (
    <>
      <section className="relative" style={{ height: "95vh", minHeight: 520 }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* Background image with fade */}
        <div className="absolute inset-0" style={{ transition: "opacity 0.4s ease", opacity: fading ? 0 : 1 }}>
          <Image
            key={slideImage}
            src={slideImage || "/placeholder.jpg"}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,13,13,0.85) 0%, rgba(13,13,13,0.65) 15%, rgba(13,13,13,0.4) 28%, rgba(13,13,13,0.18) 40%, transparent 55%)" }} />

          {/* Play button — centered, only if slide has videos */}
          {slide.hasVideos && (
            <button
              onClick={() => setShowReel(true)}
              aria-label="Play video"
              className="absolute"
              style={{
                top: "35%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.45)",
                border: "2px solid rgba(255,255,255,0.8)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(6px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                transition: "transform 0.2s ease, background 0.2s ease, opacity 0.4s ease",
                opacity: fading ? 0 : 1,
                zIndex: 5,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.08)"; e.currentTarget.style.background = "rgba(59,130,246,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)"; e.currentTarget.style.background = "rgba(0,0,0,0.45)"; }}
            >
              <svg width={30} height={30} viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div
          className="relative h-full flex items-end px-4 sm:px-10"
          style={{ paddingBottom: "10vh", transition: "opacity 0.4s ease", opacity: fading ? 0 : 1 }}
        >
          <div style={{ maxWidth: 520 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14 }}>
              {slide.boatType ? (BOAT_TYPE_LABEL[slide.boatType] || slide.boatType) : "Featured Trip"}
            </p>
            <h1 className="font-black leading-none" style={{ fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)", marginBottom: 12 }}>
              {slide.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, marginBottom: 14 }}>
              <span style={{ color: "#60a5fa", fontWeight: 700 }}>Top Pick</span>
              <span style={{ color: "#888" }}>{slide.duration}</span>
              <span style={{ color: "#888" }}>{slide.destinationName}</span>
            </div>
            <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.65, marginBottom: 24, maxWidth: 420, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {slide.description}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowInfo(true)}
                style={{ background: "#3b82f6", color: "#fff", padding: "11px 26px", borderRadius: 10, fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity 0.15s", border: "none", cursor: "pointer" }}
                className="hover:opacity-80">
                Information
              </button>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div style={{ position: "absolute", bottom: "2rem", left: 0, right: 0, display: "flex", justifyContent: "center", gap: 8, zIndex: 10 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === current ? 24 : 6,
                height: 6,
                borderRadius: 3,
                background: i === current ? "#3b82f6" : "rgba(255,255,255,0.3)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
        </div>
      </section>

      {mounted && showInfo && createPortal(
        <InfoModal trip={currentTrip} lang={lang} onClose={() => setShowInfo(false)} />,
        document.body
      )}
      {mounted && showSchedule && createPortal(
        <ScheduleSheet trip={currentTrip} onClose={() => setShowSchedule(false)} />,
        document.body
      )}
      {mounted && showReel && createPortal(
        <ReelViewer boatId={slide.boatId} onClose={() => setShowReel(false)} />,
        document.body
      )}
    </>
  );
}
