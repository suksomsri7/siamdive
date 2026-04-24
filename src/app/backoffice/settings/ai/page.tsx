"use client";

import { useState, useEffect } from "react";

const MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Fast, Cheap)" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Balanced)" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7 (Most Capable)" },
];

type Config = {
  provider: string;
  hasApiKey: boolean;
  apiKeyPreview: string;
  model: string;
  maxTokens: number;
  rateLimit: number;
  temperature: number;
  systemPromptExtra: string;
};

export default function AiConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("claude-haiku-4-5-20251001");
  const [maxTokens, setMaxTokens] = useState(1024);
  const [rateLimit, setRateLimit] = useState(20);
  const [temperature, setTemperature] = useState(0.7);
  const [extra, setExtra] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/ark-ai/config")
      .then(r => r.json())
      .then((c: Config) => {
        setConfig(c);
        setModel(c.model);
        setMaxTokens(c.maxTokens);
        setRateLimit(c.rateLimit);
        setTemperature(c.temperature);
        setExtra(c.systemPromptExtra);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const body: Record<string, unknown> = { model, maxTokens, rateLimit, temperature, systemPromptExtra: extra };
    if (apiKey) body.apiKey = apiKey;
    await fetch("/api/ark-ai/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setApiKey("");
    setSaving(false);
    setSaved(true);
    const updated = await fetch("/api/ark-ai/config").then(r => r.json());
    setConfig(updated);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ark-ai/config", { method: "POST" });
      const data = await res.json();
      setTestResult({ ok: data.ok, msg: data.ok ? `Connected! Model: ${data.model}` : data.error });
    } catch {
      setTestResult({ ok: false, msg: "Connection failed" });
    }
    setTesting(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", background: "#1a1a1a", border: "1px solid #333",
    borderRadius: 8, color: "#e5e5e5", fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = { fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" };

  if (!config) return <div style={{ padding: 40, color: "#666" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f5f5f5", marginBottom: 4 }}>Ark AI Configuration</h1>
      <p style={{ fontSize: 12, color: "#666", marginBottom: 24 }}>Manage AI chat settings for the Ark AI trip planner.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* API Key */}
        <div>
          <label style={labelStyle}>Anthropic API Key</label>
          {config.hasApiKey && (
            <p style={{ fontSize: 11, color: "#4ade80", marginBottom: 6 }}>Current: {config.apiKeyPreview}</p>
          )}
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={config.hasApiKey ? "Enter new key to replace..." : "sk-ant-..."}
            style={inputStyle}
          />
        </div>

        {/* Model */}
        <div>
          <label style={labelStyle}>Model</label>
          <select value={model} onChange={e => setModel(e.target.value)} style={inputStyle}>
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>

        {/* Max Tokens */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Max Tokens</label>
            <input type="number" value={maxTokens} onChange={e => setMaxTokens(+e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Rate Limit (msg/hr)</label>
            <input type="number" value={rateLimit} onChange={e => setRateLimit(+e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Temperature */}
        <div>
          <label style={labelStyle}>Temperature: {temperature}</label>
          <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(+e.target.value)}
            style={{ width: "100%", accentColor: "#3b82f6" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555" }}>
            <span>Precise (0)</span><span>Creative (1)</span>
          </div>
        </div>

        {/* System Prompt Extra */}
        <div>
          <label style={labelStyle}>Additional System Prompt (optional)</label>
          <textarea
            value={extra}
            onChange={e => setExtra(e.target.value)}
            rows={3}
            placeholder="Additional instructions for Ark AI..."
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "none", background: "#1e40af", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
          <button onClick={handleTest} disabled={testing}
            style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "1px solid #333", background: "#1a1a1a", color: "#ccc", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: testing ? 0.6 : 1 }}>
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div style={{ padding: 12, borderRadius: 8, background: testResult.ok ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${testResult.ok ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}` }}>
            <p style={{ fontSize: 12, color: testResult.ok ? "#4ade80" : "#ef4444" }}>
              {testResult.ok ? "✓" : "✗"} {testResult.msg}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
