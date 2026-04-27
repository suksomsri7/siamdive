"use client";

import { useState, useEffect, useCallback } from "react";

type PlanRow = {
  id: string; shortId: string; name: string; status: string; coverUrl: string | null;
  ownerEmail: string | null; ownerName: string | null;
  tripCount: number; memberCount: number; mediaCount: number; checklistCount: number; chatCount: number;
  createdAt: string; updatedAt: string;
};

type PlanDetail = {
  id: string; shortId: string; name: string; status: string; coverUrl: string | null;
  owner: { email: string | null; name: string | null; deviceId: string; createdAt: string };
  trips: { boatId: string; title: string; slug: string; type: string; area: string; cover: string | null; schedule?: { departureDate: string; returnDate: string | null; route: string; packages: { name: string; minPrice: number; qty?: number }[] } }[];
  members: { id: string; email: string; name: string | null; role: string; certLevel: string | null; joinedAt: string }[];
  media: { id: string; url: string; type: string; createdAt: string }[];
  checklists: { id: string; category: string; item: string; checked: boolean }[];
  notes: { id: string; content: string; authorEmail: string; createdAt: string }[];
  chatCount: number;
  createdAt: string; updatedAt: string;
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PLANNING: { bg: "#1e3a5f", color: "#60a5fa" },
  CONFIRMED: { bg: "#14532d", color: "#4ade80" },
  COMPLETED: { bg: "#1a1a1a", color: "#888" },
};

const TYPE_LABEL: Record<string, string> = {
  DAYTRIP: "Day Trip", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort",
  FREEDIVE: "Freedive", LAND_TOUR: "Land Tour", SNORKELING: "Snorkeling",
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
  const [detailTab, setDetailTab] = useState<"info" | "itinerary">("info");

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

  const openDetail = async (planId: string) => {
    setPanelOpen(true);
    setDetailLoading(true);
    setDetail(null);
    setDetailTab("info");
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
                  {(["info", "itinerary"] as const).map((t) => (
                    <button key={t} onClick={() => setDetailTab(t)} style={{
                      padding: "10px 16px", background: "none", border: "none",
                      borderBottom: detailTab === t ? "2px solid #3b82f6" : "2px solid transparent",
                      color: detailTab === t ? "#e5e5e5" : "#555",
                      fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                    }}>
                      {t === "info" ? "Info" : `Itinerary (${Array.isArray(detail.trips) ? detail.trips.length : 0})`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {detailLoading || !detail ? (
              <div style={{ padding: 40, textAlign: "center", color: "#555" }}>Loading...</div>
            ) : detailTab === "itinerary" ? (
              <div style={{ padding: "16px 20px" }}>
                {Array.isArray(detail.trips) && detail.trips.length > 0 ? (
                  <div style={{ background: "#0a0a0a", borderRadius: 12, padding: 16 }}>
                    {detail.trips.map((t, i) => {
                      const dep = t.schedule?.departureDate;
                      const ret = t.schedule?.returnDate;
                      return (
                        <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < detail.trips.length - 1 ? "1px solid #151515" : "none" }}>
                          {/* Number */}
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{i + 1}</span>
                          </div>
                          {/* Cover */}
                          {t.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.cover} alt="" style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 56, height: 42, background: "#161616", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                              🤿
                            </div>
                          )}
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                            <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                              {t.type && <Tag>{TYPE_LABEL[t.type] || t.type}</Tag>}
                              {t.area && <Tag>{t.area}</Tag>}
                            </div>
                            {dep && (
                              <p style={{ fontSize: 11, color: "#60a5fa", marginTop: 4 }}>
                                {fmtDate(dep)}{ret ? ` — ${fmtDate(ret)}` : ""}
                              </p>
                            )}
                            {t.schedule?.route && (
                              <p style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{t.schedule.route}</p>
                            )}
                            {t.schedule?.packages && t.schedule.packages.length > 0 && (
                              <div style={{ marginTop: 4 }}>
                                {t.schedule.packages.map((pkg, pi) => (
                                  <p key={pi} style={{ fontSize: 11, color: "#888" }}>
                                    {pkg.name} — {pkg.minPrice.toLocaleString()}B{pkg.qty ? ` x${pkg.qty}` : ""}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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

                {/* Notes */}
                {detail.notes.length > 0 && (
                  <Section title={`Notes (${detail.notes.length})`}>
                    {detail.notes.map((n) => (
                      <div key={n.id} style={{ padding: "8px 0", borderBottom: "1px solid #111" }}>
                        <p style={{ fontSize: 12, color: "#ccc" }}>{n.content}</p>
                        <p style={{ fontSize: 10, color: "#444", marginTop: 4 }}>{n.authorEmail} · {fmtDate(n.createdAt)}</p>
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

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 10, color: "#888", background: "#1a1a1a", padding: "2px 8px", borderRadius: 6 }}>
      {children}
    </span>
  );
}
