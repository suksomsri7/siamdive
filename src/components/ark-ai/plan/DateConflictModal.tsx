"use client";

import { type DateConflict } from "@/lib/plan-store";
import { t } from "@/lib/ark-ai/i18n";

type Props = {
  conflicts: DateConflict[];
  lang: string;
  onConfirm: () => void;
  onCreateNewPlan: () => void;
  onClose: () => void;
};

const LOCALE_MAP: Record<string, string> = {
  th: "th-TH", en: "en-US", cn: "zh-CN", ja: "ja-JP",
  ko: "ko-KR", de: "de-DE", fr: "fr-FR", ru: "ru-RU",
};

const fmtDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(LOCALE_MAP[lang] || "en-US", { day: "numeric", month: "short" });

export default function DateConflictModal({ conflicts, lang, onConfirm, onCreateNewPlan, onClose }: Props) {
  const L = (key: Parameters<typeof t>[1]) => t(lang, key);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1600, background: "rgba(0,0,0,0.7)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1601,
        background: "#111",
        borderRadius: "16px 16px 0 0",
        padding: "24px 20px",
        paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(251,191,36,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#f5f5f5", margin: 0 }}>
              {L("dateOverlap")}
            </p>
            <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}>
              {L("tripOverlapMessage")}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20, maxHeight: 200, overflowY: "auto" }}>
          {conflicts.map((c, i) => (
            <div key={i} style={{
              padding: "10px 12px", borderRadius: 10,
              background: "#0f0f0f",
              border: "1px solid #1a1a1a",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {c.existingTrip.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.existingTrip.cover} alt="" style={{ width: 36, height: 28, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 28, borderRadius: 6, background: "#1a1a2e", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                  🤿
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#f5f5f5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.existingTrip.title}
                </p>
                <p style={{ fontSize: 10, color: "#fbbf24", margin: "2px 0 0" }}>
                  {fmtDate(c.existingTrip.schedule?.departureDate || c.newDeparture, lang)}
                  {c.existingTrip.schedule?.returnDate ? ` → ${fmtDate(c.existingTrip.schedule.returnDate, lang)}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onConfirm}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
            background: "#b45309",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>
          {L("addToSamePlan")}
        </button>
        <button onClick={onCreateNewPlan}
          style={{
            width: "100%", padding: "14px 0", marginTop: 8, borderRadius: 10,
            border: "1px solid #222",
            background: "transparent",
            color: "#aaa", fontSize: 15, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {L("createNewPlan")}
        </button>
        <button onClick={onClose}
          style={{ width: "100%", padding: "10px 0", marginTop: 8, background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" }}>
          {L("cancel")}
        </button>
      </div>
    </>
  );
}
