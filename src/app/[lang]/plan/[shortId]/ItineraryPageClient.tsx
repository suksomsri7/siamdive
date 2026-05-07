"use client";

import { useState } from "react";

const L = {
  th: { details: "ดูรายละเอียด →", contactPrompt: "สอบถามราคาและจองทริปได้เลย", contactSub: "ติดต่อ SiamDive สำหรับราคาและการจอง", days: "วัน", dives: "ไดฟ์", tours: "ทัวร์", day: "วันที่", share: "แชร์", copied: "คัดลอกลิงก์แล้ว!", line: "จองผ่าน Line", cta: "สร้าง plan ของคุณเองกับ SIAM AI", planLabel: "SIAMDIVE TRIP PLAN", by: "โดย SIAM AI", views: "เข้าชม" },
  en: { details: "View details →", contactPrompt: "Contact us for pricing & booking", contactSub: "Contact SiamDive for pricing & booking", days: "Days", dives: "Dives", tours: "Tours", day: "Day", share: "Share", copied: "Link Copied!", line: "Book via Line", cta: "Create your own plan with SIAM AI", planLabel: "SIAMDIVE TRIP PLAN", by: "by SIAM AI", views: "views" },
  cn: { details: "查看详情 →", contactPrompt: "咨询价格并预订", contactSub: "联系 SiamDive 获取价格与预订", days: "天", dives: "潜水", tours: "游览", day: "第", share: "分享", copied: "链接已复制!", line: "通过 Line 预订", cta: "用 SIAM AI 创建你的行程", planLabel: "SIAMDIVE 行程", by: "由 SIAM AI 制作", views: "浏览" },
  ja: { details: "詳細を見る →", contactPrompt: "価格と予約のお問い合わせ", contactSub: "価格・予約は SiamDive までご連絡ください", days: "日", dives: "ダイブ", tours: "ツアー", day: "日目", share: "共有", copied: "リンクをコピーしました!", line: "Line で予約", cta: "SIAM AI で旅程を作成", planLabel: "SIAMDIVE 旅程", by: "SIAM AI 作成", views: "閲覧" },
  ko: { details: "자세히 보기 →", contactPrompt: "가격 및 예약 문의", contactSub: "가격 및 예약은 SiamDive에 문의해주세요", days: "일", dives: "다이브", tours: "투어", day: "일차", share: "공유", copied: "링크가 복사되었습니다!", line: "Line 으로 예약", cta: "SIAM AI 로 나만의 여정 만들기", planLabel: "SIAMDIVE 여정", by: "SIAM AI 제작", views: "조회" },
  de: { details: "Details ansehen →", contactPrompt: "Preise & Buchung anfragen", contactSub: "Kontakt SiamDive für Preise und Buchung", days: "Tage", dives: "Tauchgänge", tours: "Touren", day: "Tag", share: "Teilen", copied: "Link kopiert!", line: "Über Line buchen", cta: "Eigene Reise mit SIAM AI planen", planLabel: "SIAMDIVE REISEPLAN", by: "von SIAM AI", views: "Aufrufe" },
  fr: { details: "Voir détails →", contactPrompt: "Demander prix & réservation", contactSub: "Contactez SiamDive pour prix et réservation", days: "Jours", dives: "Plongées", tours: "Tours", day: "Jour", share: "Partager", copied: "Lien copié !", line: "Réserver via Line", cta: "Créer votre voyage avec SIAM AI", planLabel: "SIAMDIVE PLAN VOYAGE", by: "par SIAM AI", views: "vues" },
  ru: { details: "Подробнее →", contactPrompt: "Узнать цену и забронировать", contactSub: "Свяжитесь с SiamDive для цен и бронирования", days: "Дней", dives: "Погружений", tours: "Туров", day: "День", share: "Поделиться", copied: "Ссылка скопирована!", line: "Забронировать через Line", cta: "Создайте свою поездку с SIAM AI", planLabel: "SIAMDIVE ПЛАН", by: "от SIAM AI", views: "просмотров" },
} as const;
type Labels = typeof L.en;
const getL = (lang: string): Labels => (L as unknown as Record<string, Labels>)[lang] || L.en;

const LOCALE_MAP: Record<string, string> = {
  th: "th-TH", en: "en-GB", cn: "zh-CN", ja: "ja-JP", ko: "ko-KR",
  de: "de-DE", fr: "fr-FR", ru: "ru-RU",
};

type Activity = {
  icon: string;
  title: string;
  type: string;
  boatId?: string;
  boatSlug?: string;
  price?: number;
  note?: string;
};

