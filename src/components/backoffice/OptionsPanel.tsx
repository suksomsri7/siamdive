"use client";

import { useState, useEffect, useCallback } from "react";
import { ALL_LANGS, LANG_LABELS, type LangKey } from "./TripForm";

type OptionTranslation = { lang: string; name: string; description: string };
type OptionRow = { id: string; price: number; order: number; translations: OptionTranslation[] };

type LangForm = { name: string; description: string };
type OptionForm = { price: string } & Record<LangKey, LangForm>;

const inputStyle = { width: "100%", background: "#111", border: "1px solid #222", borderRadius: 6, padding: "7px 10px", color: "#ddd", fontSize: 13, outline: "none", boxSizing: "border-box" as const };
const labelStyle = { fontSize: 11, color: "#444", fontWeight: 600, marginBottom: 3, display: "block" as const };
const taStyle = { ...inputStyle, resize: "vertical" as const, minHeight: 60, fontFamily: "inherit" };

function emptyLang(): LangForm { return { name: "", description: "" }; }
function emptyForm(): OptionForm {
  const langs = Object.fromEntries(ALL_LANGS.map(l => [l, emptyLang()])) as Record<LangKey, LangForm>;
  return { price: "", ...langs };
}

type Props = { boatId: string; boatName: string; onClose: () => void; currency?: string };

export default function OptionsPanel({ boatId, boatName, onClose, currency = "THB" }: Props) {
  const cur = (n: number) => currency === "USD" ? `$${n.toLocaleString()}` : `฿${n.toLocaleString()}`;
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<OptionForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<LangKey>("en");

  const load = useCallback(async () => {
    const data = await fetch(`/api/boats/${boatId}/options`).then(r => r.json()).catch(() => []);
    setOptions(Array.isArray(data) ? data : []);
  }, [boatId]);

  useEffect(() => { load(); }, [load]);

  const setLang = (l: LangKey, key: keyof LangForm, val: string) =>
    setForm(f => ({ ...f, [l]: { ...(f[l] as LangForm), [key]: val } }));

  const openNew = () => { setForm(emptyForm()); setEditId(null); setActiveLang("en"); setFormOpen(true); };
  const openEdit = (opt: OptionRow) => {
    const f = emptyForm();
    f.price = opt.price.toString();
    for (const tr of opt.translations) {
      if (ALL_LANGS.includes(tr.lang as LangKey)) {
        (f as Record<string, unknown>)[tr.lang] = { name: tr.name, description: tr.description };
      }
    }
    setForm(f); setEditId(opt.id); setActiveLang("en"); setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditId(null); };

  const save = async () => {
    setSaving(true);
    const body = {
      price: form.price,
      translations: ALL_LANGS.map(l => ({ lang: l, ...(form[l] as LangForm) })),
    };
    if (editId) {
      await fetch(`/api/boats/${boatId}/options/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch(`/api/boats/${boatId}/options`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    await load(); setSaving(false); closeForm();
  };

  const deleteOpt = async (id: string) => {
    if (!confirm("ลบ option นี้?")) return;
    await fetch(`/api/boats/${boatId}/options/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />

      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(440px, 100vw)", background: "#0d0d0d", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>Options</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{boatName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>✕</button>
          <button onClick={openNew} style={{ background: "#1a3a1a", border: "1px solid #2a5a2a", color: "#4ade80", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            + เพิ่ม Option
          </button>
        </div>

        {/* Option list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {options.length === 0 && (
            <div style={{ fontSize: 12, color: "#2a2a2a", textAlign: "center", marginTop: 40 }}>ยังไม่มี Option — กด + เพิ่ม Option</div>
          )}
          {options.map(opt => {
            const enTr = opt.translations.find(t => t.lang === "en");
            const label = enTr?.name || opt.translations.find(t => t.name)?.name || "(ไม่มีชื่อ)";
            return (
              <div key={opt.id} style={{ background: "#090909", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, color: "#ccc", fontSize: 13, flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>
                    {opt.price > 0 ? `+${cur(opt.price)}` : "ฟรี"}
                  </span>
                </div>
                {enTr?.description && <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>{enTr.description}</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => openEdit(opt)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 5, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => deleteOpt(opt.id)} style={{ background: "none", border: "1px solid #222", color: "#fff", borderRadius: 5, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Option form panel */}
      {formOpen && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(480px, 100vw)", background: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ccc", flex: 1 }}>{editId ? "แก้ไข Option" : "เพิ่ม Option"}</span>
            <button onClick={save} disabled={saving} style={{ background: "#1d4ed8", border: "none", color: "#fff", borderRadius: 7, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            <button onClick={closeForm} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Price */}
            <div>
              <label style={labelStyle}>ราคา ({currency === "USD" ? "$" : "฿"})</label>
              <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={{ ...inputStyle, width: 130 }} type="number" placeholder="0" min="0" />
            </div>

            {/* Language tabs */}
            <div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                {ALL_LANGS.map(l => (
                  <button key={l} onClick={() => setActiveLang(l)} style={{ padding: "5px 12px", borderRadius: 20, border: activeLang === l ? "none" : "1px solid #222", cursor: "pointer", fontSize: 11, fontWeight: 700, background: activeLang === l ? "#3b82f6" : "transparent", color: activeLang === l ? "#fff" : "#333" }}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>

              {ALL_LANGS.map(l => {
                const lf = form[l] as LangForm;
                return (
                  <div key={l} style={{ display: activeLang === l ? "flex" : "none", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>ชื่อ</label>
                      <input value={lf.name} onChange={e => setLang(l, "name", e.target.value)} style={inputStyle} placeholder="ชื่อ option" />
                    </div>
                    <div>
                      <label style={labelStyle}>รายละเอียด</label>
                      <textarea value={lf.description} onChange={e => setLang(l, "description", e.target.value)} style={taStyle} placeholder="รายละเอียด (ถ้ามี)" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
