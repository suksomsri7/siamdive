"use client";

import { useEffect, useState } from "react";
import TripCard from "./TripCard";
import { readRecentlyViewed } from "@/lib/recentlyViewed";
import { trackRowClick, trackTripView } from "@/lib/analytics/client";

type Boat = {
  id: string;
  slug: string;
  title: string;
  price: number;
  type: "DAYTRIP" | "LIVEABOARD";
  destinationName: string;
  imageUrl?: string;
  covers?: string[];
  boatType?: string;
};

const TITLES: Record<string, string> = {
  en: "Recently Viewed",
  th: "ทริปที่เคยดู",
  cn: "最近浏览",
  ja: "最近見たツアー",
  ko: "최근 본 투어",
  de: "Zuletzt angesehen",
  fr: "Vus récemment",
  ru: "Недавно просмотренные",
};

const SECTION_ID = "recently-viewed";

export type RecentlyViewedClickPayload = Boat;

export default function RecentlyViewedRow({
  lang,
  onSelect,
}: {
  lang: string;
  onSelect: (b: Boat) => void;
}) {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const ids = readRecentlyViewed();
    if (!ids.length) {
      setLoaded(true);
      return;
    }
    fetch(`/api/trips/by-ids?ids=${encodeURIComponent(ids.join(","))}&lang=${encodeURIComponent(lang)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Boat[]) => {
        setBoats(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [lang]);

  if (!loaded || boats.length === 0) return null;

  return (
    <section className="mb-8 group/row">
      <div className="px-4 sm:px-10 mb-2">
        <h2 className="text-sm sm:text-base font-semibold tracking-wide text-gray-100">
          {TITLES[lang] || TITLES.en}
        </h2>
      </div>
      <div
        className="flex gap-2 overflow-x-auto row-scroll pl-4 sm:pl-10 pr-4"
        style={{ overflowY: "visible", paddingBottom: 8, paddingTop: 4 }}
      >
        {boats.map((b, idx) => (
          <TripCard
            key={b.id}
            slug={b.slug}
            title={b.title}
            price={b.price}
            duration=""
            type={b.type}
            destinationName={b.destinationName}
            imageUrl={b.imageUrl}
            covers={b.covers}
            boatType={b.boatType}
            variant="vertical"
            onClick={() => {
              trackRowClick(SECTION_ID, "TRIP", b.id, idx + 1);
              trackTripView(b.id, { source: "row", rowId: SECTION_ID });
              onSelect(b);
            }}
          />
        ))}
      </div>
    </section>
  );
}
