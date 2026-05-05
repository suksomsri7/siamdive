// Static "what to bring" / "what's included" templates per trip type.
// These are the planner-fallback when the operator's schedule.content
// HTML doesn't already enumerate them. The intent is that every plan
// shows the user (a) what they'll get for the price, (b) what they
// still need to budget separately for, (c) what to pack — without
// the AI having to fabricate it on every chat turn.
//
// Templates are keyed by trip TYPE (PlanTrip.type). Cert-level
// modifiers add/remove items (e.g. DSD doesn't need a logbook;
// AOW+ tend to bring their own dive computer).

export type CertLevel = "none" | "dsd" | "ow" | "aow" | "rescue" | "divemaster" | "instructor";

export type ChecklistTemplate = {
  /** Always provided by operator */
  included: { th: string; en: string }[];
  /** User pays separately or brings */
  notIncluded: { th: string; en: string }[];
  /** Recommended packing list */
  prepare: { th: string; en: string }[];
};

const COMMON_DIVE_INCLUDED = [
  { th: "เรือ + กัปตัน + ลูกเรือ", en: "Boat + captain + crew" },
  { th: "ไกด์ดำน้ำมืออาชีพ", en: "Professional dive guide" },
  { th: "อุปกรณ์ดำน้ำครบเซ็ต (mask, fins, BCD, regulator, wetsuit)", en: "Full dive gear (mask, fins, BCD, regulator, wetsuit)" },
  { th: "ถังอากาศ + น้ำหนัก", en: "Air tanks + weights" },
  { th: "อาหารกลางวัน + น้ำดื่ม + ผลไม้", en: "Lunch + drinking water + fruit" },
  { th: "ประกันอุบัติเหตุระหว่างทริป", en: "On-trip accident insurance" },
];

const COMMON_DIVE_NOT_INCLUDED = [
  { th: "ค่าเดินทางจาก/ไปสนามบิน (ถ้าไม่ได้เลือก transfer)", en: "Airport transfer (unless transfer add-on selected)" },
  { th: "ค่าธรรมเนียมอุทยานแห่งชาติ (ถ้ามี)", en: "National park fees (where applicable)" },
  { th: "อุปกรณ์ส่วนตัว (กล้องใต้น้ำ, dive computer ถ้าต้องการ)", en: "Personal gear (underwater camera, dive computer if preferred)" },
  { th: "ทิปไกด์/ลูกเรือ (แล้วแต่ใจ ปกติ 200-500 บาท/คน)", en: "Tips for guide/crew (optional, typical 200-500 THB pp)" },
  { th: "ค่าใช้จ่ายส่วนตัวอื่น ๆ", en: "Other personal expenses" },
];

const COMMON_DIVE_PREPARE = [
  { th: "ชุดว่ายน้ำ + ผ้าเช็ดตัว", en: "Swimsuit + towel" },
  { th: "ครีมกันแดดแบบ reef-safe", en: "Reef-safe sunscreen" },
  { th: "เสื้อกันลม / กันหนาวสำหรับบนเรือ", en: "Windbreaker / warm layer for the boat" },
  { th: "ยาแก้เมาเรือ (ถ้าต้องการ)", en: "Seasickness medication if needed" },
  { th: "เงินสดสำหรับทิป + อุทยาน", en: "Cash for tips + park fees" },
  { th: "บัตรประชาชน / passport (สำหรับลงทะเบียนทริป)", en: "ID / passport (for trip registration)" },
];

const LIVEABOARD_EXTRA_INCLUDED = [
  { th: "ที่พักบนเรือ (ห้องตามแพ็กเกจที่เลือก)", en: "Onboard accommodation (cabin per chosen package)" },
  { th: "อาหารทุกมื้อ + เครื่องดื่ม non-alcoholic", en: "All meals + non-alcoholic drinks" },
  { th: "Night dive (ในทริปที่กำหนด)", en: "Night dive (where included in the route)" },
];

const LIVEABOARD_EXTRA_PREPARE = [
  { th: "เสื้อผ้าใส่บนเรือ (3-5 ชุด เผื่อเปียก)", en: "Spare clothes (3-5 sets for wet days)" },
  { th: "Toiletries + ยาประจำตัว", en: "Toiletries + personal medication" },
  { th: "Power bank + adapter (ปลั๊กบนเรือมีจำกัด)", en: "Power bank + adapter (cabin outlets are limited)" },
  { th: "Logbook + ใบ cert (สำหรับ briefing)", en: "Logbook + cert card (for dive briefing)" },
  { th: "ยาแก้เมาเรือสำรอง (ทริปยาว 3-5 วัน)", en: "Extra seasickness meds (3-5 day trips)" },
];

