"use client";

import { type UserPlan, type PlanTrip } from "@/lib/plan-store";
import { t } from "@/lib/ark-ai/i18n";

type Props = {
  plans: UserPlan[];
  lang: string;
  onOpen: (planId: string) => void;
  onDelete: (planId: string) => void;
  onCreateStart: () => void;
};

export default function PlanList({ plans, lang, onOpen, onDelete, onCreateStart }: Props) {
  const L = (key: Parameters<typeof t>[1]) => t(lang, key);

  if (plans.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 16px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--plan-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--plan-fg-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--plan-fg)", marginBottom: 6 }}>
          {L("startFirstTripPlan")}
        </p>
        <p style={{ fontSize: 13, color: "var(--plan-fg-muted)", lineHeight: 1.6, maxWidth: 280, marginBottom: 24 }}>
          {L("emptyPlansSubtext")}
        </p>
        <button onClick={onCreateStart}
          style={{
            padding: "14px 32px", borderRadius: 12, border: "none",
            background: "#1e40af", color: "#fff",
            fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}>
          {L("createPlanCta")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} lang={lang} onOpen={onOpen} onDelete={onDelete} />
        ))}

        {/* Create new card */}
        <button onClick={onCreateStart} style={{
          background: "transparent", border: "1px dashed var(--plan-border)", borderRadius: 14,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 8, padding: "32px 16px", cursor: "pointer", minHeight: 160,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--plan-fg-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--plan-fg-muted)" }}>
            {L("newPlan")}
          </span>
        </button>
      </div>
    </div>
  );
}

function PlanCard({ plan, lang, onOpen, onDelete }: {
  plan: UserPlan; lang: string; onOpen: (id: string) => void; onDelete: (id: string) => void;
}) {
  const trips = plan.trips as PlanTrip[];
  const cover = plan.coverUrl || trips.find((t) => t.cover)?.cover;
  const L = (key: Parameters<typeof t>[1]) => t(lang, key);

  return (
    <div
      onClick={() => onOpen(plan.id)}
      style={{
        position: "relative", background: "var(--plan-surface)", border: "1px solid var(--plan-border-soft)",
        borderRadius: 14, overflow: "hidden", cursor: "pointer",
        transition: "border-color 0.2s",
      }}
    >
      {/* Cover */}
      <div style={{ width: "100%", aspectRatio: "16/10", background: "#161616", position: "relative" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />

        {/* Trip thumbnails strip */}
        {trips.length > 1 && (
          <div style={{ position: "absolute", bottom: 6, left: 6, display: "flex", gap: 2 }}>
            {trips.slice(0, 4).map((t, i) => (
              t.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={t.cover} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover", border: "1px solid rgba(0,0,0,0.5)" }} />
              ) : (
                <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#888", border: "1px solid rgba(0,0,0,0.5)" }}>
                  {i + 1}
                </div>
              )
            ))}
            {trips.length > 4 && (
              <div style={{ width: 20, height: 20, borderRadius: 4, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#888" }}>
                +{trips.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
          style={{
            position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 6,
            background: "rgba(0,0,0,0.5)", border: "none", color: "#fff",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "var(--plan-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {plan.name}
        </p>
        {/* Followers + Views replace the trip count per user feedback. */}
        <p style={{ fontSize: 11, color: "var(--plan-fg-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {(plan.memberCount ?? 0).toLocaleString()}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {(plan.viewCount ?? 0).toLocaleString()}
          </span>
        </p>
      </div>
    </div>
  );
}
