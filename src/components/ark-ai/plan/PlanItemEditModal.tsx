"use client";

import { useState, useEffect } from "react";
import type { PlanItem } from "./plan-item";

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
    saveFailed: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง",
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
    saveFailed: "Couldn't save — please try again",
  },
  cn: {
    titleFlight: "航班",
    titleHotel: "住宿",
    titleActivity: "活动",
    titleTransfer: "交通",
    titleNote: "备注",
    add: "添加",
    save: "保存",
    cancel: "取消",
    title: "名称",
    titleFlightPh: "例如 TG203 BKK→HKT",
    titleHotelPh: "酒店名称",
    location: "地点（选填）",
    locationFlightPh: "例如 素万那普 (BKK)",
    locationHotelPh: "例如 拉威海滩，普吉",
    startAt: "开始日期/时间",
    endAt: "结束日期/时间（选填）",
    cost: "价格（泰铢）",
    bookingRef: "预订编号（选填）",
    bookingRefPh: "PNR 或确认号",
    notes: "备注",
    titleRequired: "请填写名称",
    startRequired: "请选择日期时间",
    saveFailed: "保存失败，请重试",
  },
  ja: {
    titleFlight: "フライト",
    titleHotel: "宿泊",
    titleActivity: "アクティビティ",
    titleTransfer: "移動",
    titleNote: "メモ",
    add: "追加",
    save: "保存",
    cancel: "キャンセル",
    title: "名称",
    titleFlightPh: "例：TG203 BKK→HKT",
    titleHotelPh: "ホテル名",
    location: "場所（任意）",
    locationFlightPh: "例：スワンナプーム (BKK)",
    locationHotelPh: "例：ラワイ、プーケット",
    startAt: "開始日時",
    endAt: "終了日時（任意）",
    cost: "料金（バーツ）",
    bookingRef: "予約番号（任意）",
    bookingRefPh: "PNR または確認番号",
    notes: "備考",
    titleRequired: "名称を入力してください",
    startRequired: "日時を選択してください",
    saveFailed: "保存できませんでした。もう一度お試しください",
  },
  ko: {
    titleFlight: "항공편",
    titleHotel: "숙소",
    titleActivity: "액티비티",
    titleTransfer: "이동",
    titleNote: "메모",
    add: "추가",
    save: "저장",
    cancel: "취소",
    title: "이름",
    titleFlightPh: "예: TG203 BKK→HKT",
    titleHotelPh: "호텔 이름",
    location: "장소 (선택)",
    locationFlightPh: "예: 수완나품 (BKK)",
    locationHotelPh: "예: 라와이, 푸껫",
    startAt: "시작 날짜/시간",
    endAt: "종료 날짜/시간 (선택)",
    cost: "가격 (THB)",
    bookingRef: "예약 번호 (선택)",
    bookingRefPh: "PNR 또는 확인번호",
    notes: "메모",
    titleRequired: "이름을 입력하세요",
    startRequired: "날짜와 시간을 선택하세요",
    saveFailed: "저장하지 못했습니다. 다시 시도하세요",
  },
  de: {
    titleFlight: "Flug",
    titleHotel: "Unterkunft",
    titleActivity: "Aktivität",
    titleTransfer: "Transfer",
    titleNote: "Notiz",
    add: "Hinzufügen",
    save: "Speichern",
    cancel: "Abbrechen",
    title: "Bezeichnung",
    titleFlightPh: "z. B. TG203 BKK→HKT",
    titleHotelPh: "Hotelname",
    location: "Ort (optional)",
    locationFlightPh: "z. B. Suvarnabhumi (BKK)",
    locationHotelPh: "z. B. Rawai, Phuket",
    startAt: "Startdatum/-zeit",
    endAt: "Enddatum/-zeit (optional)",
    cost: "Preis (THB)",
    bookingRef: "Buchungsnr. (optional)",
    bookingRefPh: "PNR oder Bestätigung",
    notes: "Anmerkungen",
    titleRequired: "Bitte Bezeichnung eingeben",
    startRequired: "Bitte Datum und Uhrzeit wählen",
    saveFailed: "Speichern fehlgeschlagen — bitte erneut versuchen",
  },
  fr: {
    titleFlight: "Vol",
    titleHotel: "Hébergement",
    titleActivity: "Activité",
    titleTransfer: "Transport",
    titleNote: "Note",
    add: "Ajouter",
    save: "Enregistrer",
    cancel: "Annuler",
    title: "Nom",
    titleFlightPh: "ex. TG203 BKK→HKT",
    titleHotelPh: "Nom de l'hôtel",
    location: "Lieu (facultatif)",
    locationFlightPh: "ex. Suvarnabhumi (BKK)",
    locationHotelPh: "ex. Rawai, Phuket",
    startAt: "Date/heure de début",
    endAt: "Date/heure de fin (facultatif)",
    cost: "Prix (THB)",
    bookingRef: "N° de réservation (facultatif)",
    bookingRefPh: "PNR ou confirmation",
    notes: "Remarques",
    titleRequired: "Veuillez saisir un nom",
    startRequired: "Veuillez choisir une date et une heure",
    saveFailed: "Échec de l'enregistrement — veuillez réessayer",
  },
  ru: {
    titleFlight: "Рейс",
    titleHotel: "Проживание",
    titleActivity: "Активность",
    titleTransfer: "Трансфер",
    titleNote: "Заметка",
    add: "Добавить",
    save: "Сохранить",
    cancel: "Отмена",
    title: "Название",
    titleFlightPh: "напр. TG203 BKK→HKT",
    titleHotelPh: "Название отеля",
    location: "Место (необязательно)",
    locationFlightPh: "напр. Суварнабхуми (BKK)",
    locationHotelPh: "напр. Равай, Пхукет",
    startAt: "Дата и время начала",
    endAt: "Дата и время окончания (необязательно)",
    cost: "Цена (THB)",
    bookingRef: "Номер брони (необязательно)",
    bookingRefPh: "PNR или подтверждение",
    notes: "Примечания",
    titleRequired: "Введите название",
    startRequired: "Выберите дату и время",
    saveFailed: "Не удалось сохранить — попробуйте ещё раз",
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
  deviceId: string;
  lang: string;
  mode: "create" | "edit";
  initialType: ItemType;
  initialItem?: PlanItem | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function PlanItemEditModal({ planId, deviceId, lang, mode, initialType, initialItem, onClose, onSaved }: Props) {
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
      deviceId,
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
        console.error("[PlanItemEditModal] save failed", res.status, await res.text().catch(() => ""));
        setError(labels.saveFailed);
        setSaving(false);
        return;
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("[PlanItemEditModal] save error", err);
      setError(labels.saveFailed);
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
