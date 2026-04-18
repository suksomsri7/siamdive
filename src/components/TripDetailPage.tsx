"use client";

import { useRouter } from "next/navigation";
import { InfoModal, type Trip } from "./TripPullUp";

export default function TripDetailPage({ trip, lang }: { trip: Trip; lang: string }) {
  const router = useRouter();
  return (
    <InfoModal
      trip={trip}
      lang={lang}
      onClose={() => {
        // Prefer back navigation so share-recipients who landed directly can
        // still exit the page (history.length === 1). Fallback: home.
        if (window.history.length > 1) router.back();
        else router.push(`/${lang}`);
      }}
    />
  );
}
