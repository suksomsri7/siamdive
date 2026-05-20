"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlanTimeline from "@/components/ark-ai/plan/PlanTimeline";
import PrepBlock from "@/components/ark-ai/plan/PrepBlock";
import PlanNotificationsBanner from "@/components/ark-ai/plan/PlanNotificationsBanner";
import CompareSheet from "@/components/ark-ai/CompareSheet";
import type { PlanTrip } from "@/lib/plan-store";

type SharedLang = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";
const SHARED_LANGS: { code: SharedLang; label: string; flag: string; native: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧", native: "English"  },
  { code: "th", label: "TH", flag: "🇹🇭", native: "ภาษาไทย"   },
  { code: "cn", label: "CN", flag: "🇨🇳", native: "中文"      },
  { code: "ja", label: "JA", flag: "🇯🇵", native: "日本語"    },
  { code: "ko", label: "KO", flag: "🇰🇷", native: "한국어"    },
  { code: "de", label: "DE", flag: "🇩🇪", native: "Deutsch"  },
  { code: "fr", label: "FR", flag: "🇫🇷", native: "Français" },
  { code: "ru", label: "RU", flag: "🇷🇺", native: "Русский"  },
];

type Trip = {
  boatId: string; title: string; slug?: string; type: string; area?: string; cover?: string;
  addedAt?: number; schedule?: PlanTrip["schedule"]; note?: string;
};

type Props = {
  plan: {
    shortId: string; name: string; coverUrl: string | null;
    status: string; trips: Trip[]; ownerName: string | null;
    followerCount: number;
    viewCount: number;
    shareCount: number;
    createdAt: string;
  };
  currentLang: string;
};

const TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Day Trip", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive", LAND_TOUR: "Land Tour", SNORKELING: "Snorkeling",
};

const STATUS_LABEL: Record<string, { th: string; en: string; color: string }> = {
  PLANNING: { th: "กำลังวางแผน", en: "Planning", color: "#f59e0b" },
  CONFIRMED: { th: "ยืนยันแล้ว", en: "Confirmed", color: "#10b981" },
  COMPLETED: { th: "เสร็จแล้ว", en: "Completed", color: "#8b5cf6" },
};