type Day = { day: number; date?: string; label: string; activities: Activity[] };
type Budget = { diving?: number; landTour?: number; accommodation?: number; transport?: number; other?: number; total?: number };
type BoatInfo = { title: string; slug: string; cover: string | null; area: string; minPrice: number; type: string };

type Props = {
  plan: {
    shortId: string; title: string; lang: string;
    days: Day[]; budget: Budget; areas: string[];
    durationDays: number; totalDives: number; totalTours: number;
    viewCount: number; createdAt: string;
  };
  boatMap: Record<string, BoatInfo>;
  currentLang: string;
};

const TYPE_COLORS: Record<string, string> = {
  dive: "#3b82f6", tour: "#10b981", transport: "#f59e0b", stay: "#8b5cf6", food: "#ef4444",
};

export default function ItineraryPageClient({ plan, boatMap, currentLang }: Props) {
  const [copied, setCopied] = useState(false);
  const t = getL(currentLang);

  const handleShare = async () => {
    const url = `${location.origin}/${currentLang}/plan/${plan.shortId}`;
    if (navigator.share) {
      await navigator.share({ title: plan.title, text: `${plan.title} — SiamDive`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createdDate = new Date(plan.createdAt).toLocaleDateString(LOCALE_MAP[currentLang] || "en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingTop: 80 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #1e40af, #3b82f6)", padding: "4px 12px", borderRadius: 16, marginBottom: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>{t.planLabel}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#f5f5f5", margin: "8px 0" }}>{plan.title}</h1>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 11, color: "#666" }}>
            <span>{t.by}</span>
            <span>{createdDate}</span>
            <span>{plan.viewCount} {t.views}</span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
            {[
              { label: t.days, value: plan.durationDays, icon: "📅" },
              { label: t.dives, value: plan.totalDives, icon: "🤿" },
              { label: t.tours, value: plan.totalTours, icon: "🌴" },
            ].map(s => s.value > 0 && (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 20 }}>{s.icon}</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: "#f5f5f5" }}>{s.value}</p>
                <p style={{ fontSize: 10, color: "#666" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Days */}
        {plan.days.map((day) => (
          <div key={day.day} style={{ marginBottom: 20 }}>
            {/* Day header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{day.day}</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5" }}>{currentLang === "ja" || currentLang === "ko" ? `${day.day} ${t.day}` : currentLang === "cn" ? `${t.day}${day.day}天` : `${t.day} ${day.day}`}</p>
                <p style={{ fontSize: 11, color: "#666" }}>
                  {day.date && new Date(day.date).toLocaleDateString(LOCALE_MAP[currentLang] || "en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  {day.date && " · "}{day.label}
                </p>
              </div>
            </div>

            {/* Activities */}
            <div style={{ marginLeft: 18, borderLeft: "2px solid #1f1f1f", paddingLeft: 20 }}>
              {day.activities.map((act, i) => {
                const boat = act.boatId ? boatMap[act.boatId] : null;
                const accentColor = TYPE_COLORS[act.type] || "#666";

                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    {/* Dot on timeline */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: -27, top: 4, width: 10, height: 10, borderRadius: "50%", background: accentColor, border: "2px solid #0a0a0a" }} />
                    </div>

                    {boat ? (
                      <a href={`/${currentLang}/trips/${boat.slug}`} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10,
                        padding: 10, textDecoration: "none", transition: "border-color 0.15s",
                      }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = accentColor)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1e2e")}
                      >
                        {boat.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={boat.cover} alt="" style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 56, height: 42, background: "#222", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{act.icon}</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {boat.area && <p style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase" }}>{boat.area}</p>}
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{boat.title}</p>
                          {act.note && <p style={{ fontSize: 10, color: "#666" }}>{act.note}</p>}
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <span style={{ fontSize: 10, color: "#60a5fa", fontWeight: 600 }}>{t.details}</span>
                        </div>
                      </a>
                    ) : (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
                        <span style={{ fontSize: 16 }}>{act.icon}</span>
                        <div>
                          <p style={{ fontSize: 12, color: "#ddd" }}>{act.title}</p>
                          {act.note && <p style={{ fontSize: 10, color: "#666", marginTop: 1 }}>{act.note}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Pricing note */}
        <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: 16, marginTop: 20, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#ccc", marginBottom: 4 }}>{t.contactPrompt}</p>
          <p style={{ fontSize: 11, color: "#666" }}>{t.contactSub}</p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={handleShare}
            style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "1px solid #262626", background: "#161616", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {copied ? t.copied : t.share}
          </button>
          <a href="https://lin.ee/wayWuGH" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "none", background: "#06c755", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            💬 {t.line}
          </a>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a href={`/${currentLang}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            {t.cta}
          </a>
        </div>
      </div>
    </div>
  );
}
