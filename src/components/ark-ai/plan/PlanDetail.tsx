"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { renamePlan, removeTripByIndex, getPlans, updatePlanCoverUrl, type PlanTrip, type PlanLogistics } from "@/lib/plan-store";
import type { Slots } from "@/lib/ark-ai/slots";
import PlanMembers from "./PlanMembers";
import EmailGateModal from "./EmailGateModal";
import PlanTimeline from "./PlanTimeline";
import PlanSummaryCard from "./PlanSummaryCard";
import PlanChecklistTab from "./PlanChecklistTab";
import PlanChatTab from "./PlanChatTab";
import ContactChannelSheet from "./ContactChannelSheet";
import PlanBookBar from "./PlanBookBar";
import PrepBlock from "./PrepBlock";
import PlanItemsBlock, { type PlanItem } from "./PlanItemsBlock";
import PlanItemEditModal from "./PlanItemEditModal";
import PlanNotificationsBanner from "./PlanNotificationsBanner";
import ThemeToggle from "./ThemeToggle";
import CompareSheet from "../CompareSheet";
import { PlanDetailSkeleton } from "../Skeletons";
import { getSavedEmail } from "@/lib/plan-store";
import { trackPlanShare, trackPlanEmailLink } from "@/lib/analytics/client";
import { t, compareInPlanLabel } from "@/lib/ark-ai/i18n";

