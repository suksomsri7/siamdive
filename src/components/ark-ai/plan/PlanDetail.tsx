"use client";

import { useState, useEffect, useCallback } from "react";
import { renamePlan, removeTrip, getPlans, type PlanTrip } from "@/lib/plan-store";
import PlanMembers from "./PlanMembers";
import PlanMediaTab from "./PlanMediaTab";
import PlanChecklistTab from "./PlanChecklistTab";
import PlanChatTab from "./PlanChatTab";

type PlanData = {
  id: string; shortId: string; name: string; coverUrl: string | null;
  status: string; trips: PlanTrip[]; role: string;
  owner: { email: string | null; name: string | null };
  members: { id: string; email: string; name: string | null; role: string; certLevel: string | null }[];
  media: { id: string; url: string; thumbUrl: string | null; type: string; uploadedBy: string; caption: string | null; createdAt: string }[];
  checklists: { id: string; category: string; item: string; assignedTo: string | null; checked: boolean; checkedBy: string | null }[];
  chatCount: number;
};

type Tab = "itinerary" | "media" | "checklist" | "chat";

type Props = {
  planId: string;
  deviceId: string;
  lang: string;
  onBack: () => void;
  onClose: () => void;
};

const TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Day Trip", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive", LAND_TOUR: "Land Tour", SNORKELING: "Snorkeling",
};

