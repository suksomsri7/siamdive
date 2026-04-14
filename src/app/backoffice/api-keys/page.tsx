"use client";

import { useState, useEffect, useCallback } from "react";

// ── Permission definitions ─────────────────────────────────────────────────────
const ACTIONS = [
  { key: "read",   label: "Read",   color: "#34d399", short: "R" },
  { key: "write",  label: "Write",  color: "#60a5fa", short: "W" },
  { key: "delete", label: "Delete", color: "#f87171", short: "D" },
] as const;
type Action = typeof ACTIONS[number]["key"];

const PERM_GROUPS = [
  {
    label: "ทริปดำน้ำ", icon: "🤿",
    items: [
      { key: "daytrip",   label: "🤿 Scuba Day Trips",  actions: ["read","write","delete"] as Action[] },
      { key: "snorkeling", label: "🐠 Snorkeling",       actions: ["read","write","delete"] as Action[] },
      { key: "land-tour",  label: "🗺 Land Tour",         actions: ["read","write","delete"] as Action[] },
      { key: "liveaboard", label: "🚢 Liveaboard",        actions: ["read","write","delete"] as Action[] },
      { key: "dive-resort",label: "🏝 Dive Resort",        actions: ["read","write","delete"] as Action[] },
      { key: "freedive",   label: "🫧 Freedive Trips",    actions: ["read","write","delete"] as Action[] },
    ],
  },
  {
    label: "คอร์สดำน้ำ", icon: "🎓",
    items: [
      { key: "scuba-courses",    label: "🎓 Scuba Courses",    actions: ["read","write","delete"] as Action[] },
      { key: "freedive-courses", label: "🫁 Freedive Courses", actions: ["read","write","delete"] as Action[] },
    ],
  },
  {
    label: "ข้อมูลส่วนกลาง", icon: "🏢",
    items: [
      { key: "companies",     label: "Companies / บริษัท",   actions: ["read","write","delete"] as Action[] },
      { key: "service-areas", label: "Service Areas / จุดดำน้ำ", actions: ["read","write","delete"] as Action[] },
    ],
  },
  {
    label: "คอนเทนต์", icon: "📝",
    items: [
      { key: "blogs",  label: "Blogs",           actions: ["read","write","delete"] as Action[] },
      { key: "upload", label: "Media / Upload",   actions: ["write"] as Action[] },
    ],
  },
  {
    label: "ระบบ", icon: "⚙️",
    items: [
      { key: "display-rows", label: "Display Rows", actions: ["read","write","delete"] as Action[] },
      { key: "admins",       label: "Admins",        actions: ["read","write","delete"] as Action[] },
      { key: "api-keys",     label: "API Keys",      actions: ["read","write","delete"] as Action[] },
    ],
  },
] as const;

// Flatten all valid permission strings
const ALL_PERMS = PERM_GROUPS.flatMap(g => g.items.flatMap(item => item.actions.map(a => `${item.key}.${a}`)));

// ── Types ─────────────────────────────────────────────────────────────────────
type ApiKeyRecord = {
  id: string; name: string; keyPrefix: string; permissions: string[];
  active: boolean; lastUsedAt: string | null; expiresAt: string | null; createdAt: string;
};
type NewKeyResult = ApiKeyRecord & { key: string };

