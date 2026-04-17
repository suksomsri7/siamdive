"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", href: "/backoffice", icon: "▦" }],
  },
  {
    section: "Trips",
    items: [
      { label: "Scuba Day Trips", href: "/backoffice/trips/daytrip", icon: "🤿" },
      { label: "Snorkeling Trips", href: "/backoffice/trips/snorkeling", icon: "🐠" },
      { label: "Land Tour", href: "/backoffice/trips/land-tour", icon: "🗺" },
      { label: "Liveaboard", href: "/backoffice/trips/liveaboard", icon: "🚢" },
      { label: "Dive Resort", href: "/backoffice/trips/dive-resort", icon: "🏝" },
      { label: "Freedive Trips", href: "/backoffice/trips/freedive", icon: "🫧" },
      { label: "Scuba Courses", href: "/backoffice/courses", icon: "🎓" },
      { label: "Freedive Courses", href: "/backoffice/freedive-courses", icon: "🫁" },
      { label: "Scuba Dive Instructor", href: "/backoffice/scuba-instructor", icon: "🎖" },
      { label: "Freedive Instructor", href: "/backoffice/freedive-instructor", icon: "🏅" },
      { label: "Blog / Articles", href: "/backoffice/blogs", icon: "📝" },
    ],
  },
  {
    section: "Data",
    items: [
      { label: "Companies", href: "/backoffice/companies", icon: "🏢" },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Admins", href: "/backoffice/admins", icon: "👤" },
      { label: "Display", href: "/backoffice/display", icon: "🖥" },
      { label: "API", href: "/backoffice/api-keys", icon: "🔑" },
      { label: "Settings", href: "/backoffice/settings", icon: "⚙" },
    ],
  },
];

const SIDEBAR_W = 220;

function isActive(pathname: string, href: string) {
  return href === "/backoffice"
    ? pathname === href
    : pathname.startsWith(href);
}

