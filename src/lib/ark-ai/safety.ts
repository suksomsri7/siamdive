// Hallucination + safety guards for Ark AI.
// All functions are pure / synchronous so they can be unit-tested without DB.

// ── Medical concern detection ────────────────────────────────────────────────
// We refuse to give medical advice for diving safety reasons. Detected → AI is
// short-circuited and we respond with a "consult a doctor" message in the user
// language. This also saves API budget on requests that should never go to AI.

const MEDICAL_PATTERNS: Array<{ pattern: RegExp; concern: string }> = [
  { pattern: /\b(heart|cardiac|cardio|hypertension|angina|stent|pacemaker)\b/i, concern: "heart" },
  { pattern: /หัวใจ|ความดัน|เส้นเลือด/, concern: "heart" },
  { pattern: /\b(asthma|copd|emphysema|pneumothorax)\b/i, concern: "lung" },
  { pattern: /หอบ|หืด|ปอด/, concern: "lung" },
  { pattern: /\b(eardrum|ear ache|ear pain|tinnitus|vertigo|sinus(itis)?)\b/i, concern: "ear" },
  { pattern: /หูอักเสบ|แก้วหู|ปวดหู|เวียนหัว|ผมเคยปวดหู|ปวดหู/, concern: "ear" },
  { pattern: /\b(diabetes|insulin|glucose)\b/i, concern: "diabetes" },
  { pattern: /เบาหวาน/, concern: "diabetes" },
  { pattern: /\b(pregnant|pregnancy|expecting)\b/i, concern: "pregnancy" },
  { pattern: /ตั้งครรภ์/, concern: "pregnancy" },
  { pattern: /\b(epilep|seizure)\b/i, concern: "epilepsy" },
  { pattern: /ลมชัก/, concern: "epilepsy" },
  { pattern: /\b(decompression sickness|dcs|the bends|nitrogen narcosis)\b/i, concern: "dcs" },
];

export type MedicalConcern = "heart" | "lung" | "ear" | "diabetes" | "pregnancy" | "epilepsy" | "dcs";

export function detectMedicalConcern(userMessage: string): MedicalConcern | null {
  for (const { pattern, concern } of MEDICAL_PATTERNS) {
    if (pattern.test(userMessage)) return concern as MedicalConcern;
  }
  return null;
}

// Localized "see a doctor" responses. We deliberately keep these short and
// always include a contact escape hatch so users have something actionable.
const MEDICAL_REDIRECT: Record<string, Record<MedicalConcern, string>> = {
  th: {
    heart: "เรื่องหัวใจ/ความดันเป็นข้อบ่งห้ามการดำน้ำ — ควรปรึกษาแพทย์ที่เชี่ยวชาญ Diving Medicine ก่อนตัดสินใจดำ ติดต่อทีม SiamDive ได้ที่ LINE/WhatsApp ถ้าต้องการคำแนะนำเรื่องคอร์สเริ่มต้นที่เหมาะสม",
    lung: "ปัญหาปอด/ระบบหายใจอย่างหอบหืดเป็นข้อบ่งห้ามการดำน้ำในหลายกรณี — ควรปรึกษาแพทย์ที่เชี่ยวชาญ Diving Medicine ก่อน ติดต่อทีมเราได้ที่ LINE/WhatsApp ถ้าอยากเริ่มจาก snorkeling แทน",
    ear: "ปัญหาเรื่องหู (ปวดหู, แก้วหูทะลุ, sinus) ทำให้ equalize ไม่ได้และเสี่ยงบาดเจ็บใต้น้ำ — ควรปรึกษาแพทย์ ENT ก่อน ติดต่อทีมเราได้ที่ LINE/WhatsApp",
    diabetes: "ผู้ป่วยเบาหวานสามารถดำน้ำได้ในเงื่อนไขที่ควบคุมได้ดี — ต้องปรึกษาแพทย์ Diving Medicine ก่อน ติดต่อ SiamDive ได้ที่ LINE/WhatsApp",
    pregnancy: "การดำน้ำขณะตั้งครรภ์ไม่แนะนำในทุกไตรมาส — เราแนะนำให้รอหลังคลอด หรือเลือกกิจกรรม snorkeling ผิวน้ำแทน ติดต่อทีมเราได้ที่ LINE/WhatsApp",
    epilepsy: "โรคลมชักเป็นข้อบ่งห้ามการดำน้ำในเกือบทุกกรณี — ควรปรึกษาแพทย์ก่อน ทีม SiamDive ติดต่อได้ที่ LINE/WhatsApp ถ้าอยากแนะนำกิจกรรมทางน้ำที่ปลอดภัยกว่า",
    dcs: "เรื่อง decompression sickness ต้องปรึกษาแพทย์ Diving Medicine โดยตรง — ทีม SiamDive ไม่ใช่แพทย์และไม่ให้คำแนะนำการรักษา ถ้ามีอาการฉุกเฉินติดต่อ DAN Hotline หรือโรงพยาบาลใกล้สุดทันที",
  },
  en: {
    heart: "Cardiovascular conditions are a serious diving contraindication — please consult a doctor specializing in Diving Medicine before any course or trip. Contact our SiamDive team on LINE/WhatsApp if you'd like guidance on a starter course that fits your situation.",
    lung: "Lung conditions like asthma are often a contraindication for scuba diving — please consult a Diving Medicine specialist first. We can suggest snorkeling alternatives — message us on LINE/WhatsApp.",
    ear: "Ear conditions (chronic pain, ruptured eardrum, sinus issues) prevent safe equalization underwater. Please see an ENT doctor first. Reach SiamDive team on LINE/WhatsApp for guidance.",
    diabetes: "Divers with well-controlled diabetes can dive under medical clearance — please consult a Diving Medicine specialist. Contact SiamDive on LINE/WhatsApp afterwards for trip suggestions.",
    pregnancy: "Scuba diving while pregnant is not recommended at any trimester — we suggest waiting until after birth, or considering surface snorkeling instead. Reach our team on LINE/WhatsApp.",
    epilepsy: "Epilepsy is a contraindication for scuba diving in nearly all cases — please consult a doctor first. SiamDive team can suggest safer water activities — contact us on LINE/WhatsApp.",
    dcs: "Decompression sickness questions need a Diving Medicine doctor — SiamDive team is not medically qualified and cannot offer treatment advice. For emergencies, contact DAN Hotline or the nearest hospital immediately.",
  },
};

