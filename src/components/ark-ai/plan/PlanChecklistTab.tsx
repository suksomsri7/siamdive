"use client";

import { useState } from "react";

type ChecklistItem = {
  id: string; category: string; item: string;
  assignedTo: string | null; checked: boolean; checkedBy: string | null;
};

type Member = {
  id: string; email: string; name: string | null; role: string; certLevel: string | null;
};

type Props = {
  planId: string;
  deviceId: string;
  lang: string;
  checklists: ChecklistItem[];
  members: Member[];
  canEdit: boolean;
  onRefresh: () => void;
};

const TEMPLATES: Record<string, { th: string; en: string; items: { category: string; item: string }[] }> = {
  scuba: {
    th: "Scuba Diving",
    en: "Scuba Diving",
    items: [
      { category: "Documents", item: "Dive certification card" },
      { category: "Documents", item: "Dive insurance" },
      { category: "Documents", item: "Logbook" },
      { category: "Gear", item: "Mask & snorkel" },
      { category: "Gear", item: "Fins & boots" },
      { category: "Gear", item: "Wetsuit / rashguard" },
      { category: "Gear", item: "BCD" },
      { category: "Gear", item: "Regulator set" },
      { category: "Gear", item: "Dive computer" },
      { category: "Gear", item: "Torch / flashlight" },
      { category: "Gear", item: "Surface marker buoy (SMB)" },
      { category: "Essentials", item: "Reef-safe sunscreen" },
      { category: "Essentials", item: "Seasickness medicine" },
      { category: "Essentials", item: "Dry bag" },
      { category: "Essentials", item: "Underwater camera" },
      { category: "Essentials", item: "Towel" },
    ],
  },
  freedive: {
    th: "Freedive",
    en: "Freedive",
    items: [
      { category: "Documents", item: "Freedive certification card" },
      { category: "Gear", item: "Low-volume mask" },
      { category: "Gear", item: "Long fins" },
      { category: "Gear", item: "Wetsuit" },
      { category: "Gear", item: "Weight belt" },
      { category: "Gear", item: "Nose clip" },
      { category: "Gear", item: "Dive watch / computer" },
      { category: "Gear", item: "Lanyard" },
      { category: "Essentials", item: "Reef-safe sunscreen" },
      { category: "Essentials", item: "Dry bag" },
    ],
  },
  travel: {
    th: "Travel General",
    en: "Travel General",
    items: [
      { category: "Documents", item: "Passport / ID card" },
      { category: "Documents", item: "Travel insurance" },
      { category: "Documents", item: "Hotel booking confirmation" },
      { category: "Documents", item: "Flight / ferry tickets" },
      { category: "Essentials", item: "Cash / cards" },
      { category: "Essentials", item: "Phone charger & power bank" },
      { category: "Essentials", item: "Medications" },
      { category: "Essentials", item: "Sunscreen" },
      { category: "Essentials", item: "Hat & sunglasses" },
    ],
  },
};