const emptyForm = () => ({ name: "", permissions: [] as string[], expiresAt: "" });
type KeyForm = ReturnType<typeof emptyForm>;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ApiKeysPage() {
  const [keys,      setKeys]      = useState<ApiKeyRecord[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState<KeyForm>(emptyForm());
  const [saving,    setSaving]    = useState(false);
  const [newKey,    setNewKey]    = useState<NewKeyResult | null>(null);
  const [copied,    setCopied]    = useState(false);

  const load = useCallback(async () => {
    const data = await fetch("/api/api-keys").then(r => r.json()).catch(() => []);
    setKeys(Array.isArray(data) ? data : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  // ── Permission helpers ──
  const hasPerm = (perm: string) => form.permissions.includes(perm);

  const togglePerm = (perm: string) =>
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));

  const setGroupPerms = (groupItems: readonly { key: string; actions: readonly Action[] }[], on: boolean) => {
    const perms = groupItems.flatMap(item => item.actions.map(a => `${item.key}.${a}`));
    setForm(f => ({
      ...f,
      permissions: on
        ? Array.from(new Set([...f.permissions, ...perms]))
        : f.permissions.filter(p => !perms.includes(p)),
    }));
  };

  const setResourcePerms = (resourceKey: string, actions: readonly Action[], on: boolean) => {
    const perms = actions.map(a => `${resourceKey}.${a}`);
    setForm(f => ({
      ...f,
      permissions: on
        ? Array.from(new Set([...f.permissions, ...perms]))
        : f.permissions.filter(p => !perms.includes(p)),
    }));
  };

  const setActionPerms = (action: Action, on: boolean) => {
    const perms = PERM_GROUPS.flatMap(g =>
      g.items.filter(i => (i.actions as readonly string[]).includes(action)).map(i => `${i.key}.${action}`)
    );
    setForm(f => ({
      ...f,
      permissions: on
        ? Array.from(new Set([...f.permissions, ...perms]))
        : f.permissions.filter(p => !perms.includes(p)),
    }));
  };

  const allOn  = ALL_PERMS.every(p => form.permissions.includes(p));
  const someOn = ALL_PERMS.some(p => form.permissions.includes(p));

  // ── Panel ──
  const openNew  = () => { setForm(emptyForm()); setEditId(null); setPanelOpen(true); };
  const openEdit = (k: ApiKeyRecord) => {
    setForm({ name: k.name, permissions: k.permissions, expiresAt: k.expiresAt ? k.expiresAt.slice(0,10) : "" });
    setEditId(k.id); setPanelOpen(true);
  };
  const close = () => { setPanelOpen(false); setEditId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const body = { name: form.name, permissions: form.permissions, expiresAt: form.expiresAt || null };
    if (editId) {
      await fetch(`/api/api-keys/${editId}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      setSaving(false); close(); load();
    } else {
      const res  = await fetch("/api/api-keys", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      const data = await res.json();
      setSaving(false); close(); load();
      if (data.key) setNewKey(data);
    }
  };

  const toggleActive = async (k: ApiKeyRecord) => {
    setKeys(prev => prev.map(r => r.id === k.id ? {...r, active: !r.active} : r));
    await fetch(`/api/api-keys/${k.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({active: !k.active}) });
  };

  const handleDelete = async (k: ApiKeyRecord) => {
    if (!confirm(`ลบ API Key "${k.name}"?\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return;
    await fetch(`/api/api-keys/${k.id}`, { method:"DELETE" }); load();
  };

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
    } catch {
      const el = document.createElement("textarea");
      el.value = key;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const inp: React.CSSProperties = { width:"100%", background:"#161616", border:"1px solid #222", borderRadius:7, color:"#ccc", fontSize:13, padding:"9px 12px", outline:"none", boxSizing:"border-box" };
  const lbl: React.CSSProperties = { fontSize:11, color:"#444", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:6 };

  return (
    <div style={{ padding:"24px 20px", maxWidth:960 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#e5e5e5" }}>🔑 API Keys</h1>
          <p style={{ margin:"4px 0 0", fontSize:12, color:"#333" }}>จัดการ API Keys และสิทธิ์การเข้าถึงแบบละเอียด · {keys.length} keys</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <a href="/backoffice/api-docs" target="_blank"
            style={{ display:"flex", alignItems:"center", gap:6, background:"#111", border:"1px solid #222", color:"#888", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:600, textDecoration:"none", cursor:"pointer" }}>
            📖 API Manual
          </a>
          <a href="/api/skill.yaml" download="siamdive-skill.yaml"
            style={{ display:"flex", alignItems:"center", gap:6, background:"#111", border:"1px solid #222", color:"#888", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:600, textDecoration:"none", cursor:"pointer" }}>
            🤖 API Skill
          </a>
          <button onClick={openNew} style={{ background:"#3b82f6", border:"none", color:"#fff", borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ สร้าง API Key</button>
        </div>
      </div>

      {/* Key list */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {keys.map(k => {
          const expired = k.expiresAt && new Date(k.expiresAt) < new Date();
          const byAction: Record<string, number> = {};
          k.permissions.forEach(p => { const a = p.split(".")[1]; byAction[a] = (byAction[a] ?? 0) + 1; });
          return (
            <div key={k.id} style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", gap:14, opacity:k.active ? 1 : 0.45 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, color:"#ccc", fontSize:14 }}>{k.name}</span>
                  {expired && <span style={{ fontSize:10, fontWeight:700, color:"#f87171", background:"#2d0000", padding:"2px 8px", borderRadius:10 }}>หมดอายุ</span>}
                </div>
                <div style={{ marginTop:5, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <code style={{ fontSize:11, color:"#555", background:"#111", padding:"2px 8px", borderRadius:5, fontFamily:"monospace" }}>
                    {k.keyPrefix}••••••••••••••••
                  </code>
                  {k.permissions.length === 0 ? (
                    <span style={{ fontSize:10, color:"#333" }}>ไม่มีสิทธิ์</span>
                  ) : ACTIONS.map(a => {
                    const count = byAction[a.key];
                    if (!count) return null;
                    return (
                      <span key={a.key} style={{ fontSize:10, fontWeight:700, color:a.color, background:a.color + "15", padding:"2px 8px", borderRadius:10 }}>
                        {a.label} ×{count}
                      </span>
                    );
                  })}
                </div>
                <div style={{ marginTop:4, fontSize:10, color:"#252525" }}>
                  สร้างเมื่อ {new Date(k.createdAt).toLocaleDateString("th-TH")}
                  {k.expiresAt && <> · หมดอายุ {new Date(k.expiresAt).toLocaleDateString("th-TH")}</>}
                  {k.lastUsedAt && <> · ใช้ล่าสุด {new Date(k.lastUsedAt).toLocaleDateString("th-TH")}</>}
                </div>
              </div>
              <button onClick={() => toggleActive(k)}
                style={{ background:k.active ? "#14532d":"#111", border:`1px solid ${k.active ? "#166534":"#1a1a1a"}`, color:k.active ? "#4ade80":"#333", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                {k.active ? "ON":"OFF"}
              </button>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button onClick={() => openEdit(k)} style={{ background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#aaa", borderRadius:7, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>แก้ไข</button>
                <button onClick={() => handleDelete(k)} style={{ background:"none", border:"1px solid #2a1010", color:"#4a2020", borderRadius:7, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>ลบ</button>
              </div>
            </div>
          );
        })}
      </div>
      {keys.length === 0 && (
        <div style={{ textAlign:"center", color:"#333", padding:"60px 0", fontSize:14 }}>
          ยังไม่มี API Key — กด + สร้าง API Key เพื่อเริ่ม
        </div>
      )}

      {/* ── New Key Modal ── */}
      {newKey && (
        <div style={{ position:"fixed", inset:0, zIndex:60, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.8)" }} />
          <div style={{ position:"relative", background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:16, padding:"28px 28px 24px", width:"min(520px,90vw)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ fontSize:20 }}>🔑</span>
              <span style={{ fontWeight:700, fontSize:16, color:"#e5e5e5" }}>API Key สร้างสำเร็จ!</span>
            </div>
            <div style={{ background:"#ff000008", border:"1px solid #7f1d1d44", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, color:"#fca5a5" }}>
              ⚠️ คัดลอก Key นี้ไว้ก่อน — <strong>ระบบจะแสดงเพียงครั้งเดียว</strong> ไม่สามารถดูได้อีก
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              <code style={{ flex:1, background:"#111", border:"1px solid #222", borderRadius:8, padding:"12px 14px", fontSize:12, color:"#a3e635", fontFamily:"monospace", wordBreak:"break-all" }}>
                {newKey.key}
              </code>
              <button onClick={() => copyKey(newKey.key)}
                style={{ background:copied ? "#14532d":"#1e3a5f", border:`1px solid ${copied ? "#166534":"#1e40af"}`, color:copied ? "#4ade80":"#60a5fa", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
                {copied ? "✓ คัดลอกแล้ว" : "📋 คัดลอก"}
              </button>
            </div>
            <button onClick={() => setNewKey(null)}
              style={{ width:"100%", background:"#3b82f6", border:"none", color:"#fff", borderRadius:8, padding:"11px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              รับทราบ — ปิด
            </button>
          </div>
        </div>
      )}

      {/* ── Panel ── */}
      {panelOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", justifyContent:"flex-end" }}>
          <div onClick={close} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.65)" }} />
          <div style={{ position:"relative", width:"min(700px,100vw)", background:"#0a0a0a", borderLeft:"1px solid #1a1a1a", display:"flex", flexDirection:"column", height:"100%" }}>

            <div style={{ padding:"20px 24px", borderBottom:"1px solid #111", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <span style={{ fontWeight:700, fontSize:16, color:"#e5e5e5" }}>{editId ? "แก้ไข API Key" : "สร้าง API Key ใหม่"}</span>
              <button onClick={close} style={{ background:"none", border:"none", color:"#555", fontSize:20, cursor:"pointer" }}>×</button>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"22px 24px", display:"flex", flexDirection:"column", gap:20 }}>

              {/* Name */}
              <div>
                <label style={lbl}>ชื่อ Key *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))}
                  placeholder="เช่น Mobile App, Partner Integration, Data Sync..." style={inp} />
              </div>

              {/* Expiry */}
              <div>
                <label style={lbl}>วันหมดอายุ (ไม่บังคับ)</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({...f, expiresAt:e.target.value}))}
                  style={{ ...inp, width:"auto", minWidth:180 }} />
              </div>

              {/* Permissions table */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <label style={{ ...lbl, marginBottom:0 }}>สิทธิ์การเข้าถึง</label>
                  <button onClick={() => setForm(f => ({...f, permissions: allOn ? [] : [...ALL_PERMS]}))}
                    style={{ fontSize:11, fontWeight:700, padding:"4px 14px", borderRadius:6, border:"1px solid #333", background:allOn ? "#1e3a5f":"#111", color:allOn ? "#60a5fa":"#555", cursor:"pointer" }}>
                    {allOn ? "ล้างทั้งหมด" : "เลือกทั้งหมด"}
                  </button>
                </div>

                {/* Column header: action-level toggles */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr repeat(3,68px)", gap:0, marginBottom:8 }}>
                  <div style={{ fontSize:10, color:"#333", padding:"0 10px", alignSelf:"center" }}>Resource</div>
                  {ACTIONS.map(a => {
                    const actionPerms = ALL_PERMS.filter(p => p.endsWith(`.${a.key}`));
                    const colOn = actionPerms.every(p => form.permissions.includes(p));
                    return (
                      <button key={a.key} onClick={() => setActionPerms(a.key, !colOn)}
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"4px 0" }}>
                        <span style={{ fontSize:11, fontWeight:700, color:colOn ? a.color : "#333" }}>{a.label}</span>
                        <span style={{ fontSize:8, color:"#1a1a1a", textTransform:"uppercase", letterSpacing:"0.05em" }}>ทั้งหมด</span>
                      </button>
                    );
                  })}
                </div>

                {/* Groups */}
                {PERM_GROUPS.map(group => {
                  const groupPerms = group.items.flatMap(item => item.actions.map(a => `${item.key}.${a}`));
                  const groupAllOn  = groupPerms.every(p => form.permissions.includes(p));
                  const groupSomeOn = groupPerms.some(p => form.permissions.includes(p));
                  const groupSelectedCount = groupPerms.filter(p => form.permissions.includes(p)).length;
                  return (
                    <div key={group.label} style={{ marginBottom:10 }}>
                      {/* Group header */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr repeat(3,68px)", background:"#111", borderRadius:"8px 8px 0 0", padding:"7px 10px", borderBottom:"1px solid #1a1a1a" }}>
                        <button onClick={() => setGroupPerms(group.items, !groupAllOn)}
                          style={{ display:"flex", alignItems:"center", gap:7, background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:0 }}>
                          <span style={{ fontSize:13 }}>{group.icon}</span>
                          <span style={{ fontSize:12, fontWeight:700, color: groupAllOn ? "#e5e5e5" : groupSomeOn ? "#888" : "#444" }}>{group.label}</span>
                          <span style={{ fontSize:9, color:"#333", background:"#1a1a1a", padding:"1px 7px", borderRadius:10 }}>
                            {groupSelectedCount}/{groupPerms.length}
                          </span>
                        </button>
                        <div /><div /><div />
                      </div>

                      {/* Resource rows */}
                      {group.items.map((item, ri) => {
                        const resourcePerms = item.actions.map(a => `${item.key}.${a}`);
                        const resAllOn = resourcePerms.every(p => form.permissions.includes(p));
                        const isLast = ri === group.items.length - 1;
                        return (
                          <div key={item.key}
                            style={{ display:"grid", gridTemplateColumns:"1fr repeat(3,68px)", background:"#0d0d0d", border:"1px solid #161616", borderTop:"none", borderRadius: isLast ? "0 0 8px 8px" : 0, padding:"8px 10px", alignItems:"center" }}>
                            <button onClick={() => setResourcePerms(item.key, item.actions, !resAllOn)}
                              style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:0 }}>
                              <span style={{ width:15, height:15, borderRadius:4, border:`2px solid ${resAllOn ? "#3b82f6":"#2a2a2a"}`, background:resAllOn ? "#3b82f6":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                {resAllOn && <span style={{ color:"#fff", fontSize:8, fontWeight:900, lineHeight:1 }}>✓</span>}
                              </span>
                              <span style={{ fontSize:12, color: resAllOn ? "#ccc":"#555" }}>{item.label}</span>
                            </button>
                            {ACTIONS.map(a => {
                              const perm = `${item.key}.${a.key}`;
                              const available = (item.actions as readonly string[]).includes(a.key);
                              const checked = available && hasPerm(perm);
                              return (
                                <div key={a.key} style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                                  {available ? (
                                    <button onClick={() => togglePerm(perm)}
                                      style={{ width:30, height:30, borderRadius:7, border:`2px solid ${checked ? a.color : "#1a1a1a"}`, background:checked ? a.color + "22":"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                                      {checked && <span style={{ color:a.color, fontSize:13, fontWeight:900 }}>✓</span>}
                                    </button>
                                  ) : (
                                    <span style={{ color:"#1a1a1a", fontSize:12 }}>—</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Summary bar */}
                <div style={{ marginTop:8, padding:"9px 14px", background:"#111", borderRadius:8, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, color:"#333" }}>เลือกแล้ว:</span>
                  {ACTIONS.map(a => {
                    const count = form.permissions.filter(p => p.endsWith(`.${a.key}`)).length;
                    return count > 0 ? (
                      <span key={a.key} style={{ fontSize:11, fontWeight:700, color:a.color }}>
                        {a.label} ×{count}
                      </span>
                    ) : null;
                  })}
                  {!someOn && <span style={{ fontSize:11, color:"#252525" }}>ยังไม่ได้เลือกสิทธิ์ใด</span>}
                  <span style={{ marginLeft:"auto", fontSize:11, color:"#252525" }}>รวม {form.permissions.length} สิทธิ์</span>
                </div>
              </div>
            </div>

            <div style={{ padding:"16px 24px", borderTop:"1px solid #111", display:"flex", gap:10, flexShrink:0 }}>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                style={{ flex:1, background:"#3b82f6", border:"none", color:"#fff", borderRadius:8, padding:"12px", fontSize:14, fontWeight:600, cursor:(saving || !form.name.trim()) ? "not-allowed":"pointer", opacity:(saving || !form.name.trim()) ? 0.5:1 }}>
                {saving ? "กำลังบันทึก..." : editId ? "บันทึกการแก้ไข" : "สร้าง API Key"}
              </button>
              <button onClick={close} style={{ background:"#111", border:"1px solid #222", color:"#555", borderRadius:8, padding:"12px 20px", fontSize:14, cursor:"pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
