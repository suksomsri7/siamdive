"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Plan = {
  shortId: string;
  title: string;
  durationDays: number;
  totalDives: number;
  totalTours: number;
  areas: string[];
  viewCount: number;
  budget: { total?: number };
};

const TITLE: Record<string, string> = {
  th: "แผนดำน้ำยอดฮิต",
  en: "Popular Dive Plans",
  cn: "热门潜水计划",
  ja: "人気ダイビングプラン",
  ko: "인기 다이빙 플랜",
  de: "Beliebte Tauchpläne",
  fr: "Plans de plongée populaires",
  ru: "Популярные планы дайвинга",
};

const SUBTITLE: Record<string, string> = {
  th: "แผนทริปที่คนสร้างมากที่สุดใน 7 วันที่ผ่านมา",
  en: "Most created trip plans from the last 7 days",
  cn: "过去7天最受欢迎的行程计划",
  ja: "過去7日間で最も作成されたプラン",
  ko: "지난 7일간 가장 많이 만들어진 플랜",
  de: "Meisterstellte Reisepläne der letzten 7 Tage",
  fr: "Plans les plus créés au cours des 7 derniers jours",
  ru: "Самые популярные планы за последние 7 дней",
};

export default function PopularPlansRow({ lang }: { lang: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetch("/api/ark-ai/itinerary?mode=popular")
      .then(r => r.ok ? r.json() : [])
      .then((data: Plan[]) => setPlans(data))
      .catch(() => {});
  }, []);

  if (plans.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="px-4 sm:px-10 mb-3">
        <h2 className="text-sm sm:text-base font-semibold tracking-wide" style={{ color: "#e5e5e5" }}>
          {TITLE[lang] || TITLE.en}
        </h2>
        <p style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
          {SUBTITLE[lang] || SUBTITLE.en}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto row-scroll pl-4 sm:pl-10 pr-4 pb-2">
        {plans.map(plan => (
          <Link
            key={plan.shortId}
            href={`/${lang}/plan/${plan.shortId}`}
            className="group flex-shrink-0 transition-transform hover:scale-[1.03]"
            style={{
              width: "clamp(240px, 28vw, 320px)",
              background: "#0f0f1a",
              border: "1px solid #1e1e3a",
              borderRadius: 12,
              textDecoration: "none",
              overflow: "hidden",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#3b82f6")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1e3a")}
          >
            {/* Gradient header */}
            <div style={{
              height: 48,
              background: "linear-gradient(135deg, #1e3a5f 0%, #0f1a2e 100%)",
              display: "flex", alignItems: "center", padding: "0 14px", gap: 8,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.8" opacity="0.5"/>
                  <path d="M4 13c2-2.5 4-2.5 6 0s4 2.5 6 0s4-2.5 6 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <circle cx="8" cy="8" r="1.5" fill="#fff" opacity="0.7"/>
                  <circle cx="16" cy="7" r="1" fill="#fff" opacity="0.5"/>
                </svg>
              </div>
              <span style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                SIAM AI Plan
              </span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#555" }}>
                {plan.viewCount} views
              </span>
            </div>

            <div style={{ padding: "12px 14px" }}>
              <h3 style={{
                fontSize: 13, fontWeight: 700, color: "#e5e5e5", lineHeight: 1.4,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {plan.title}
              </h3>

              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: "#888", background: "#1a1a2e", padding: "2px 8px", borderRadius: 4 }}>
                  {plan.durationDays} days
                </span>
                {plan.totalDives > 0 && (
                  <span style={{ fontSize: 10, color: "#60a5fa", background: "rgba(59,130,246,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                    {plan.totalDives} dives
                  </span>
                )}
                {plan.totalTours > 0 && (
                  <span style={{ fontSize: 10, color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                    {plan.totalTours} tours
                  </span>
                )}
              </div>

              {plan.areas.length > 0 && (
                <p style={{ fontSize: 10, color: "#555", marginTop: 6 }}>
                  {plan.areas.join(", ")}
                </p>
              )}

              {plan.budget?.total && plan.budget.total > 0 && (
                <p style={{ fontSize: 12, fontWeight: 800, color: "#60a5fa", marginTop: 6 }}>
                  {"฿"}{plan.budget.total.toLocaleString()}/person
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