export default function PlanChecklistTab({ planId, deviceId, lang, checklists, members, canEdit, onRefresh }: Props) {
  const [items, setItems] = useState(checklists);
  const [showTemplate, setShowTemplate] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newItem, setNewItem] = useState("");

  const isTh = lang === "th";

  const handleToggle = async (item: ChecklistItem) => {
    const newChecked = !item.checked;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: newChecked } : i));
    try {
      await fetch(`/api/plans/${planId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, itemId: item.id, checked: newChecked }),
      });
    } catch {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: !newChecked } : i));
    }
  };

  const handleAddTemplate = async (templateKey: string) => {
    const template = TEMPLATES[templateKey];
    if (!template) return;
    try {
      await fetch(`/api/plans/${planId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, items: template.items }),
      });
      setShowTemplate(false);
      onRefresh();
    } catch {}
  };

  const handleAddItem = async () => {
    const cat = newCategory.trim() || "General";
    const itm = newItem.trim();
    if (!itm) return;
    try {
      await fetch(`/api/plans/${planId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, items: [{ category: cat, item: itm }] }),
      });
      setNewItem("");
      setAddingItem(false);
      onRefresh();
    } catch {}
  };

  const handleDelete = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await fetch(`/api/plans/${planId}/checklist?itemId=${encodeURIComponent(itemId)}&deviceId=${encodeURIComponent(deviceId)}`, {
        method: "DELETE",
      });
    } catch { onRefresh(); }
  };

  const handleAssign = async (itemId: string, email: string | null) => {
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, assignedTo: email } : i));
    try {
      await fetch(`/api/plans/${planId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, itemId, assignedTo: email }),
      });
    } catch { onRefresh(); }
  };

  const categories = [...new Set(items.map((i) => i.category))];
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div>
      {/* Progress */}
      {items.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#888" }}>
              {checkedCount}/{items.length} {isTh ? "เสร็จแล้ว" : "completed"}
            </span>
            <span style={{ fontSize: 12, color: checkedCount === items.length ? "#22c55e" : "#555" }}>
              {items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0}%
            </span>
          </div>
          <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2, transition: "width 0.3s",
              width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%`,
              background: checkedCount === items.length ? "#22c55e" : "#333",
            }} />
          </div>
        </div>
      )}

      {/* Items by category */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <p style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
            {isTh ? "ยังไม่มีรายการเตรียมตัว" : "No checklist items yet"}
          </p>
          {canEdit && (
            <button onClick={() => setShowTemplate(true)} style={{
              padding: "12px 28px", borderRadius: 10, border: "none",
              background: "#1e40af", color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              {isTh ? "เลือกจาก Template" : "Use Template"}
            </button>
          )}
        </div>
      ) : (
        <div>
          {categories.map((cat) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{cat}</p>
              {items.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                  <button onClick={() => handleToggle(item)} style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: item.checked ? "none" : "2px solid #333",
                    background: item.checked ? "#22c55e" : "transparent",
                    color: "#fff", fontSize: 12, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {item.checked && "✓"}
                  </button>
                  <span style={{
                    flex: 1, fontSize: 13, color: item.checked ? "#555" : "#e5e5e5",
                    textDecoration: item.checked ? "line-through" : "none",
                  }}>
                    {item.item}
                  </span>
                  {item.assignedTo && (
                    <span style={{ fontSize: 9, color: "#888", background: "#1a1a1a", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>
                      {item.assignedTo.split("@")[0]}
                    </span>
                  )}
                  {canEdit && (
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                      {members.length > 0 && (
                        <select
                          value={item.assignedTo || ""}
                          onChange={(e) => handleAssign(item.id, e.target.value || null)}
                          style={{ width: 20, height: 20, opacity: 0.5, background: "transparent", border: "none", color: "#888", fontSize: 10, cursor: "pointer", padding: 0 }}
                          title={isTh ? "มอบหมาย" : "Assign"}
                        >
                          <option value="">—</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.email}>{m.name || m.email.split("@")[0]}</option>
                          ))}
                        </select>
                      )}
                      <button onClick={() => handleDelete(item.id)} style={{
                        width: 20, height: 20, borderRadius: 4, border: "none",
                        background: "transparent", color: "#333", fontSize: 10, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {canEdit && items.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => setAddingItem(true)} style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "1px dashed #333",
            background: "transparent", color: "#666", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            + {isTh ? "เพิ่มรายการ" : "Add Item"}
          </button>
          <button onClick={() => setShowTemplate(true)} style={{
            padding: "10px 16px", borderRadius: 8, border: "1px solid #262626",
            background: "transparent", color: "#888", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {isTh ? "Template" : "Template"}
          </button>
        </div>
      )}

      {/* Add item form */}
      {addingItem && (
        <div style={{ marginTop: 12, background: "#0a0a0a", borderRadius: 10, padding: 12, border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={isTh ? "หมวด (เช่น Gear)" : "Category (e.g. Gear)"}
              style={{ width: 120, padding: "8px 10px", borderRadius: 6, background: "#111", border: "1px solid #262626", color: "#f5f5f5", fontSize: 12, fontFamily: "inherit", outline: "none" }}
            />
            <input
              autoFocus
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={isTh ? "รายการ" : "Item name"}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddItem(); }}
              style={{ flex: 1, padding: "8px 10px", borderRadius: 6, background: "#111", border: "1px solid #262626", color: "#f5f5f5", fontSize: 12, fontFamily: "inherit", outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAddItem} disabled={!newItem.trim()} style={{
              flex: 1, padding: "8px 0", borderRadius: 6, border: "none",
              background: newItem.trim() ? "#1e40af" : "#222", color: newItem.trim() ? "#fff" : "#555",
              fontSize: 12, fontWeight: 700, cursor: newItem.trim() ? "pointer" : "default",
            }}>
              {isTh ? "เพิ่ม" : "Add"}
            </button>
            <button onClick={() => setAddingItem(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "transparent", color: "#555", fontSize: 12, cursor: "pointer" }}>
              {isTh ? "ยกเลิก" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Template selector modal */}
      {showTemplate && (
        <>
          <div onClick={() => setShowTemplate(false)} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(0,0,0,0.7)" }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1401,
            background: "#111", borderRadius: "16px 16px 0 0",
            padding: "20px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
          }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", marginBottom: 16 }}>
              {isTh ? "เลือก Template" : "Choose Template"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <button key={key} onClick={() => handleAddTemplate(key)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: 10, background: "#0a0a0a",
                  border: "1px solid #1a1a1a", color: "#e5e5e5", cursor: "pointer", textAlign: "left",
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>{isTh ? tpl.th : tpl.en}</p>
                    <p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                      {tpl.items.length} {isTh ? "รายการ" : "items"}
                    </p>
                  </div>
                  <span style={{ fontSize: 18 }}>
                    {key === "scuba" ? "🤿" : key === "freedive" ? "🏊" : "✈️"}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowTemplate(false)} style={{
              width: "100%", padding: "10px 0", marginTop: 12, background: "none",
              border: "none", color: "#555", fontSize: 13, cursor: "pointer",
            }}>
              {isTh ? "ยกเลิก" : "Cancel"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