type PlanData = {
  id: string; shortId: string; name: string; coverUrl: string | null;
  status: string; trips: PlanTrip[]; role: string;
  logistics?: PlanLogistics;
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
  const [slots, setSlots] = useState<Slots | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [itemModal, setItemModal] = useState<
    | { mode: "create"; type: "FLIGHT" | "HOTEL" | "ACTIVITY" | "TRANSFER" | "NOTE" }
    | { mode: "edit"; item: PlanItem }
    | null
  >(null);
  const [itemsRefresh, setItemsRefresh] = useState(0);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const L = (key: Parameters<typeof t>[1]) => t(lang, key);

  const fetchPlan = useCallback(async () => {
    let data: PlanData | null = null;
    try {
      const res = await fetch(`/api/plans/${planId}?deviceId=${encodeURIComponent(deviceId)}`);
      if (res.ok) data = await res.json();
    } catch {}

    // Fallback: server 404 / network error / sync still pending. Build a
    // synthetic plan view from the local store so the user isn't stuck on
    // a blank loader after creating a plan via the chat picker. Edit /
    // delete continue to work because they already operate on localStorage.
    if (!data) {
      const local = getPlans().find((p) => p.id === planId);
      if (local) {
        data = {
          id: local.id,
          shortId: local.id,
          name: local.name,
          coverUrl: local.coverUrl ?? null,
          status: "PLANNING",
          trips: local.trips,
          logistics: local.logistics,
          role: "OWNER",
          owner: { email: getSavedEmail(), name: null },
          members: [], media: [], checklists: [], chatCount: 0,
        };
      }
    } else {
      // Server responded — but localStorage is the source of truth for
      // very recent edits, so prefer its trip list + logistics when present.
      // (Server schema doesn't carry `logistics` yet — Sprint 1 keeps it client-only.)
      const local = getPlans().find((p) => p.id === planId);
      if (local) {
        data.trips = local.trips;
        if (local.logistics) data.logistics = local.logistics;
      }
    }

    if (data) {
      setPlan(data);
      setNameValue(data.name);
    }
  }, [planId, deviceId]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // Sprint 4 B6 — fetch the user's chat slots so PlanBookBar can render a
  // group-aware breakdown (X divers × per-person × N + Y non-divers note).
  // Slots live in AiPlanSession keyed by deviceId, not on the plan itself —
  // they reflect the current chat session that produced this plan. If the
  // user opens an old plan in a new session there'll be no slots; the book
  // bar simply falls back to the per-person range.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ark-ai/session?deviceId=${encodeURIComponent(deviceId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled && data?.session?.slots) setSlots(data.session.slots); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [deviceId]);

  useEffect(() => {
    const handler = () => {
      const localPlans = getPlans();
      const local = localPlans.find((p) => p.id === planId);
      if (local && plan) {
        setPlan((prev) => prev ? { ...prev, trips: local.trips as PlanTrip[], logistics: local.logistics } : prev);
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
        alert(L("linkCopied"));
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
    return <PlanDetailSkeleton />;
  }

  const trips = plan.trips;
  const cover = trips.find((t) => t.cover)?.cover || plan.coverUrl;
  const isOwner = plan.role === "OWNER";
  const canEdit = plan.role === "OWNER" || plan.role === "EDITOR";

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "itinerary", label: L("trips"), icon: "🗺", count: trips.length },
  ];

  const tabsBar = (
    <div style={{ display: "flex", borderBottom: "1px solid var(--plan-border-soft)", padding: "0 16px", flexShrink: 0 }}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => setTab(t.key)} style={{
          flex: 1, padding: "10px 0", background: "none", border: "none",
          borderBottom: tab === t.key ? "2px solid var(--plan-fg)" : "2px solid transparent",
          color: tab === t.key ? "var(--plan-fg)" : "var(--plan-fg-subtle)",
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          transition: "color 0.15s",
        }}>
          <span>{t.icon}</span>
          <span>{t.label}</span>
          {t.count !== undefined && t.count > 0 && (
            <span style={{ fontSize: 9, background: "var(--plan-surface-alt)", color: tab === t.key ? "var(--plan-fg)" : "var(--plan-fg-subtle)", padding: "1px 5px", borderRadius: 8, fontWeight: 600 }}>
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
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--plan-border-soft)", flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", color: "var(--plan-fg-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, marginRight: 8 }}>
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
            style={{ flex: 1, background: "var(--plan-surface-alt)", border: "1px solid var(--plan-border)", borderRadius: 6, color: "var(--plan-fg)", fontSize: 14, fontWeight: 700, padding: "4px 8px", fontFamily: "inherit", outline: "none" }}
          />
        ) : (
          <p onClick={() => isOwner && setRenaming(true)}
            style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "var(--plan-fg)", cursor: isOwner ? "pointer" : "default" }}>
            {plan.name}
          </p>
        )}

        <ThemeToggle />
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
          <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", background: "var(--plan-surface-alt)" }}>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--plan-bg) 0%, transparent 60%)" }} />
            {isOwner && (
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                style={{
                  position: "absolute", top: 10, right: 10,
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {uploadingCover ? (
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                )}
              </button>
            )}
            <div style={{ position: "absolute", bottom: 12, left: 16, right: 16 }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: "var(--plan-fg)" }}>{plan.name}</p>
              <p style={{ fontSize: 12, color: "var(--plan-fg-subtle)", marginTop: 2 }}>
                {trips.length} {L("tripsLower")} · {plan.members.length + 1} {L("membersLower")}
              </p>
            </div>
          </div>

          {/* Members strip */}
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--plan-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--plan-fg)", border: "2px solid var(--plan-border-soft)" }}>
              {(plan.owner.name || plan.owner.email || "O")[0].toUpperCase()}
            </div>
            {plan.members.slice(0, 5).map((m) => (
              <div key={m.id} style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--plan-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--plan-fg-muted)", border: "2px solid var(--plan-border-soft)" }}>
                {(m.name || m.email)[0].toUpperCase()}
              </div>
            ))}
            {isOwner && (
              <button onClick={() => plan.owner.email ? setShowMembers(true) : setEmailGateAction("members")} style={{
                width: 28, height: 28, borderRadius: "50%", background: "transparent",
                border: "2px dashed var(--plan-border-soft)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--plan-fg-subtle)", fontSize: 14,
              }}>
                +
              </button>
            )}
          </div>

          {tabsBar}

          {/* Sprint 3 B5 — auto-improve notifications */}
          <PlanNotificationsBanner planId={plan.id} lang={lang} />

          {/* Tab content */}
          <div style={{ padding: "16px" }}>
            {tab === "itinerary" && (
              <div>
                {trips.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 16px" }}>
                    <p style={{ fontSize: 14, color: "var(--plan-fg-subtle)", marginBottom: 16 }}>
                      {L("noTripsYet")}
                    </p>
                    <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-ark-ai")), 100); }}
                      style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: "#1e40af", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                      {L("recommendedTripsFromAi")}
                    </button>
                  </div>
                ) : (
                  <div>
                    <PlanSummaryCard
                      trips={trips}
                      logistics={plan.logistics}
                      headcountAdults={slots?.headcount?.adults}
                      headcountKids={slots?.headcount?.kids}
                      lang={lang}
                      canEdit={canEdit}
                      onRemoveTrip={(idx) => {
                        removeTripByIndex(planId, idx);
                        handleTripRemoved();
                      }}
                    />
                    {trips.length >= 2 && (
                      <div style={{ marginBottom: 12 }}>
                        <button
                          type="button"
                          onClick={() => setCompareOpen(true)}
                          style={{
                            width: "100%", padding: "10px 14px", borderRadius: 10,
                            background: "#f59e0b",
                            border: "1px solid #d97706",
                            color: "#1f1300", fontSize: 13, fontWeight: 800,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            fontFamily: "inherit",
                          }}
                        >
                          {compareInPlanLabel(lang, trips.length)}
                        </button>
                      </div>
                    )}
                    <PlanTimeline
                      planId={planId}
                      trips={trips}
                      lang={lang}
                      canEdit={canEdit}
                      onTripRemoved={handleTripRemoved}
                    />
                    <PlanItemsBlock
                      planId={planId}
                      lang={lang}
                      canEdit={canEdit}
                      refreshSignal={itemsRefresh}
                      onAddManual={(type) => setItemModal({ mode: "create", type })}
                      onEdit={(item) => setItemModal({ mode: "edit", item })}
                    />
                    <div style={{ marginTop: 18 }}>
                      <PrepBlock trips={trips} lang={lang} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "checklist" && (
              <PlanChecklistTab planId={planId} deviceId={deviceId} lang={lang} checklists={plan.checklists} members={plan.members} canEdit={canEdit} onRefresh={fetchPlan} />
            )}
          </div>
          <div style={{ height: 96 }} />
        </div>

        {tab === "itinerary" && trips.length > 0 && (
          <PlanBookBar
            trips={trips}
            logistics={plan.logistics}
            planShortId={plan.shortId}
            ownerEmail={plan.owner.email}
            lang={lang}
            slots={slots}
            onContact={(msg) => {
              setContactMessage(msg);
              if (plan.owner.email) {
                setShowChannelSheet(true);
              } else {
                setEmailGateAction("contact");
              }
            }}
            onInvite={() => plan.owner.email ? handleShare() : setEmailGateAction("share")}
          />
        )}

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

      {compareOpen && trips.length >= 2 && (
        <CompareSheet
          picks={trips}
          lang={lang}
          onClose={() => setCompareOpen(false)}
        />
      )}

      {itemModal && (
        <PlanItemEditModal
          planId={planId}
          lang={lang}
          mode={itemModal.mode}
          initialType={itemModal.mode === "create" ? itemModal.type : itemModal.item.type as "FLIGHT" | "HOTEL" | "ACTIVITY" | "TRANSFER" | "NOTE"}
          initialItem={itemModal.mode === "edit" ? itemModal.item : null}
          onClose={() => setItemModal(null)}
          onSaved={() => setItemsRefresh((n) => n + 1)}
        />
      )}
    </>
  );
}
