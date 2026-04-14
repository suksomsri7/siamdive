"use client";

import { useState, useEffect, useCallback } from "react";

type AdminRow = {
  id: string; name: string; email: string;
  role: string; permissions: string[]; active: boolean; createdAt: string;
};

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "#f59e0b", bg: "#451a03", desc: "สิทธิ์ทั้งหมด + จัดการ Admin" },
  { value: "ADMIN",       label: "Admin",       color: "#60a5fa", bg: "#1e3a5f", desc: "สิทธิ์ทั้งหมด ยกเว้นจัดการ Admin" },
  { value: "EDITOR",      label: "Editor",      color: "#a3e635", bg: "#1a2e05", desc: "สิทธิ์เฉพาะที่กำหนด" },
] as const;

const PERM_GROUPS = [
  {
    label: "Content",
    items: [
      { key: "trips",        label: "Trips & Schedules", icon: "🤿" },
      { key: "blogs",        label: "Blog / Articles",   icon: "📝" },
      { key: "courses",      label: "Courses",           icon: "🎓" },
      { key: "companies",    label: "Companies",         icon: "🏢" },
      { key: "destinations", label: "Destinations",      icon: "📍" },
      { key: "media",        label: "Media",             icon: "🖼" },
    ],
  },
  {
    label: "System",
    items: [
      { key: "display",  label: "Display",     icon: "🖥" },
      { key: "api",      label: "API Keys",    icon: "🔑" },
      { key: "admins",   label: "Admin Users", icon: "👤" },
      { key: "settings", label: "Settings",    icon: "⚙" },
    ],
  },
];

const ALL_PERMS = PERM_GROUPS.flatMap(g => g.items.map(i => i.key));

const emptyForm = () => ({
  name: "", email: "", password: "",
  role: "ADMIN" as string,
  permissions: [] as string[],
  active: true,
});
type AdminForm = ReturnType<typeof emptyForm>;

const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
  SUPER_ADMIN: { color: "#f59e0b", bg: "#451a03" },
  ADMIN:       { color: "#60a5fa", bg: "#1e3a5f" },
  EDITOR:      { color: "#a3e635", bg: "#1a2e05" },
};

