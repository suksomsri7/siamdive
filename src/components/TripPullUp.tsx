"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
type Trip = {
  slug: string;
  title: string;
  description?: string;
  price: number;
  duration: string;
  type: "DAYTRIP" | "LIVEABOARD";
  destinationName: string;
  imageUrl?: string;
  boatId?: string;
};

type Schedule = {
  id: string;
  departureDate: string | null;
  returnDate: string | null;
  status: string;
  availableSeats: number | null;
  totalSeats: number | null;
  season: string | null;
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  OPEN:      { bg: "#14532d", color: "#4ade80" },
  FULL:      { bg: "#451a03", color: "#fbbf24" },
  CANCELLED: { bg: "#2d0000", color: "#f87171" },
  COMPLETED: { bg: "#1a1a1a", color: "#555"    },
  DRAFT:     { bg: "#1a1a1a", color: "#555"    },
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "ไม่ระบุ";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

// ── Shared types (exported) ───────────────────────────────────────────────────
export type { Trip };

// ── ReelViewer — Instagram Reels style ────────────────────────────────────────
const DEMO_VIDEOS = [
  { url: "https://videos.pexels.com/video-files/1093662/1093662-hd_1280_720_30fps.mp4", name: "Ocean Waves" },
  { url: "https://videos.pexels.com/video-files/3355624/3355624-hd_1080_1920_25fps.mp4", name: "Underwater Coral" },
  { url: "https://videos.pexels.com/video-files/1918465/1918465-hd_1280_720_25fps.mp4", name: "Diving in the Deep" },
];

export function ReelViewer({ boatId, onClose }: { boatId?: string; onClose: () => void }) {
  const [videos, setVideos]   = useState<{ url: string; name: string }[]>(DEMO_VIDEOS);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(!!boatId);
  const [muted, setMuted]     = useState(true);
  const [isDemo, setIsDemo]   = useState(true);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const touchStart = useRef(0);

  useEffect(() => {
    if (!boatId) {
      setVideos(DEMO_VIDEOS);
      setIsDemo(true);
      setLoading(false);
      return;
    }
    fetch(`/api/boats/${boatId}`)
      .then(r => r.json())
      .then(d => {
        const vids = (d.videos ?? []).slice().sort((a: { order: number }, b: { order: number }) => a.order - b.order);
        if (vids.length > 0) { setVideos(vids); setIsDemo(false); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [boatId]);

  // Reload + play on clip change, auto-advance to next when ended
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
    const onEnded = () => setCurrent(c => (c + 1) % videos.length);
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [current, videos.length]);

  // Keyboard navigation
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if ((e.key === "ArrowRight" || e.key === "ArrowDown") && current < videos.length - 1) setCurrent(c => c + 1);
      if ((e.key === "ArrowLeft"  || e.key === "ArrowUp")   && current > 0)                 setCurrent(c => c - 1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, current, videos.length]);

  const goNext = () => { if (current < videos.length - 1) setCurrent(c => c + 1); };
  const goPrev = () => { if (current > 0)                 setCurrent(c => c - 1); };

  // Tap left half = prev, right half = next
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.clientX < e.currentTarget.offsetWidth / 2 ? goPrev() : goNext();
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    const delta = touchStart.current - e.changedTouches[0].clientY;
    if (delta >  60) goNext();
    if (delta < -60) goPrev();
  };

  const video = videos[current];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "#000", display: "flex", flexDirection: "column", animation: "reelFadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
      <style>{`@keyframes reelFadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }`}</style>

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "env(safe-area-inset-top, 16px) 16px 0", paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
        <button onClick={onClose} style={{ background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", width: 38, height: 38, borderRadius: "50%", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>←</button>
        {videos.length > 1 && (
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, background: "rgba(0,0,0,0.35)", padding: "4px 12px", borderRadius: 20, backdropFilter: "blur(6px)" }}>
            {current + 1} / {videos.length}
          </span>
        )}
        <button onClick={() => setMuted(m => !m)} style={{ background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
          {muted ? (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          )}
        </button>
      </div>

      {/* Video area */}
      <div
        style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div style={{ color: "#444", fontSize: 14 }}>กำลังโหลด...</div>
        ) : (
          <>
            <video
              ref={videoRef}
              key={video.url}
              src={video.url}
              autoPlay
              playsInline
              muted={muted}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />

            {/* Side dot indicators */}
            {videos.length > 1 && (
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 6 }}>
                {videos.map((_, i) => (
                  <div key={i}
                    onClick={e => { e.stopPropagation(); setCurrent(i); }}
                    style={{ width: 3, height: i === current ? 22 : 6, borderRadius: 2, background: i === current ? "#fff" : "rgba(255,255,255,0.3)", transition: "height 0.25s, background 0.25s", cursor: "pointer" }}
                  />
                ))}
              </div>
            )}

            {/* Prev/Next tap zones hint (mobile) */}
            {videos.length > 1 && (
              <>
                <div style={{ position: "absolute", left: 0, top: 0, width: "45%", height: "100%" }} />
                <div style={{ position: "absolute", right: 0, top: 0, width: "45%", height: "100%" }} />
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom overlay — demo message only */}
      {isDemo && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "60px 20px 40px", background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)", pointerEvents: "none" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Demo · จะแสดงวิดีโอจริงเมื่ออัปโหลดแล้ว</span>
        </div>
      )}
    </div>
  );
}

