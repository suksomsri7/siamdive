"use client";
// Recommended trips (v2 explore KB) — CLIENT-side fetch so the blog page can be
// statically cached (ISR). Previously the page read the currency cookie server-side
// (cookies() → forces dynamic SSR) which meant every bot hit ran the full DB work;
// with ~4k blog URLs being crawled nonstop that alone blew the Supabase egress
// quota. The section now hydrates after load and reads the cookie in the browser.
import { useEffect, useState } from "react";
import Link from "next/link";

type FeaturedTrip = {
  id: string; name: string; slug: string; catSlug: string; path: string;
  area: string | null; country: string | null;
  priceFrom: number | null; priceCurrency: string | null; coverImage: string | null; rating: number | null;
};

const CURRENCY_COOKIE = "pref_currency";

export default function FeaturedTripsSection({ lang }: { lang: string }) {
  const isTH = lang === "th";
  const [trips, setTrips] = useState<FeaturedTrip[]>([]);

  useEffect(() => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]+)`));
    const currency = m ? decodeURIComponent(m[1]) : "";
    const url = `/api/public/featured-explore?take=6${currency ? `&currency=${encodeURIComponent(currency)}` : ""}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.items) setTrips(j.items); })
      .catch(() => { /* feed unavailable → hide the section */ });
  }, []);

  if (!trips.length) return null;
  const tripHref = (path: string) => (isTH ? `/th${path}` : path);

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
          {isTH ? "ทริปแนะนำ" : "Recommended trips"}
        </h2>
        <Link href={isTH ? "/th/explore" : "/explore"} style={{ fontSize: 12, color: "#777", textDecoration: "none" }}>
          {isTH ? "ดูทั้งหมด →" : "See all →"}
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
        {trips.map(t => (
          <Link key={t.id} href={tripHref(t.path)}
            style={{ background: "#121212", borderRadius: 14, overflow: "hidden", border: "1px solid #1c1c1c", textDecoration: "none", display: "block" }}>
            <div style={{ aspectRatio: "16/10", overflow: "hidden", position: "relative", background: "#1a1a1a" }}>
              {t.coverImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={t.coverImage} alt={t.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {t.rating ? (
                <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.7)", color: "#fbbf24", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                  ★ {Math.round(t.rating * 10) / 10}
                </span>
              ) : null}
            </div>
            <div style={{ padding: "12px 14px 16px" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {t.catSlug === "dive-resort" ? (isTH ? "รีสอร์ตดำน้ำ" : "Dive resort") : (isTH ? "เรือไลฟ์อะบอร์ด" : "Liveaboard")}
              </span>
              <h3 style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, color: "#ededed", margin: "4px 0 4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.name}</h3>
              <p style={{ fontSize: 11.5, color: "#666", margin: "0 0 8px" }}>{[t.area, t.country].filter(Boolean).join(", ")}</p>
              {t.priceFrom != null && (
                <p style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", margin: 0 }}>
                  {isTH ? "เริ่ม" : "from"} {t.priceCurrency} {Math.round(t.priceFrom).toLocaleString()}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