export function buildMedicalRedirect(concern: MedicalConcern, lang: string): string {
  const dict = MEDICAL_REDIRECT[lang] ?? MEDICAL_REDIRECT.en;
  return dict[concern] ?? MEDICAL_REDIRECT.en[concern];
}

// ── Cert depth limits (PADI/SSI standards) ─────────────────────────────────
// Used both at request time (warn/block deep recs) and as system-prompt facts.

export const CERT_MAX_DEPTH_M: Record<string, number> = {
  NONE: 0,         // snorkel only
  SCUBA_DIVER: 12,
  OPEN_WATER: 18,
  ADVANCED: 30,    // AOW
  RESCUE: 30,
  DEEP: 40,
  TECH: 60,
};

export function maxDepthForCert(cert: string): number {
  return CERT_MAX_DEPTH_M[cert.toUpperCase()] ?? 18;
}

// Detect explicit depth mentions in AI output (e.g. "50m", "30 metres", "ลึก 40 เมตร").
// We deliberately avoid \b on the Thai side because JS \b matches ASCII word
// boundaries only — non-Latin text would never produce a boundary.
const DEPTH_EN_RX = /\b(\d{1,3})\s*(m|metres?|meters?)\b/gi;
const DEPTH_TH_RX = /(\d{1,3})\s*เมตร/g;

export function extractDepthsMentioned(text: string): number[] {
  const depths: number[] = [];
  for (const rx of [DEPTH_EN_RX, DEPTH_TH_RX]) {
    let m: RegExpExecArray | null;
    const re = new RegExp(rx);
    while ((m = re.exec(text)) !== null) {
      const n = parseInt(m[1], 10);
      if (n > 0 && n <= 200) depths.push(n);
    }
  }
  return depths;
}

export function flagOverdepthRecommendation(text: string, userCert: string): { exceeded: boolean; maxDepth: number; mentioned: number[] } {
  const max = maxDepthForCert(userCert);
  const mentioned = extractDepthsMentioned(text);
  const exceeded = mentioned.some(d => d > max);
  return { exceeded, maxDepth: max, mentioned };
}

// ── Boat name fabrication detection ────────────────────────────────────────
// Compares boat names found in AI output against a list of allowed names from
// RAG context. Catches hallucinated boats. Returns names that look like boat
// references but are NOT in the allowed list.

const BOAT_PREFIXES = ["MV", "M/V", "S/Y", "SY", "MY"];

export function findFabricatedBoatNames(text: string, allowedTitles: string[]): string[] {
  // Normalize allowed titles for case-insensitive matching
  const allowed = new Set(allowedTitles.map(t => t.toLowerCase().trim()));

  // Extract candidate boat names: prefix + 1-3 words. e.g. "MV Manta Queen 5"
  const fabricated: string[] = [];
  const prefixRx = new RegExp(`\\b(${BOAT_PREFIXES.join("|")})\\s+([A-Z][A-Za-z]+(?:\\s+[A-Z][A-Za-z0-9]+){0,3})`, "g");
  let m: RegExpExecArray | null;
  while ((m = prefixRx.exec(text)) !== null) {
    const candidate = `${m[1]} ${m[2]}`.trim();
    const isAllowed = [...allowed].some(a => a.includes(candidate.toLowerCase()));
    if (!isAllowed && !fabricated.includes(candidate)) {
      fabricated.push(candidate);
    }
  }
  return fabricated;
}
