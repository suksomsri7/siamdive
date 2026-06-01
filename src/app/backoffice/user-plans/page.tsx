"use client";

import { useState, useEffect, useCallback } from "react";
import PlanTimeline from "@/components/ark-ai/plan/PlanTimeline";

type PlanRow = {
  id: string; shortId: string; name: string; status: string; coverUrl: string | null;
  ownerEmail: string | null; ownerName: string | null;
  tripCount: number; memberCount: number; mediaCount: number; checklistCount: number; chatCount: number;
  createdAt: string; updatedAt: string;
};

type PlanDetail = {
  id: string; shortId: string; name: string; status: string; coverUrl: string | null;
  owner: { email: string | null; name: string | null; deviceId: string; createdAt: string };
  trips: { boatId: string; title: string; slug: string; type: string; area: string; cover: string | null; addedAt?: number; note?: string; schedule?: { scheduleId: string; departureDate: string; returnDate: string | null; route: string; packages: { name: string; minPrice: number; qty?: number }[] } }[];
  members: { id: string; email: string; name: string | null; role: string; certLevel: string | null; joinedAt: string }[];
  media: { id: string; url: string; type: string; createdAt: string }[];
  checklists: { id: string; category: string; item: string; checked: boolean }[];
  chatCount: number;
  createdAt: string; updatedAt: string;
};

type CustomerProfile = {
  linked: boolean;
  visitor: { device: string | null; os: string | null; browser: string | null; country: string | null; city: string | null; lang: string | null } | null;
  acquisition: { firstReferrer: string | null; firstUtmSource: string | null; firstUtmMedium: string | null; firstUtmCampaign: string | null; firstLandingPath: string | null } | null;
  engagement: { totalSessions: number; totalEvents: number; firstSeenAt: string | null; lastSeenAt: string | null; totalDaysActive: number } | null;
  interests: { topTrips: { boatId: string; title: string; viewCount: number }[]; topBlogs: { blogId: string; title: string; viewCount: number }[]; searches: { query: string; resultsCount: number; ts: string }[] } | null;
  timeline: { ts: string; type: string; label: string; path?: string; entityType?: string; entityId?: string }[];
};

