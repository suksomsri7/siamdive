"use client";

// LogisticsBlock — collapsible card on PlanDetail capturing pickup / hotel /
// airport transfer / equipment / special needs. The chat AI doesn't write
// these slots yet (Sprint 2 will wire them in), so today the block is the
// user's only entry point for this info. Render it for ANY plan with at
// least one scheduled trip.
//
// Trip-type-aware fields:
//   - DAYTRIP / SNORKELING (single-day):  pickup yes/no + hotel name
//   - LIVEABOARD / DIVE_RESORT (multi-day): airport transfer yes/no + equipment rental + special needs
//   - Mixed:                                show all (some users do both)
//
// When the user has answered NOTHING, the card collapses to a "+ Add logistics"
// hint so the timeline doesn't get cluttered. When something IS filled, the
// preview line summarizes it ("Pickup at Hilton · Airport transfer · DSD").

import { useState, useMemo } from "react";
import { updatePlanLogistics, type PlanLogistics, type PlanTrip } from "@/lib/plan-store";

type Props = {
  planId: string;
  trips: PlanTrip[];
  logistics: PlanLogistics | undefined;
  lang: string;
  canEdit: boolean;
  onChange?: (next: PlanLogistics) => void;
};

const L = {
  th: {
    title: "การเดินทาง / ความต้องการพิเศษ",
    add: "+ เพิ่มข้อมูลการเดินทาง",
    pickup: "บริการรับที่โรงแรม",
    pickupYes: "ต้องการ",
    pickupNo: "ไปเอง",
    hotel: "ชื่อโรงแรม / ย่านที่พัก",
    hotelPlaceholder: "เช่น Hilton Phuket, Patong",
    airport: "บริการรับ-ส่งสนามบิน",
    airportYes: "ต้องการ",
    airportNo: "ไม่ต้องการ",
    equipment: "ต้องการเช่าอุปกรณ์",
    equipmentPlaceholder: "เช่น mask, fins, wetsuit",
    notes: "ความต้องการพิเศษ",
    notesPlaceholder: "อาหาร / เด็ก / ภาพถ่าย / แพ้อะไร",
    save: "บันทึก",
    cancel: "ยกเลิก",
    none: "—",
    pickupAt: "รับที่",
    transfer: "รับสนามบิน",
    rent: "เช่า",
  },
  en: {
    title: "Logistics & special needs",
    add: "+ Add logistics info",
    pickup: "Hotel pickup",
    pickupYes: "Yes, pick me up",
    pickupNo: "I'll come myself",
    hotel: "Hotel name / district",
    hotelPlaceholder: "e.g. Hilton Phuket, Patong",
    airport: "Airport transfer",
    airportYes: "Arrange transfer",
    airportNo: "I'll arrange myself",
    equipment: "Equipment to rent",
    equipmentPlaceholder: "e.g. mask, fins, wetsuit",
    notes: "Special needs",
    notesPlaceholder: "diet / kids / photographer / allergies",
    save: "Save",
    cancel: "Cancel",
    none: "—",
    pickupAt: "Pickup at",
    transfer: "Airport transfer",
    rent: "Rent",
  },
} as const;

type Labels = typeof L.en;
function getLabels(lang: string): Labels {
  const map = L as unknown as Record<string, Labels>;
  return map[lang] || L.en;
}

function classifyTrips(trips: PlanTrip[]) {
  let hasDaytrip = false;
  let hasLiveaboard = false;
  for (const t of trips) {
    if (t.type === "DAYTRIP" || t.type === "SNORKELING" || t.type === "FREEDIVE") hasDaytrip = true;
    if (t.type === "LIVEABOARD" || t.type === "DIVE_RESORT") hasLiveaboard = true;
  }
  return { hasDaytrip, hasLiveaboard };
}

function isEmpty(l: PlanLogistics | undefined): boolean {
  if (!l) return true;
  return !l.pickup && !l.hotelName && !l.airportTransfer && !l.equipmentRental && !l.specialNeeds;
}

function summarize(l: PlanLogistics | undefined, t: ReturnType<typeof getLabels>): string {
  if (!l) return "";
  const parts: string[] = [];
  if (l.pickup === "yes") {
    parts.push(l.hotelName ? `${t.pickupAt} ${l.hotelName}` : t.pickupYes);
  } else if (l.pickup === "no") {
    parts.push(t.pickupNo);
  }
  if (l.airportTransfer === "yes") parts.push(t.transfer);
  if (l.equipmentRental) parts.push(`${t.rent} ${l.equipmentRental}`);
  if (l.specialNeeds) parts.push(l.specialNeeds.length > 30 ? l.specialNeeds.slice(0, 30) + "…" : l.specialNeeds);
  return parts.join(" · ");
}

