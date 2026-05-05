// Sprint 3 B10 — Plan templates ("starter packs").
// Three curated entry points for users who don't yet know what they want.
// Each template carries default Slots (dates left blank — user picks date)
// + a multi-language copy block. Click → fill slots → category-first ASK
// or auto-build if dates are pre-set.
//
// Hardcoded over DB-seeded because: 3 entries, no operator-controlled CRUD
// needed, copy changes ship via deploy. If we ever need >5 templates the
// system-prompt addition + UI handle them generically — only the registry
// here would move into a backoffice CRUD.

import type { Slots } from "./slots";

export type TemplateLang = "th" | "en" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";

export type PlanTemplate = {
  id: "budget" | "classic" | "premium";
  emoji: string;
  /** Bullet headline shown on the chip itself, per language. */
  copy: Record<TemplateLang, { title: string; tagline: string; whatYouGet: string }>;
  /** Pre-fills sent to the chat as a slot snapshot — anything left undefined
   *  the user fills via the standard ASK flow. */
  slots: Slots;
  /** Free-text the chat will inject as the user's first message after the
   *  pick. Phrased so the AI knows the user picked a template AND wants to
   *  add concrete details (dates, headcount). */
  primer: Record<TemplateLang, string>;
};

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "budget",
    emoji: "💰",
    copy: {
      th: {
        title: "Budget — เริ่มต้นเบา",
        tagline: "Day Trip 1 วัน, ภูเก็ต/พีพี, OW หรือ snorkel",
        whatYouGet: "ทริปวันเดียว • ขึ้นเรือเช้ากลับเย็น • รถรับส่งจากที่พัก",
      },
      en: {
        title: "Budget — Quick start",
        tagline: "Single day trip, Phuket/Phi Phi, OW or snorkel",
        whatYouGet: "1 day trip • morning departure / evening return • hotel pickup",
      },
      cn: {
        title: "经济型 — 快速开始",
        tagline: "单日行程，普吉岛/皮皮岛，OW或浮潜",
        whatYouGet: "一日游 • 早出晚归 • 酒店接送",
      },
      ja: {
        title: "バジェット — 気軽に",
        tagline: "日帰り、プーケット/ピピ、OWまたはシュノーケル",
        whatYouGet: "日帰り • 朝発夕方帰り • ホテル送迎",
      },
      ko: {
        title: "버젯 — 가볍게 시작",
        tagline: "당일치기, 푸켓/피피, OW 또는 스노클링",
        whatYouGet: "당일 트립 • 아침 출발 저녁 귀항 • 호텔 픽업",
      },
      de: {
        title: "Budget — leichter Einstieg",
        tagline: "Tagestrip, Phuket/Phi Phi, OW oder Schnorcheln",
        whatYouGet: "1-Tages-Trip • Morgens los, abends zurück • Hotelabholung",
      },
      fr: {
        title: "Budget — démarrage simple",
        tagline: "Sortie d'une journée, Phuket/Phi Phi, OW ou snorkeling",
        whatYouGet: "Trip 1 jour • Matin/soir • Transfert hôtel",
      },
      ru: {
        title: "Бюджет — лёгкий старт",
        tagline: "Однодневный трип, Пхукет/Пхи-Пхи, OW или снорклинг",
        whatYouGet: "1 день • Утро-вечер • Трансфер из отеля",
      },
    },
    slots: {
      region: "andaman",
      categories: ["daytrip"],
      style: "relaxed",
    },
    primer: {
      th: "อยากเริ่มแบบเบาๆ — Day Trip 1 วันที่ภูเก็ต/พีพี ช่วยแนะนำทริปที่เหมาะให้หน่อยครับ",
      en: "I want a budget-friendly start — a single day trip in Phuket / Phi Phi. Recommend something that fits.",
      cn: "我想轻松开始 — 普吉/皮皮的一日游，请推荐合适的行程。",
      ja: "気軽に始めたい — プーケットやピピでの日帰りツアー、おすすめを教えてください。",
      ko: "가볍게 시작하고 싶어요 — 푸켓/피피 당일 트립으로 추천해주세요.",
      de: "Ich möchte einen unkomplizierten Start — Tagestrip in Phuket / Phi Phi. Was empfiehlst du?",
      fr: "Je veux commencer simplement — une journée à Phuket / Phi Phi. Une recommandation ?",
      ru: "Хочу начать с малого — однодневный трип в Пхукете или Пхи-Пхи. Что посоветуете?",
    },
  },
  {
    id: "classic",
    emoji: "⚓",
    copy: {
      th: {
        title: "Classic — Liveaboard 4 วัน",
        tagline: "เรือนอนสิมิลัน/สุรินทร์, OW ขึ้นไป",
        whatYouGet: "ค้างคืนบนเรือ 4 วัน • ดำน้ำ 10-12 ไดฟ์ • รถรับสนามบิน",
      },
      en: {
        title: "Classic — 4-day liveaboard",
        tagline: "Similan/Surin liveaboard, OW or above",
        whatYouGet: "4 nights aboard • 10-12 dives • Airport transfer",
      },
      cn: {
        title: "经典 — 4日船宿",
        tagline: "斯米兰/素林船宿，OW以上",
        whatYouGet: "船上4晚 • 10-12次潜水 • 机场接送",
      },
      ja: {
        title: "クラシック — 4日リブアボード",
        tagline: "シミラン/スリン、OW以上",
        whatYouGet: "船上4泊 • 10-12ダイブ • 空港送迎",
      },
      ko: {
        title: "클래식 — 4일 리브어보드",
        tagline: "시밀란/수린, OW 이상",
        whatYouGet: "선상 4박 • 10-12회 다이브 • 공항 픽업",
      },
      de: {
        title: "Classic — 4-Tage-Liveaboard",
        tagline: "Similan/Surin-Liveaboard, OW oder höher",
        whatYouGet: "4 Nächte an Bord • 10-12 Tauchgänge • Flughafentransfer",
      },
      fr: {
        title: "Classique — Croisière 4 jours",
        tagline: "Similan/Surin, OW minimum",
        whatYouGet: "4 nuits à bord • 10-12 plongées • Transfert aéroport",
      },
      ru: {
        title: "Классика — 4-дневный ливаборд",
        tagline: "Симилан/Сурин, OW и выше",
        whatYouGet: "4 ночи на борту • 10-12 погружений • Трансфер из аэропорта",
      },
    },
    slots: {
      region: "andaman",
      categories: ["liveaboard"],
      certs: ["ow"],
      style: "intense",
    },
    primer: {
      th: "อยากไป liveaboard 4 วันที่สิมิลัน/สุรินทร์ มี OW อยู่แล้ว ช่วยแนะนำเรือและช่วงวันที่ให้หน่อย",
      en: "I want a 4-day Similan/Surin liveaboard, I'm OW certified. Recommend a boat and dates.",
      cn: "想要4天斯米兰/素林船宿，我有OW证书。推荐合适的船只和日期。",
      ja: "4日間のシミラン/スリンのリブアボードに行きたい、OW持ちです。船と日程を提案してください。",
      ko: "4일 시밀란/수린 리브어보드를 원해요, OW 보유. 보트와 날짜 추천해주세요.",
      de: "Ich möchte einen 4-Tage-Liveaboard nach Similan/Surin, OW vorhanden. Boot & Termine vorschlagen.",
      fr: "Je veux une croisière 4 jours Similan/Surin, OW. Recommandez un bateau et des dates.",
      ru: "Хочу 4-дневный ливаборд Симилан/Сурин, есть OW. Посоветуйте лодку и даты.",
    },
  },
  {
    id: "premium",
    emoji: "✨",
    copy: {
      th: {
        title: "Premium — เรือชั้นดี 6 วัน",
        tagline: "Liveaboard ระดับพรีเมียม + ครอบคลุมทั้ง Andaman",
        whatYouGet: "ห้องชั้นบน • ดำน้ำลึกถึง Richelieu • รถรับ-ส่ง VIP",
      },
      en: {
        title: "Premium — 6-day flagship",
        tagline: "Top-tier liveaboard, full Andaman coverage",
        whatYouGet: "Upper deck cabin • Richelieu Rock dives • VIP transfer",
      },
      cn: {
        title: "尊享 — 6日旗舰",
        tagline: "顶级船宿，安达曼全境",
        whatYouGet: "上层舱房 • 里切利岩潜水 • VIP接送",
      },
      ja: {
        title: "プレミアム — 6日フラッグシップ",
        tagline: "最上級リブアボード、アンダマン全域",
        whatYouGet: "上層キャビン • リチェリュー • VIP送迎",
      },
      ko: {
        title: "프리미엄 — 6일 플래그십",
        tagline: "최상급 리브어보드, 안다만 전역",
        whatYouGet: "상층 캐빈 • 리첼리외 다이브 • VIP 픽업",
      },
      de: {
        title: "Premium — 6 Tage Flaggschiff",
        tagline: "Top-Liveaboard, gesamte Andamanensee",
        whatYouGet: "Oberdeck-Kabine • Richelieu Rock • VIP-Transfer",
      },
      fr: {
        title: "Premium — Vaisseau amiral 6 jours",
        tagline: "Croisière haut de gamme, toute la mer d'Andaman",
        whatYouGet: "Cabine pont supérieur • Richelieu • Transfert VIP",
      },
      ru: {
        title: "Премиум — 6-дневный флагман",
        tagline: "Топовый ливаборд, вся Андаманская акватория",
        whatYouGet: "Каюта верхней палубы • Ришелье • VIP-трансфер",
      },
    },
    slots: {
      region: "andaman",
      categories: ["liveaboard"],
      certs: ["aow"],
      style: "intense",
    },
    primer: {
      th: "ขอเรือ liveaboard ระดับพรีเมียม 6 วันใน Andaman, AOW มีแล้ว ช่วยแนะนำเรือชั้นดีให้หน่อย",
      en: "I want a 6-day premium Andaman liveaboard, AOW certified. Recommend a top-tier boat.",
      cn: "想要6天高端安达曼船宿，AOW证书，请推荐顶级船只。",
      ja: "アンダマンの6日プレミアムリブアボード、AOW持ちです。最上級の船を提案してください。",
      ko: "안다만 6일 프리미엄 리브어보드, AOW 보유. 최상급 보트 추천해주세요.",
      de: "Ich möchte einen 6-Tage-Premium-Liveaboard in der Andamanensee, AOW. Top-Boot bitte.",
      fr: "Je veux une croisière premium 6 jours en mer d'Andaman, AOW. Bateau haut de gamme svp.",
      ru: "Хочу 6-дневный премиум-ливаборд в Андаманском море, AOW. Посоветуйте топовую лодку.",
    },
  },
];

