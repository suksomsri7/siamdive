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
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<{ ok: boolean; msg: string } | null>(null);

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

  async function connectToken() {
    if (!token.trim()) return;
    setConnecting(true);
    setConnectResult(null);
    try {
      const res = await fetch("/api/social/buffer/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "connect failed");
      setConnectResult({ ok: true, msg: `เชื่อมแล้ว ${data.total} channels (ใหม่ ${data.new})` });
      setToken("");
      load();
    } catch (err) {
      setConnectResult({ ok: false, msg: err instanceof Error ? err.message : "connect failed" });
    } finally {
      setConnecting(false);
    }
  }

  async function update(a: Account, patch: Partial<Account>) {
    const res = await fetch(`/api/social/accounts/${a.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) load();
  }

  async function disconnect(a: Account) {
    if (!confirm(`ตัดการเชื่���ม ${a.pageName}?`)) return;
    await fetch(`/api/social/accounts/${a.id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <main style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Social Accounts (Buffer)</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/backoffice/social/settings" style={link}>AI Settings</a>
          <a href="/backoffice/social/queue" style={link}>Queue</a>
          <a href="/backoffice/social/templates" style={link}>Templates</a>
        </div>
      </header>

      {connectedCount && (
        <div style={{ background: "#1e3a2e", color: "#10b981", padding: 12, borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
          เชื่อมแล้ว {connectedCount} pages (ใหม่ {newCount})
        </div>
      )}

      {/* Token connect section */}
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: 8, padding: 18, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>เชื่อมต่อ Buffer API Token</h3>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 12, lineHeight: 1.6 }}>
          คัดลอก token จาก{" "}
          <a href="https://publish.buffer.com/settings/api" target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>
            publish.buffer.com/settings/api
          </a>{" "}
          แล้ววางที่นี่
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="วาง Buffer API token ที่นี่..."
            style={{ flex: 1, background: "#0a0a0a", border: "1px solid #333", color: "#e5e5e5", padding: "10px 14px", borderRadius: 6, fontSize: 13 }}
          />
          <button
            onClick={connectToken}
            disabled={connecting || !token.trim()}
            style={{
              background: connecting ? "#333" : "#1877f2",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "10px 20px",
              fontWeight: 700,
              fontSize: 13,
              cursor: connecting ? "wait" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {connecting ? "กำลังเชื่อม..." : "เชื่อมต่อ"}
          </button>
        </div>
        {connectResult && (
          <div style={{
            marginTop: 10, padding: 10, borderRadius: 6, fontSize: 12,
            background: connectResult.ok ? "#1e3a2e" : "#3a1e1e",
            color: connectResult.ok ? "#10b981" : "#ef4444",
            border: `1px solid ${connectResult.ok ? "#10b981" : "#ef4444"}`,
          }}>
            {connectResult.ok ? "✓ " : "✗ "}{connectResult.msg}
          </div>
        )}
      </div>

      {error && <div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>}
      {loading ? <div>Loading...</div> : accounts.length === 0 ? (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: 8, padding: 40, textAlign: "center", color: "#666" }}>
          <p>ยังไม่ได้เชื่อมต่อ Buffer account</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>วาง API token ด้านบนเพื่อเริ่ม</p>
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
                <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Buffer channel: {a.bufferProfileId}</div>
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
          <li>ไปที่ <a href="https://publish.buffer.com/settings/api" target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>publish.buffer.com/settings/api</a> → คัดลอก API token</li>
          <li>เพิ่ม Facebook Pages / Instagram / X เข้า Buffer ผ่าน Buffer UI ก่อน</li>
          <li>วาง token ด้านบน → ระบบจะดึง channels ทั้งหมดมาอัตโนมัติ</li>
          <li>กำหนดภาษา (TH/EN) ของแต่ละ channel เพื่อให้ blog auto-route ถูก</li>
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
const link: React.CSSProperties = { color: "#93c5fd", fontSize: 12, textDecoration: "none" };