// Hamburger icon
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div style={{ width: 22, height: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <span style={{
        display: "block", height: 2, background: "#fff", borderRadius: 2,
        transformOrigin: "left center",
        transform: open ? "rotate(45deg) translateY(-1px)" : "none",
        transition: "transform 0.2s",
      }} />
      <span style={{
        display: "block", height: 2, background: "#fff", borderRadius: 2,
        opacity: open ? 0 : 1,
        transition: "opacity 0.15s",
      }} />
      <span style={{
        display: "block", height: 2, background: "#fff", borderRadius: 2,
        transformOrigin: "left center",
        transform: open ? "rotate(-45deg) translateY(1px)" : "none",
        transition: "transform 0.2s",
      }} />
    </div>
  );
}

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname === "/backoffice/login") return <>{children}</>;

  const allItems = NAV.flatMap((g) => g.items);
  const currentItem = allItems.find((item) =>
    item.href === "/backoffice" ? pathname === item.href : pathname.startsWith(item.href)
  );

  const SidebarNav = (
    <>
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #181818", flexShrink: 0 }}>
        <Link href="/backoffice" style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em", textDecoration: "none" }}>
          <span style={{ color: "#fff" }}>SIAM</span><span style={{ color: "#3b82f6" }}>DIVE</span>
        </Link>
        <p style={{ fontSize: 9, color: "#2a2a2a", marginTop: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em" }}>Backoffice</p>
      </div>
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        {NAV.map((group) => (
          <div key={group.section} style={{ marginBottom: 2 }}>
            <p style={{ fontSize: 9, color: "#252525", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", padding: "8px 18px 3px" }}>
              {group.section}
            </p>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link key={item.href} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "8px 18px",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "#e5e5e5" : "#3a3a3a",
                  background: active ? "rgba(59,130,246,0.08)" : "transparent",
                  borderLeft: active ? "2px solid #3b82f6" : "2px solid transparent",
                  transition: "color 0.15s, background 0.15s", textDecoration: "none",
                }}>
                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div style={{ padding: "10px 18px 18px", borderTop: "1px solid #181818", flexShrink: 0 }}>
        <Link href="/" target="_blank" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#2a2a2a", marginBottom: 8, textDecoration: "none" }}>
          <span>↗</span> View Frontend
        </Link>
        <Link href="/backoffice/login" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#2a2a2a", textDecoration: "none" }}>
          <span>⏻</span> Logout
        </Link>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a" }}>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex" style={{
        width: SIDEBAR_W, flexShrink: 0, background: "#0d0d0d",
        borderRight: "1px solid #181818", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40,
      }}>
        {SidebarNav}
      </aside>

      {/* ── Desktop main ── */}
      <main className="hidden md:block" style={{ marginLeft: SIDEBAR_W, flex: 1, minHeight: "100vh" }}>
        {children}
      </main>

      {/* ── Mobile layout ── */}
      <div className="flex flex-col md:hidden" style={{ flex: 1, minHeight: "100vh", width: "100%" }}>

        {/* Mobile top header */}
        <header style={{
          height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", background: "#0d0d0d", borderBottom: "1px solid #181818",
          position: "sticky", top: 0, zIndex: 50, flexShrink: 0,
        }}>
          {/* Logo */}
          <Link href="/backoffice" style={{ fontSize: 15, fontWeight: 900, textDecoration: "none" }}>
            <span style={{ color: "#fff" }}>SIAM</span><span style={{ color: "#3b82f6" }}>DIVE</span>
          </Link>

          {/* Current page label */}
          <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>
            {currentItem?.icon} {currentItem?.label ?? "Backoffice"}
          </span>

          {/* Hamburger button */}
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 4px", display: "flex", alignItems: "center", justifyContent: "center",
            }}
            aria-label="Toggle menu"
          >
            <HamburgerIcon open={drawerOpen} />
          </button>
        </header>

        {/* Mobile content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>

        {/* ── Backdrop ── */}
        {drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 55,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(2px)",
            }}
          />
        )}

        {/* ── Drawer (slide from right) ── */}
        <div style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 60,
          width: 260, background: "#0d0d0d", borderLeft: "1px solid #1e1e1e",
          display: "flex", flexDirection: "column",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowY: "auto",
        }}>
          {/* Drawer header */}
          <div style={{
            height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", borderBottom: "1px solid #181818", flexShrink: 0,
          }}>
            <span style={{ fontSize: 15, fontWeight: 900 }}>
              <span style={{ color: "#fff" }}>SIAM</span><span style={{ color: "#3b82f6" }}>DIVE</span>
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 20, lineHeight: 1, padding: 4 }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Drawer nav */}
          <nav style={{ flex: 1, padding: "8px 0" }}>
            {NAV.map((group) => (
              <div key={group.section} style={{ marginBottom: 4 }}>
                <p style={{
                  fontSize: 9, color: "#303030", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.14em",
                  padding: "10px 18px 4px",
                }}>
                  {group.section}
                </p>
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 18px",
                        fontSize: 14, fontWeight: active ? 600 : 400,
                        color: active ? "#e5e5e5" : "#555",
                        background: active ? "rgba(59,130,246,0.1)" : "transparent",
                        borderLeft: active ? "2px solid #3b82f6" : "2px solid transparent",
                        textDecoration: "none",
                        transition: "color 0.15s, background 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Drawer footer */}
          <div style={{ padding: "12px 18px 24px", borderTop: "1px solid #181818", flexShrink: 0 }}>
            <Link href="/" target="_blank"
              onClick={() => setDrawerOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#444", marginBottom: 10, textDecoration: "none" }}>
              <span style={{ width: 24, textAlign: "center" }}>↗</span> View Frontend
            </Link>
            <Link href="/backoffice/login"
              onClick={() => setDrawerOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#444", textDecoration: "none" }}>
              <span style={{ width: 24, textAlign: "center" }}>⏻</span> Logout
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
