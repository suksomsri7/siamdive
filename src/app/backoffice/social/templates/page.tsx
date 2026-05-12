"use client";

import { useEffect, useState } from "react";

type Template = {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnailUrl: string;
  isSystem: boolean;
  createdAt: string;
};

export default function SocialTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [seedDone, setSeedDone] = useState<string>("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/social/templates", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "load failed");
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function seed() {
    const res = await fetch("/api/social/templates/seed", { method: "POST", credentials: "include" });
    const data = await res.json();
    setSeedDone(`seeded ${data.seeded ?? 0}`);
    load();
  }

  async function rename(t: Template) {
    const name = prompt("ตั้งชื่อใหม่", t.name);
    if (!name || name === t.name) return;
    const res = await fetch(`/api/social/templates/${t.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) load();
  }

  async function remove(t: Template) {
    if (!confirm(`ลบ ${t.name}?`)) return;
    const res = await fetch(`/api/social/templates/${t.id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  }

  return (
    <main style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Social Image Templates</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={seed} style={btn}>🌱 Seed system templates</button>
        </div>
      </header>

      {seedDone && <div style={{ background: "#1e3a2e", color: "#10b981", padding: 10, borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{seedDone}</div>}
      {error && <div style={{ color: "#ef4444" }}>{error}</div>}
      {loading ? <div>Loading...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {templates.map(t => (
            <div key={t.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ background: "#000", aspectRatio: `${t.width} / ${t.height}`, position: "relative" }}>
                {t.thumbnailUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={t.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                {t.isSystem && <span style={{ position: "absolute", top: 6, right: 6, background: "#1e3a8a", color: "#93c5fd", fontSize: 9, padding: "2px 6px", borderRadius: 3, fontWeight: 700 }}>SYSTEM</span>}
              </div>
              <div style={{ padding: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: "#666" }}>{t.width} × {t.height}</div>
                {!t.isSystem && (
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    <button onClick={() => rename(t)} style={miniBtn}>✏️ Rename</button>
                    <button onClick={() => remove(t)} style={{ ...miniBtn, color: "#ef4444" }}>🗑️ Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: 24, fontSize: 12, color: "#666" }}>
        Templates ใหม่ถูกบันทึกจาก Share drawer photo editor (ติ๊ก "บันทึกเป็น template" ก่อน Save & use).
      </p>
    </main>
  );
}

const btn: React.CSSProperties = { background: "#111", border: "1px solid #333", color: "#ccc", padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" };
const miniBtn: React.CSSProperties = { background: "transparent", border: "1px solid #333", color: "#ccc", padding: "3px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer" };