const CTA_LABEL: Record<TemplateLang, string> = {
  th: "เริ่มจากเทมเพลต",
  en: "Start from a template",
  cn: "从模板开始",
  ja: "テンプレートから開始",
  ko: "템플릿에서 시작",
  de: "Mit Vorlage starten",
  fr: "Commencer avec un modèle",
  ru: "Начать с шаблона",
};
const CTA_HINT: Record<TemplateLang, string> = {
  th: "ยังไม่รู้จะเริ่มยังไง? เลือกแบบสำเร็จรูปได้",
  en: "Not sure where to start? Pick a starter pack",
  cn: "不知从何开始？选个套餐",
  ja: "迷ったらこちら",
  ko: "어디서 시작할지 모르겠다면",
  de: "Nicht sicher, wo anfangen? Wähle ein Starter-Paket",
  fr: "Pas sûr ? Choisis un pack",
  ru: "Не знаете с чего начать? Выберите пакет",
};

export function templateCtaLabel(lang: string): string {
  return (CTA_LABEL as Record<string, string>)[lang] || CTA_LABEL.en;
}
export function templateCtaHint(lang: string): string {
  return (CTA_HINT as Record<string, string>)[lang] || CTA_HINT.en;
}

export function getTemplate(id: PlanTemplate["id"]): PlanTemplate | undefined {
  return PLAN_TEMPLATES.find(t => t.id === id);
}

export function templateCopy(t: PlanTemplate, lang: string): PlanTemplate["copy"]["en"] {
  return (t.copy as Record<string, PlanTemplate["copy"]["en"]>)[lang] || t.copy.en;
}

export function templatePrimer(t: PlanTemplate, lang: string): string {
  return (t.primer as Record<string, string>)[lang] || t.primer.en;
}
