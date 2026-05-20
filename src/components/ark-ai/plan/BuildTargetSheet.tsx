"use client";

// BuildTargetSheet — opens before /api/ark-ai/build-plan runs when the user
// already has plans. Two modes inside a single sheet:
//   1. pick: list existing plans + a "create new" CTA
//   2. name: text input for the new plan's name (only when "create new"
//      was picked, or when the user has zero plans at all)
//
// onSelect returns { targetPlanId } to append, or { customName } to create.

import { useEffect, useRef, useState } from "react";
import { getPlans } from "@/lib/plan-store";
import { t } from "@/lib/ark-ai/i18n";

type Selection =
  | { targetPlanId: string }
  | { customName: string };

type Props = {
  lang: string;
  /** Optional auto-suggested name shown pre-filled in the name input */
  suggestedName?: string;
  onSelect: (s: Selection) => void;
  onClose: () => void;
};

const T: Record<string, Record<string, string>> = {
  pickTitle:   { th: "เพิ่มในแผนไหน?",          en: "Add to which plan?" },
  pickHint:    { th: "เลือกแผนที่มีอยู่ หรือสร้างใหม่",  en: "Pick an existing plan or create a new one" },
  createNew:   { th: "+ สร้างแผนใหม่",            en: "+ Create new plan" },
  nameTitle:   { th: "ตั้งชื่อแผน",                en: "Name your plan" },
  nameHint:    { th: "ใส่ชื่อสั้นๆ ที่จำได้",       en: "A short name you'll remember" },
  namePh:      { th: "เช่น ดำน้ำภูเก็ต พ.ค.",      en: "e.g. Phuket dive trip May" },
  back:        { th: "← กลับ",                    en: "← Back" },
  cancel:      { th: "ยกเลิก",                    en: "Cancel" },
  create:      { th: "สร้าง",                     en: "Create" },
  trips:       { th: "ทริป",                      en: "trips" },
};
const L = (k: keyof typeof T, lang: string) => T[k][lang] || T[k].en;

export default function BuildTargetSheet({ lang, suggestedName, onSelect, onClose }: Props) {
  const [plans] = useState(() => getPlans());
  // When the user has zero plans, skip the picker and go straight to the
  // name step. Saves a click for the common first-time path.
  const [mode, setMode] = useState<"pick" | "name">(plans.length === 0 ? "name" : "pick");
  const [name, setName] = useState(suggestedName || "");
  const nameRef = useRef<HTMLInputElement>(null);

  // No focus useEffect — focus is driven directly from the click handler
  // that flips mode (see the "create new" button). The input element is
  // always in the DOM (just visually hidden during pick mode) so calling
  // .focus() inside the click works on iOS Safari, which only honours
  // programmatic focus while a user gesture is on the call stack.

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleCreate = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;
    // Dismiss the mobile soft keyboard before the sheet closes — iOS
    // sometimes keeps the keyboard up through the transition otherwise.
    // Blur both the ref and document.activeElement to cover the case
    // where focus moved to the submit button after Enter / Done.
    nameRef.current?.blur();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onSelect({ customName: name.trim() });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1500,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        animation: "btsFade 0.18s ease-out both",
      }}
    >
      <style>{`
        @keyframes btsFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes btsSlide { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#0d0d0d",
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          padding: "16px 18px 24px",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          maxHeight: "75vh",
          display: "flex", flexDirection: "column",
          animation: "btsSlide 0.25s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <div style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 14px" }} />

        {/* Pick mode — list of existing plans + "create new" button.
            Hidden via display:none when mode === "name" so the input
            below stays mounted (lets iOS focus it from the click). */}
        <div style={{ display: mode === "pick" ? "flex" : "none", flexDirection: "column" }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#f5f5f5", margin: "0 0 4px", textAlign: "center" }}>
            {L("pickTitle", lang)}
          </p>
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 14px", textAlign: "center" }}>
            {L("pickHint", lang)}
          </p>
          <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: "40vh" }}>
            {plans.map(p => (
              <button key={p.id} onClick={() => onSelect({ targetPlanId: p.id })}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  background: "#161616",
                  border: "1px solid #262626",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.10)"; e.currentTarget.style.borderColor = "rgba(96,165,250,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#161616"; e.currentTarget.style.borderColor = "#262626"; }}
              >
                {p.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverUrl} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#262626", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🗺</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#f5f5f5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: "#888", margin: "1px 0 0" }}>{p.trips.length} {L("trips", lang)}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => {
              setMode("name");
              // Input element is always-mounted (display:none toggle), so
              // .focus() inside this click handler stays in the iOS user
              // gesture frame and opens the soft keyboard.
              nameRef.current?.focus();
            }}
            style={{
              width: "100%", padding: "12px", borderRadius: 10,
              background: "rgba(59,130,246,0.14)",
              border: "1px dashed rgba(96,165,250,0.45)",
              color: "#93c5fd",
              fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
            }}>
            {L("createNew", lang)}
          </button>
          <button onClick={onClose}
            style={{
              width: "100%", marginTop: 8, padding: "10px",
              background: "transparent", border: "1px solid #262626",
              color: "#888", borderRadius: 10,
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
            {L("cancel", lang)}
          </button>
        </div>

        {/* Name mode — always mounted but hidden in pick mode. The input
            staying in DOM is what makes iOS focus from the click work. */}
        <form onSubmit={handleCreate} style={{ display: mode === "name" ? "block" : "none" }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#f5f5f5", margin: "0 0 4px", textAlign: "center" }}>
            {L("nameTitle", lang)}
          </p>
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 14px", textAlign: "center" }}>
            {L("nameHint", lang)}
          </p>
          <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} placeholder={L("namePh", lang)}
            enterKeyHint="done"
            onKeyDown={(e) => {
              // Catch Enter explicitly so we can blur the input BEFORE
              // submitting. iOS Safari keeps the soft keyboard up if the
              // form submit moves focus to the submit button; blurring
              // here in the keydown handler dismisses the keyboard
              // immediately.
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (!name.trim()) return;
              e.currentTarget.blur();
              onSelect({ customName: name.trim() });
            }}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              background: "#161616", border: "1px solid #262626",
              color: "#f5f5f5", fontSize: 15, fontFamily: "inherit",
              outline: "none", marginBottom: 14,
            }} />
          <div style={{ display: "flex", gap: 8 }}>
            {plans.length > 0 && (
              <button type="button" onClick={() => setMode("pick")}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  background: "transparent", border: "1px solid #262626",
                  color: "#888", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                {L("back", lang)}
              </button>
            )}
            <button type="submit" disabled={!name.trim()}
              style={{
                flex: 2, padding: "12px", borderRadius: 10,
                background: name.trim() ? "#3b82f6" : "#1a1a1a",
                border: "none",
                color: "#fff",
                fontSize: 13, fontWeight: 800,
                cursor: name.trim() ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}>
              {L("create", lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
