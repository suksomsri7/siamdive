"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { renamePlan, getPlans, updatePlanCoverUrl, type PlanTrip, type PlanLogistics } from "@/lib/plan-store";
import type { Slots } from "@/lib/ark-ai/slots";
import PlanTimeline from "./PlanTimeline";
import PlanChecklistTab from "./PlanChecklistTab";
import PlanChatTab from "./PlanChatTab";
import ContactChannelSheet from "./ContactChannelSheet";
import PlanBookBar, { buildBookingMessage } from "./PlanBookBar";
import PrepBlock from "./PrepBlock";
import { type PlanItem } from "./PlanItemsBlock";
import PlanItemEditModal from "./PlanItemEditModal";
import SearchResultModal from "./SearchResultModal";
import SharePlanSheet from "./SharePlanSheet";
import PlanNotificationsBanner from "./PlanNotificationsBanner";
import GapSuggestions from "./GapSuggestions";
import SuggestedBlogs from "./SuggestedBlogs";
import PopularTripsSection from "./PopularTrips";
import ThemeToggle from "./ThemeToggle";
import LangSwitch from "./LangSwitch";
import CompareSheet from "../CompareSheet";
import { PlanDetailSkeleton } from "../Skeletons";
import { getSavedEmail } from "@/lib/plan-store";
import { t } from "@/lib/ark-ai/i18n";

