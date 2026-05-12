"use client";

import { useEffect, useState } from "react";

type Post = {
  id: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
  scheduledAt: string | null;
  postedAt: string | null;
  status: "QUEUED" | "POSTED" | "FAILED" | "CANCELLED";
  errorMessage: string | null;
  externalUrl: string | null;
  language: string;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  reach: number | null;
  createdAt: string;
  account: { id: string; pageName: string; language: string; avatarUrl: string } | null;
  blog: { id: string; covers: string[]; translations: { lang: string; title: string; slug: string }[] } | null;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  QUEUED:    { label: "🟡 Queued",    color: "#f59e0b" },
  POSTED:    { label: "🟢 Posted",    color: "#10b981" },
  FAILED:    { label: "🔴 Failed",    color: "#ef4444" },
  CANCELLED: { label: "⚫ Cancelled", color: "#6b7280" },
};

type Account = { id: string; pageName: string; language: string };

export default function SocialQueuePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [syncing, setSyncing] = useState(false);

  // Load accounts once for the filter dropdown
  useEffect(() => {
    fetch("/api/social/accounts", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAccounts(d.accounts || []))
      .catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    const url = new URL("/api/social/posts", window.location.origin);
    if (statusFilter) url.searchParams.set("status", statusFilter);
    if (accountFilter) url.searchParams.set("accountId", accountFilter);
    url.searchParams.set("limit", "100");
    const res = await fetch(url.toString(), { credentials: "include" });
    const data = await res.json();
    let list = (data.posts || []) as Post[];
    // language filter happens client-side (API doesn't filter on language directly)
    if (languageFilter) list = list.filter(p => p.language === languageFilter);
    setPosts(list);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter, accountFilter, languageFilter]);

  async function cancel(p: Post) {
    if (!confirm("ยกเลิกโพสนี้?")) return;
    await fetch(`/api/social/posts/${p.id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  async function syncMetrics() {
    setSyncing(true);
    try {
      const secret = prompt("ใส่ X-Cron-Secret เพื่อ sync metrics:");
      if (!secret) return;
      const res = await fetch("/api/cron/sync-social-metrics", {
        method: "POST",
        headers: { "X-Cron-Secret": secret },
      });
      const data = await res.json();
      alert(`Synced ${data.synced ?? 0} posts`);
      load();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <main style={{ padding: 32, maxWidth: 1400, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Social Queue</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} style={selStyle}>
            <option value="">ทุก channel</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.pageName} ({a.language.toUpperCase()})</option>
            ))}
          </select>
          <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)} style={selStyle}>
            <option value="">ทุกภาษา</option>
            <option value="th">TH</option>
            <option value="en">EN</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selStyle}>
            <option value="">ทุกสถานะ</option>
            <option value="QUEUED">Queued</option>
            <option value="POSTED">Posted</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button onClick={syncMetrics} disabled={syncing} style={btn}>{syncing ? "..." : "🔄 Sync metrics"}</button>
          <a href="/backoffice/social/accounts" style={{ ...btn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Accounts</a>
          <a href="/backoffice/social/templates" style={{ ...btn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Templates</a>
          <a href="/backoffice/social/settings" style={{ ...btn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>AI Settings</a>
        </div>
      </header>

      {loading ? <div>Loading...</div> : posts.length === 0 ? (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: 8, padding: 40, textAlign: "center", color: "#666" }}>
          ยังไม่มีโพสในคิว
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #222" }}>
              <Th>Image</Th>
              <Th>Caption</Th>
              <Th>Page</Th>
              <Th>Scheduled</Th>
              <Th>Status</Th>
              <Th>Stats</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {posts.map(p => {
              const t = p.blog?.translations.find(t => t.lang === p.language) || p.blog?.translations[0];
              const stat = STATUS_LABEL[p.status];
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                  <Td>
                    {p.imageUrl
                      ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.imageUrl} alt="" style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 4 }} />
                      : <div style={{ width: 80, height: 50, background: "#222", borderRadius: 4 }} />
                    }
                  </Td>
                  <Td>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{t?.title || "(no title)"}</div>
                    <div style={{ color: "#888", fontSize: 11, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.caption}</div>
                    {p.errorMessage && <div style={{ color: "#ef4444", fontSize: 10, marginTop: 3 }}>{p.errorMessage}</div>}
                  </Td>
                  <Td>{p.account?.pageName ?? "—"} <span style={{ color: "#666" }}>({p.language})</span></Td>
                  <Td style={{ fontSize: 11 }}>
                    {p.scheduledAt ? new Date(p.scheduledAt).toLocaleString("th-TH") : "—"}
                    {p.postedAt && <div style={{ color: "#10b981", fontSize: 10 }}>✓ {new Date(p.postedAt).toLocaleString("th-TH")}</div>}
                  </Td>
                  <Td><span style={{ color: stat.color, fontWeight: 700, fontSize: 11 }}>{stat.label}</span></Td>
                  <Td style={{ fontSize: 11, color: "#888" }}>
                    {p.likes != null && <div>❤️ {p.likes} 💬 {p.comments ?? 0} 🔁 {p.shares ?? 0}</div>}
                    {p.reach != null && <div>👁 {p.reach}</div>}
                  </Td>
                  <Td>
                    {p.externalUrl && <a href={p.externalUrl} target="_blank" rel="noreferrer" style={linkBtn}>Open</a>}
                    {p.status === "QUEUED" && <button onClick={() => cancel(p)} style={{ ...linkBtn, color: "#ef4444" }}>Cancel</button>}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</th>;
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "10px", verticalAlign: "top", ...style }}>{children}</td>;
}

const btn: React.CSSProperties = { background: "#111", border: "1px solid #333", color: "#ccc", padding: "7px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer" };
const selStyle: React.CSSProperties = { ...btn, padding: "7px 10px" };
const linkBtn: React.CSSProperties = { background: "transparent", border: "1px solid #333", color: "#93c5fd", padding: "3px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer", textDecoration: "none", marginRight: 4 };
