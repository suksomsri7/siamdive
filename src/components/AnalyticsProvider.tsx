"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, onRouteChange, setLang } from "@/lib/analytics/client";

export default function AnalyticsProvider({ lang }: { lang?: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initAnalytics(lang ?? null);
  }, [lang]);

  useEffect(() => {
    if (lang) setLang(lang);
  }, [lang]);

  useEffect(() => {
    const path = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    onRouteChange(path);
  }, [pathname, searchParams]);

  return null;
}