export default function AdminsPage() {
  const [admins, setAdmins]     = useState<AdminRow[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState<AdminForm>(emptyForm());
  const [saving, setSaving]     = useState(false);
  const [pwPlaceholder, setPwPlaceholder] = useState("");

  const load = useCallback(async () => {
    const data = await fetch("/api/admins").then(r => r.json()).catch(() => []);
    setAdmins(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm(emptyForm()); setEditId(null); setPwPlaceholder(""); setPanelOpen(true);
  };
  const openEdit = (a: AdminRow) => {
    setForm({ name: a.name, email: a.email, password: "", role: a.role, permissions: a.permissions ?? [], active: a.active });
    setEditId(a.id); setPwPlaceholder("เว้นว่างถ้าไม่เปลี่ยนรหัสผ่าน"); setPanelOpen(true);
  };
  const close = () => { setPanelOpen(false); setEditId(null); };

  const togglePerm = (key: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const selectAllPerms = () => setForm(f => ({ ...f, permissions: ALL_PERMS }));
  const clearAllPerms  = () => setForm(f => ({ ...f, permissions: [] }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (!editId && !form.password.trim()) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      name: form.name, email: form.email,
      role: form.role,
      permissions: form.role === "EDITOR" ? form.permissions : [],
      active: form.active,
    };
    if (form.password.trim()) body.password = form.password;
    if (editId) {
      await fetch(`/api/admins/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setSaving(false); close(); load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ลบ Admin "${name}" ? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return;
    await fetch(`/api/admins/${id}`, { method: "DELETE" });
    load();
  };

  const inp: React.CSSProperties = { width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { fontSize: 11, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e5e5e5" }}>👤 Admin Users</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#333" }}>{admins.length} accounts</p>
        </div>
        <button onClick={openNew}
          style={{ background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + เพิ่ม Admin
        </button>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {admins.map(a => {
          const rs = ROLE_STYLE[a.role] ?? { color: "#888", bg: "#1a1a1a" };
          const roleLabel = ROLES.find(r => r.value === a.role)?.label ?? a.role;
          return (
            <div key={a.id} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
              {/* Avatar */}
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#161616", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                👤
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: a.active ? "#ccc" : "#444", fontSize: 14 }}>{a.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: rs.bg, color: rs.color }}>
                    {roleLabel}
                  </span>
                  {!a.active && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#1a1a1a", color: "#444" }}>INACTIVE</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#333", marginTop: 3 }}>{a.email}</div>
                {a.role === "EDITOR" && a.permissions.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                    {a.permissions.map(p => {
                      const item = PERM_GROUPS.flatMap(g => g.items).find(i => i.key === p);
                      return item ? (
                        <span key={p} style={{ fontSize: 10, background: "#111", border: "1px solid #1e1e1e", color: "#444", padding: "1px 7px", borderRadius: 8 }}>
                          {item.icon} {item.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => openEdit(a)}
                  style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#aaa", borderRadius: 7, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
                  แก้ไข
                </button>
                <button onClick={() => handleDelete(a.id, a.name)}
                  style={{ background: "none", border: "1px solid #2a1010", color: "#4a2020", borderRadius: 7, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
                  ลบ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {admins.length === 0 && (
        <div style={{ textAlign: "center", color: "#333", padding: "60px 0", fontSize: 14 }}>ยังไม่มี Admin — กด + เพิ่ม Admin</div>
      )}

      {/* ── Panel ── */}
      {panelOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={close} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }} />
          <div style={{ position: "relative", width: "min(540px,100vw)", background: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Header */}
            <div style={{ padding: "20px 22px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#e5e5e5" }}>{editId ? "แก้ไข Admin" : "เพิ่ม Admin"}</span>
              <button onClick={close} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "22px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Name + Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>ชื่อ *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@siamdive.com" style={inp} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={lbl}>รหัสผ่าน {editId ? "(ไม่บังคับ)" : "*"}</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={pwPlaceholder || "รหัสผ่าน..."}
                  style={inp} />
              </div>

              {/* Role */}
              <div>
                <label style={lbl}>Role</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ROLES.map(r => {
                    const active = form.role === r.value;
                    return (
                      <label key={r.value} onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `1px solid ${active ? r.color + "44" : "#1a1a1a"}`, background: active ? r.bg + "88" : "#111", cursor: "pointer" }}>
                        <input type="radio" checked={active} onChange={() => setForm(f => ({ ...f, role: r.value }))} style={{ accentColor: r.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: active ? r.color : "#555" }}>{r.label}</div>
                          <div style={{ fontSize: 11, color: active ? r.color + "99" : "#2a2a2a", marginTop: 2 }}>{r.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Permissions — only for EDITOR */}
              {form.role === "EDITOR" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>สิทธิ์การเข้าถึง</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={selectAllPerms} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>เลือกทั้งหมด</button>
                      <button onClick={clearAllPerms}  style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>ล้าง</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {PERM_GROUPS.map(group => (
                      <div key={group.label}>
                        <p style={{ fontSize: 10, color: "#252525", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{group.label}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          {group.items.map(item => {
                            const checked = form.permissions.includes(item.key);
                            return (
                              <label key={item.key} onClick={() => togglePerm(item.key)}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: `1px solid ${checked ? "#3b82f644" : "#1a1a1a"}`, background: checked ? "rgba(59,130,246,0.06)" : "#111", cursor: "pointer" }}>
                                <input type="checkbox" checked={checked} onChange={() => togglePerm(item.key)} style={{ accentColor: "#3b82f6", width: 13, height: 13, flexShrink: 0 }} />
                                <span style={{ fontSize: 13 }}>{item.icon}</span>
                                <span style={{ fontSize: 12, color: checked ? "#ccc" : "#444", fontWeight: checked ? 500 : 400 }}>{item.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active toggle */}
              <div>
                <label style={lbl}>สถานะ</label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    style={{ accentColor: "#3b82f6", width: 15, height: 15 }} />
                  <span style={{ fontSize: 13, color: form.active ? "#4ade80" : "#555" }}>{form.active ? "Active" : "Inactive"}</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 22px", borderTop: "1px solid #111", display: "flex", gap: 10, flexShrink: 0 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "กำลังบันทึก..." : editId ? "บันทึกการแก้ไข" : "เพิ่ม Admin"}
              </button>
              <button onClick={close} style={{ background: "#111", border: "1px solid #222", color: "#555", borderRadius: 8, padding: "12px 20px", fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