// ── InfoModal — fullscreen ─────────────────────────────────────────────────────

type BoatTranslation = { lang: string; title: string; excerpt: string; content: string; keywords: string[] };
type BoatPriceTier   = { tier: string; regularPrice: number; salePrice: number | null };
type PackageTranslation = { lang: string; title: string; excerpt: string; content: string; itinerary: string; route: string };
type PackageData = {
  id: string;
  name: string;
  totalSeats: number | null;
  photos: string[];
  translations: PackageTranslation[];
  priceTiers: { tier: string; regularPrice: number; salePrice: number | null }[];
  seasonPeriods: { season: string; startDate: string; endDate: string }[];
};

// For seasonal packages, priceTier.tier stores the season name (HIGH_SEASON,
// PEAK_SEASON, GREEN_SEASON, ALL_SEASON). seasonPeriods defines date ranges per
// season. Pick the lowest price among tiers that match seasons whose date
// range covers today; fall back to ALL_SEASON, then any tier.
function getCurrentPackageMinPrice(pkg: PackageData): number | null {
  const now = Date.now();
  const activeSeasons = (pkg.seasonPeriods || [])
    .filter(p => {
      const start = new Date(p.startDate).getTime();
      const end   = new Date(p.endDate).getTime();
      return now >= start && now <= end;
    })
    .map(p => p.season);

  let candidates = pkg.priceTiers.filter(t =>
    activeSeasons.includes(t.tier) || t.tier === "ALL_SEASON"
  );
  if (candidates.length === 0) candidates = pkg.priceTiers;

  const prices = candidates
    .map(t => t.salePrice ?? t.regularPrice)
    .filter(n => n > 0);
  return prices.length ? Math.min(...prices) : null;
}
type ScheduleTranslation = { lang: string; title: string; excerpt: string; content: string; itinerary: string; route: string };
type ScheduleData = {
  id: string;
  departureDate: string | null;
  returnDate: string | null;
  status: string;
  translations: ScheduleTranslation[];
  packages: { packageId: string; availableSeats: number | null; isFull: boolean; appendScheduleDetail: boolean; priceTiers: { tier: string; regularPrice: number; salePrice: number | null }[] }[];
};
type BoatData = {
  id: string;
  name: string;
  capacity: number | null;
  type: string;
  photos: string[];
  covers: string[];
  videos: { url: string; name: string }[];
  translations: BoatTranslation[];
  priceTiers: BoatPriceTier[];
  packages: PackageData[];
  schedules: ScheduleData[];
};

function pickTrans<T extends { lang: string }>(arr: T[] | undefined, lang: string): T | undefined {
  if (!arr || !arr.length) return undefined;
  return arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];
}

const formatPrice = (n: number) => `฿${n.toLocaleString()}`;

const TRIP_TYPES_WITH_DATE_PICKER = ["DAYTRIP", "SNORKELING", "LAND_TOUR"];
const BOAT_TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Scuba Day Trips",
  SNORKELING: "Snorkeling",
  LAND_TOUR: "Land Tour",
  LIVEABOARD: "Liveaboard",
  DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive",
  SCUBA_COURSES: "Scuba Courses",
  FREEDIVE_COURSES: "Freedive Courses",
  SCUBA_INSTRUCTOR: "Scuba Dive Instructor",
  FREEDIVE_INSTRUCTOR: "Freedive Instructor",
};
const todayISO = () => new Date().toISOString().slice(0, 10);

