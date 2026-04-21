// Backoffice dashboard — Server Component. All numbers come from the DB in
// one pass so the page loads as a single render.

import { prisma } from "@/lib/prisma";
import type { BoatType, BlogCategory } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const DAYTRIP_TYPES: BoatType[] = ["DAYTRIP", "SNORKELING", "LAND_TOUR", "FREEDIVE"];
const LIVEABOARD_TYPES: BoatType[] = ["LIVEABOARD", "DIVE_RESORT"];
const COURSE_TYPES: BoatType[] = ["SCUBA_COURSES", "FREEDIVE_COURSES", "SCUBA_INSTRUCTOR", "FREEDIVE_INSTRUCTOR"];
const BLOG_CATEGORIES: BlogCategory[] = ["DIVE_SITES", "MARINE_LIFE", "GEAR", "WHY_THAILAND", "SAFETY", "EDUCATION", "CONSERVATION", "WORLD_DIVE_SITES"];

const QUICK_LINKS = [
  { label: "Add Scuba Day Trip", href: "/backoffice/trips/daytrip/new", icon: "+" },
  { label: "Add Liveaboard", href: "/backoffice/trips/liveaboard/new", icon: "+" },
  { label: "Add Course", href: "/backoffice/courses/new", icon: "+" },
  { label: "Add Blog Post", href: "/backoffice/blogs/new", icon: "+" },
  { label: "Manage Display", href: "/backoffice/display", icon: "🖥" },
  { label: "Media Library", href: "/backoffice/media", icon: "🖼" },
  { label: "Analytics", href: "/backoffice/analytics", icon: "📊" },
];

function fmtRel(d: Date | null | undefined): string {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(d).toISOString().slice(0, 10);
}

