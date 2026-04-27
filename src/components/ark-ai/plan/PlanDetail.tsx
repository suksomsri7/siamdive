"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { renamePlan, removeTripByIndex, getPlans, updatePlanCoverUrl, type PlanTrip } from "@/lib/plan-store";
import PlanMembers from "./PlanMembers";
import EmailGateModal from "./EmailGateModal";
import PlanTimeline from "./PlanTimeline";
import PlanChecklistTab from "./PlanChecklistTab";
import PlanChatTab from "./PlanChatTab";
import ContactChannelSheet from "./ContactChannelSheet";
import { getSavedEmail } from "@/lib/plan-store";
import { trackPlanShare, trackPlanEmailLink } from "@/lib/analytics/client";

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
  const [emailGateAction, setEmailGateAction] = useState<"members" | "share" | "contact" | null>(null);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [showChannelSheet, setShowChannelSheet] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isTh = lang === "th";

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans/${planId}?deviceId=${encodeURIComponent(deviceId)}`);
      if (res.ok) {
        const data = await res.json();
        const local = getPlans().find((p) => p.id === planId);
        if (local) data.trips = local.trips;
        setPlan(data);
        setNameValue(data.name);
      }
    } catch {}
  }, [planId, deviceId]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

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
      const newName = nameValue.trim();
      renamePlan(planId, newName);
      setPlan((prev) => prev ? { ...prev, name: newName } : prev);
      fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, name: newName }),
      }).catch(() => {});
    }
    setRenaming(false);
  };

  const handleTripRemoved = () => {
    const localPlans = getPlans();
    const local = localPlans.find((p) => p.id === planId);
    if (local) {
      setPlan((prev) => prev ? { ...prev, trips: local.trips as PlanTrip[] } : prev);
    }
  };

  const handleShare = async () => {
    if (!plan) return;
    setSharing(true);
    trackPlanShare(planId, plan.shortId);
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("deviceId", deviceId);
      const uploadRes = await fetch("/api/plans/upload", { method: "POST", body: form });
      if (!uploadRes.ok) return;
      const { url } = await uploadRes.json();
      await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, coverUrl: url }),
      });
      setPlan((prev) => prev ? { ...prev, coverUrl: url } : prev);
      updatePlanCoverUrl(planId, url);
    } catch {} finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
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
  ];

  const tabsBar = (
    <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", padding: "0 16px", flexShrink: 0 }}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => setTab(t.key)} style={{
          flex: 1, padding: "10px 0", background: "none", border: "none",
          borderBottom: tab === t.key ? "2px solid #f5f5f5" : "2px solid transparent",
          color: tab === t.key ? "#f5f5f5" : "#555",
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          transition: "color 0.15s",
        }}>
          <span>{t.icon}</span>
          <span>{t.label}</span>
          {t.count !== undefined && t.count > 0 && (
            <span style={{ fontSize: 9, background: tab === t.key ? "#222" : "#1a1a1a", color: tab === t.key ? "#f5f5f5" : "#555", padding: "1px 5px", borderRadius: 8, fontWeight: 600 }}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );

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

        <button onClick={() => plan.owner.email ? handleShare() : setEmailGateAction("share")} disabled={sharing}
          style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", padding: 4, marginLeft: 4, display: "flex" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>

      <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} />

      {tab === "chat" ? (
        <>
          {tabsBar}
          <PlanChatTab planId={planId} deviceId={deviceId} lang={lang} />
        </>
      ) : (
        <>
        <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
          {/* Hero */}
          <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", background: "#111" }}>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0a0a0a 0%, transparent 60%)" }} />
            {isOwner && (
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                style={{
                  position: "absolute", top: 10, right: 10,
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)", border: "1px solid #333",
                  color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {uploadingCover ? (
                  <div style={{ width: 16, height: 16, border: "2px solid #555", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                )}
              </button>
            )}
            <div style={{ position: "absolute", bottom: 12, left: 16, right: 16 }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{plan.name}</p>
              <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                {trips.length} {isTh ? "ทริป" : "trips"} · {plan.members.length + 1} {isTh ? "สมาชิก" : "members"}
              </p>
            </div>
          </div>

          {/* Members strip */}
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#e5e5e5", border: "2px solid #333" }}>
              {(plan.owner.name || plan.owner.email || "O")[0].toUpperCase()}
            </div>
            {plan.members.slice(0, 5).map((m) => (
              <div key={m.id} style={{ width: 28, height: 28, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#888", border: "2px solid #333" }}>
                {(m.name || m.email)[0].toUpperCase()}
              </div>
            ))}
            {isOwner && (
              <button onClick={() => plan.owner.email ? setShowMembers(true) : setEmailGateAction("members")} style={{
                width: 28, height: 28, borderRadius: "50%", background: "transparent",
                border: "2px dashed #333", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#555", fontSize: 14,
              }}>
                +
              </button>
            )}
          </div>

          {tabsBar}

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
                      style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: "#1e40af", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                      {isTh ? "ทริปจาก AI" : "Recommended trips from AI"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <PlanTimeline
                      planId={planId}
                      trips={trips}
                      lang={lang}
                      canEdit={canEdit}
                      onTripRemoved={handleTripRemoved}
                      onContactClick={(msg) => {
                        const extra = `\nPlan: ${plan.shortId}` + (plan.owner.email ? `\nEmail: ${plan.owner.email}` : "");
                        setContactMessage(msg + extra);
                        if (plan.owner.email) {
                          setShowChannelSheet(true);
                        } else {
                          setEmailGateAction("contact");
                        }
                      }}
                      onAddPackage={(slug, departureDate) => {
                        const t = trips.find((tr) => tr.slug === slug);
                        onClose();
                        setTimeout(() => window.dispatchEvent(new CustomEvent("open-trip-info", {
                          detail: { slug, title: t?.title, type: t?.type, area: t?.area, cover: t?.cover, boatId: t?.boatId, initialDate: departureDate },
                        })), 100);
                      }}
                    />

                  </div>
                )}
              </div>
            )}

            {tab === "checklist" && (
              <PlanChecklistTab planId={planId} deviceId={deviceId} lang={lang} checklists={plan.checklists} members={plan.members} canEdit={canEdit} onRefresh={fetchPlan} />
            )}
          </div>
          <div style={{ height: 72 }} />
        </div>

        </>
      )}

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

      {/* Email gate — require email before invite/share */}
      {emailGateAction && (
        <EmailGateModal
          lang={lang}
          onSuccess={(newEmail, newName) => {
            setPlan((prev) => prev ? { ...prev, owner: { ...prev.owner, email: newEmail, name: newName ?? prev.owner.name } } : prev);
            trackPlanEmailLink(planId, newEmail);
            const action = emailGateAction;
            setEmailGateAction(null);
            if (action === "members") setShowMembers(true);
            if (action === "share") handleShare();
            if (action === "contact") {
              setContactMessage((prev) => prev ? prev + `\nEmail: ${newEmail}` : prev);
              setShowChannelSheet(true);
            }
          }}
          onClose={() => setEmailGateAction(null)}
        />
      )}

      {showChannelSheet && contactMessage && (
        <ContactChannelSheet
          planId={planId}
          message={contactMessage}
          lang={lang}
          onClose={() => { setShowChannelSheet(false); setContactMessage(null); }}
        />
      )}
    </>
  );
}