export default function SharedPlanClient({ plan, currentLang }: Props) {
  const [copied, setCopied] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const isTh = currentLang === "th";
  const router = useRouter();

  const switchLang = (next: SharedLang) => {
    if (next === currentLang) { setLangOpen(false); return; }
    try { document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`; } catch {}
    const path = window.location.pathname + window.location.search;
    const newPath = path.replace(/^\/[a-z]{2}(\/|$)/, `/${next}$1`);
    router.replace(newPath);
    setLangOpen(false);
  };
  const currentLangObj = SHARED_LANGS.find(l => l.code === (currentLang as SharedLang)) || SHARED_LANGS[0];

  const langContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!langOpen) return;
    const fn = (e: MouseEvent) => {
      if (!langContainerRef.current?.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [langOpen]);

  const compareTrips = plan.trips.map(t => ({
    boatId: t.boatId,
    title: t.title,
    type: t.type,
    area: t.area || "",
    cover: t.cover || null,
    schedule: t.schedule
      ? {
          scheduleId: t.schedule.scheduleId,
          departureDate: t.schedule.departureDate,
          returnDate: t.schedule.returnDate,
          route: t.schedule.route,
          priceMin: t.schedule.priceMin,
          priceMax: t.schedule.priceMax,
        }
      : undefined,
  }));

  const cover = plan.coverUrl || plan.trips.find(t => t.cover)?.cover;
  const status = STATUS_LABEL[plan.status] || STATUS_LABEL.PLANNING;
  const createdDate = new Date(plan.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const handleShare = async () => {
    const url = `${location.origin}/${currentLang}/plan/${plan.shortId}`;
    if (navigator.share) {
      await navigator.share({ title: plan.name, text: `${plan.name} — SiamDive`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      {/* Sticky top bar — Ark AI logo on the left, language switcher on
          the right. The public plan view sits outside the main Navbar
          layout, so we carry our own minimal header. */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "10px 14px",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Link href={`/${currentLang}`} aria-label="SIAMDIVE"
            style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ai-mask.png" alt="SIAMDIVE" width={32} height={32} style={{ filter: "brightness(1.1)" }} />
          </Link>
          <div ref={langContainerRef} style={{ position: "relative" }}>
            <button onClick={() => setLangOpen(v => !v)} aria-label="Language"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                fontFamily: "inherit",
              }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#ccc" }}>{currentLangObj.label}</span>
              <svg width="9" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: "transform 0.2s", transform: langOpen ? "rotate(180deg)" : "none" }}>
                <path d="M1 1l4 4 4-4" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {langOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "rgba(13,13,13,0.98)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: 6, minWidth: 170,
                boxShadow: "0 16px 40px rgba(0,0,0,0.6)", zIndex: 200,
              }}>
                {SHARED_LANGS.map(l => (
                  <button key={l.code} onClick={() => switchLang(l.code)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", borderRadius: 8,
                      background: currentLang === l.code ? "rgba(59,130,246,0.15)" : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                      fontFamily: "inherit",
                    }}>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{l.flag}</span>
                    <span style={{ fontSize: 13, color: currentLang === l.code ? "#60a5fa" : "#999", fontWeight: currentLang === l.code ? 700 : 400 }}>{l.native}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#444", fontWeight: 700 }}>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 60px" }}>

        {/* Hero */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg, #0f172a, #1e3a5f)", marginBottom: 20 }}>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${status.color}22`, border: `1px solid ${status.color}44`, padding: "2px 10px", borderRadius: 12, marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: status.color }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: status.color }}>{isTh ? status.th : status.en}</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>{plan.name}</h1>
          </div>
        </div>

        {/* Social stats — Followers / Views / Shares replace the older
            Trips + Members strip per user feedback. */}
        <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 24 }}>
          {[
            { label: isTh ? "ผู้ติดตาม" : "Followers", value: plan.followerCount },
            { label: isTh ? "ผู้เข้าชม" : "Views",     value: plan.viewCount },
            { label: isTh ? "แชร์"      : "Shares",    value: plan.shareCount },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#f5f5f5", margin: 0 }}>
                {s.value.toLocaleString()}
              </p>
              <p style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", margin: "2px 0 0" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Sprint 3 B5 — auto-improve banners */}
        <div style={{ marginBottom: 12, marginLeft: -16, marginRight: -16 }}>
          <PlanNotificationsBanner planId={plan.shortId} lang={currentLang} />
        </div>

        {/* Trips timeline */}
        {plan.trips.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", marginBottom: 10 }}>
              {isTh ? "ทริปในแพลน" : "Trips in this plan"}
            </p>
            {plan.trips.length >= 2 && (
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10, marginBottom: 12,
                  background: "rgba(245,158,11,0.10)",
                  border: "1px solid rgba(245,158,11,0.35)",
                  color: "#fbbf24", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: "inherit",
                }}
              >
                {isTh ? `⚖️ เปรียบเทียบทริปในแพลน (${plan.trips.length})` : `⚖️ Compare trips in plan (${plan.trips.length})`}
              </button>
            )}
            <PlanTimeline
              planId={plan.shortId}
              trips={plan.trips.map(t => ({
                boatId: t.boatId,
                title: t.title,
                slug: t.slug || "",
                type: t.type,
                area: t.area || "",
                cover: t.cover || null,
                addedAt: t.addedAt || 0,
                schedule: t.schedule,
                note: t.note,
              }))}
              lang={currentLang}
              canEdit={false}
            />
            <div style={{ marginTop: 18 }}>
              <PrepBlock
                trips={plan.trips.map(t => ({
                  boatId: t.boatId,
                  title: t.title,
                  slug: t.slug || "",
                  type: t.type,
                  area: t.area || "",
                  cover: t.cover || null,
                  addedAt: t.addedAt || 0,
                  schedule: t.schedule,
                  note: t.note,
                }))}
                lang={currentLang}
              />
            </div>
          </div>
        )}

        {/* Meta */}
        <div style={{ textAlign: "center", fontSize: 11, color: "#444", marginBottom: 24 }}>
          {plan.ownerName && <span>{isTh ? "สร้างโดย" : "Created by"} {plan.ownerName} · </span>}
          <span>{createdDate}</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleShare}
            style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "1px solid #262626", background: "#161616", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {copied ? (isTh ? "คัดลอกลิงก์แล้ว!" : "Link Copied!") : (isTh ? "แชร์" : "Share")}
          </button>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a href={`/${currentLang}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            {isTh ? "สร้างแพลนของคุณเอง" : "Create your own plan with SIAM AI"}
          </a>
        </div>
      </div>
      {compareOpen && compareTrips.length >= 2 && (
        <CompareSheet
          picks={compareTrips}
          lang={currentLang}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  );
}