type AiSummary = {
  summary: string;
  generatedAt: string;
  cached: boolean;
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PLANNING: { bg: "#1e3a5f", color: "#60a5fa" },
  CONFIRMED: { bg: "#14532d", color: "#4ade80" },
  COMPLETED: { bg: "#1a1a1a", color: "#888" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function UserPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "itinerary" | "brief">("info");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("q", search);
      const res = await fetch(`/api/user-plans?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans);
        setTotal(data.total);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => {
    setPage(1);
    setSearch(query.trim());
  };

  const loadProfile = async (planId: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/user-plans/${planId}/profile`);
      if (res.ok) setProfile(await res.json());
    } catch {} finally {
      setProfileLoading(false);
    }
  };

  const [aiError, setAiError] = useState<string | null>(null);

  const loadAiSummary = async (planId: string, refresh = false) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/user-plans/${planId}/summary${refresh ? "?refresh=1" : ""}`);
      if (res.ok) {
        setAiSummary(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setAiError(data.error || `Error ${res.status}`);
      }
    } catch (e) {
      setAiError("Network error");
    } finally {
      setAiLoading(false);
    }
  };

  const openDetail = async (planId: string) => {
    setPanelOpen(true);
    setDetailLoading(true);
    setDetail(null);
    setDetailTab("info");
    setProfile(null);
    setAiSummary(null);
    setAiError(null);
    try {
      const res = await fetch(`/api/user-plans/${planId}`);
      if (res.ok) setDetail(await res.json());
    } catch {} finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Delete this plan? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/user-plans/${planId}`, { method: "DELETE" });
      if (res.ok) {
        setPanelOpen(false);
        setDetail(null);
        load();
      }
    } catch {} finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e5e5e5", margin: 0 }}>User Plans</h1>
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{total} plans</p>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          placeholder="Search by Plan ID, Short ID, Email, or Name..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8,
            background: "#0d0d0d", border: "1px solid #1a1a1a",
            color: "#e5e5e5", fontSize: 13, fontFamily: "inherit", outline: "none",
          }}
        />
        <button onClick={handleSearch} style={{
          padding: "10px 20px", borderRadius: 8, border: "none",
          background: "#1e40af", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          Search
        </button>
        {search && (
          <button onClick={() => { setQuery(""); setSearch(""); setPage(1); }} style={{
            padding: "10px 16px", borderRadius: 8, border: "1px solid #262626",
            background: "transparent", color: "#888", fontSize: 13, cursor: "pointer",
          }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
              {["Plan Name", "Owner", "Trips", "Members", "Status", "Updated"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#555", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#555" }}>Loading...</td></tr>
            ) : plans.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#555" }}>
                {search ? "No plans found" : "No user plans yet"}
              </td></tr>
            ) : plans.map((p) => {
              const sc = STATUS_COLORS[p.status] || STATUS_COLORS.PLANNING;
              return (
                <tr key={p.id}
                  onClick={() => openDetail(p.id)}
                  style={{ borderBottom: "1px solid #111", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#0d0d0d")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <p style={{ color: "#e5e5e5", fontWeight: 600, marginBottom: 2 }}>{p.name}</p>
                    <p style={{ color: "#333", fontSize: 10, fontFamily: "monospace" }}>{p.shortId}</p>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <p style={{ color: "#ccc", fontSize: 12 }}>{p.ownerEmail || "-"}</p>
                    {p.ownerName && <p style={{ color: "#444", fontSize: 11 }}>{p.ownerName}</p>}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#ccc", textAlign: "center" }}>{p.tripCount}</td>
                  <td style={{ padding: "10px 12px", color: "#ccc", textAlign: "center" }}>{p.memberCount + 1}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: sc.bg, color: sc.color }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#555", fontSize: 11, whiteSpace: "nowrap" }}>{fmtDate(p.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #262626", background: "transparent", color: page <= 1 ? "#333" : "#ccc", fontSize: 12, cursor: page <= 1 ? "default" : "pointer" }}>
            Prev
          </button>
          <span style={{ fontSize: 12, color: "#555" }}>
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #262626", background: "transparent", color: page >= totalPages ? "#333" : "#ccc", fontSize: 12, cursor: page >= totalPages ? "default" : "pointer" }}>
            Next
          </button>
        </div>
      )}

      {/* ── Detail Panel (slide-in) ── */}
      {panelOpen && (
        <>
          <div onClick={() => setPanelOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)" }} />
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 101,
            width: "min(520px, 90vw)", background: "#0d0d0d",
            borderLeft: "1px solid #1a1a1a", overflowY: "auto",
            animation: "slideIn 0.2s ease-out",
          }}>
            <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

            {/* Panel header */}
            <div style={{ position: "sticky", top: 0, background: "#0d0d0d", zIndex: 1 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5" }}>Plan Detail</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {detail && (
                    <button onClick={() => handleDelete(detail.id)} disabled={deleting}
                      style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #7f1d1d", background: "transparent", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {deleting ? "..." : "Delete"}
                    </button>
                  )}
                  <button onClick={() => setPanelOpen(false)} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer", padding: 4 }}>✕</button>
                </div>
              </div>
              {detail && (
                <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", padding: "0 20px" }}>
                  {(["info", "itinerary", "brief"] as const).map((t) => (
                    <button key={t} onClick={() => {
                      setDetailTab(t);
                      if (t === "brief" && !profile && detail) loadProfile(detail.id);
                    }} style={{
                      padding: "10px 16px", background: "none", border: "none",
                      borderBottom: detailTab === t ? "2px solid #3b82f6" : "2px solid transparent",
                      color: detailTab === t ? "#e5e5e5" : "#555",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>
                      {t === "info" ? "Info" : t === "itinerary" ? `Itinerary (${Array.isArray(detail.trips) ? detail.trips.length : 0})` : "Customer Brief"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {detailLoading || !detail ? (
              <div style={{ padding: 40, textAlign: "center", color: "#555" }}>Loading...</div>
            ) : detailTab === "brief" ? (
              <div style={{ padding: "16px 20px" }}>
                {/* AI Summary */}
                <div style={{ marginBottom: 20, padding: 16, background: "#111", borderRadius: 10, border: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: aiSummary ? 12 : 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6" }}>AI Summary</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {aiSummary && (
                        <button
                          onClick={() => detail && loadAiSummary(detail.id, true)}
                          disabled={aiLoading}
                          style={{
                            padding: "5px 12px", borderRadius: 6, border: "1px solid #262626",
                            background: "transparent", color: "#888", fontSize: 11, cursor: aiLoading ? "default" : "pointer",
                          }}
                        >
                          {aiLoading ? "กำลังสร้าง..." : "Refresh"}
                        </button>
                      )}
                      {!aiSummary && (
                        <button
                          onClick={() => detail && loadAiSummary(detail.id)}
                          disabled={aiLoading}
                          style={{
                            padding: "5px 14px", borderRadius: 6, border: "none",
                            background: aiLoading ? "#1e3a5f" : "#1e40af", color: "#fff",
                            fontSize: 11, fontWeight: 600, cursor: aiLoading ? "default" : "pointer",
                          }}
                        >
                          {aiLoading ? "กำลังวิเครา���ห์..." : "สร้าง AI Summary"}
                        </button>
                      )}
                    </div>
                  </div>
                  {aiError && (
                    <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{aiError}</p>
                  )}
                  {aiSummary && (
                    <>
                      <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {aiSummary.summary}
                      </div>
                      <p style={{ fontSize: 10, color: "#333", marginTop: 8 }}>
                        {aiSummary.cached ? "cached" : "just generated"} · {fmtDate(aiSummary.generatedAt)}
                      </p>
                    </>
                  )}
                </div>

                {profileLoading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#555" }}>Loading...</div>
                ) : !profile || !profile.linked ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#555" }}>ไม่พบข้อมูลพฤติกรรม</div>
                ) : (
                  <>
                    {/* Visitor & Acquisition */}
                    <Section title="Visitor">
                      <InfoRow label="Device" value={[profile.visitor?.device, profile.visitor?.os, profile.visitor?.browser].filter(Boolean).join(" · ") || "-"} />
                      <InfoRow label="Location" value={[profile.visitor?.city, profile.visitor?.country].filter(Boolean).join(", ") || "-"} />
                      <InfoRow label="Language" value={profile.visitor?.lang || "-"} />
                    </Section>
                    <Section title="Acquisition">
                      <InfoRow label="Referrer" value={profile.acquisition?.firstReferrer || "(direct)"} />
                      {profile.acquisition?.firstUtmSource && <InfoRow label="UTM Source" value={profile.acquisition.firstUtmSource} />}
                      {profile.acquisition?.firstUtmMedium && <InfoRow label="UTM Medium" value={profile.acquisition.firstUtmMedium} />}
                      {profile.acquisition?.firstUtmCampaign && <InfoRow label="UTM Campaign" value={profile.acquisition.firstUtmCampaign} />}
                      <InfoRow label="Landing" value={profile.acquisition?.firstLandingPath || "-"} mono />
                    </Section>

                    {/* Engagement */}
                    <Section title="Engagement">
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 8 }}>
                        <StatBox label="Sessions" value={profile.engagement?.totalSessions ?? 0} />
                        <StatBox label="Events" value={profile.engagement?.totalEvents ?? 0} />
                        <StatBox label="Days Active" value={profile.engagement?.totalDaysActive ?? 0} />
                      </div>
                      <InfoRow label="First Seen" value={profile.engagement?.firstSeenAt ? fmtDate(profile.engagement.firstSeenAt) : "-"} />
                      <InfoRow label="Last Seen" value={profile.engagement?.lastSeenAt ? fmtDate(profile.engagement.lastSeenAt) : "-"} />
                    </Section>

                    {/* Top Trips */}
                    {(profile.interests?.topTrips?.length ?? 0) > 0 && (
                      <Section title="Top Trips Viewed">
                        {profile.interests!.topTrips.map((t) => (
                          <div key={t.boatId} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0f0f0f" }}>
                            <span style={{ fontSize: 12, color: "#ccc" }}>{t.title}</span>
                            <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>{t.viewCount}x</span>
                          </div>
                        ))}
                      </Section>
                    )}

                    {/* Top Blogs */}
                    {(profile.interests?.topBlogs?.length ?? 0) > 0 && (
                      <Section title="Blogs Read">
                        {profile.interests!.topBlogs.map((b) => (
                          <div key={b.blogId} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0f0f0f" }}>
                            <span style={{ fontSize: 12, color: "#ccc" }}>{b.title}</span>
                            <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>{b.viewCount}x</span>
                          </div>
                        ))}
                      </Section>
                    )}

                    {/* Searches */}
                    {(profile.interests?.searches?.length ?? 0) > 0 && (
                      <Section title="Searches">
                        {profile.interests!.searches.map((s, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0f0f0f" }}>
                            <span style={{ fontSize: 12, color: "#ccc" }}>&ldquo;{s.query}&rdquo;</span>
                            <span style={{ fontSize: 11, color: "#555" }}>{s.resultsCount} results</span>
                          </div>
                        ))}
                      </Section>
                    )}

                    {/* Timeline */}
                    {profile.timeline.length > 0 && (
                      <Section title="Activity Timeline">
                        {profile.timeline.map((e, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: "1px solid #0a0a0a", alignItems: "baseline" }}>
                            <span style={{ fontSize: 10, color: "#444", fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0 }}>
                              {new Date(e.ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                              {" "}
                              {new Date(e.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span style={{ fontSize: 12, color: "#ccc" }}>{e.label}</span>
                            {e.path && <span style={{ fontSize: 10, color: "#333", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.path}</span>}
                          </div>
                        ))}
                      </Section>
                    )}
                    <div style={{ height: 40 }} />
                  </>
                )}
              </div>
            ) : detailTab === "itinerary" ? (
              <div style={{ padding: "16px 20px" }}>
                {/* Plan hero */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", borderRadius: 12, overflow: "hidden", background: "#111", marginBottom: 16 }}>
                  {(detail.coverUrl || (Array.isArray(detail.trips) && detail.trips.find(t => t.cover))) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.coverUrl || detail.trips.find(t => t.cover)?.cover || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>{detail.name}</p>
                    <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                      {Array.isArray(detail.trips) ? detail.trips.length : 0} trips · {detail.members.length + 1} members
                      {detail.owner.email && ` · ${detail.owner.email}`}
                    </p>
                  </div>
                </div>

                {Array.isArray(detail.trips) && detail.trips.length > 0 ? (
                  <PlanTimeline
                    planId={detail.id}
                    trips={detail.trips.map((t) => ({
                      ...t,
                      slug: t.slug || "",
                      area: t.area || "",
                      cover: t.cover || null,
                      addedAt: t.addedAt || 0,
                    }))}
                    lang="en"
                    canEdit={false}
                  />
                ) : (
                  <p style={{ textAlign: "center", color: "#555", padding: 40 }}>No trips in this plan</p>
                )}
                <div style={{ height: 40 }} />
              </div>
            ) : (
              <div style={{ padding: "16px 20px" }}>
                {/* Cover */}
                {detail.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detail.coverUrl} alt="" style={{ width: "100%", aspectRatio: "21/9", objectFit: "cover", borderRadius: 8, marginBottom: 16 }} />
                )}

                {/* Plan info */}
                <Section title="Plan Info">
                  <InfoRow label="Name" value={detail.name} />
                  <InfoRow label="Short ID" value={detail.shortId} mono />
                  <InfoRow label="Plan ID" value={detail.id} mono />
                  <InfoRow label="Status">
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: (STATUS_COLORS[detail.status] || STATUS_COLORS.PLANNING).bg, color: (STATUS_COLORS[detail.status] || STATUS_COLORS.PLANNING).color }}>
                      {detail.status}
                    </span>
                  </InfoRow>
                  <InfoRow label="Created" value={fmtDate(detail.createdAt)} />
                  <InfoRow label="Updated" value={fmtDate(detail.updatedAt)} />
                </Section>

                {/* Owner */}
                <Section title="Owner">
                  <InfoRow label="Email" value={detail.owner.email || "(no email)"} />
                  <InfoRow label="Name" value={detail.owner.name || "-"} />
                  <InfoRow label="Device ID" value={detail.owner.deviceId} mono />
                  <InfoRow label="Joined" value={fmtDate(detail.owner.createdAt)} />
                </Section>

                {/* Stats */}
                <Section title="Stats">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    <StatBox label="Trips" value={Array.isArray(detail.trips) ? detail.trips.length : 0} />
                    <StatBox label="Members" value={detail.members.length + 1} />
                    <StatBox label="Media" value={detail.media.length} />
                    <StatBox label="Chat" value={detail.chatCount} />
                  </div>
                </Section>

                {/* Members */}
                {detail.members.length > 0 && (
                  <Section title={`Members (${detail.members.length})`}>
                    {detail.members.map((m) => (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #111" }}>
                        <div>
                          <p style={{ fontSize: 12, color: "#ccc" }}>{m.email}</p>
                          {m.name && <p style={{ fontSize: 11, color: "#555" }}>{m.name}</p>}
                          {m.certLevel && <p style={{ fontSize: 10, color: "#10b981" }}>{m.certLevel}</p>}
                        </div>
                        <span style={{ fontSize: 10, color: "#888", background: "#1a1a1a", padding: "2px 8px", borderRadius: 6 }}>
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </Section>
                )}

                <div style={{ height: 40 }} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>{title}</p>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0f0f0f" }}>
      <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
      {children || (
        <span style={{ fontSize: 12, color: "#ccc", fontFamily: mono ? "monospace" : "inherit", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
          {value}
        </span>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#111", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
      <p style={{ fontSize: 18, fontWeight: 800, color: "#e5e5e5" }}>{value}</p>
      <p style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{label}</p>
    </div>
  );
}

