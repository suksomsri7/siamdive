"use client";

import { useEffect, useState } from "react";
import TripCard from "./TripCard";
import { formatDateLabel } from "@/lib/formatDate";
import { trackRowClick, trackTripView } from "@/lib/analytics/client";
import { pushRecentBoat } from "@/lib/recentlyViewed";

type RecommendedTrip = {
  id: string;
  slug: string;
  title: string;
  destinationName: string;
  price: number;
  type: "DAYTRIP" | "LIVEABOARD";
  imageUrl?: string;
  covers?: string[];
  boatType?: string;
  boatId: string;
  nextDeparture?: string;
};

const TITLES: Record<string, string> = {
  en: "Recommended for You",
  th: "ทริปแนะนำสำหรับคุณ",
  cn: "为您推荐",
  ja: "おすすめツアー",
  ko: "추천 투어",
  de: "Empfohlen für dich",
  fr: "Recommandé pour vous",
  ru: "Рекомендовано для вас",
};

const STORAGE_VISITOR = "sd_vid";
const SECTION_ID = "recommended-trips";

export default function RecommendedTripsRow({
  lang,
  onSelect,
  onRecentUpdate,
}: {
  lang: string;
  onSelect: (trip: {
    slug: string;
    title: string;
    price: number;
    type: "DAYTRIP" | "LIVEABOARD";
    destinationName: string;
    imageUrl?: string;
    boatId?: string;
    initialDate?: string;
  }) => void;
  onRecentUpdate?: () => void;
}) {
  const [trips, setTrips] = useState<RecommendedTrip[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const vid =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_VISITOR)
        : null;
    if (!vid) {
      setLoaded(true);
      return;
    }

    fetch(
      `/api/public/recommended-trips?vid=${encodeURIComponent(vid)}&lang=${encodeURIComponent(lang)}`,
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data: RecommendedTrip[]) => {
        setTrips(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [lang]);

  if (!loaded || trips.length === 0) return null;

  return (
    <section className="mb-8 group/row">
      <div className="px-4 sm:px-10 mb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14 }}>✨</span>
          <h2 className="text-sm sm:text-base font-semibold tracking-wide text-gray-100">
            {TITLES[lang] || TITLES.en}
          </h2>
        </div>
      </div>
      <div
        className="flex gap-2 overflow-x-auto row-scroll pl-4 sm:pl-10 pr-4"
        style={{ overflowY: "visible", paddingBottom: 8, paddingTop: 4 }}
      >
        {trips.map((trip, idx) => (
          <TripCard
            key={trip.id}
            slug={trip.slug}
            title={trip.title}
            price={trip.price}
            duration=""
            type={trip.type}
            destinationName={trip.destinationName}
            imageUrl={trip.imageUrl}
            covers={trip.covers}
            boatType={trip.boatType}
            variant="vertical"
            lang={lang}
            dateLabel={
              trip.nextDeparture
                ? formatDateLabel(trip.nextDeparture, lang)
                : undefined
            }
            onClick={() => {
              trackRowClick(SECTION_ID, "TRIP", trip.id, idx + 1);
              trackTripView(trip.boatId, {
                source: "row",
                rowId: SECTION_ID,
              });
              pushRecentBoat(trip.boatId, trip.nextDeparture);
              onRecentUpdate?.();
              onSelect({
                slug: trip.slug,
                title: trip.title,
                price: trip.price,
                type: trip.type,
                destinationName: trip.destinationName,
                imageUrl: trip.imageUrl,
                boatId: trip.boatId,
                initialDate: trip.nextDeparture?.slice(0, 10),
              });
            }}
          />
        ))}
      </div>
    </section>
  );
}
