"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import TripCard from "./TripCard";
import { InfoModal, type Trip } from "./TripPullUp";
import HeroSlider from "./HeroSlider";

export type Section = {
  id:       string;
  layout:   string;
  title:    string;
  subtitle?: string;
  trips: {
    id: string; slug: string; title: string; price: number;
    duration: string; type: "DAYTRIP" | "LIVEABOARD";
    destinationName: string; imageUrl?: string; covers?: string[]; description?: string; boatId?: string; boatType?: string; hasVideos?: boolean;
  }[];
  blogs: {
    id: string; slug: string; title: string; excerpt: string; cover: string;
  }[];
};

type SelectedTrip = {
  slug: string; title: string; description?: string; price: number;
  duration: string; type: "DAYTRIP" | "LIVEABOARD"; destinationName: string; imageUrl?: string; boatId?: string;
};

export default function HomeContent({ sections, lang }: { sections: Section[]; lang: string }) {
  const [selected, setSelected] = useState<SelectedTrip | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!sections.length) return null;

  return (
    <>
      <div style={{ marginTop: 40, position: "relative", zIndex: 2 }}>
        {sections.map(section => {
          const hasSomething = section.trips.length > 0 || section.blogs.length > 0;
          if (!hasSomething) return null;

          // ── FULL layout (HeroSlider) ──────────────────────────────────────
          if (section.layout === "FULL" && section.trips.length > 0) {
            return (
              <HeroSlider
                key={section.id}
                lang={lang}
                slides={section.trips.map(t => ({
                  slug: t.slug,
                  title: t.title,
                  description: t.description || "",
                  duration: t.duration,
                  destinationName: t.destinationName,
                  imageUrl: t.imageUrl || "",
                  covers: t.covers && t.covers.length ? t.covers : (t.imageUrl ? [t.imageUrl] : []),
                  type: t.type,
                  price: t.price,
                  boatId: t.boatId,
                  boatType: t.boatType,
                  hasVideos: t.hasVideos,
                }))}
              />
            );
          }

          // ── BLOG row (Horizontal) — only when no trips in this row ──────────
          if (section.blogs.length > 0 && section.trips.length === 0) {
            return (
              <section key={section.id} className="mb-12">
                <div className="px-4 sm:px-10 flex flex-col mb-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm sm:text-base font-semibold tracking-wide" style={{ color: "#e5e5e5" }}>
                      {section.title}
                    </h2>
                    <Link href={`/${lang}/blogs`}
                      className="text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all"
                      style={{ color: "#60a5fa" }}>
                      ดูทั้งหมด <span aria-hidden>&rsaquo;</span>
                    </Link>
                  </div>
                  {section.subtitle && (
                    <p style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{section.subtitle}</p>
                  )}
                </div>
                <div className="flex gap-3 overflow-x-auto row-scroll pl-4 sm:pl-10 pr-4 pb-2">
                  {section.blogs.map(b => (
                    <Link key={b.id} href={`/${lang}/blogs/${b.slug}`}
                      className="group flex-shrink-0 overflow-hidden transition-transform hover:scale-[1.04]"
                      style={{ width: "clamp(240px, 28vw, 340px)", background: "#1a1a1a", borderRadius: 12, textDecoration: "none" }}>
                      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                        {b.cover
                          ? <Image src={b.cover} alt={b.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 80vw, 30vw" />
                          : <div style={{ width: "100%", height: "100%", background: "#222" }} />
                        }
                      </div>
                      <div style={{ padding: "14px 16px" }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginBottom: 6, color: "#e5e5e5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.title}</h3>
                        {b.excerpt && (
                          <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.excerpt}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          }

          // ── TRIP row (Vertical or Horizontal) ─────────────────────────────
          const cardVariant = section.layout === "HORIZONTAL" ? "horizontal" : "vertical";
          const tripType = section.trips[0]?.type === "LIVEABOARD" ? "liveaboard" : "daytrip";
          const viewAllHref = `/${lang}/trips/${tripType}`;

          return (
            <section key={section.id} className="mb-8 group/row">
              <div className="px-4 sm:px-10 mb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm sm:text-base font-semibold tracking-wide text-gray-100">
                    {section.title}
                  </h2>
                  <Link href={viewAllHref}
                    className="text-xs font-medium opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
                    style={{ color: "#60a5fa" }}>
                    Explore All &rsaquo;
                  </Link>
                </div>
                {section.subtitle && (
                  <p style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{section.subtitle}</p>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto row-scroll pl-4 sm:pl-10 pr-4"
                style={{ overflowY: "visible", paddingBottom: 8, paddingTop: 4 }}>
                {section.trips.map(trip => (
                  <TripCard
                    key={trip.id}
                    slug={trip.slug}
                    title={trip.title}
                    price={trip.price}
                    duration={trip.duration}
                    type={trip.type}
                    destinationName={trip.destinationName}
                    imageUrl={trip.imageUrl}
                    covers={trip.covers}
                    boatType={trip.boatType}
                    description={trip.description}
                    variant={cardVariant}
                    onClick={() => setSelected({
                      slug: trip.slug, title: trip.title, description: trip.description,
                      price: trip.price, duration: trip.duration, type: trip.type,
                      destinationName: trip.destinationName, imageUrl: trip.imageUrl, boatId: trip.boatId,
                    })}
                  />
                ))}
                {section.blogs.map(b => (
                  <Link key={b.id} href={`/${lang}/blogs/${b.slug}`}
                    className="group flex-shrink-0 overflow-hidden transition-transform hover:scale-[1.04]"
                    style={{ width: "clamp(200px, 22vw, 280px)", background: "#1a1a1a", borderRadius: 12, textDecoration: "none" }}>
                    <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                      {b.cover
                        ? <Image src={b.cover} alt={b.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 80vw, 25vw" />
                        : <div style={{ width: "100%", height: "100%", background: "#222" }} />
                      }
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, color: "#e5e5e5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {mounted && selected && createPortal(
        <InfoModal
          trip={{
            slug: selected.slug, title: selected.title, description: selected.description || "",
            price: selected.price, duration: selected.duration, type: selected.type,
            destinationName: selected.destinationName, imageUrl: selected.imageUrl, boatId: selected.boatId,
          }}
          lang={lang}
          onClose={() => setSelected(null)}
        />,
        document.body
      )}
    </>
  );
}