type PlanData = {
  id: string; shortId: string; name: string; coverUrl: string | null;
  status: string; trips: PlanTrip[]; role: string;
  logistics?: PlanLogistics;
  owner: { email: string | null; name: string | null };
  members: { id: string; email: string; name: string | null; role: string; certLevel: string | null }[];
  media: { id: string; url: string; thumbUrl: string | null; type: string; uploadedBy: string; caption: string | null; createdAt: string }[];
  checklists: { id: string; category: string; item: string; assignedTo: string | null; checked: boolean; checkedBy: string | null }[];
  chatCount: number;
  viewCount?: number;
  shareCount?: number;
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
  const [searchModal, setSearchModal] = useState<{ type: "FLIGHT" | "HOTEL" } | null>(null);
  const [showSharePlan, setShowSharePlan] = useState(false);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    gaps: Array<{ start: string; end: string; days: number; trips: unknown[] }>;
    blogs: Array<{ blogId: string; title: string; slug: string; excerpt: string; cover: string | null; category: string }>;
    popular?: Array<unknown>;
  } | null>(null);
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

  // Plan items (flights / hotels / etc.) live on the plan but render
  // interleaved with trip cards in the timeline now, so PlanDetail owns the
  // list. itemsRefresh bumps when the edit/search modals confirm a change.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/plans/${planId}/items?deviceId=${encodeURIComponent(deviceId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d?.items) setPlanItems(d.items); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [planId, itemsRefresh, deviceId]);

  // Fetch smart suggestions (gap-fill trips + contextual blogs + popular for empty plans)
  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    fetch(`/api/plans/${planId}/suggestions?deviceId=${encodeURIComponent(deviceId)}&lang=${lang}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d) setSuggestions(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [planId, plan?.trips.length, lang, deviceId]);

  const handleItemRemove = async (id: string) => {
    setPlanItems(prev => prev.filter(i => i.id !== id));
    try { await fetch(`/api/plans/${planId}/items/${id}?deviceId=${encodeURIComponent(deviceId)}`, { method: "DELETE" }); } catch {}
  };

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
  // Custom-uploaded cover wins; fall back to the first trip's image. Order
  // matters — previously trip.cover took priority, which silently masked
  // the user's own upload as soon as a single trip had its own cover.
  const cover = plan.coverUrl || trips.find((t) => t.cover)?.cover;
  const isOwner = plan.role === "OWNER";
  const canEdit = plan.role === "OWNER" || plan.role === "EDITOR";

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "itinerary", label: L("trips"), icon: "🗺", count: trips.length },
  ];

  const tabsBar = (
    <div style={{ display: "flex", padding: "0 16px", flexShrink: 0 }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LangSwitch />
          <ThemeToggle />
        </div>
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
            </div>
            {/* Social mini-stats — bottom-right of cover. Followers + Views
                only, no Shares per user request. Members count = followers
                (excludes owner since they don't follow their own plan). */}
            <div style={{
              position: "absolute", bottom: 10, right: 12,
              display: "flex", gap: 10,
              padding: "5px 10px",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
            }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {plan.members.length.toLocaleString()}
              </span>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {(plan.viewCount ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Members strip + tabsBar removed — the social mini-pill on the
              cover already conveys followers/views, and the tab system only
              ever held one Itinerary tab. */}

          {/* Sprint 3 B5 — auto-improve notifications */}
          <PlanNotificationsBanner planId={plan.id} lang={lang} />

          {/* Tab content */}
          <div style={{ padding: "16px" }}>
            {tab === "itinerary" && (
              <div>
                {trips.length === 0 ? (
                  <div style={{ padding: "24px 0" }}>
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <p style={{ fontSize: 14, color: "var(--plan-fg-subtle)", marginBottom: 16 }}>
                        {L("noTripsYet")}
                      </p>
                      <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-ark-ai")), 100); }}
                        style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: "#1e40af", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                        {L("recommendedTripsFromAi")}
                      </button>
                    </div>
                    {suggestions?.popular && suggestions.popular.length > 0 && (
                      <PopularTripsSection
                        planId={planId}
                        trips={suggestions.popular as never}
                        lang={lang}
                        onTripAdded={() => {
                          const localPlans = getPlans();
                          const local = localPlans.find((p) => p.id === planId);
                          if (local) {
                            setPlan((prev) => prev ? { ...prev, trips: local.trips as PlanTrip[] } : prev);
                          }
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <PlanTimeline
                      planId={planId}
                      trips={trips}
                      items={planItems}
                      lang={lang}
                      canEdit={canEdit}
                      onTripRemoved={handleTripRemoved}
                      onItemRemove={handleItemRemove}
                      onItemEdit={(item) => setItemModal({ mode: "edit", item })}
                    />
                    <div style={{ marginTop: 18 }}>
                      <PrepBlock trips={trips} lang={lang} />
                    </div>

                    {/* Smart suggestions: gap-fill trips + contextual blogs */}
                    {suggestions?.gaps && suggestions.gaps.length > 0 && (
                      <GapSuggestions
                        planId={planId}
                        gaps={suggestions.gaps as never}
                        lang={lang}
                        onTripAdded={() => {
                          const localPlans = getPlans();
                          const local = localPlans.find((p) => p.id === planId);
                          if (local) {
                            setPlan((prev) => prev ? { ...prev, trips: local.trips as PlanTrip[] } : prev);
                          }
                        }}
                      />
                    )}
                    {suggestions?.blogs && suggestions.blogs.length > 0 && (
                      <SuggestedBlogs blogs={suggestions.blogs} lang={lang} />
                    )}

                    {/* Bottom action row — three circular icon buttons on a
                        single line. Add (blue) opens the AI/manual sheet,
                        Compare (amber) shows only with 2+ trips, Share is
                        always available. */}
                    <div style={{ marginTop: 20, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 28 }}>
                      {canEdit && (
                        <PlanActionButton
                          onClick={() => setAddSheetOpen(true)}
                          label={lang === "th" ? "เพิ่มรายการ" : "Add"}
                          fg="#ffffff"
                          bg="#3b82f6"
                          border="#2563eb"
                          icon={
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14"/><path d="M5 12h14"/>
                            </svg>
                          }
                        />
                      )}
                      {trips.length >= 2 && (
                        <PlanActionButton
                          onClick={() => setCompareOpen(true)}
                          label={lang === "th" ? "เปรียบเทียบ" : "Compare"}
                          fg="#ffffff"
                          bg="#f59e0b"
                          border="#d97706"
                          icon={
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="17 1 21 5 17 9"/>
                              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                              <polyline points="7 23 3 19 7 15"/>
                              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                            </svg>
                          }
                        />
                      )}
                      <PlanActionButton
                        onClick={() => setShowSharePlan(true)}
                        label={lang === "th" ? "แชร์" : "Share"}
                        fg="#ffffff"
                        bg="#6366f1"
                        border="#4f46e5"
                        icon={
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3"/>
                            <circle cx="6" cy="12" r="3"/>
                            <circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                          </svg>
                        }
                      />
                      {trips.some(tr => tr.schedule?.departureDate) && (
                        <PlanActionButton
                          // Contact opens the channel sheet (Line / WhatsApp /
                          // Messenger / WeChat / Kakao) directly — the email
                          // gate is bypassed so users see the channels first.
                          // The optional Email: line in the message is only
                          // appended when owner.email is already on file.
                          onClick={() => {
                            const msg = buildBookingMessage(trips, plan.logistics, plan.shortId, plan.owner.email, lang);
                            setContactMessage(msg);
                            setShowChannelSheet(true);
                          }}
                          label={lang === "th" ? "ติดต่อ" : "Contact"}
                          fg="#ffffff"
                          bg="#10b981"
                          border="#059669"
                          icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                          }
                        />
                      )}
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
          <PlanBookBar trips={trips} lang={lang} slots={slots} />
        )}

        </>
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
          deviceId={deviceId}
          lang={lang}
          mode={itemModal.mode}
          initialType={itemModal.mode === "create" ? itemModal.type : itemModal.item.type as "FLIGHT" | "HOTEL" | "ACTIVITY" | "TRANSFER" | "NOTE"}
          initialItem={itemModal.mode === "edit" ? itemModal.item : null}
          onClose={() => setItemModal(null)}
          onSaved={() => setItemsRefresh((n) => n + 1)}
        />
      )}

      {showSharePlan && (
        <SharePlanSheet
          planId={planId}
          planShortId={plan.shortId}
          planName={plan.name}
          lang={lang}
          onClose={() => setShowSharePlan(false)}
        />
      )}

      {searchModal && (
        <SearchResultModal
          planId={planId}
          deviceId={deviceId}
          lang={lang}
          type={searchModal.type}
          onClose={() => setSearchModal(null)}
          onPicked={() => setItemsRefresh((n) => n + 1)}
        />
      )}

      {addSheetOpen && (
        <AddItemSheet
          lang={lang}
          onClose={() => setAddSheetOpen(false)}
          onPick={(type, mode) => {
            setAddSheetOpen(false);
            if (mode === "ai") setSearchModal({ type });
            else setItemModal({ mode: "create", type });
          }}
        />
      )}
    </>
  );
}

// ── AddItemSheet ────────────────────────────────────────────────────────────
// Bottom sheet that asks the user whether they want to add a flight or a
// hotel, and whether the AI should suggest one or they want to enter it
// manually. Replaces the inline empty-slot UI per user feedback.
const ADD_SHEET_T: Record<string, Record<string, string>> = {
  title:   { th: "เพิ่มเที่ยวบินหรือที่พัก", en: "Add flight or hotel" },
  flight:  { th: "เที่ยวบิน", en: "Flight" },
  hotel:   { th: "ที่พัก",     en: "Hotel"  },
  ai:      { th: "ค้นหา",           en: "Search" },
  manual:  { th: "+ กรอกเอง",     en: "+ Enter manually" },
  cancel:  { th: "ยกเลิก",        en: "Cancel" },
};
const addSheetT = (key: keyof typeof ADD_SHEET_T, lang: string) =>
  ADD_SHEET_T[key][lang] || ADD_SHEET_T[key].en;

function AddItemSheet({ lang, onClose, onPick }: {
  lang: string;
  onClose: () => void;
  onPick: (type: "FLIGHT" | "HOTEL", mode: "ai" | "manual") => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        animation: "addSheetFade 0.2s ease-out both",
      }}
    >
      <style>{`
        @keyframes addSheetFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes addSheetSlide { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "var(--plan-bg, #0d0d0d)",
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          padding: "18px 18px 24px",
          borderTop: "1px solid var(--plan-border-soft)",
          animation: "addSheetSlide 0.25s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <div style={{ width: 36, height: 4, background: "var(--plan-border)", borderRadius: 2, margin: "0 auto 14px" }} />
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--plan-fg)", margin: "0 0 14px", textAlign: "center" }}>
          {addSheetT("title", lang)}
        </p>

        {([
          {
            type: "FLIGHT" as const, label: addSheetT("flight", lang),
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
              </svg>
            ),
          },
          {
            type: "HOTEL" as const, label: addSheetT("hotel", lang),
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v3"/>
              </svg>
            ),
          },
        ]).map((row) => (
          <div key={row.type} style={{
            background: "var(--plan-surface)",
            border: "1px solid var(--plan-border-soft)",
            borderRadius: 12, padding: 12, marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ color: "#93c5fd", display: "flex", alignItems: "center", justifyContent: "center" }}>{row.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--plan-fg)" }}>{row.label}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onPick(row.type, "ai")}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8,
                  background: "#1e40af", border: "1px solid #1e3a8a", color: "#fff",
                  fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                {addSheetT("ai", lang)}
              </button>
              <button onClick={() => onPick(row.type, "manual")}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8,
                  background: "var(--plan-surface-alt)", border: "1px solid var(--plan-border-soft)",
                  color: "var(--plan-fg)",
                  fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                {addSheetT("manual", lang)}
              </button>
            </div>
          </div>
        ))}

        <button onClick={onClose}
          style={{
            width: "100%", marginTop: 4, padding: "10px",
            background: "transparent", border: "1px solid var(--plan-border-soft)",
            color: "var(--plan-fg-subtle)", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
          {addSheetT("cancel", lang)}
        </button>
      </div>
    </div>
  );
}

// ── PlanActionButton ────────────────────────────────────────────────────────
// Circular icon button + label below. Used for the bottom action row
// (Add / Compare / Share) so the three CTAs read as a single bar.
function PlanActionButton({ onClick, icon, label, bg, fg, border }: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  bg: string; fg: string; border: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
        background: "transparent", border: "none", padding: 0,
        cursor: "pointer", fontFamily: "inherit",
      }}
    >
      <span style={{
        width: 52, height: 52, borderRadius: "50%",
        background: bg,
        border: `1px solid ${border}`,
        color: fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        transition: "transform 0.12s ease",
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--plan-fg-muted)", letterSpacing: "0.01em" }}>
        {label}
      </span>
    </button>
  );
}
