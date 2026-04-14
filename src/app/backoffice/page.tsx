"use client";

const STATS = [
  { label: "Daytrip", value: "6", sub: "trips", color: "#3b82f6" },
  { label: "Liveaboard", value: "9", sub: "trips", color: "#8b5cf6" },
  { label: "Courses", value: "0", sub: "courses", color: "#10b981" },
  { label: "Blog Posts", value: "5", sub: "articles", color: "#f59e0b" },
];

const QUICK_LINKS = [
  { label: "Add Daytrip", href: "/backoffice/trips/daytrip/new", icon: "+" },
  { label: "Add Liveaboard", href: "/backoffice/trips/liveaboard/new", icon: "+" },
  { label: "Add Course", href: "/backoffice/courses/new", icon: "+" },
  { label: "Add Blog Post", href: "/backoffice/blogs/new", icon: "+" },
  { label: "Manage Destinations", href: "/backoffice/destinations", icon: "📍" },
  { label: "Upload Media", href: "/backoffice/media", icon: "🖼" },
];

export default function BackofficeDashboard() {
  return (
    <div style={{ padding: "clamp(16px, 4vw, 32px) clamp(16px, 4vw, 36px)", color: "#e5e5e5" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#444" }}>SIAMDIVE Backoffice Management</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 40 }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ background: "#161616", borderRadius: 12, padding: "20px 22px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#333", marginTop: 4 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {QUICK_LINKS.map((q) => (
            <a key={q.href} href={q.href}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "#161616", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "13px 16px", fontSize: 13, color: "#aaa", fontWeight: 500, textDecoration: "none", transition: "border-color 0.15s, color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#aaa"; }}>
              <span style={{ fontSize: 16 }}>{q.icon}</span>
              {q.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
