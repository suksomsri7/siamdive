"use client";

import { useState, useEffect } from "react";
import type { PlanItem } from "./PlanItemsBlock";

const LABELS = {
  th: {
    titleFlight: "เที่ยวบิน",
    titleHotel: "ที่พัก",
    titleActivity: "กิจกรรม",
    titleTransfer: "การเดินทาง",
    titleNote: "บันทึก",
    add: "เพิ่ม",
    save: "บันทึก",
    cancel: "ยกเลิก",
    title: "ชื่อ",
    titleFlightPh: "เช่น TG203 BKK→HKT",
    titleHotelPh: "ชื่อโรงแรม",
    location: "สถานที่ (ไม่บังคับ)",
    locationFlightPh: "เช่น Suvarnabhumi (BKK)",
    locationHotelPh: "เช่น ราไวย์, ภูเก็ต",
    startAt: "วันเวลาเริ่ม",
    endAt: "วันเวลาสิ้นสุด (ไม่บังคับ)",
    cost: "ราคา (บาท)",
    bookingRef: "เลขที่จอง (ไม่บังคับ)",
    bookingRefPh: "PNR หรือ confirmation",
    notes: "หมายเหตุ",
    titleRequired: "กรุณากรอกชื่อ",
    startRequired: "กรุณาเลือกวันเวลา",
  },
  en: {
    titleFlight: "Flight",
    titleHotel: "Hotel",
    titleActivity: "Activity",
    titleTransfer: "Transfer",
    titleNote: "Note",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    title: "Title",
    titleFlightPh: "e.g. TG203 BKK→HKT",
    titleHotelPh: "Hotel name",
    location: "Location (optional)",
    locationFlightPh: "e.g. Suvarnabhumi (BKK)",
    locationHotelPh: "e.g. Rawai, Phuket",
    startAt: "Start date/time",
    endAt: "End date/time (optional)",
    cost: "Cost (THB)",
    bookingRef: "Booking ref (optional)",
    bookingRefPh: "PNR or confirmation",
    notes: "Notes",
    titleRequired: "Title required",
    startRequired: "Start date required",
  },
} as const;

function L(lang: string) {
  return (LABELS as Record<string, typeof LABELS.en>)[lang] || LABELS.en;
}

function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localToIso(local: string): string {
  if (!local) return "";
  return new Date(local).toISOString();
}

type ItemType = "FLIGHT" | "HOTEL" | "ACTIVITY" | "TRANSFER" | "NOTE";

type Props = {
  planId: string;
  lang: string;
  mode: "create" | "edit";
  initialType: ItemType;
  initialItem?: PlanItem | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function PlanItemEditModal({ planId, lang, mode, initialType, initialItem, onClose, onSaved }: Props) {
  const labels = L(lang);
  const [type] = useState<ItemType>(initialItem?.type as ItemType || initialType);
  const [title, setTitle] = useState(initialItem?.title || "");
  const [location, setLocation] = useState(initialItem?.location || "");
  const [startAt, setStartAt] = useState(isoToLocal(initialItem?.startAt || null));
  const [endAt, setEndAt] = useState(isoToLocal(initialItem?.endAt || null));
  const [cost, setCost] = useState(initialItem?.cost?.toString() || "");
  const [bookingRef, setBookingRef] = useState(initialItem?.bookingRef || "");
  const [notes, setNotes] = useState(initialItem?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "create" && !startAt) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(type === "HOTEL" ? 14 : 9, 0, 0, 0);
      setStartAt(isoToLocal(tomorrow.toISOString()));
    }
  }, [mode, startAt, type]);

  const typeLabel =
    type === "FLIGHT" ? labels.titleFlight :
    type === "HOTEL" ? labels.titleHotel :
    type === "ACTIVITY" ? labels.titleActivity :
    type === "TRANSFER" ? labels.titleTransfer : labels.titleNote;

  const titlePh = type === "FLIGHT" ? labels.titleFlightPh : labels.titleHotelPh;
  const locationPh = type === "FLIGHT" ? labels.locationFlightPh : labels.locationHotelPh;

  const submit = async () => {
    setError("");
    if (!title.trim()) { setError(labels.titleRequired); return; }
    if (!startAt) { setError(labels.startRequired); return; }
    setSaving(true);

    const payload: Record<string, unknown> = {
      type,
      title: title.trim(),
      location: location.trim() || undefined,
      startAt: localToIso(startAt),
      endAt: endAt ? localToIso(endAt) : undefined,
      cost: cost ? Number(cost) : undefined,
      currency: "THB",
      bookingRef: bookingRef.trim() || undefined,
      notes: notes.trim() || undefined,
      source: "USER_INPUT",
    };

    try {
      const url = mode === "edit" && initialItem
        ? `/api/plans/${planId}/items/${initialItem.id}`
        : `/api/plans/${planId}/items`;
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        setSaving(false);
        return;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(0,0,0,0.7)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1401,
        background: "var(--plan-surface)", borderRadius: "16px 16px 0 0",
        padding: "20px 18px",
        paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "var(--plan-fg)", margin: 0 }}>
            {mode === "edit" ? typeLabel : `${labels.add} ${typeLabel}`}
          </p>
          <button onClick={onClose} aria-label={labels.cancel} style={{ background: "none", border: "none", color: "var(--plan-fg-subtle)", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        <Field label={labels.title}>
          <input
            autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={titlePh} style={inputStyle}
          />
        </Field>

        {type !== "NOTE" && (
          <Field label={labels.location}>
            <input
              value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder={locationPh} style={inputStyle}
            />
          </Field>
        )}

        <Field label={labels.startAt}>
          <input
            type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {(type === "FLIGHT" || type === "HOTEL") && (
          <Field label={labels.endAt}>
            <input
              type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
              style={inputStyle}
            />
          </Field>
        )}

        {type !== "NOTE" && (
          <Field label={labels.cost}>
            <input
              type="number" inputMode="numeric" min={0}
              value={cost} onChange={(e) => setCost(e.target.value)}
              placeholder="0" style={inputStyle}
            />
          </Field>
        )}

        {(type === "FLIGHT" || type === "HOTEL") && (
          <Field label={labels.bookingRef}>
            <input
              value={bookingRef} onChange={(e) => setBookingRef(e.target.value)}
              placeholder={labels.bookingRefPh} style={inputStyle}
            />
          </Field>
        )}

        <Field label={labels.notes}>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical", minHeight: 56, fontFamily: "inherit" }}
          />
        </Field>

        {error && (
          <p style={{ fontSize: 12, color: "#dc2626", margin: "4px 0 10px" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={onClose} disabled={saving} style={btnGhostStyle}>{labels.cancel}</button>
          <button onClick={submit} disabled={saving} style={btnPrimaryStyle}>
            {saving ? "…" : (mode === "edit" ? labels.save : labels.add)}
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--plan-fg-subtle)", display: "block", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  background: "var(--plan-bg)", border: "1px solid var(--plan-border-soft)",
  color: "var(--plan-fg)", fontSize: 14, outline: "none", boxSizing: "border-box",
};

const btnPrimaryStyle: React.CSSProperties = {
  flex: 1, padding: "12px", borderRadius: 10,
  background: "#1e40af", border: "1px solid #1e3a8a", color: "#fff",
  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

const btnGhostStyle: React.CSSProperties = {
  flex: 1, padding: "12px", borderRadius: 10,
  background: "transparent", border: "1px solid var(--plan-border-soft)",
  color: "var(--plan-fg-muted)",
  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