export default function PlanDetail({ planId, deviceId, lang, onBack, onClose }: Props) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [tab, setTab] = useState<Tab>("itinerary");
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [sharing, setSharing] = useState(false);

  const isTh = lang === "th";

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans/${planId}?deviceId=${encodeURIComponent(deviceId)}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
        setNameValue(data.name);
      }
    } catch {}
  }, [planId, deviceId]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // Also sync from local store for trips
  useEffect(() => {
    const handler = () => {
      const localPlans = getPlans();
      const local = localPlans.find((p) => p.id === planId);
      if (local && plan) {
        setPlan((prev) => prev ? { ...prev, trips: local.trips as PlanTrip[] } : prev);
      }
    };
    window.addEventListener("myplan-change", handler);
    return () => window.removeEventListener("myplan-change", handler);
  }, [planId, plan]);

  const handleRename = () => {
    if (nameValue.trim() && nameValue.trim() !== plan?.name) {
      renamePlan(planId, nameValue.trim());
      setPlan((prev) => prev ? { ...prev, name: nameValue.trim() } : prev);
    }
    setRenaming(false);
  };

  const handleRemoveTrip = (boatId: string) => {
    removeTrip(boatId);
    setPlan((prev) => prev ? { ...prev, trips: prev.trips.filter((t) => t.boatId !== boatId) } : prev);
  };

  const handleShare = async () => {
    if (!plan) return;
    setSharing(true);
    const url = `${location.origin}/${lang}/plan/${plan.shortId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: plan.name, text: `${plan.name} — SiamDive`, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert(isTh ? "คัดลอกลิงก์แล้ว!" : "Link copied!");
      }
    } catch {} finally {
      setSharing(false);
    }
  };

  if (!plan) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #333", borderTopColor: "#60a5fa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const trips = plan.trips;
  const cover = trips.find((t) => t.cover)?.cover || plan.coverUrl;
  const isOwner = plan.role === "OWNER";
  const canEdit = plan.role === "OWNER" || plan.role === "EDITOR";

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "itinerary", label: isTh ? "ทริป" : "Trips", icon: "🗺", count: trips.length },
    { key: "media", label: isTh ? "รูป" : "Media", icon: "📷", count: plan.media.length },
    { key: "chat", label: isTh ? "แชท" : "Chat", icon: "💬", count: plan.chatCount },
  ];

  return (
    <>
      {/* Header */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, marginRight: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>

        {renaming ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
            style={{ flex: 1, background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, color: "#f5f5f5", fontSize: 14, fontWeight: 700, padding: "4px 8px", fontFamily: "inherit", outline: "none" }}
          />
        ) : (
          <p onClick={() => isOwner && setRenaming(true)}
            style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "#f5f5f5", cursor: isOwner ? "pointer" : "default" }}>
            {plan.name}
          </p>
        )}

        <button onClick={handleShare} disabled={sharing}
          style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", padding: 4, marginLeft: 4, display: "flex" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
        {/* Hero */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.3) 50%, transparent 100%)" }} />
          <div style={{ position: "absolute", bottom: 12, left: 16, right: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{plan.name}</p>
            <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              {trips.length} {isTh ? "ทริป" : "trips"} · {plan.members.length + 1} {isTh ? "สมาชิก" : "members"}
            </p>
          </div>
        </div>

        {/* Members strip */}
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          {/* Owner avatar */}
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", border: "2px solid #3b82f6" }}>
            {(plan.owner.name || plan.owner.email || "O")[0].toUpperCase()}
          </div>
          {plan.members.slice(0, 5).map((m) => (
            <div key={m.id} style={{ width: 28, height: 28, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#888", border: "2px solid #333" }}>
              {(m.name || m.email)[0].toUpperCase()}
            </div>
          ))}
          {isOwner && (
            <button onClick={() => setShowMembers(true)} style={{
              width: 28, height: 28, borderRadius: "50%", background: "transparent",
              border: "2px dashed #333", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#555", fontSize: 14,
            }}>
              +
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", padding: "0 16px" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: "10px 0", background: "none", border: "none",
              borderBottom: tab === t.key ? "2px solid #3b82f6" : "2px solid transparent",
              color: tab === t.key ? "#f5f5f5" : "#555",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              transition: "color 0.15s",
            }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span style={{ fontSize: 9, background: tab === t.key ? "#1e40af" : "#222", color: tab === t.key ? "#fff" : "#666", padding: "1px 5px", borderRadius: 8, fontWeight: 600 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "16px" }}>
          {tab === "itinerary" && (
            <div>
              {trips.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px" }}>
                  <p style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
                    {isTh ? "ยังไม่มีทริปในแพลน" : "No trips yet"}
                  </p>
                  <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-ark-ai")), 100); }}
                    style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1e40af, #3b82f6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    {isTh ? "เพิ่มทริปจาก AI" : "Add trips from AI"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trips.map((trip, idx) => (
                    <div key={trip.boatId} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "#111", border: "1px solid #1e1e2e", borderRadius: 12, padding: 12,
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{idx + 1}</span>
                      </div>
                      {trip.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={trip.cover} alt="" style={{ width: 52, height: 40, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 52, height: 40, background: "#1a1a2e", borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          🤿
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {trip.area && <p style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase" }}>{trip.area}</p>}
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</p>
                        <p style={{ fontSize: 10, color: "#555" }}>{TYPE_LABEL[trip.type] || trip.type}</p>
                      </div>
                      {canEdit && (
                        <button onClick={() => handleRemoveTrip(trip.boatId)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #262626", background: "transparent", color: "#555", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {canEdit && (
                    <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-ark-ai")), 100); }}
                      style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "1px dashed rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.05)", color: "#60a5fa", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
                      + {isTh ? "เพิ่มทริปจาก AI" : "Add trips from AI"}
                    </button>
                  )}

                  {/* Summary */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    <span style={{ fontSize: 11, color: "#60a5fa", background: "rgba(96,165,250,0.1)", padding: "4px 10px", borderRadius: 8 }}>
                      🤿 {trips.filter((t) => ["DAYTRIP", "LIVEABOARD", "DIVE_RESORT", "FREEDIVE"].includes(t.type)).length} {isTh ? "ทริปดำน้ำ" : "dive trips"}
                    </span>
                    {trips.some((t) => t.type === "LAND_TOUR" || t.type === "SNORKELING") && (
                      <span style={{ fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 8 }}>
                        🏝 {trips.filter((t) => t.type === "LAND_TOUR" || t.type === "SNORKELING").length} {isTh ? "ทัวร์" : "tours"}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "#888", background: "#1a1a1a", padding: "4px 10px", borderRadius: 8 }}>
                      👤 {plan.members.length + 1} {isTh ? "คน" : "people"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "media" && (
            <PlanMediaTab planId={planId} deviceId={deviceId} lang={lang} media={plan.media} canEdit={canEdit} onRefresh={fetchPlan} />
          )}

          {tab === "checklist" && (
            <PlanChecklistTab planId={planId} deviceId={deviceId} lang={lang} checklists={plan.checklists} members={plan.members} canEdit={canEdit} onRefresh={fetchPlan} />
          )}

          {tab === "chat" && (
            <PlanChatTab planId={planId} deviceId={deviceId} lang={lang} />
          )}
        </div>
      </div>

      {/* Members modal */}
      {showMembers && (
        <PlanMembers
          planId={planId}
          deviceId={deviceId}
          lang={lang}
          owner={plan.owner}
          members={plan.members}
          onClose={() => { setShowMembers(false); fetchPlan(); }}
        />
      )}
    </>
  );
}
