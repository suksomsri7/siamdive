// Analytics dashboard — Server Component. All metrics fetched in parallel.
// Supports ?range=7d|30d|90d via searchParams.

import Link from "next/link";
import {
  overview,
  topTrips,
  topBlogs,
  searchInsights,
  countryHeatmap,
  funnel,
  utmRoi,
  trendingNow,
  type RangeKey,
} from "@/lib/analytics/adminQueries";

export const dynamic = "force-dynamic";

const RANGES: RangeKey[] = ["7d", "30d", "90d"];

function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtDwell(ms: number | null): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function Card({ children, pad = 20 }: { children: React.ReactNode; pad?: number }) {
  return (
    <section style={{
      background: "#111", border: "1px solid #1f1f1f", borderRadius: 14,
      padding: pad, marginBottom: 20,
    }}>
      {children}
    </section>
  );
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: "#e5e5e5", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {children}
      </h2>
      {hint && <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export default async function AnalyticsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range: RangeKey = (RANGES.includes(sp.range as RangeKey) ? sp.range : "30d") as RangeKey;

  const [ov, trips, blogs, search, heatmap, fn, utm, trending] = await Promise.all([
    overview(range),
    topTrips(range, 10),
    topBlogs(range, 10),
    searchInsights(range),
    countryHeatmap(range),
    funnel(range),
    utmRoi(range),
    trendingNow(10),
  ]);

  // Aggregate heatmap into country × entityType matrix
  const countries = Array.from(new Set(heatmap.map((r) => r.country ?? "(unknown)"))).slice(0, 12);
  const entityTypes = ["BOAT", "BLOG", "SCHEDULE", "PATH"];
  const matrix = new Map<string, Map<string, number>>();
  for (const r of heatmap) {
    const k = r.country ?? "(unknown)";
    if (!matrix.has(k)) matrix.set(k, new Map());
    matrix.get(k)!.set(r.entityType, (matrix.get(k)!.get(r.entityType) ?? 0) + r.views);
  }

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", color: "#e5e5e5", padding: "28px 24px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <Link href="/backoffice" style={{ fontSize: 11, color: "#555", textDecoration: "none" }}>← Dashboard</Link>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: "6px 0 0" }}>Analytics</h1>
            <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              Live data. Bots excluded. Raw events retained 90 days; aggregates forever.
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, background: "#161616", padding: 4, borderRadius: 10 }}>
            {RANGES.map((r) => (
              <Link key={r} href={`/backoffice/analytics?range=${r}`}
                style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: "none",
                  background: r === range ? "#3b82f6" : "transparent",
                  color: r === range ? "#fff" : "#666",
                }}>
                {r}
              </Link>
            ))}
          </div>
        </div>

        {/* ── KPI cards ──────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
          <KPI label="Sessions"           value={fmtNum(ov.sessions)} />
          <KPI label="Unique Visitors"    value={fmtNum(ov.visitors)} />
          <KPI label="Events"             value={fmtNum(ov.events)} />
          <KPI label="Booking Intents"    value={fmtNum(ov.intents)} tone="accent" />
          <KPI label="Returning Visitors" value={fmtNum(ov.returningVisitors)} sub={`${fmtPct(ov.returningRate)} of visitors`} />
          <KPI label="View → Intent"      value={fmtPct(fn.intentRate)} sub={`${fmtNum(fn.viewed)} → ${fmtNum(fn.intent)}`} tone="accent" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
          {/* Top trips */}
          <Card>
            <SectionTitle hint="Boat detail views + booking intents">Top Trips</SectionTitle>
            {trips.length === 0 ? (
              <Empty />
            ) : (
              <table style={tableStyle}>
                <thead><tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Title</th>
                  <th style={thNumStyle}>Views</th>
                  <th style={thNumStyle}>Visitors</th>
                  <th style={thNumStyle}>Intents</th>
                </tr></thead>
                <tbody>
                  {trips.map((t, i) => (
                    <tr key={t.entityId} style={i % 2 ? oddRowStyle : undefined}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={{ ...tdStyle, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.boat?.translations[0]?.title || t.boat?.name || t.entityId}
                      </td>
                      <td style={tdNumStyle}>{fmtNum(t.views)}</td>
                      <td style={tdNumStyle}>{fmtNum(t.uniqueVisitors)}</td>
                      <td style={{ ...tdNumStyle, color: t.intents ? "#f59e0b" : "#444", fontWeight: 700 }}>{t.intents || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Top blogs */}
          <Card>
            <SectionTitle hint="Ranked by READS (scroll≥80% + dwell≥30s) — true engagement">Top Blogs</SectionTitle>
            {blogs.length === 0 ? (
              <Empty />
            ) : (
              <table style={tableStyle}>
                <thead><tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Title</th>
                  <th style={thNumStyle}>Views</th>
                  <th style={thNumStyle}>Reads</th>
                  <th style={thNumStyle}>Avg Dwell</th>
                </tr></thead>
                <tbody>
                  {blogs.map((b, i) => (
                    <tr key={b.entityId} style={i % 2 ? oddRowStyle : undefined}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={{ ...tdStyle, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.blog?.translations[0]?.title || b.entityId}
                      </td>
                      <td style={tdNumStyle}>{fmtNum(b.views)}</td>
                      <td style={{ ...tdNumStyle, color: b.reads ? "#10b981" : "#444", fontWeight: 700 }}>{b.reads || "—"}</td>
                      <td style={tdNumStyle}>{fmtDwell(b.avgDwellMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Top searches */}
          <Card>
            <SectionTitle hint={`${search.totals.zero} of ${search.totals.total} searches returned 0 results`}>Top Searches</SectionTitle>
            {search.top.length === 0 ? (
              <Empty />
            ) : (
              <table style={tableStyle}>
                <thead><tr>
                  <th style={thStyle}>Query</th>
                  <th style={thNumStyle}>Count</th>
                  <th style={thNumStyle}>Avg Results</th>
                </tr></thead>
                <tbody>
                  {search.top.slice(0, 12).map((s, i) => (
                    <tr key={s.queryNorm} style={i % 2 ? oddRowStyle : undefined}>
                      <td style={{ ...tdStyle, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.queryNorm}
                      </td>
                      <td style={tdNumStyle}>{fmtNum(s.count)}</td>
                      <td style={{ ...tdNumStyle, color: (s.avgResultsCount ?? 0) === 0 ? "#ef4444" : "#888" }}>
                        {s.avgResultsCount ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* 0-result queries (SEO gold) */}
          <Card>
            <SectionTitle hint="Searches with 0 matches → content or SEO opportunity">0-Result Queries</SectionTitle>
            {search.zeroResult.length === 0 ? (
              <Empty />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {search.zeroResult.slice(0, 15).map((q) => (
                  <div key={q.queryNorm} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", background: "#161616", borderRadius: 8,
                    borderLeft: "3px solid #ef4444",
                  }}>
                    <span style={{ fontSize: 13, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.queryNorm}
                    </span>
                    <span style={{ fontSize: 11, color: "#888", fontWeight: 700, marginLeft: 12 }}>×{q.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Country × Entity heatmap */}
          <Card>
            <SectionTitle hint="Top countries × content type — targeting signal">Country Heatmap</SectionTitle>
            {countries.length === 0 ? (
              <Empty />
            ) : (
              <table style={tableStyle}>
                <thead><tr>
                  <th style={thStyle}>Country</th>
                  {entityTypes.map((t) => <th key={t} style={thNumStyle}>{t}</th>)}
                </tr></thead>
                <tbody>
                  {countries.map((c, i) => {
                    const row = matrix.get(c);
                    return (
                      <tr key={c} style={i % 2 ? oddRowStyle : undefined}>
                        <td style={tdStyle}>{c}</td>
                        {entityTypes.map((t) => {
                          const v = row?.get(t) ?? 0;
                          return (
                            <td key={t} style={{ ...tdNumStyle, color: v ? "#e5e5e5" : "#333" }}>
                              {v ? fmtNum(v) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>

          {/* UTM ROI */}
          <Card>
            <SectionTitle hint="First-touch attribution · sessions per source → booking intents">UTM Source ROI</SectionTitle>
            {utm.length === 0 ? (
              <Empty caption="No UTM-tagged traffic yet. Add ?utm_source=... to ad links." />
            ) : (
              <table style={tableStyle}>
                <thead><tr>
                  <th style={thStyle}>Source / Medium / Campaign</th>
                  <th style={thNumStyle}>Sessions</th>
                  <th style={thNumStyle}>Intents</th>
                  <th style={thNumStyle}>Rate</th>
                </tr></thead>
                <tbody>
                  {utm.slice(0, 12).map((u, i) => (
                    <tr key={i} style={i % 2 ? oddRowStyle : undefined}>
                      <td style={{ ...tdStyle, fontSize: 11, color: "#aaa" }}>
                        {[u.source ?? "(direct)", u.medium ?? "—", u.campaign ?? "—"].join(" / ")}
                      </td>
                      <td style={tdNumStyle}>{fmtNum(u.sessions)}</td>
                      <td style={{ ...tdNumStyle, color: u.intents ? "#f59e0b" : "#444", fontWeight: 700 }}>{u.intents || "—"}</td>
                      <td style={tdNumStyle}>{fmtPct(u.intentRate ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Trending now */}
          <Card>
            <SectionTitle hint="Last 24h (refreshed every 15min)">Trending Now</SectionTitle>
            {trending.length === 0 ? (
              <Empty />
            ) : (
              <table style={tableStyle}>
                <thead><tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Entity ID</th>
                  <th style={thNumStyle}>Views</th>
                  <th style={thNumStyle}>Sessions</th>
                </tr></thead>
                <tbody>
                  {trending.map((t, i) => (
                    <tr key={`${t.entityType}-${t.entityId}`} style={i % 2 ? oddRowStyle : undefined}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={tdStyle}><Badge>{t.entityType}</Badge></td>
                      <td style={{ ...tdStyle, fontSize: 11, fontFamily: "monospace", color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{t.entityId}</td>
                      <td style={tdNumStyle}>{fmtNum(t.views)}</td>
                      <td style={tdNumStyle}>{fmtNum(t.sessions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <p style={{ fontSize: 11, color: "#333", marginTop: 24, textAlign: "center" }}>
          Cron: daily rollup 01:00 BKK · trending view refreshed every 15min (manual for now)
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "accent" }) {
  return (
    <div style={{
      background: "#111", border: `1px solid ${tone === "accent" ? "#3b82f6" : "#1f1f1f"}`,
      borderRadius: 12, padding: "14px 16px",
    }}>
      <div style={{ fontSize: 10, color: "#666", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: tone === "accent" ? "#3b82f6" : "#f5f5f5", marginTop: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Empty({ caption = "No data yet — data will appear once events flow in." }: { caption?: string }) {
  return <p style={{ fontSize: 12, color: "#444", textAlign: "center", padding: "32px 0" }}>{caption}</p>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 5,
      background: "#1a1a1a", color: "#888", letterSpacing: "0.05em",
    }}>
      {children}
    </span>
  );
}

const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 12 };
const thStyle:    React.CSSProperties = { textAlign: "left",  padding: "6px 8px", fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid #1f1f1f" };
const thNumStyle: React.CSSProperties = { ...thStyle, textAlign: "right" };
const tdStyle:    React.CSSProperties = { padding: "8px", fontSize: 12, color: "#ccc" };
const tdNumStyle: React.CSSProperties = { ...tdStyle, textAlign: "right", fontFamily: "monospace", fontWeight: 600 };
const oddRowStyle: React.CSSProperties = { background: "#0f0f0f" };