export default function LogisticsBlock({ planId, trips, logistics, lang, canEdit, onChange }: Props) {
  const t = getLabels(lang);
  const empty = isEmpty(logistics);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlanLogistics>(logistics || {});

  const { hasDaytrip, hasLiveaboard } = useMemo(() => classifyTrips(trips), [trips]);

  if (trips.length === 0) return null;

  const handleSave = () => {
    updatePlanLogistics(planId, draft);
    onChange?.(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(logistics || {});
    setEditing(false);
  };

  // Collapsed state — show summary or add CTA
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => canEdit && setEditing(true)}
        disabled={!canEdit && empty}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "10px 14px",
          marginBottom: 14,
          borderRadius: 12,
          background: empty ? "transparent" : "#111",
          border: empty ? "1px dashed #2a2a2a" : "1px solid #1a1a1a",
          color: empty ? "#555" : "#bbb",
          fontSize: 12,
          fontWeight: empty ? 600 : 500,
          cursor: canEdit ? "pointer" : "default",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: empty ? "#444" : "#666" }}>
          <path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M3 16v5h5"/><path d="M16 21h5v-5"/>
        </svg>
        {empty ? (
          <span>{canEdit ? t.add : t.title}</span>
        ) : (
          <>
            <span style={{ fontSize: 11, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.title}
            </span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {summarize(logistics, t)}
            </span>
            {canEdit && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            )}
          </>
        )}
      </button>
    );
  }

  // Expanded edit form
  return (
    <div style={{
      padding: 14,
      marginBottom: 14,
      borderRadius: 12,
      background: "#111",
      border: "1px solid #1a1a1a",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <p style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
        {t.title}
      </p>

      {hasDaytrip && (
        <Field label={t.pickup}>
          <SegmentedToggle
            value={draft.pickup}
            options={[
              { val: "yes", label: t.pickupYes },
              { val: "no", label: t.pickupNo },
            ]}
            onChange={(v) => setDraft({ ...draft, pickup: v as "yes" | "no" | undefined })}
          />
        </Field>
      )}

      {hasDaytrip && draft.pickup === "yes" && (
        <Field label={t.hotel}>
          <input
            value={draft.hotelName || ""}
            onChange={(e) => setDraft({ ...draft, hotelName: e.target.value })}
            placeholder={t.hotelPlaceholder}
            style={inputStyle}
          />
        </Field>
      )}

      {hasLiveaboard && (
        <Field label={t.airport}>
          <SegmentedToggle
            value={draft.airportTransfer}
            options={[
              { val: "yes", label: t.airportYes },
              { val: "no", label: t.airportNo },
            ]}
            onChange={(v) => setDraft({ ...draft, airportTransfer: v as "yes" | "no" | undefined })}
          />
        </Field>
      )}

      {hasLiveaboard && (
        <Field label={t.equipment}>
          <input
            value={draft.equipmentRental || ""}
            onChange={(e) => setDraft({ ...draft, equipmentRental: e.target.value })}
            placeholder={t.equipmentPlaceholder}
            style={inputStyle}
          />
        </Field>
      )}

      <Field label={t.notes}>
        <textarea
          value={draft.specialNeeds || ""}
          onChange={(e) => setDraft({ ...draft, specialNeeds: e.target.value })}
          placeholder={t.notesPlaceholder}
          rows={2}
          style={{ ...inputStyle, resize: "vertical", minHeight: 48 }}
        />
      </Field>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          type="button"
          onClick={handleCancel}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 8,
            background: "transparent",
            border: "1px solid #333",
            color: "#888",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 8,
            background: "#1e40af",
            border: "none",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {t.save}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid #222",
  borderRadius: 6,
  color: "#f5f5f5",
  fontSize: 13,
  padding: "8px 10px",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>{label}</span>
      {children}
    </label>
  );
}

function SegmentedToggle({
  value,
  options,
  onChange,
}: {
  value: string | undefined;
  options: { val: string; label: string }[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #222" }}>
      {options.map((o, i) => {
        const selected = value === o.val;
        return (
          <button
            key={o.val}
            type="button"
            onClick={() => onChange(selected ? undefined : o.val)}
            style={{
              flex: 1,
              padding: "8px 10px",
              background: selected ? "#1e3a8a" : "transparent",
              border: "none",
              borderLeft: i > 0 ? "1px solid #222" : "none",
              color: selected ? "#fff" : "#888",
              fontSize: 12,
              fontWeight: selected ? 700 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