// ── GallerySlider — horizontal thumbnail strip ───────────────────────────────
function GallerySlider({ photos }: { photos: string[] }) {
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const viewTrackRef = useRef<HTMLDivElement>(null);
  const touchStartX  = useRef(0);
  const touchStartY  = useRef(0);
  const swiping      = useRef(false);

  // Scroll fullscreen viewer to selected image
  useEffect(() => {
    if (viewIdx == null || !viewTrackRef.current) return;
    const el = viewTrackRef.current;
    el.scrollTo({ left: viewIdx * el.clientWidth, behavior: "instant" as ScrollBehavior });
  }, [viewIdx]);

  const closeViewer = () => setViewIdx(null);

  const onViewTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = false;
  };
  const onViewTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > dy && dx > 10) swiping.current = true;
  };
  const onViewTouchEnd = () => {
    if (swiping.current) {
      // Snap to nearest after swipe
      const el = viewTrackRef.current;
      if (el) {
        const w = el.clientWidth;
        const idx = Math.round(el.scrollLeft / w);
        el.scrollTo({ left: idx * w, behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <div className="gallery-strip" style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        padding: "12px 16px",
        background: "#0a0a0a",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
      }}>
        <style>{`.gallery-strip::-webkit-scrollbar { display: none; }
.viewer-track::-webkit-scrollbar { display: none; }`}</style>
        {photos.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            onClick={() => setViewIdx(i)}
            style={{
              width: 130,
              height: 90,
              objectFit: "cover",
              borderRadius: 8,
              flexShrink: 0,
              cursor: "pointer",
              border: "1px solid #1f1f1f",
              transition: "transform 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.borderColor = "#3b82f6"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "#1f1f1f"; }}
          />
        ))}
      </div>

      {/* Fullscreen swipeable viewer */}
      {viewIdx != null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1050, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column" }}>
          {/* Close + counter */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
              {(viewTrackRef.current ? Math.round(viewTrackRef.current.scrollLeft / viewTrackRef.current.clientWidth) : viewIdx) + 1} / {photos.length}
            </span>
            <button onClick={closeViewer}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ×
            </button>
          </div>

          {/* Swipeable track */}
          <div
            ref={viewTrackRef}
            className="viewer-track"
            onTouchStart={onViewTouchStart}
            onTouchMove={onViewTouchMove}
            onTouchEnd={onViewTouchEnd}
            onScroll={() => {
              // Force re-render for counter update
              const el = viewTrackRef.current;
              if (el) {
                const idx = Math.round(el.scrollLeft / el.clientWidth);
                if (idx !== viewIdx) setViewIdx(idx);
              }
            }}
            style={{
              flex: 1,
              display: "flex",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {photos.map((src, i) => (
              <div key={i} style={{ width: "100vw", height: "100%", flexShrink: 0, scrollSnapAlign: "start", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
              </div>
            ))}
          </div>

          {/* Arrow buttons (desktop) */}
          <button onClick={() => { const n = ((viewIdx ?? 0) - 1 + photos.length) % photos.length; setViewIdx(n); viewTrackRef.current?.scrollTo({ left: n * (viewTrackRef.current?.clientWidth ?? 0), behavior: "smooth" }); }}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            ‹
          </button>
          <button onClick={() => { const n = ((viewIdx ?? 0) + 1) % photos.length; setViewIdx(n); viewTrackRef.current?.scrollTo({ left: n * (viewTrackRef.current?.clientWidth ?? 0), behavior: "smooth" }); }}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            ›
          </button>
        </div>
      )}
    </>
  );
}

export function InfoModal({ trip, lang = "en", onClose }: { trip: Trip; lang?: string; onClose: () => void }) {
  const [boat, setBoat]         = useState<BoatData | null>(null);
  const [loading, setLoading]   = useState<boolean>(!!trip.boatId);
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [showVideos, setShowVideos]   = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  // Lock body scroll while InfoModal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    if (!trip.boatId) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    fetch(`/api/public/boats/${trip.boatId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive) { setBoat(d); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [trip.boatId]);

  const boatTrans = pickTrans(boat?.translations, lang);
  const title     = boatTrans?.title || trip.title;
  const excerpt   = boatTrans?.excerpt || trip.description || "";
  const content   = boatTrans?.content || "";
  const keywords  = boatTrans?.keywords || [];

  // Determine which packages are currently visible based on date selection,
  // then compute the lowest price among them so the hero meta can stay in
  // sync with what the user is actually looking at.
  const usesDatePicker = !!boat && TRIP_TYPES_WITH_DATE_PICKER.includes(boat.type);
  const matchingSchedules = usesDatePicker && boat
    ? boat.schedules.filter(s => s.departureDate && s.departureDate.slice(0, 10) === selectedDate)
    : [];
  const visiblePackageIds = usesDatePicker
    ? new Set(matchingSchedules.flatMap(s => s.packages.map(p => p.packageId)))
    : null;
  const visiblePackages = boat
    ? (usesDatePicker ? boat.packages.filter(p => visiblePackageIds!.has(p.id)) : boat.packages)
    : [];
  const heroMinPrice = (() => {
    const prices = visiblePackages
      .map(p => getCurrentPackageMinPrice(p))
      .filter((n): n is number => n != null && n > 0);
    if (prices.length) return Math.min(...prices);
    if (trip.price != null && trip.price > 0) return trip.price;
    return null;
  })();
  const todayLabel = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

  return (
    <>
    {/* Fixed back button — outside animated container so position:fixed works */}
    <div style={{ position: "fixed", top: 16, left: 16, zIndex: 1032 }}>
      <button onClick={onClose}
        style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
        ←
      </button>
    </div>

    <div style={{ position: "fixed", inset: 0, zIndex: 1030, background: "#0d0d0d", color: "#e5e5e5", overflowY: "auto", animation: "infoSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both" }}>
      <style>{`
        @keyframes infoSlideUp { from { opacity: 0; } to { opacity: 1; } }
        .rich-content { font-size: 15px; color: #bbb; line-height: 1.8; }
        .rich-content p { margin: 0 0 14px; }
        .rich-content p:last-child { margin-bottom: 0; }
        .rich-content h1, .rich-content h2, .rich-content h3, .rich-content h4 {
          color: #f5f5f5; font-weight: 800; margin: 22px 0 10px; line-height: 1.3;
        }
        .rich-content h1 { font-size: 22px; }
        .rich-content h2 { font-size: 19px; }
        .rich-content h3 { font-size: 16px; }
        .rich-content h4 { font-size: 14px; }
        .rich-content ul, .rich-content ol { margin: 0 0 14px; padding-left: 22px; }
        .rich-content li { margin-bottom: 6px; }
        .rich-content a { color: #60a5fa; text-decoration: underline; }
        .rich-content strong, .rich-content b { color: #e5e5e5; font-weight: 700; }
        .rich-content em, .rich-content i { font-style: italic; }
        .rich-content blockquote {
          margin: 14px 0; padding: 10px 16px; border-left: 3px solid #3b82f6;
          background: #1a1a1a; color: #ccc; border-radius: 0 8px 8px 0;
        }
        .rich-content img { max-width: 100%; border-radius: 10px; margin: 12px 0; }
        .rich-content code {
          background: #1a1a1a; padding: 2px 6px; border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px;
        }
        .rich-content pre {
          background: #141414; border: 1px solid #262626; border-radius: 10px;
          padding: 14px; overflow-x: auto; margin: 14px 0;
        }
        .rich-content pre code { background: transparent; padding: 0; }
        .rich-content hr { border: none; border-top: 1px solid #262626; margin: 18px 0; }
        .rich-content.small { font-size: 13px; line-height: 1.7; }
      `}</style>
      {/* Hero */}
      <div style={{ position: "relative", height: "50vh", minHeight: 280 }}>
        {trip.imageUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={trip.imageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#0f172a,#1e3a5f)" }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0d0d0d 0%, rgba(13,13,13,0.6) 40%, transparent 75%)" }} />

        {/* Type badge — scrolls with content */}
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 12px", borderRadius: 20, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(6px)" }}>
            {boat ? (BOAT_TYPE_LABEL[boat.type] || boat.type) : (trip.type === "LIVEABOARD" ? "Liveaboard" : "Scuba Day Trips")}
          </span>
        </div>

        {/* Play button — only when boat has videos */}
        {boat && boat.videos && boat.videos.length > 0 && (
          <button
            onClick={() => setShowVideos(true)}
            aria-label="Play video"
            style={{
              position: "absolute",
              top: "38%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 76,
              height: 76,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              border: "2px solid rgba(255,255,255,0.85)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(6px)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              transition: "transform 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.08)"; e.currentTarget.style.background = "rgba(59,130,246,0.75)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)"; e.currentTarget.style.background = "rgba(0,0,0,0.55)"; }}
          >
            <svg width={32} height={32} viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          </button>
        )}

        {/* Compact meta — overlay bottom-right of hero image */}
        <div style={{ position: "absolute", right: 16, bottom: 16, display: "flex", flexDirection: "column", gap: 6, minWidth: 130, zIndex: 2 }}>
          {[
            { label: "ระยะเวลา",   value: trip.duration },
            { label: "ราคาเริ่มต้น", value: heroMinPrice != null ? formatPrice(heroMinPrice) : "ติดต่อสอบถาม" },
            ...(boat?.capacity ? [{ label: "ที่นั่ง", value: `${boat.capacity}` }] : []),
          ].map(m => (
            <div key={m.label} style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: 8,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#60a5fa" }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Slider — boat photos */}
      {boat && boat.photos.length > 0 && <GallerySlider photos={boat.photos} />}

      {/* Body */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px 80px" }}>
        {/* Title block */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{trip.destinationName}</p>
          <h1 style={{ fontSize: "clamp(1.5rem,5vw,2.4rem)", fontWeight: 900, lineHeight: 1.15, color: "#f5f5f5" }}>{title}</h1>
        </div>

        {excerpt && (
          <div className="rich-content" style={{ marginBottom: 22 }} dangerouslySetInnerHTML={{ __html: excerpt }} />
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#555", fontSize: 13 }}>กำลังโหลด...</div>
        )}

        {/* Packages — collapsible accordion */}
        {boat && boat.packages.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>แพ็กเกจที่มีให้เลือก</h2>
              <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 20, padding: "3px 10px" }}>{visiblePackages.length} แพ็กเกจ</span>
            </div>

            {/* Date picker — for daytrip / snorkeling / land-tour */}
            {usesDatePicker && (
              <div style={{ marginBottom: 14, padding: "12px 14px", background: "#141414", border: "1px solid #1f1f1f", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <label style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  เลือกวันที่
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={todayISO()}
                  onChange={e => { setSelectedDate(e.target.value); setExpandedPkg(null); }}
                  style={{ background: "#0d0d0d", border: "1px solid #262626", borderRadius: 8, color: "#f5f5f5", fontSize: 13, padding: "8px 12px", outline: "none", colorScheme: "dark", flex: 1, minWidth: 160 }}
                />
                <span style={{ fontSize: 11, color: "#666" }}>วันนี้ {todayLabel}</span>
              </div>
            )}

            {/* Schedule excerpt for the selected date */}
            {usesDatePicker && matchingSchedules.length > 0 && (() => {
              const sExcerpt = pickTrans(matchingSchedules[0].translations, lang)?.excerpt || "";
              if (!sExcerpt) return null;
              return (
                <div style={{ marginBottom: 14, padding: "14px 16px", background: "#141414", border: "1px solid #1f1f1f", borderRadius: 12 }}>
                  <div className="rich-content small" dangerouslySetInnerHTML={{ __html: sExcerpt }} />
                </div>
              );
            })()}

            {visiblePackages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#555", fontSize: 13, background: "#0f0f0f", border: "1px dashed #1f1f1f", borderRadius: 12 }}>
                {usesDatePicker ? "ไม่มี Schedule ในวันที่เลือก ลองเลือกวันที่อื่น" : "ยังไม่มีแพ็กเกจ"}
              </div>
            ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visiblePackages.map(pkg => {
                const pt        = pickTrans(pkg.translations, lang);
                const pTitle    = pt?.title || pkg.name;
                const pExcerpt  = pt?.excerpt || "";
                const pContent  = pt?.content || "";
                const pItin     = pt?.itinerary || "";
                const pRoute    = pt?.route || "";
                const cover     = pkg.photos[0];
                const minPrice  = getCurrentPackageMinPrice(pkg);
                const hasSale   = pkg.priceTiers.some(t => t.salePrice != null && t.salePrice < t.regularPrice);
                // Check if this package is marked FULL in any matching schedule
                const pkgIsFull = usesDatePicker && matchingSchedules.some(s => s.packages.some(p => p.packageId === pkg.id && p.isFull));
                const isOpen    = expandedPkg === pkg.id;
                return (
                  <div key={pkg.id} style={{
                    background: isOpen ? "#161616" : "#121212",
                    border: `1px solid ${isOpen ? "#2a3a52" : "#1f1f1f"}`,
                    borderRadius: 14,
                    overflow: "hidden",
                    transition: "background 0.25s, border-color 0.25s",
                  }}>
                    {/* Compact header — always visible, click to expand */}
                    <button
                      onClick={() => setExpandedPkg(isOpen ? null : pkg.id)}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        padding: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        cursor: "pointer",
                        textAlign: "left",
                        color: "inherit",
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ width: 84, height: 84, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#1a1a1a", position: "relative" }}>
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt={pTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}>🤿</div>
                        )}
                      </div>
                      {/* Title */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#f5f5f5", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{pTitle}</h3>
                      </div>
                      {/* Price + chevron */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <div style={{ textAlign: "right" }}>
                          {pkgIsFull ? (
                            <p style={{ fontSize: 14, fontWeight: 900, color: "#ef4444", lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>FULL</p>
                          ) : minPrice != null && minPrice > 0 ? (
                            <>
                              <p style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>เริ่มต้น</p>
                              <p style={{ fontSize: 17, fontWeight: 900, color: "#60a5fa", lineHeight: 1 }}>{formatPrice(minPrice)}</p>
                            </>
                          ) : (
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", lineHeight: 1.2 }}>ติดต่อสอบถาม</p>
                          )}
                        </div>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: isOpen ? "#3b82f6" : "rgba(255,255,255,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff",
                          transition: "background 0.2s, transform 0.3s cubic-bezier(0.22,1,0.36,1)",
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}>
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                      </div>
                    </button>

                    {/* Expanded body */}
                    <div style={{
                      maxHeight: isOpen ? 4000 : 0,
                      opacity: isOpen ? 1 : 0,
                      overflow: "hidden",
                      transition: "max-height 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
                    }}>
                      <div style={{ padding: "0 18px 20px", borderTop: "1px solid #1f1f1f", marginTop: 4 }}>
                        {/* Photo gallery if multiple */}
                        {pkg.photos.length > 1 && (
                          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 16, marginBottom: 16 }}>
                            {pkg.photos.slice(0, 8).map((p, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={p} alt="" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                            ))}
                          </div>
                        )}

                        {pExcerpt && (
                          <div style={{ paddingTop: pkg.photos.length > 1 ? 0 : 16, marginBottom: 14 }}>
                            <div className="rich-content small" dangerouslySetInnerHTML={{ __html: pExcerpt }} />
                          </div>
                        )}

                        {pRoute && (
                          <div style={{ marginBottom: 14, padding: "12px 14px", background: "#0f0f0f", border: "1px solid #1f1f1f", borderRadius: 10 }}>
                            <p style={{ fontSize: 10, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              เส้นทาง
                            </p>
                            <div className="rich-content small" dangerouslySetInnerHTML={{ __html: pRoute }} />
                          </div>
                        )}

                        {pItin && (
                          <div style={{ marginBottom: 14 }}>
                            <p style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              โปรแกรมการเดินทาง
                            </p>
                            <div className="rich-content small" dangerouslySetInnerHTML={{ __html: pItin }} />
                          </div>
                        )}

                        {pContent && !pItin && (
                          <div style={{ marginBottom: 14 }}>
                            <div className="rich-content small" dangerouslySetInnerHTML={{ __html: pContent }} />
                          </div>
                        )}

                        {/* Append schedule detail if checkbox was set in backoffice */}
                        {usesDatePicker && matchingSchedules.length > 0 && (() => {
                          const sp = matchingSchedules[0].packages.find(p => p.packageId === pkg.id);
                          if (!sp?.appendScheduleDetail) return null;
                          const st = pickTrans(matchingSchedules[0].translations, lang);
                          const sContent = st?.content || "";
                          const sItin    = st?.itinerary || "";
                          if (!sContent && !sItin) return null;
                          return (
                            <div style={{ marginTop: 6, paddingTop: 14, borderTop: "1px solid #1f1f1f" }}>
                              <p style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                รายละเอียด Schedule
                              </p>
                              {sContent && <div className="rich-content small" style={{ marginBottom: sItin ? 10 : 0 }} dangerouslySetInnerHTML={{ __html: sContent }} />}
                              {sItin && (
                                <div>
                                  <p style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>โปรแกรม</p>
                                  <div className="rich-content small" dangerouslySetInnerHTML={{ __html: sItin }} />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* Boat description (rich content) */}
        {content && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>รายละเอียด</h2>
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Tags</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {keywords.map(k => (
                <span key={k} style={{ fontSize: 11, color: "#888", background: "#1a1a1a", border: "1px solid #262626", borderRadius: 6, padding: "4px 10px" }}>{k}</span>
              ))}
            </div>
          </div>
        )}

        {!loading && boat && boat.packages.length === 0 && !content && (
          <p style={{ fontSize: 13, color: "#555", textAlign: "center", padding: "24px 0" }}>ยังไม่มีข้อมูลเพิ่มเติม</p>
        )}
      </div>

      {showVideos && trip.boatId && (
        <ReelViewer boatId={trip.boatId} onClose={() => setShowVideos(false)} />
      )}
    </div>
    </>
  );
}

// ── ScheduleSheet — pullup ─────────────────────────────────────────────────────
const STATUS_STYLE_LIGHT: Record<string, { bg: string; color: string }> = {
  OPEN:      { bg: "rgba(34,197,94,0.18)",  color: "#4ade80" },
  FULL:      { bg: "rgba(234,179,8,0.18)",  color: "#facc15" },
  CANCELLED: { bg: "rgba(239,68,68,0.18)",  color: "#f87171" },
  COMPLETED: { bg: "rgba(255,255,255,0.08)", color: "#888" },
  DRAFT:     { bg: "rgba(255,255,255,0.08)", color: "#888" },
};

export function ScheduleSheet({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const [month,     setMonth]     = useState(() => new Date().toISOString().slice(0, 7));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [shareFor,  setShareFor]  = useState<string | null>(null); // schedule id or "trip"
  const pathname = usePathname();
  const lang = pathname?.split("/")[1] || "en";

  const fetchSchedules = useCallback(async () => {
    if (!trip.boatId) return;
    setLoading(true);
    const data = await fetch(`/api/schedules?boatId=${trip.boatId}`).then(r => r.json()).catch(() => []);
    setSchedules(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [trip.boatId]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const filtered = schedules.filter(s => {
    if (!month || !s.departureDate) return true;
    return s.departureDate.slice(0, 7) === month;
  });

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1019, background: "rgba(0,0,0,0.65)" }} />

      {/* Sheet — dark */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1020, background: "#0d0d0d", color: "#e5e5e5", borderRadius: "20px 20px 0 0", height: "60vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 60px rgba(0,0,0,0.7)", border: "1px solid #1f1f1f", borderBottom: "none", animation: "scheduleSheetUp 0.65s cubic-bezier(0.22,1,0.36,1) both" }}>
        <style>{`@keyframes scheduleSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#3a3a3a" }} />
        </div>

        {/* Header — title + month on same line, close right */}
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #1f1f1f", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5", flexShrink: 0 }}>Schedule</div>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ background: "#1a1a1a", border: "1px solid #262626", borderRadius: 8, color: "#f5f5f5", fontSize: 13, padding: "6px 12px", outline: "none", colorScheme: "dark" }} />
          <div style={{ flex: 1 }} />
          <button onClick={() => setShareFor("trip")}
            style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            aria-label="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
          <button onClick={onClose} style={{ background: "#1a1a1a", border: "1px solid #262626", color: "#aaa", width: 28, height: 28, borderRadius: "50%", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 36px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#555", padding: "48px 0", fontSize: 13 }}>กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
              <div style={{ fontSize: 13, color: "#555" }}>{month ? "ไม่พบ Schedule ในเดือนที่เลือก" : "ยังไม่มี Schedule"}</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {filtered.map(s => {
                const st = STATUS_STYLE_LIGHT[s.status] ?? { bg: "rgba(255,255,255,0.08)", color: "#888" };
                return (
                  <div key={s.id} style={{ background: "#1a1a1a", border: "1px solid #262626", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5" }}>{fmtDate(s.departureDate)}</div>
                      {s.returnDate && (
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>ถึง {fmtDate(s.returnDate)}</div>
                      )}
                      {s.availableSeats != null && (
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 5 }}>
                          ว่าง {s.availableSeats}{s.totalSeats ? `/${s.totalSeats}` : ""} ที่นั่ง
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: st.bg, color: st.color }}>
                        {s.status}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => setShareFor(s.id)}
                          style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.35)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          aria-label="Share this date">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
                            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                          </svg>
                        </button>
                        <a href="https://lin.ee/wayWuGH" target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "#3b82f6", borderRadius: 7, padding: "6px 16px", textDecoration: "none" }}>
                          จอง
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {shareFor && (
        <ShareMenu
          url={typeof window !== "undefined"
            ? `${window.location.origin}/${lang}/trips/${trip.slug}${shareFor !== "trip" ? `?schedule=${shareFor}` : ""}`
            : `/${lang}/trips/${trip.slug}`}
          title={trip.title}
          onClose={() => setShareFor(null)}
        />
      )}
    </>
  );
}

// ── ShareMenu ─────────────────────────────────────────────────────────────────
function ShareMenu({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [
    {
      name: "Facebook",
      color: "#1877f2",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: "WhatsApp",
      color: "#25d366",
      href: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      name: "LINE",
      color: "#06c755",
      href: `https://line.me/R/msg/text/?${encodeURIComponent(title + " " + url)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
      ),
    },
    {
      name: "WeChat",
      color: "#07c160",
      href: `weixin://dl/moments`,
      onClick: copyUrl,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.11.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-3.85 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm5.351 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
        </svg>
      ),
    },
    {
      name: "X",
      color: "#000",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: "Messenger",
      color: "#0084ff",
      href: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=966242223397117&redirect_uri=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.733 8.6l3.13 3.259 5.89-3.259-6.56 6.363z"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "fixed", bottom: 80, right: 16, zIndex: 151, background: "#1e1e1e", borderRadius: 16, padding: "16px", boxShadow: "0 8px 40px rgba(0,0,0,0.8)", minWidth: 220, animation: "shareIn 0.2s ease both" }}>
        <style>{`@keyframes shareIn { from { opacity:0; transform:scale(0.9) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>แชร์</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
          {platforms.map(p => (
            <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer"
              onClick={p.onClick ? (e) => { e.preventDefault(); p.onClick?.(); } : undefined}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, textDecoration: "none" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: p.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.icon}
              </div>
              <span style={{ fontSize: 9, color: "#666", fontWeight: 600 }}>{p.name}</span>
            </a>
          ))}
        </div>
        <button onClick={copyUrl} style={{ width: "100%", background: "#2a2a2a", border: "1px solid #333", borderRadius: 10, color: copied ? "#4ade80" : "#ccc", fontSize: 13, fontWeight: 600, padding: "10px 0", cursor: "pointer", transition: "color 0.2s" }}>
          {copied ? "คัดลอกแล้ว!" : "คัดลอก URL"}
        </button>
      </div>
    </>
  );
}

// ── TripPullUp — main ─────────────────────────────────────────────────────────
export default function TripPullUp({ trip, onClose }: { trip: Trip | null; onClose: () => void }) {
  const [showInfo,     setShowInfo]     = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReel,     setShowReel]     = useState(false);
  const [showShare,    setShowShare]    = useState(false);
  const pathname = usePathname();
  const lang = pathname?.split("/")[1] || "en";

  // Reset sub-views when trip changes
  useEffect(() => { setShowInfo(false); setShowSchedule(false); setShowReel(false); setShowShare(false); }, [trip]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = trip ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [trip]);

  // Escape closes sub-views first, then the pullup
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showReel)     { setShowReel(false);     return; }
      if (showInfo)     { setShowInfo(false);     return; }
      if (showSchedule) { setShowSchedule(false); return; }
      if (showShare)    { setShowShare(false);    return; }
      onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, showReel, showInfo, showSchedule, showShare]);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.75)", transition: "opacity 0.3s", opacity: trip ? 1 : 0, pointerEvents: trip ? "auto" : "none" }} />

      {/* Main sheet */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 111, background: "#161616", borderRadius: "20px 20px 0 0", transition: "transform 0.65s cubic-bezier(0.22,1,0.36,1)", transform: trip ? "translateY(0)" : "translateY(100%)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 -8px 60px rgba(0,0,0,0.6)" }}>
        {trip && (
          <>
            {/* Hero image */}
            <div style={{ position: "relative", height: 220, overflow: "hidden", borderRadius: "20px 20px 0 0" }}>
              {trip.imageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={trip.imageUrl} alt={trip.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#0f172a,#1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🤿</div>
              }
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #161616 0%, transparent 60%)" }} />
              {/* Top-right action buttons */}
              <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 8 }}>
                {/* Fullscreen — open info page in new tab */}
                <a href={`/${lang}/trips/${trip.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", textDecoration: "none" }}
                  aria-label="Open full page">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                </a>
                {/* Share */}
                <button onClick={() => setShowShare(s => !s)}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: showShare ? "rgba(59,130,246,0.6)" : "rgba(0,0,0,0.5)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", cursor: "pointer" }}
                  aria-label="Share">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </button>
                {/* Close */}
                <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>×</button>
              </div>
              <div style={{ position: "absolute", top: 14, left: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
                  {trip.type === "LIVEABOARD" ? "Liveaboard" : "Daytrip"}
                </span>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "20px 24px 36px" }}>
              <p style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{trip.destinationName}</p>
              <h2 style={{ fontSize: "clamp(1.2rem,5vw,1.6rem)", fontWeight: 900, lineHeight: 1.2, marginBottom: 14, color: "#fff" }}>{trip.title}</h2>

              <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 10, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>ระยะเวลา</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#ccc" }}>{trip.duration}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>ราคาเริ่มต้น</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: "#60a5fa" }}>฿{trip.price.toLocaleString()}</p>
                </div>
              </div>

              {trip.description && (
                <p style={{ fontSize: 14, color: "#888", lineHeight: 1.65, marginBottom: 24 }}>{trip.description}</p>
              )}

              {/* CTA buttons */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={() => setShowInfo(true)}
                  style={{ flex: 1, background: "#3b82f6", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 0", borderRadius: 10, cursor: "pointer" }}>
                  Information
                </button>
                <button onClick={() => setShowSchedule(true)}
                  style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 0", borderRadius: 10, cursor: "pointer" }}>
                  Schedule
                </button>
                {/* Clip video icon */}
                <button onClick={() => setShowReel(true)}
                  style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                  aria-label="Video clip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M2 7l4-5h12l4 5"/>
                    <path d="M7 2l-2 5M12 2l-2 5M17 2l-2 5"/>
                    <polygon points="10,11 10,17 16,14" fill="currentColor" stroke="none"/>
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info modal */}
      {trip && showInfo && <InfoModal trip={trip} lang={lang} onClose={() => setShowInfo(false)} />}

      {/* Schedule sheet */}
      {trip && showSchedule && <ScheduleSheet trip={trip} onClose={() => setShowSchedule(false)} />}

      {/* Reel viewer */}
      {trip && showReel && <ReelViewer boatId={trip.boatId} onClose={() => setShowReel(false)} />}

      {/* Share menu */}
      {trip && showShare && (
        <ShareMenu
          url={typeof window !== "undefined" ? `${window.location.origin}/${lang}/trips/${trip.slug}` : `/${lang}/trips/${trip.slug}`}
          title={trip.title}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
