"use client";

import { useState } from "react";

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

  const budgetRows = [
    plan.budget.diving && ["Diving", plan.budget.diving],
    plan.budget.landTour && ["Land Tour", plan.budget.landTour],
    plan.budget.accommodation && ["Accommodation", plan.budget.accommodation],
    plan.budget.transport && ["Transport", plan.budget.transport],
    plan.budget.other && ["Other", plan.budget.other],
  ].filter(Boolean) as [string, number][];

  const createdDate = new Date(plan.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingTop: 80 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #1e40af, #3b82f6)", padding: "4px 12px", borderRadius: 16, marginBottom: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>SIAMDIVE TRIP PLAN</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#f5f5f5", margin: "8px 0" }}>{plan.title}</h1>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 11, color: "#666" }}>
            <span>by SIAM AI</span>
            <span>{createdDate}</span>
            <span>{plan.viewCount} views</span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
            {[
              { label: "Days", value: plan.durationDays, icon: "📅" },
              { label: "Dives", value: plan.totalDives, icon: "🤿" },
              { label: "Tours", value: plan.totalTours, icon: "🌴" },
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
                <p style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5" }}>Day {day.day}</p>
                <p style={{ fontSize: 11, color: "#666" }}>
                  {day.date && new Date(day.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
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
                        {(act.price || boat.minPrice) > 0 && (
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ fontSize: 8, color: "#555", fontWeight: 700 }}>FROM</p>
                            <p style={{ fontSize: 13, fontWeight: 900, color: "#60a5fa" }}>{"฿"}{(act.price || boat.minPrice).toLocaleString()}</p>
                          </div>
                        )}
                      </a>
                    ) : (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
                        <span style={{ fontSize: 16 }}>{act.icon}</span>
                        <div>
                          <p style={{ fontSize: 12, color: "#ddd" }}>{act.title}</p>
                          {act.price != null && act.price > 0 && <span style={{ fontSize: 10, color: "#60a5fa" }}>{"฿"}{act.price.toLocaleString()}</span>}
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

        {/* Budget */}
        {budgetRows.length > 0 && (
          <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: 16, marginTop: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10 }}>ESTIMATED BUDGET</p>
            {budgetRows.map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                <span style={{ color: "#888" }}>{label}</span>
                <span style={{ color: "#ccc" }}>{"฿"}{val.toLocaleString()}</span>
              </div>
            ))}
            {plan.budget.total && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 15, borderTop: "1px solid #1e1e2e", marginTop: 8 }}>
                <span style={{ color: "#f5f5f5", fontWeight: 700 }}>Total / person</span>
                <span style={{ color: "#60a5fa", fontWeight: 900 }}>{"฿"}{plan.budget.total.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={handleShare}
            style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "none", background: "#1e40af", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {copied ? "Link Copied!" : "Share"}
          </button>
          <a href={`https://lin.ee/wayWuGH`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "1px solid #262626", background: "#161616", color: "#4ade80", fontSize: 14, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Book via Line
          </a>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a href={`/${currentLang}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            Create your own plan with SIAM AI
          </a>
        </div>
      </div>
    </div>
  );
}
