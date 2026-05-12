"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Account = {
  id: string;
  pageName: string;
  pageUrl: string;
  avatarUrl: string;
  language: string;
  bufferProfileId: string;
  expiresAt: string | null;
  createdAt: string;
};

function AccountsContent() {
  const search = useSearchParams();
  const connectedCount = search.get("connected");
  const newCount = search.get("new");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/social/accounts", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "load failed");
      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function update(a: Account, patch: Partial<Account>) {
    const res = await fetch(`/api/social/accounts/${a.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) load();
  }

  async function disconnect(a: Account) {
    if (!confirm(`ตัดการเชื่อม ${a.pageName}?`)) return;
    await fetch(`/api/social/accounts/${a.id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <main style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Social Accounts (Buffer)</h1>
        <a href="/api/social/buffer/oauth/start" style={{ background: "#1877f2", color: "#fff", padding: "10px 18px", borderRadius: 6, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
          🔗 เชื่อม Buffer
        </a>
      </header>

      {connectedCount && (
        <div style={{ background: "#1e3a2e", color: "#10b981", padding: 12, borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
          ✅ เชื่อมแล้ว {connectedCount} pages (ใหม่ {newCount})
        </div>
      )}

      {error && <div style={{ color: "#ef4444" }}>{error}</div>}
      {loading ? <div>Loading...</div> : accounts.length === 0 ? (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: 8, padding: 40, textAlign: "center", color: "#666" }}>
          <p>ยังไม่ได้เชื่อมต่อ Buffer account</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>คลิก "เชื่อม Buffer" ด้านบนเพื่อเริ่ม OAuth</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {accounts.map(a => (
            <div key={a.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 8, padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
              {a.avatarUrl
                ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.avatarUrl} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                : <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1877f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>f</div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{a.pageName}</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Buffer profile: {a.bufferProfileId}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ fontSize: 11, color: "#888" }}>ภาษา:</label>
                <select value={a.language} onChange={e => update(a, { language: e.target.value })} style={selStyle}>
                  <option value="th">TH (Thai)</option>
                  <option value="en">EN (English)</option>
                </select>
                <button onClick={() => disconnect(a)} style={{ background: "transparent", border: "1px solid #333", color: "#ef4444", padding: "5px 12px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
                  Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 28, padding: 16, background: "#111", border: "1px solid #222", borderRadius: 8, fontSize: 12, color: "#999", lineHeight: 1.6 }}>
        <strong style={{ color: "#ccc" }}>วิธีตั้งค่า:</strong>
        <ol style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>สร้าง Buffer app ที่ <a href="https://buffer.com/developers/apps" target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>buffer.com/developers/apps</a> → ได้ Client ID + Secret</li>
          <li>ตั้ง Vercel env: <code>BUFFER_CLIENT_ID</code>, <code>BUFFER_CLIENT_SECRET</code></li>
          <li>เพิ่ม 2 Facebook Pages เข้า Buffer ผ่าน Buffer UI (TH + EN) ก่อน</li>
          <li>คลิก "เชื่อม Buffer" ด้านบน → OAuth → SocialAccount rows ถูกสร้าง</li>
          <li>กำหนดภาษา (TH/EN) ของแต่ละ Page เพื่อให้ blog auto-route ถูก</li>
        </ol>
      </div>
    </main>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Loading...</div>}>
      <AccountsContent />
    </Suspense>
  );
}

const selStyle: React.CSSProperties = { background: "#0a0a0a", border: "1px solid #333", color: "#e5e5e5", padding: "5px 8px", borderRadius: 4, fontSize: 12 };
