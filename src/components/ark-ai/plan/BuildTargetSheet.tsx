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
  pickTitle:   { th: "เพิ่มในแผนไหน?",          en: "Add to which plan?",
                 cn: "添加到哪个计划？", ja: "どのプランに追加する？", ko: "어느 플랜에 추가할까요?",
                 de: "Zu welchem Plan hinzufügen?", fr: "Ajouter à quel plan ?", ru: "В какой план добавить?" },
  pickHint:    { th: "เลือกแผนที่มีอยู่ หรือสร้างใหม่",  en: "Pick an existing plan or create a new one",
                 cn: "选择现有计划或新建一个", ja: "既存のプランを選ぶか、新しく作成", ko: "기존 플랜을 선택하거나 새로 만드세요",
                 de: "Vorhandenen Plan wählen oder neuen erstellen", fr: "Choisissez un plan existant ou créez-en un", ru: "Выберите существующий план или создайте новый" },
  createNew:   { th: "+ สร้างแผนใหม่",            en: "+ Create new plan",
                 cn: "+ 新建计划", ja: "+ 新しいプランを作成", ko: "+ 새 플랜 만들기",
                 de: "+ Neuen Plan erstellen", fr: "+ Créer un nouveau plan", ru: "+ Создать новый план" },
  nameTitle:   { th: "ตั้งชื่อแผน",                en: "Name your plan",
                 cn: "为计划命名", ja: "プランに名前を付ける", ko: "플랜 이름 정하기",
                 de: "Plan benennen", fr: "Nommez votre plan", ru: "Назовите план" },
  nameHint:    { th: "ใส่ชื่อสั้นๆ ที่จำได้",       en: "A short name you'll remember",
                 cn: "起一个好记的短名称", ja: "覚えやすい短い名前を", ko: "기억하기 쉬운 짧은 이름",
                 de: "Ein kurzer, einprägsamer Name", fr: "Un nom court et facile à retenir", ru: "Короткое запоминающееся название" },
  namePh:      { th: "เช่น ดำน้ำภูเก็ต พ.ค.",      en: "e.g. Phuket dive trip May",
                 cn: "例如 普吉潜水 5月", ja: "例：プーケット ダイビング 5月", ko: "예: 푸껫 다이빙 5월",
                 de: "z. B. Tauchen Phuket Mai", fr: "ex. Plongée Phuket mai", ru: "напр. Дайвинг Пхукет, май" },
  back:        { th: "← กลับ",                    en: "← Back",
                 cn: "← 返回", ja: "← 戻る", ko: "← 뒤로",
                 de: "← Zurück", fr: "← Retour", ru: "← Назад" },
  cancel:      { th: "ยกเลิก",                    en: "Cancel",
                 cn: "取消", ja: "キャンセル", ko: "취소",
                 de: "Abbrechen", fr: "Annuler", ru: "Отмена" },
  create:      { th: "สร้าง",                     en: "Create",
                 cn: "创建", ja: "作成", ko: "만들기",
                 de: "Erstellen", fr: "Créer", ru: "Создать" },
  trips:       { th: "ทริป",                      en: "trips",
                 cn: "个行程", ja: "件の旅行", ko: "개 여행",
                 de: "Reisen", fr: "voyages", ru: "поездок" },
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