function fmtDateShort(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function BackofficeDashboard() {
  const now = new Date();
  const todayStart = new Date(now.toISOString().slice(0, 10) + "T00:00:00.000Z");
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonth  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [
    // Boats
    boatsByType,
    // Schedules
    schedulesUpcoming,
    schedulesThisMonthOpen,
    schedulesThisMonthFull,
    nextFiveSchedules,
    // Blog pipeline
    blogsByStatus,
    cronState,
    recentPublished,
    // Topic pool
    topicsByCat,
    // Cron audit (recent activity)
    recentAudit,
  ] = await Promise.all([
    prisma.boat.groupBy({ by: ["type"], where: { status: "PUBLISHED" }, _count: true }),
    prisma.schedule.count({ where: { status: { in: ["OPEN", "FULL"] }, departureDate: { gte: todayStart } } }),
    prisma.schedule.count({
      where: { status: "OPEN", departureDate: { gte: todayStart, lt: nextMonth } },
    }),
    prisma.schedule.count({
      where: { status: "FULL", departureDate: { gte: todayStart, lt: nextMonth } },
    }),
    prisma.schedule.findMany({
      where: { status: { in: ["OPEN", "FULL"] }, departureDate: { gte: todayStart } },
      orderBy: { departureDate: "asc" },
      take: 5,
      include: {
        boat: { select: { id: true, name: true, type: true, translations: { where: { lang: "en" }, select: { title: true } } } },
        translations: { where: { lang: "en" }, select: { title: true } },
      },
    }),
    prisma.blog.groupBy({ by: ["status"], _count: true }),
    prisma.cronState.findUnique({ where: { id: "default" } }),
    prisma.blog.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        covers: true,
        updatedAt: true,
        translations: { where: { lang: "en" }, select: { title: true, slug: true } },
      },
    }),
    prisma.blogTopic.groupBy({ by: ["category", "used"], _count: true }),
    prisma.cronAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { event: true, detail: true, createdAt: true, blogId: true, category: true },
    }),
  ]);

  // Roll the groupBy results into shapes the UI needs.
  const boatCount = (types: BoatType[]) =>
    boatsByType.filter((r) => types.includes(r.type)).reduce((s, r) => s + r._count, 0);

  const blogStatusCount = (s: "DRAFT" | "APPROVED" | "PUBLISHED") =>
    blogsByStatus.find((r) => r.status === s)?._count ?? 0;

  const topicsByCategoryMap = new Map<BlogCategory, { used: number; unused: number }>();
  for (const c of BLOG_CATEGORIES) topicsByCategoryMap.set(c, { used: 0, unused: 0 });
  for (const r of topicsByCat) {
    const slot = topicsByCategoryMap.get(r.category)!;
    if (r.used) slot.used += r._count; else slot.unused += r._count;
  }
  const totalUnusedTopics = [...topicsByCategoryMap.values()].reduce((s, v) => s + v.unused, 0);

  // Blog-to-category lookup: Blog.category doesn't exist; category lives on
  // BlogTopic.blogId. Fetch matching topics for the recent-blog cards only.
  const recentBlogIds = recentPublished.map((b) => b.id);
  const topicsForRecent = recentBlogIds.length
    ? await prisma.blogTopic.findMany({
        where: { blogId: { in: recentBlogIds } },
        select: { blogId: true, category: true },
      })
    : [];
  const blogCategoryMap = new Map<string, BlogCategory>();
  for (const t of topicsForRecent) if (t.blogId) blogCategoryMap.set(t.blogId, t.category);

  // Today's publish progress — mirrors the cron's bkkDate logic.
  const bkkDate = (() => {
    const bkk = new Date(Date.now() + 7 * 60 * 60 * 1000);
    return bkk.toISOString().slice(0, 10);
  })();
  const publishedToday = cronState?.publishedDate === bkkDate ? cronState.publishedToday : 0;
  const dailyCap = 4;

  // Hero stats
  const HERO: Array<{ label: string; value: string | number; sub: string; color: string; href?: string }> = [
    { label: "Scuba Day Trips",  value: boatCount(DAYTRIP_TYPES),   sub: "published boats",   color: "#3b82f6", href: "/backoffice/trips/daytrip" },
    { label: "Liveaboard",       value: boatCount(LIVEABOARD_TYPES), sub: "published boats",   color: "#8b5cf6", href: "/backoffice/trips/liveaboard" },
    { label: "Courses",          value: boatCount(COURSE_TYPES),    sub: "course offerings",  color: "#10b981", href: "/backoffice/courses" },
    { label: "Upcoming Schedules", value: schedulesUpcoming,        sub: "today onwards",     color: "#f59e0b", href: "/backoffice/schedules" },
  ];

  const card: React.CSSProperties = {
    background: "#161616",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 12,
  };

  const publisherLabel = cronState?.autoPublishEnabled ? "ON" : "OFF";
  const generatorLabel = cronState?.generatorEnabled   ? "ON" : "OFF";

  return (
    <div style={{ padding: "clamp(16px, 4vw, 32px) clamp(16px, 4vw, 36px)", color: "#e5e5e5" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#444" }}>SIAMDIVE Backoffice — live metrics</p>
      </div>

      {/* Hero stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 28 }}>
        {HERO.map((s) => (
          <a key={s.label} href={s.href || "#"} style={{ ...card, padding: "18px 20px", textDecoration: "none", display: "block" }}>
            <p style={{ fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#333", marginTop: 4 }}>{s.sub}</p>
          </a>
        ))}
      </div>

      {/* Row: Blog pipeline + Schedule health */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 28 }}>
        {/* Blog pipeline */}
        <div style={{ ...card, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontSize: 12, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Blog Pipeline</h2>
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: cronState?.autoPublishEnabled ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.15)", color: cronState?.autoPublishEnabled ? "#10b981" : "#f87171", fontWeight: 700 }}>
              Publisher {publisherLabel}
            </span>
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: cronState?.generatorEnabled ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.15)", color: cronState?.generatorEnabled ? "#10b981" : "#f87171", fontWeight: 700 }}>
              Generator {generatorLabel}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {([
              { label: "Draft",     value: blogStatusCount("DRAFT"),     color: "#94a3b8" },
              { label: "Approved",  value: blogStatusCount("APPROVED"),  color: "#60a5fa" },
              { label: "Published", value: blogStatusCount("PUBLISHED"), color: "#10b981" },
            ] as const).map((b) => (
              <div key={b.label} style={{ background: "#0d0d0d", borderRadius: 8, padding: "12px 14px" }}>
                <p style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{b.label}</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: b.color, lineHeight: 1, marginTop: 4 }}>{b.value}</p>
              </div>
            ))}
          </div>

          {/* Today's progress bar */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#777", marginBottom: 6 }}>
              <span>Today's publish ({bkkDate} BKK)</span>
              <span>{publishedToday} / {dailyCap}</span>
            </div>
            <div style={{ width: "100%", height: 6, background: "#0d0d0d", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (publishedToday / dailyCap) * 100)}%`, height: "100%", background: publishedToday >= dailyCap ? "#10b981" : "#3b82f6" }} />
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#555" }}>
            Last published: <span style={{ color: "#888" }}>{fmtRel(cronState?.lastPublishedAt)}</span>
            <span style={{ margin: "0 8px", color: "#2a2a2a" }}>·</span>
            Last generated: <span style={{ color: "#888" }}>{fmtRel(cronState?.lastGeneratedAt)}</span>
          </p>
        </div>

        {/* Schedule health */}
        <div style={{ ...card, padding: "18px 20px" }}>
          <h2 style={{ fontSize: 12, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            This Month's Schedules
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "#0d0d0d", borderRadius: 8, padding: "12px 14px" }}>
              <p style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Open</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#10b981", lineHeight: 1, marginTop: 4 }}>{schedulesThisMonthOpen}</p>
            </div>
            <div style={{ background: "#0d0d0d", borderRadius: 8, padding: "12px 14px" }}>
              <p style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Full</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#f59e0b", lineHeight: 1, marginTop: 4 }}>{schedulesThisMonthFull}</p>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Next up
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {nextFiveSchedules.length === 0 && (
              <p style={{ fontSize: 12, color: "#444" }}>No upcoming schedules.</p>
            )}
            {nextFiveSchedules.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                <span style={{ color: "#888", minWidth: 50 }}>{fmtDateShort(s.departureDate)}</span>
                <span style={{ color: "#ddd", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.boat.translations[0]?.title || s.boat.name}
                  {s.translations[0]?.title && <span style={{ color: "#555" }}> · {s.translations[0].title}</span>}
                </span>
                {s.status === "FULL" && <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b" }}>FULL</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Topic pool + Recent cron activity */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 28 }}>
        {/* Topic pool */}
        <div style={{ ...card, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 12, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Topic Pool</h2>
            <span style={{ fontSize: 11, color: "#555" }}>{totalUnusedTopics} unused · auto-refill Sun</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {BLOG_CATEGORIES.map((cat) => {
              const v = topicsByCategoryMap.get(cat)!;
              const target = 25;
              const ratio = Math.min(1, v.unused / target);
              const low = v.unused < 15;
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: "#aaa", fontWeight: 600 }}>{cat}</span>
                    <span style={{ color: low ? "#f87171" : "#555" }}>{v.unused} unused {low && "· low"}</span>
                  </div>
                  <div style={{ width: "100%", height: 4, background: "#0d0d0d", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      width: `${ratio * 100}%`, height: "100%",
                      background: low ? "#f87171" : ratio < 0.6 ? "#f59e0b" : "#10b981",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent cron activity */}
        <div style={{ ...card, padding: "18px 20px" }}>
          <h2 style={{ fontSize: 12, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
            Cron Activity
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentAudit.length === 0 && (
              <p style={{ fontSize: 12, color: "#444" }}>No audit events yet.</p>
            )}
            {recentAudit.map((a, i) => {
              const [group, action] = a.event.split(".");
              const color =
                action === "published" ? "#10b981" :
                action === "completed" || action === "picked" ? "#60a5fa" :
                action === "skipped" || action === "empty" ? "#94a3b8" :
                action === "topics" ? "#8b5cf6" : "#777";
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 11, lineHeight: 1.4 }}>
                  <span style={{ color: "#444", minWidth: 54 }}>{fmtRel(a.createdAt)}</span>
                  <span style={{ color, fontWeight: 700, minWidth: 82 }}>{group}.{action}</span>
                  <span style={{ color: "#888", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.detail || a.category || a.blogId || ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent published blogs */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 12, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Recent Published Blogs
          </h2>
          <a href="/backoffice/blogs" style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none" }}>View all →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {recentPublished.length === 0 && (
            <p style={{ fontSize: 12, color: "#444" }}>No published blogs yet.</p>
          )}
          {recentPublished.map((b) => {
            const cover = b.covers[0]
              ? (b.covers[0].startsWith("http") ? b.covers[0] : `https://siamdive-cdn.b-cdn.net${b.covers[0]}`)
              : null;
            return (
              <a key={b.id} href={`/backoffice/blogs/${b.id}`}
                style={{ ...card, overflow: "hidden", textDecoration: "none", color: "inherit", display: "block" }}>
                {cover
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={cover} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                  : <div style={{ width: "100%", aspectRatio: "16/9", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: 11 }}>no cover</div>
                }
                <div style={{ padding: "10px 12px" }}>
                  <p style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{blogCategoryMap.get(b.id) ?? "—"}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {b.translations[0]?.title || "(no title)"}
                  </p>
                  <p style={{ fontSize: 10, color: "#444", marginTop: 6 }}>{fmtRel(b.updatedAt)}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          Quick Actions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {QUICK_LINKS.map((q) => (
            <a key={q.href} href={q.href}
              style={{ display: "flex", alignItems: "center", gap: 10, ...card, padding: "13px 16px", fontSize: 13, color: "#aaa", fontWeight: 500, textDecoration: "none" }}>
              <span style={{ fontSize: 16 }}>{q.icon}</span>
              {q.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
