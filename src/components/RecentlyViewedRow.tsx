"use client";

import { useEffect, useState } from "react";
import TripCard from "./TripCard";
import { readRecentSchedules } from "@/lib/recentlyViewed";
import { formatDateLabel } from "@/lib/formatDate";
import { trackRowClick, trackTripView } from "@/lib/analytics/client";

export type RecentSchedule = {
  id: string;
  scheduleTitle: string;
  slug: string;
  title: string;
  price: number;
  type: "DAYTRIP" | "LIVEABOARD";
  imageUrl?: string;
  covers?: string[];
  boatType?: string;
  boatId: string;
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
}: {
  lang: string;
  onSelect: (s: RecentSchedule) => void;
}) {
  const [schedules, setSchedules] = useState<RecentSchedule[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const ids = readRecentSchedules();
    if (!ids.length) {
      setLoaded(true);
      return;
    }
    fetch(
      `/api/schedules/by-ids?ids=${encodeURIComponent(ids.join(","))}&lang=${encodeURIComponent(lang)}`,
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data: RecentSchedule[]) => {
        setSchedules(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [lang]);

  if (!loaded || schedules.length === 0) return null;

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
        {schedules.map((s, idx) => (
          <TripCard
            key={s.id}
            slug={s.slug}
            title={s.title}
            price={s.price}
            duration=""
            type={s.type}
            destinationName={s.scheduleTitle}
            imageUrl={s.imageUrl}
            covers={s.covers}
            boatType={s.boatType}
            variant="vertical"
            dateLabel={s.departureDate ? formatDateLabel(s.departureDate, lang) : undefined}
            onClick={() => {
              trackRowClick(SECTION_ID, "TRIP", s.id, idx + 1);
              trackTripView(s.boatId, { source: "row", rowId: SECTION_ID });
              onSelect(s);
            }}
          />
        ))}
      </div>
    </section>
  );
}
