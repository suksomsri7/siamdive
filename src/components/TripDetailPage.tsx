"use client";

import { useRouter } from "next/navigation";
import { InfoModal, type Trip } from "./TripPullUp";

export default function TripDetailPage({ trip, lang, initialDate }: { trip: Trip; lang: string; initialDate?: string }) {
  const router = useRouter();
  return (
    <InfoModal
      trip={trip}
      lang={lang}
      initialDate={initialDate}
      onClose={() => {
        // Prefer back navigation so share-recipients who landed directly can
        // still exit the page (history.length === 1). Fallback: home.
        if (window.history.length > 1) router.back();
        else router.push(`/${lang}`);
      }}
    />
  );
}
