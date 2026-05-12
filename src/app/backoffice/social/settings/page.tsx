"use client";

import { useEffect, useState } from "react";

type Settings = {
  provider: "anthropic" | "openai" | "openrouter";
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  hasKey: boolean;
  keyPrefix: string;
  updatedAt: string | null;
};

const MODEL_PRESETS: Record<string, { label: string; value: string }[]> = {
  anthropic: [
    { label: "Claude Haiku 4.5 (cheap, fast)", value: "claude-haiku-4-5-20251001" },
    { label: "Claude Sonnet 4.6 (balanced)", value: "claude-sonnet-4-6" },
    { label: "Claude Opus 4.7 (premium)", value: "claude-opus-4-7" },
  ],
  openai: [
    { label: "gpt-4o-mini (cheapest)", value: "gpt-4o-mini" },
    { label: "gpt-4o", value: "gpt-4o" },
  ],
  openrouter: [
    { label: "openai/gpt-4o-mini ($0.15/1M tokens)", value: "openai/gpt-4o-mini" },
    { label: "anthropic/claude-haiku-4.5", value: "anthropic/claude-haiku-4.5" },
    { label: "deepseek/deepseek-chat-v3-0324 (super cheap)", value: "deepseek/deepseek-chat-v3-0324" },
    { label: "google/gemini-flash-1.5", value: "google/gemini-flash-1.5" },
    { label: "meta-llama/llama-3.3-70b-instruct", value: "meta-llama/llama-3.3-70b-instruct" },
  ],
};

const KEY_HINTS: Record<string, string> = {
  anthropic: "ขึ้นต้นด้วย sk-ant-… (จาก console.anthropic.com)",
  openai: "ขึ้นต้นด้วย sk-… (จาก platform.openai.com)",
  openrouter: "ขึ้นต้นด้วย sk-or-… (จาก openrouter.ai/keys)",
};

