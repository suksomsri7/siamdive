"use client";

import { useEffect, useState } from "react";
import TripCard from "./TripCard";
import { readRecentBoatEntries } from "@/lib/recentlyViewed";
import { formatDateLabel } from "@/lib/formatDate";
import { trackRowClick, trackTripView } from "@/lib/analytics/client";

export type RecentBoat = {
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
  // ISO departure date captured at view time — displayed on the card so
  // the user can distinguish the same boat on different departures.
  departureDate?: string;
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

export default function RecentlyViewedRow({
  lang,
  onSelect,
  refreshKey = 0,
}: {
  lang: string;
  onSelect: (s: RecentBoat) => void;
  refreshKey?: number;
}) {
  const [boats, setBoats] = useState<RecentBoat[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const entries = readRecentBoatEntries();
    if (!entries.length) {
      setLoaded(true);
      return;
    }
    const ids = entries.map((e) => e.id);
    fetch(
      `/api/boats/by-ids?ids=${encodeURIComponent(ids.join(","))}&lang=${encodeURIComponent(lang)}`,
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data: RecentBoat[]) => {
        const rows = Array.isArray(data) ? data : [];
        const depById = new Map(entries.map((e) => [e.id, e.dep]));
        setBoats(rows.map((b) => ({ ...b, departureDate: depById.get(b.boatId) })));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [lang, refreshKey]);

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
            lang={lang}
            dateLabel={b.departureDate ? formatDateLabel(b.departureDate, lang) : undefined}
            onClick={() => {
              trackRowClick(SECTION_ID, "TRIP", b.id, idx + 1);
              trackTripView(b.boatId, { source: "row", rowId: SECTION_ID });
              onSelect(b);
            }}
          />
        ))}
      </div>
    </section>
  );
}