const SNORKEL_INCLUDED = [
  { th: "เรือ + กัปตัน + ลูกเรือ", en: "Boat + captain + crew" },
  { th: "ไกด์", en: "Guide" },
  { th: "หน้ากาก + snorkel + life jacket", en: "Mask + snorkel + life jacket" },
  { th: "อาหารกลางวัน + น้ำดื่ม", en: "Lunch + drinking water" },
  { th: "ประกันทริป", en: "Trip insurance" },
];

const SNORKEL_NOT_INCLUDED = [
  { th: "ค่าธรรมเนียมอุทยาน", en: "National park fees" },
  { th: "ค่าเดินทางจาก/ไปสนามบิน", en: "Airport transfer" },
  { th: "ทิปไกด์/ลูกเรือ", en: "Tips for guide/crew" },
];

const SNORKEL_PREPARE = [
  { th: "ชุดว่ายน้ำ + ผ้าเช็ดตัว", en: "Swimsuit + towel" },
  { th: "ครีมกันแดด reef-safe", en: "Reef-safe sunscreen" },
  { th: "ยาแก้เมาเรือ (ถ้าต้องการ)", en: "Seasickness meds if needed" },
  { th: "เสื้อกันลม", en: "Windbreaker" },
  { th: "เงินสดสำหรับทิป + อุทยาน", en: "Cash for tips + park fees" },
];

const LAND_INCLUDED = [
  { th: "รถ + คนขับ + ไกด์", en: "Vehicle + driver + guide" },
  { th: "ค่าเข้าสถานที่ตามรายการ", en: "Site entry fees per itinerary" },
  { th: "อาหารกลางวัน (ถ้ามี)", en: "Lunch (where applicable)" },
  { th: "น้ำดื่ม", en: "Drinking water" },
  { th: "ประกันทริป", en: "Trip insurance" },
];

const LAND_NOT_INCLUDED = [
  { th: "ค่าใช้จ่ายส่วนตัว", en: "Personal expenses" },
  { th: "ทิปไกด์/คนขับ", en: "Tips for guide/driver" },
  { th: "อาหารมื้อที่ไม่ระบุ", en: "Meals not listed" },
];

const LAND_PREPARE = [
  { th: "เสื้อผ้าสบาย ๆ + รองเท้าเดินสะดวก", en: "Comfortable clothes + walking shoes" },
  { th: "ครีมกันแดด + หมวก + แว่นกันแดด", en: "Sunscreen + hat + sunglasses" },
  { th: "กล้อง / มือถือ (พร้อม power bank)", en: "Camera / phone (with power bank)" },
  { th: "เงินสดสำหรับซื้อของ + ทิป", en: "Cash for shopping + tips" },
];

export function getTripTemplate(tripType: string, cert: CertLevel = "ow"): ChecklistTemplate {
  const t = tripType.toUpperCase();

  if (t === "SNORKELING") {
    return {
      included: SNORKEL_INCLUDED,
      notIncluded: SNORKEL_NOT_INCLUDED,
      prepare: SNORKEL_PREPARE,
    };
  }

  if (t === "LAND_TOUR") {
    return {
      included: LAND_INCLUDED,
      notIncluded: LAND_NOT_INCLUDED,
      prepare: LAND_PREPARE,
    };
  }

  // DAYTRIP / FREEDIVE / DIVE_RESORT / LIVEABOARD all share the dive base
  const isLiveaboard = t === "LIVEABOARD" || t === "DIVE_RESORT";
  const isDsd = cert === "dsd" || cert === "none";

  const included = [
    ...COMMON_DIVE_INCLUDED,
    ...(isLiveaboard ? LIVEABOARD_EXTRA_INCLUDED : []),
  ];

  const notIncluded = [...COMMON_DIVE_NOT_INCLUDED];

  const prepare = [
    ...COMMON_DIVE_PREPARE,
    ...(isLiveaboard ? LIVEABOARD_EXTRA_PREPARE : []),
    ...(isDsd
      ? [{ th: "ใบรับรองแพทย์ (สำหรับ DSD ตามที่ผู้ประกอบการขอ)", en: "Medical clearance form (where requested for DSD)" }]
      : [{ th: "บัตรนักดำน้ำ (cert card) + logbook", en: "Cert card + logbook" }]),
  ];

  return { included, notIncluded, prepare };
}