export default function SocialSettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [toast, setToast] = useState<string>("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/social/settings", { credentials: "include" });
    const data = await res.json();
    setS(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(patch: Partial<Settings> & { apiKey?: string }) {
    setSaving(true);
    try {
      const res = await fetch("/api/social/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("save failed");
      setToast("✅ บันทึกแล้ว");
      setApiKey("");
      load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 3000);
    }
  }

  async function test() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/social/settings/test", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.ok) setTestResult({ ok: true, msg: `${data.caption} (${data.ms}ms)` });
      else setTestResult({ ok: false, msg: data.error || "unknown" });
    } finally {
      setTesting(false);
    }
  }

  if (loading || !s) return <main style={{ padding: 32 }}>Loading…</main>;

  const presets = MODEL_PRESETS[s.provider] ?? [];
  const customModel = !presets.find(p => p.value === s.model);

  return (
    <main style={{ padding: 32, maxWidth: 760, margin: "0 auto", color: "#e5e5e5" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Social AI Settings</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/backoffice/social/queue" style={link}>Queue</a>
          <a href="/backoffice/social/accounts" style={link}>Accounts</a>
          <a href="/backoffice/social/templates" style={link}>Templates</a>
        </div>
      </header>

      <p style={{ color: "#888", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        ตั้งค่า AI สำหรับ ✨ caption + ✨ hashtags ใน Share drawer.
        <strong style={{ color: "#fbbf24" }}> แยกจาก Ark AI</strong> (ใช้คนละ provider/model/budget ได้).
      </p>

      <Section title="Enable">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={s.enabled} onChange={e => save({ enabled: e.target.checked })} />
          เปิดใช้งาน AI ใน Share drawer
        </label>
      </Section>

      <Section title="Provider">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {(["anthropic", "openai", "openrouter"] as const).map(p => (
            <button
              key={p}
              onClick={() => save({ provider: p, model: MODEL_PRESETS[p][0].value })}
              disabled={saving}
              style={{
                ...btn,
                background: s.provider === p ? "#1877f2" : "#111",
                color: s.provider === p ? "#fff" : "#ccc",
                borderColor: s.provider === p ? "#1877f2" : "#333",
              }}
            >
              {p === "anthropic" ? "🔵 Anthropic" : p === "openai" ? "🟢 OpenAI" : "🟣 OpenRouter"}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#666" }}>
          {s.provider === "openrouter" && "✨ แนะนำ: ราคาถูกสุด + เลือก model หลากหลาย"}
          {s.provider === "anthropic" && "Native Claude API — คุณภาพดีสุดสำหรับภาษาไทย"}
          {s.provider === "openai" && "OpenAI Direct — gpt-4o-mini ราคา ~$0.15/1M tokens"}
        </p>
      </Section>

      <Section title="API Key">
        {s.hasKey && !apiKey && (
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 6, padding: 10, marginBottom: 8, fontSize: 12, color: "#10b981" }}>
            ✓ มี key อยู่: <code>{s.keyPrefix}</code>
          </div>
        )}
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder={s.hasKey ? "ใส่ key ใหม่เพื่อแทนที่ (ปล่อยว่างเพื่อคงไว้)" : KEY_HINTS[s.provider]}
          style={input}
        />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <button onClick={() => apiKey && save({ apiKey })} disabled={!apiKey || saving} style={btnPrimary}>
            {saving ? "..." : "💾 บันทึก key"}
          </button>
          {s.hasKey && (
            <button onClick={() => { if (confirm("ลบ key?")) save({ apiKey: "" }); }} disabled={saving} style={{ ...btn, color: "#ef4444" }}>
              🗑️ ลบ key
            </button>
          )}
        </div>
        <p style={{ fontSize: 11, color: "#666", marginTop: 6 }}>{KEY_HINTS[s.provider]}</p>
      </Section>

      <Section title="Model">
        <select value={customModel ? "__custom__" : s.model} onChange={e => {
          if (e.target.value !== "__custom__") save({ model: e.target.value });
        }} style={input}>
          {presets.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          <option value="__custom__">Custom...</option>
        </select>
        {customModel && (
          <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
            <input type="text" defaultValue={s.model} onBlur={e => save({ model: e.target.value })} style={input} placeholder="model id" />
          </div>
        )}
      </Section>

      <Section title="Parameters">
        <Row label="Max tokens">
          <input type="number" min={100} max={4096} defaultValue={s.maxTokens} onBlur={e => save({ maxTokens: Number(e.target.value) })} style={input} />
          <span style={{ fontSize: 11, color: "#666" }}>caption ใช้ ~300, hashtags ~500</span>
        </Row>
        <Row label="Temperature">
          <input type="range" min={0} max={2} step={0.1} defaultValue={s.temperature} onChange={e => {
            const v = Number(e.target.value);
            (e.target as HTMLInputElement).nextElementSibling!.textContent = v.toFixed(1);
          }} onMouseUp={e => save({ temperature: Number((e.target as HTMLInputElement).value) })} style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#888", minWidth: 30 }}>{s.temperature.toFixed(1)}</span>
        </Row>
      </Section>

      <Section title="Test">
        <button onClick={test} disabled={testing || !s.enabled || !s.hasKey} style={btnPrimary}>
          {testing ? "กำลังเทส..." : "🧪 ทดสอบ caption สั้นๆ"}
        </button>
        {testResult && (
          <div style={{
            marginTop: 10, padding: 12, borderRadius: 6, fontSize: 13, lineHeight: 1.5,
            background: testResult.ok ? "#1e3a2e" : "#3a1e1e",
            color: testResult.ok ? "#10b981" : "#ef4444",
            border: `1px solid ${testResult.ok ? "#10b981" : "#ef4444"}`,
            whiteSpace: "pre-wrap",
          }}>
            {testResult.ok ? "✅ " : "❌ "}{testResult.msg}
          </div>
        )}
      </Section>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#10b981", color: "#fff", padding: "10px 18px", borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
          {toast}
        </div>
      )}

      <div style={{ marginTop: 28, padding: 16, background: "#111", border: "1px solid #222", borderRadius: 8, fontSize: 12, color: "#999", lineHeight: 1.7 }}>
        <strong style={{ color: "#ccc" }}>วิธีหา API key:</strong>
        <ul style={{ marginTop: 8, paddingLeft: 18 }}>
          <li><strong>Anthropic:</strong> <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>console.anthropic.com</a> → API Keys → Create Key</li>
          <li><strong>OpenAI:</strong> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>platform.openai.com</a> → API Keys</li>
          <li><strong>OpenRouter:</strong> <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>openrouter.ai/keys</a> → Create Key (ใช้ Anthropic/OpenAI/หลาย model ผ่าน key เดียว)</li>
        </ul>
        <p style={{ marginTop: 10, color: "#666" }}>
          ต้นทุน: caption + hashtags ราว 1,500 tokens/blog (~$0.0003 ด้วย gpt-4o-mini, ~$0.002 ด้วย Claude Haiku)
        </p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22, background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: 16 }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ width: 100, fontSize: 12, color: "#888" }}>{label}</span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>{children}</div>
    </div>
  );
}

const btn: React.CSSProperties = { background: "#111", border: "1px solid #333", color: "#ccc", padding: "7px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" };
const btnPrimary: React.CSSProperties = { ...btn, background: "#1877f2", color: "#fff", borderColor: "#1877f2", fontWeight: 700 };
const input: React.CSSProperties = { width: "100%", background: "#0a0a0a", border: "1px solid #333", color: "#e5e5e5", padding: "8px 10px", borderRadius: 4, fontSize: 13 };
const link: React.CSSProperties = { ...btn, textDecoration: "none", display: "inline-flex", alignItems: "center" };
