"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, usePathname } from "next/navigation";
import ChatMessage from "./ChatMessage";
import SuggestionChips from "./SuggestionChips";
import SlotTrackerChips from "./SlotTrackerChips";
import TemplatePicker from "./TemplatePicker";
import CompareSheet from "./CompareSheet";
import PlanRouteSheet from "./PlanRouteSheet";
import BuildTargetSheet from "./plan/BuildTargetSheet";
import { templatePrimer } from "@/lib/ark-ai/plan-templates";
import { readRecentBoats } from "@/lib/recentlyViewed";
import { monthName, seasonInfo, seasonLabel } from "@/lib/dive-season";
import { addTrip, addTripToPlan, createPlan, getPlans, switchPlan, upsertServerPlan, suggestPlanName, type UserPlan, type PlanTrip } from "@/lib/plan-store";
import { readPendingPicks, clearPendingPicks, addPendingPick, type PendingPick } from "@/lib/pending-picks";
import { rankPlans, type PlanScore } from "@/lib/plan-routing";
import {
  trackChatOpen,
  trackChatMessage,
  trackChatFeedback,
  trackChatSessionFeedback,
  track,
} from "@/lib/analytics/client";
import type { Slots, SlotField } from "@/lib/ark-ai/slots";
import { t, bcp47Locale, pickGreetingMessage, pickDateLabel, addedToMyPlanMessage, planReusedExistingLabel, openPlanLabel, planRecentlyDeletedLabel, createNewLabel, pickConfirmIntro, pickConfirmHeadcountAsk, planCreatedToast, planAddedTripsToast, switchPlanLabel, planMovedToNewToast } from "@/lib/ark-ai/i18n";

type Msg = { role: "user" | "assistant"; content: string };

// Read browser-managed identifiers written by the analytics SDK
// (src/lib/analytics/client.ts). We don't import the getter because the SDK
// stores them as module-level vars without an exported accessor; localStorage
// is the same source of truth.
function readBrowserId(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

// Mirrors slots.ts TripCategory enum — picking a schedule from a card
// implies the user wants this category, so we set it eagerly. DIVE_RESORT
// rolls into "liveaboard" because that's the closest planning bucket.
const TYPE_TO_CATEGORY: Record<string, "liveaboard" | "daytrip" | "snorkeling" | "land_tour"> = {
  DAYTRIP:     "daytrip",
  SNORKELING:  "snorkeling",
  LIVEABOARD:  "liveaboard",
  DIVE_RESORT: "liveaboard",
  LAND_TOUR:   "land_tour",
};

const WELCOME_BASE: Record<string, string> = {
  th: "สวัสดีครับ! ผมเป็นผู้ช่วยหาทริปดำน้ำในประเทศไทย\n\nผมสามารถ:\n- **แนะนำทริป** เรือดำน้ำ, Liveaboard และ Day Trip\n- **เปรียบเทียบเรือ** ให้เลือกง่ายขึ้น\n- **ตอบคำถามเรื่องดำน้ำ** ฤดูกาล, cert, จุดดำน้ำ\n\nสนใจทริปไหน กด **+** เพิ่มเข้า My Plan ได้เลย!",
  en: "Hi! I'm your AI dive trip advisor for Thailand.\n\nI can:\n- **Recommend trips** — boats, liveaboards, and dive sites\n- **Compare boats** side by side\n- **Answer diving questions** — seasons, certs, dive spots\n\nLike a trip? Tap **+** to add it to your plan!",
  cn: "你好！我是你的泰国潜水旅行AI顾问。\n\n我可以：\n- **推荐潜水行程** — 船只、船宿、潜点\n- **对比船只**\n- **回答潜水问题** — 季节、证书、潜点\n\n喜欢的行程点 **+** 加入计划！",
  ja: "こんにちは！タイのダイビングAIアドバイザーです。\n\nできること：\n- **トリップ提案** — ボート、リブアボード、ダイビングスポット\n- **ボート比較**\n- **ダイビングの質問に回答** — シーズン、資格、スポット\n\n気に入ったトリップは **+** でプランに追加！",
  ko: "안녕하세요! 태국 다이빙 AI 어드바이저입니다.\n\n할 수 있는 것:\n- **트립 추천** — 보트, 리브어보드, 다이빙 사이트\n- **보트 비교**\n- **다이빙 질문 답변** — 시즌, 자격증, 스팟\n\n마음에 드는 트립은 **+** 로 플랜에 추가!",
  de: "Hallo! Ich bin dein KI-Tauchberater für Thailand.\n\nIch kann:\n- **Trips empfehlen** — Boote, Liveaboards, Tauchplätze\n- **Boote vergleichen**\n- **Tauchfragen beantworten** — Saisons, Zertifikate, Spots\n\nGefällt dir ein Trip? Tippe **+** um ihn zum Plan hinzuzufügen!",
  fr: "Bonjour ! Je suis votre conseiller IA plongée pour la Thaïlande.\n\nJe peux :\n- **Recommander des trips** — bateaux, croisières, sites de plongée\n- **Comparer les bateaux**\n- **Répondre aux questions** — saisons, certifications, spots\n\nUn trip vous plaît ? Appuyez sur **+** pour l'ajouter au plan !",
  ru: "Привет! Я ваш AI-консультант по дайвингу в Таиланде.\n\nЯ могу:\n- **Рекомендовать трипы** — лодки, ливаборды, дайв-сайты\n- **Сравнить лодки**\n- **Ответить на вопросы** — сезоны, сертификаты, споты\n\nПонравился трип? Нажмите **+** чтобы добавить в план!",
};

const WELCOME_ON_TRIP: Record<string, string> = {
  th: "สวัสดีครับ! เห็นว่ากำลังดูทริปนี้อยู่ 👀\n\nผมช่วยได้เลย:\n- **ถามรายละเอียดทริปนี้** — ดำกี่ไดฟ์ เหมาะกับ cert ไหน\n- **หาวันว่าง** หรือเช็คตารางเรือ\n- **เปรียบเทียบกับเรืออื่น** ในพื้นที่เดียวกัน\n\nสนใจทริปนี้ กด **+** เพิ่มเข้า My Plan ได้เลย!",
  en: "Hi! I see you're checking out this trip 👀\n\nI can help you:\n- **Ask about this trip** — how many dives, what cert you need\n- **Check available dates** and schedules\n- **Compare with other boats** in the same area\n\nLike it? Tap **+** to add it to your plan!",
  cn: "你好！看到你正在查看这个行程 👀\n\n我可以帮你：\n- **了解行程详情** — 几次潜水、需要什么证书\n- **查看可用日期** 和船期\n- **与同区域其他船只对比**\n\n喜欢就点 **+** 加入计划！",
  ja: "こんにちは！このトリップをご覧になっていますね 👀\n\nお手伝いできます：\n- **このトリップの詳細** — ダイブ回数、必要な資格\n- **空き日程の確認**\n- **同エリアの他のボートと比較**\n\n気に入ったら **+** でプランに追加！",
  ko: "안녕하세요! 이 트립을 보고 계시군요 👀\n\n도움을 드릴 수 있어요:\n- **트립 상세 정보** — 다이빙 횟수, 필요한 자격증\n- **가능한 날짜 확인**\n- **같은 지역 다른 보트와 비교**\n\n마음에 들면 **+** 로 플랜에 추가!",
  de: "Hallo! Ich sehe, du schaust dir diesen Trip an 👀\n\nIch kann dir helfen:\n- **Details zu diesem Trip** — Anzahl Tauchgänge, benötigtes Zertifikat\n- **Verfügbare Termine prüfen**\n- **Mit anderen Booten vergleichen**\n\nGefällt dir? Tippe **+** um zum Plan hinzuzufügen!",
  fr: "Bonjour ! Je vois que vous regardez ce trip 👀\n\nJe peux vous aider :\n- **Détails sur ce trip** — nombre de plongées, certificat requis\n- **Vérifier les dates disponibles**\n- **Comparer avec d'autres bateaux**\n\nIntéressé ? Appuyez sur **+** pour l'ajouter au plan !",
  ru: "Привет! Вижу, вы смотрите этот трип 👀\n\nМогу помочь:\n- **Подробности о трипе** — сколько погружений, какой сертификат нужен\n- **Проверить доступные даты**\n- **Сравнить с другими лодками**\n\nНравится? Нажмите **+** чтобы добавить в план!",
};

const WELCOME_ON_BLOG: Record<string, string> = {
  th: "สวัสดีครับ! กำลังอ่านบทความอยู่ใช่ไหม 📖\n\nถ้าสนใจเนื้อหาในบทความนี้ ผมช่วยได้:\n- **หาทริปที่เกี่ยวข้อง** กับสิ่งที่อ่านอยู่\n- **วางแผนทริปดำน้ำ** ตามสถานที่ที่กล่าวถึง\n- **ตอบคำถามเพิ่มเติม** เกี่ยวกับดำน้ำในไทย\n\nถามได้เลยครับ!",
  en: "Hi! I see you're reading a blog article 📖\n\nInterested in what you're reading? I can:\n- **Find related trips** based on this article\n- **Plan a dive trip** to the locations mentioned\n- **Answer any questions** about diving in Thailand\n\nJust ask!",
  cn: "你好！看到你在阅读文章 📖\n\n对内容感兴趣？我可以：\n- **查找相关行程**\n- **规划文中提到地点的潜水之旅**\n- **回答关于泰国潜水的问题**\n\n直接问我！",
  ja: "こんにちは！ブログ記事をお読みですね 📖\n\n興味がありましたら：\n- **関連トリップを探す**\n- **記事の場所へのダイビング旅行を計画**\n- **タイのダイビングについて質問に回答**\n\nお気軽にどうぞ！",
  ko: "안녕하세요! 블로그 기사를 읽고 계시군요 📖\n\n관심이 있으시다면:\n- **관련 트립 찾기**\n- **기사에 언급된 장소로 다이빙 여행 계획**\n- **태국 다이빙에 대한 질문 답변**\n\n질문하세요!",
  de: "Hallo! Du liest gerade einen Blog-Artikel 📖\n\nInteressiert? Ich kann:\n- **Passende Trips finden**\n- **Tauchreise zu den genannten Orten planen**\n- **Fragen zum Tauchen in Thailand beantworten**\n\nFrag einfach!",
  fr: "Bonjour ! Vous lisez un article 📖\n\nIntéressé ? Je peux :\n- **Trouver des trips associés**\n- **Planifier un voyage vers les lieux mentionnés**\n- **Répondre à vos questions sur la plongée en Thaïlande**\n\nDemandez-moi !",
  ru: "Привет! Вижу, вы читаете статью 📖\n\nИнтересно? Я могу:\n- **Найти связанные трипы**\n- **Спланировать поездку в упомянутые места**\n- **Ответить на вопросы о дайвинге в Таиланде**\n\nСпрашивайте!",
};

const WELCOME_RETURNING: Record<string, string> = {
  th: "ยินดีต้อนรับกลับมาครับ! 🤿\n\nเห็นว่าเพิ่งดูมาหลายทริป ต้องการให้ช่วย:\n- **เปรียบเทียบทริปที่ดูมา** ให้เห็นข้อดี-ข้อเสีย\n- **หาทริปเพิ่มเติม** ตามความสนใจ\n\nสนใจทริปไหน กด **+** เพิ่มเข้า My Plan ได้เลย!",
  en: "Welcome back! 🤿\n\nI see you've been browsing several trips. Want me to:\n- **Compare the trips you viewed** — pros and cons\n- **Find more trips** in the areas you like\n\nLike a trip? Tap **+** to add it to your plan!",
  cn: "欢迎回来！🤿\n\n看到你浏览了多个行程，需要我：\n- **对比你看过的行程** — 优缺点分析\n- **查找更多行程**\n\n喜欢的行程点 **+** 加入计划！",
  ja: "おかえりなさい！🤿\n\nいくつかのトリップを閲覧されましたね：\n- **閲覧したトリップを比較** — メリット・デメリット\n- **もっとトリップを探す**\n\n気に入ったら **+** でプランに追加！",
  ko: "다시 오신 것을 환영합니다! 🤿\n\n여러 트립을 둘러보셨군요:\n- **본 트립들 비교** — 장단점 분석\n- **더 많은 트립 찾기**\n\n마음에 들면 **+** 로 플랜에 추가!",
  de: "Willkommen zurück! 🤿\n\nDu hast mehrere Trips angesehen:\n- **Angesehene Trips vergleichen** — Vor- und Nachteile\n- **Weitere Trips finden**\n\nGefällt dir? Tippe **+** um zum Plan hinzuzufügen!",
  fr: "Bon retour ! 🤿\n\nVous avez consulté plusieurs trips :\n- **Comparer les trips consultés** — avantages et inconvénients\n- **Trouver plus de trips**\n\nIntéressé ? Appuyez sur **+** pour l'ajouter au plan !",
  ru: "С возвращением! 🤿\n\nВижу, вы просматривали несколько трипов:\n- **Сравнить просмотренные трипы** — плюсы и минусы\n- **Найти больше трипов**\n\nНравится? Нажмите **+** чтобы добавить в план!",
};

const WELCOME_BROWSING: Record<string, string> = {
  th: "สวัสดีครับ! เห็นว่ากำลังหาทริปดำน้ำอยู่ 🔍\n\nผมช่วยให้เจอทริปที่ใช่ได้เร็วขึ้น:\n- **บอกงบ วัน cert level** แล้วผมแนะนำทริปที่เหมาะ\n- **เปรียบเทียบเรือ** ให้เห็นชัดๆ\n\nสนใจทริปไหน กด **+** เพิ่มเข้า My Plan ได้เลย!",
  en: "Hi! I see you're looking for a dive trip 🔍\n\nI can help you find the right one faster:\n- **Tell me your dates, cert level & preferences** and I'll recommend the best match\n- **Compare boats** side by side\n\nLike a trip? Tap **+** to add it to your plan!",
  cn: "你好！看到你在找潜水行程 🔍\n\n我能帮你更快找到：\n- **告诉我日期和证书等级** 我推荐最合适的\n- **对比船只**\n\n喜欢的行程点 **+** 加入计划！",
  ja: "こんにちは！ダイビングトリップをお探しですね 🔍\n\nもっと早く見つけるお手伝いができます：\n- **日程、資格レベルを教えてください** 最適なものを提案します\n- **ボートを比較**\n\n気に入ったら **+** でプランに追加！",
  ko: "안녕하세요! 다이빙 트립을 찾고 계시군요 🔍\n\n더 빨리 찾아드릴 수 있어요:\n- **날짜, 자격증 레벨을 알려주세요** 최적의 것을 추천합니다\n- **보트 비교**\n\n마음에 들면 **+** 로 플랜에 추가!",
  de: "Hallo! Du suchst einen Tauchtrip 🔍\n\nIch helfe dir schneller:\n- **Sag mir Termine & Zertifikat** — ich empfehle das Beste\n- **Boote vergleichen**\n\nGefällt dir? Tippe **+** um zum Plan hinzuzufügen!",
  fr: "Bonjour ! Vous cherchez un voyage de plongée 🔍\n\nJe peux vous aider plus vite :\n- **Dites-moi dates & niveau** — je recommande le meilleur\n- **Comparer les bateaux**\n\nIntéressé ? Appuyez sur **+** pour l'ajouter au plan !",
  ru: "Привет! Вижу, вы ищете дайвинг-трип 🔍\n\nПомогу найти быстрее:\n- **Скажите даты и уровень сертификата** — подберу лучшее\n- **Сравнить лодки**\n\nНравится? Нажмите **+** чтобы добавить в план!",
};

// Per-lang season tag-lines for the welcome message header. Geographic
// names (Similan / Surin / Koh Tao / Sail Rock / whale shark) stay in
// their conventional Roman spellings — those are the proper nouns dive
// travellers search for.
const SEASON_HEADER: Record<string, (mn: string) => string> = {
  th: (mn) => `🌊 **เดือน${mn}**`,
  en: (mn) => `🌊 **${mn}**`,
  cn: (mn) => `🌊 **${mn}**`,
  ja: (mn) => `🌊 **${mn}**`,
  ko: (mn) => `🌊 **${mn}**`,
  de: (mn) => `🌊 **${mn}**`,
  fr: (mn) => `🌊 **${mn}**`,
  ru: (mn) => `🌊 **${mn}**`,
};
const WHALE_SHARK_NOTE: Record<string, string> = {
  th: " ช่วงนี้มีโอกาสเจอฉลามวาฬ!",
  en: " — whale shark season!",
  cn: " — 鲸鲨季节!",
  ja: " — ジンベエザメのシーズン!",
  ko: " — 고래상어 시즌!",
  de: " — Walhai-Saison!",
  fr: " — saison des requins-baleines !",
  ru: " — сезон китовых акул!",
};
const ANDAMAN_NOTE: Record<string, string> = {
  th: " สิมิลัน-สุรินทร์ เปิดอยู่!",
  en: " — Similan & Surin are open!",
  cn: " — 西米兰和素林开放!",
  ja: " — シミラン&スリン オープン中!",
  ko: " — 시밀란 & 수린 오픈!",
  de: " — Similan & Surin geöffnet!",
  fr: " — Similan & Surin sont ouverts !",
  ru: " — Симилан и Сурин открыты!",
};
const GULF_NOTE: Record<string, string> = {
  th: " เกาะเต่า-Sail Rock สภาพดี!",
  en: " — Koh Tao & Sail Rock at their best!",
  cn: " — 龟岛和 Sail Rock 状态最佳!",
  ja: " — タオ島 & Sail Rock 絶好調!",
  ko: " — 따오섬 & Sail Rock 최상!",
  de: " — Koh Tao & Sail Rock in Bestform!",
  fr: " — Koh Tao & Sail Rock au meilleur !",
  ru: " — Ко-Тао и Sail Rock в лучшем состоянии!",
};
function buildSeasonLine(lang: string): string {
  const mn = monthName(lang);
  const s = seasonInfo();
  const label = seasonLabel(lang);
  const header = (SEASON_HEADER[lang] || SEASON_HEADER.en)(mn);
  let line = `\n\n${header} — ${label}`;
  if (s.whaleShark) line += WHALE_SHARK_NOTE[lang] || WHALE_SHARK_NOTE.en;
  else if (s.coast === "andaman") line += ANDAMAN_NOTE[lang] || ANDAMAN_NOTE.en;
  else if (s.coast === "gulf") line += GULF_NOTE[lang] || GULF_NOTE.en;
  return line;
}

function buildWelcome(lang: string, pathname: string): string {
  const seasonLine = buildSeasonLine(lang);

  const tripMatch = pathname.match(/\/trips\/([^/]+)/);
  if (tripMatch) return (WELCOME_ON_TRIP[lang] || WELCOME_ON_TRIP.en) + seasonLine;

  const blogMatch = pathname.match(/\/blogs\/([^/]+)/);
  if (blogMatch) return (WELCOME_ON_BLOG[lang] || WELCOME_ON_BLOG.en) + seasonLine;

  const recentBoats = readRecentBoats();
  if (recentBoats.length >= 3) return (WELCOME_RETURNING[lang] || WELCOME_RETURNING.en) + seasonLine;
  if (recentBoats.length > 0) return (WELCOME_BROWSING[lang] || WELCOME_BROWSING.en) + seasonLine;

  return (WELCOME_BASE[lang] || WELCOME_BASE.en) + seasonLine;
}

function detectPageContext(pathname: string): string | undefined {
  const tripMatch = pathname.match(/\/trips\/([^/]+)/);
  if (tripMatch) return `trip:${tripMatch[1]}`;
  const blogMatch = pathname.match(/\/blogs\/([^/]+)/);
  if (blogMatch) return `blog:${blogMatch[1]}`;
  const planMatch = pathname.match(/\/plan\/([^/]+)/);
  if (planMatch) return `plan:${planMatch[1]}`;
  return pathname;
}

export default function ArkAIChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const params = useParams();
  const pathname = usePathname();
  const lang = (params.lang as string) || "en";

  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem("ark-ai-messages");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [feedbackState, setFeedbackState] = useState<Record<number, boolean>>({});
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slots>({});
  const [slotsComplete, setSlotsComplete] = useState(false);
  // Trips the user clicked "+" on but hasn't built into a plan yet. Lives in
  // sessionStorage (see pending-picks.ts). Until $$BUILD$$ fires, picks are
  // pure intent — the plan-store stays untouched.
  const [pendingPicks, setPendingPicks] = useState<PendingPick[]>(() => readPendingPicks());
  // Step animation rendered while the build flushes pendingPicks → plan-store.
  // null = no animation in flight. The integer is the current step (0-based).
  const [buildStep, setBuildStep] = useState<number | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [buildTargetOpen, setBuildTargetOpen] = useState(false);
  // PlanRouteSheet state — open with picks to commit + ranked plans, then
  // resolve via the routeSheetResolver callback so flushPicksToPlan can
  // await the user's choice.
  const [routeSheet, setRouteSheet] = useState<{
    picks: PendingPick[];
    ranked: PlanScore[];
    resolve: (choice: { type: "existing"; planId: string } | { type: "new" } | null) => void;
  } | null>(null);
  const [sessionFeedbackPrompt, setSessionFeedbackPrompt] = useState(false);
  const [sessionFeedbackReason, setSessionFeedbackReason] = useState("");
  const sessionFeedbackAskedRef = useRef(false);
  // Wraps requestClose so the keydown effect (which mounts once per open)
  // doesn't need it as a dependency — would otherwise re-bind on every
  // message change and disrupt scroll lock.
  const requestCloseRef = useRef<() => void>(() => {});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Pixel offset between the layout viewport bottom and the visual viewport
  // bottom — non-zero when the on-screen keyboard is visible. We use it to
  // shrink the chat panel so the textarea stays visible above the keyboard.
  const [keyboardInset, setKeyboardInset] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const trackedOpenRef = useRef(false);
  const sendRef = useRef<(t: string) => void>(undefined);

  useEffect(() => {
    if (open && !trackedOpenRef.current) {
      trackChatOpen();
      trackedOpenRef.current = true;
    }
  }, [open]);

  // Keep pendingPicks state in sync with sessionStorage. The boat-detail
  // page's "+" button writes directly to storage and dispatches a
  // pending-picks-changed event — without this listener we'd miss every
  // out-of-component update.
  useEffect(() => {
    const sync = () => setPendingPicks(readPendingPicks());
    window.addEventListener("pending-picks-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pending-picks-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Acknowledge staged picks in chat — runs both on cold start (chat opens
  // with picks already in sessionStorage) AND on every subsequent "+" tap
  // while the chat is open. Without the second case, picking a schedule
  // again from the home page just reopened a silent chat — the user said
  // (2026-05-09) "ระบบเงียบ ... ควรจะคุยและแนะนำ".
  //
  // Why a deterministic local injection instead of round-tripping through
  // /api/ark-ai/chat: the LLM sometimes denied the pick existed
  // ("เรายังไม่มีทริปนี้บนเว็บตอนนี้") because the boat name in free-form
  // Thai didn't fuzzy-match its RAG context strongly enough. The user just
  // CLICKED + on this exact boat — there's nothing for the model to decide.
  // We render a $$TRIP$$ card straight from the staged pick (cover/area/type
  // all known client-side) and ask the next slot question; the LLM picks up
  // from the user's reply.
  //
  // Acked-pick tracking persists in sessionStorage so reopening the panel
  // doesn't double-acknowledge already-rendered picks. We also drop entries
  // that no longer match a current pick (Build clears pendingPicks → acked
  // is cleaned up so the next + tap re-acknowledges).
  const ACK_KEY = "siamdive:ark-ai-acked-picks";
  useEffect(() => {
    if (!open) return;

    const pickKey = (p: PendingPick) => `${p.boatId}:${p.schedule?.scheduleId || ""}`;
    const readAcked = (): Set<string> => {
      try {
        const raw = sessionStorage.getItem(ACK_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set<string>(Array.isArray(arr) ? arr : []);
      } catch {
        return new Set<string>();
      }
    };
    const writeAcked = (set: Set<string>) => {
      try { sessionStorage.setItem(ACK_KEY, JSON.stringify([...set])); } catch {}
    };

    const acknowledgeNewPicks = () => {
      const picks = readPendingPicks();
      const currentKeys = new Set(picks.map(pickKey));
      // Drop acked entries that are no longer in pendingPicks (e.g. Build
      // ran and cleared everything) so re-adding the same trip later still
      // gets a fresh acknowledgment.
      const acked = new Set([...readAcked()].filter(k => currentKeys.has(k)));
      const newPicks = picks.filter(p => !acked.has(pickKey(p)));
      if (newPicks.length === 0) {
        writeAcked(acked);
        return;
      }

      const fmtDateShort = (iso: string) =>
        new Date(iso + "T00:00:00").toLocaleDateString(
          bcp47Locale(lang),
          { day: "numeric", month: "short", year: "2-digit" },
        );
      const labels = newPicks.map(p => {
        const d = p.schedule?.departureDate?.slice(0, 10);
        if (!d) return p.title;
        return pickDateLabel(lang, p.title, fmtDateShort(d));
      });
      const userText = pickGreetingMessage(lang, labels.join(", "));
      const tripMarkers = newPicks.map(p => {
        const tripCard = {
          boatId: p.boatId,
          title: p.title,
          type: p.type,
          area: p.area,
          slug: p.slug,
          cover: p.cover,
          ...(p.schedule?.departureDate ? { departureDate: p.schedule.departureDate } : {}),
        };
        return `$$TRIP${JSON.stringify(tripCard)}$$`;
      }).join("\n");

      // Duplicate detection — if any new pick is already in one of the
      // user's plans, surface that in the assistant message so the user
      // doesn't accidentally end up with two copies of the same booking.
      const userPlans = getPlans();
      const dupNames = new Set<string>();
      for (const pick of newPicks) {
        const dupPlan = userPlans.find(plan =>
          plan.trips.some(t =>
            t.boatId === pick.boatId &&
            (t.schedule?.scheduleId || "") === (pick.schedule?.scheduleId || ""),
          ),
        );
        if (dupPlan) dupNames.add(dupPlan.name);
      }

      let intro = pickConfirmIntro(lang);
      if (dupNames.size > 0) {
        const namesList = [...dupNames].map(n => `"${n}"`).join(", ");
        intro = lang === "th"
          ? `ทริปนี้คุณมีอยู่ใน ${namesList} แล้วนะ — ตอบคำถามต่อเพื่อสร้าง plan ใหม่ หรือกดเปิด plan เดิมได้`
          : lang === "cn"
            ? `此行程已在 ${namesList} 中 — 继续回答创建新计划，或打开原计划`
            : lang === "ja"
              ? `このツアーは既に ${namesList} にあります — 質問に答えて新規作成するか、既存を開いてください`
              : lang === "ko"
                ? `이 투어는 이미 ${namesList}에 있어요 — 새로 만들려면 답변을 계속하거나 기존 플랜을 여세요`
                : lang === "de"
                  ? `Diese Tour ist bereits in ${namesList} — Antworte weiter für einen neuen Plan oder öffne den vorhandenen`
                  : lang === "fr"
                    ? `Ce voyage est déjà dans ${namesList} — continuez à répondre pour un nouveau plan ou ouvrez l'existant`
                    : lang === "ru"
                      ? `Этот тур уже есть в ${namesList} — ответьте на вопросы для нового плана или откройте существующий`
                      : `This trip is already in ${namesList} — keep answering to start a new plan, or open the existing one`;
      }

      const assistantText = `${intro}\n\n${tripMarkers}\n\n${pickConfirmHeadcountAsk(lang)}`;
      setMessages(prev => [
        ...prev,
        { role: "user", content: userText },
        { role: "assistant", content: assistantText },
      ]);

      const newAcked = new Set(acked);
      for (const p of newPicks) newAcked.add(pickKey(p));
      writeAcked(newAcked);
    };

    acknowledgeNewPicks();
    const handler = () => acknowledgeNewPicks();
    window.addEventListener("pending-picks-changed", handler);
    return () => window.removeEventListener("pending-picks-changed", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lang]);

  // Hydrate slot chips from the most-recent active session so the user can
  // resume across refreshes. Cold-start visitors get an empty {} (no flicker).
  useEffect(() => {
    if (!open) return;
    const deviceId = readBrowserId("sd_vid");
    if (!deviceId) return;
    let cancelled = false;
    fetch(`/api/ark-ai/session?deviceId=${encodeURIComponent(deviceId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.session) return;
        setSlots(data.session.slots || {});
        setSlotsComplete(!!data.session.complete);
      })
      .catch(() => { /* resume failure is silent — chips just stay empty */ });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (messages.length > 0) {
      try { sessionStorage.setItem("ark-ai-messages", JSON.stringify(messages)); } catch {}
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    body.style.touchAction = "none";

    const pending = sessionStorage.getItem("ark-ai-pending");
    if (pending) {
      sessionStorage.removeItem("ark-ai-pending");
      setTimeout(() => sendRef.current?.(pending), 500);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestCloseRef.current();
    };
    window.addEventListener("keydown", onKey);

    // Auto-focus the input when the panel opens (a11y: keyboard users land
    // ready to type instead of tabbing through the header).
    setTimeout(() => inputRef.current?.focus(), 100);

    // Track the on-screen keyboard so the textarea stays above it. iOS
    // Safari + Chrome Mobile both expose keyboard size via visualViewport:
    // when the keyboard opens the visual viewport shrinks while the layout
    // viewport stays. The panel is `position:fixed; inset:0`, so without
    // this listener the input falls behind the keyboard.
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    const updateKeyboardInset = () => {
      if (!vv) return;
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset);
    };
    if (vv) {
      vv.addEventListener("resize", updateKeyboardInset);
      vv.addEventListener("scroll", updateKeyboardInset);
      updateKeyboardInset();
    }

    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      html.style.overflow = "";
      body.style.touchAction = "";
      window.removeEventListener("keydown", onKey);
      if (vv) {
        vv.removeEventListener("resize", updateKeyboardInset);
        vv.removeEventListener("scroll", updateKeyboardInset);
      }
      setKeyboardInset(0);
      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  // When the keyboard appears, scroll the chat to the bottom so the most
  // recent message stays in view above the input.
  useEffect(() => {
    if (keyboardInset > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [keyboardInset]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current && !showScrollBtn) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming, showScrollBtn]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 80);
  }, []);

  const handleFeedback = useCallback((msgIndex: number, positive: boolean, reason?: string) => {
    setFeedbackState(prev => ({ ...prev, [msgIndex]: positive }));
    trackChatFeedback(positive, msgIndex, reason);
  }, []);

  useEffect(() => {
    try { sessionFeedbackAskedRef.current = sessionStorage.getItem("ark-ai-session-fb") === "1"; } catch {}
  }, []);

  // User-initiated close (X button or Esc). Show the session feedback prompt
  // once per session if the conversation had any back-and-forth AND the user
  // hasn't already left per-message feedback. Auto-close paths after build
  // success call onClose() directly — they bypass the prompt.
  const requestClose = useCallback(() => {
    const userTurns = messages.filter(m => m.role === "user").length;
    const eligible =
      !sessionFeedbackAskedRef.current &&
      userTurns >= 2 &&
      Object.keys(feedbackState).length === 0;
    if (eligible) {
      setSessionFeedbackPrompt(true);
      return;
    }
    onClose();
  }, [messages, feedbackState, onClose]);

  useEffect(() => { requestCloseRef.current = requestClose; }, [requestClose]);

  const submitSessionFeedback = useCallback((positive: boolean, reason?: string) => {
    trackChatSessionFeedback(positive, reason, messages.length);
    sessionFeedbackAskedRef.current = true;
    try { sessionStorage.setItem("ark-ai-session-fb", "1"); } catch {}
    setSessionFeedbackPrompt(false);
    setSessionFeedbackReason("");
    onClose();
  }, [messages.length, onClose]);

  const skipSessionFeedback = useCallback(() => {
    sessionFeedbackAskedRef.current = true;
    try { sessionStorage.setItem("ark-ai-session-fb", "1"); } catch {}
    setSessionFeedbackPrompt(false);
    setSessionFeedbackReason("");
    onClose();
  }, [onClose]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    setLastError(null);
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    trackChatMessage("user", text.trim().length);

    const assistantMsg: Msg = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    const recentBoatIds = readRecentBoats();
    const pageContext = detectPageContext(pathname);

    try {
      abortRef.current = new AbortController();
      const deviceId = readBrowserId("sd_vid");
      const sessionIdHdr = readBrowserId("sd_sid");
      const res = await fetch("/api/ark-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          lang,
          pageContext,
          recentlyViewed: recentBoatIds.length ? recentBoatIds.slice(0, 10).join(",") : undefined,
          path: pathname,
          deviceId,
          sessionId: sessionIdHdr,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error" }));
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: err.error || "Something went wrong." };
          return updated;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: accumulated };
                return updated;
              });
            }
            if (parsed.slotUpdate) {
              setSlots(parsed.slotUpdate.slots || {});
              setSlotsComplete(!!parsed.slotUpdate.complete);
            }
            if (parsed.error) {
              accumulated += `\n\n*Error: ${parsed.error}*`;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: accumulated };
                return updated;
              });
            }
          } catch {}
        }
      }

      // Server now does a tool-result round-trip when the model emitted only
      // tool_calls, so the empty-bubble case shouldn't reach here. As a last
      // resort (network blip, model regresses), drop the empty placeholder
      // instead of showing fabricated "saved" text.
      if (!accumulated.trim()) {
        setMessages(prev => prev.slice(0, -1));
      }

      trackChatMessage("assistant", accumulated.length);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Connection error. Please try again." };
        return updated;
      });
      setLastError(text.trim());
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, lang, pathname]);

  const retry = useCallback(() => {
    if (!lastError || streaming) return;
    // Drop the failed assistant message + the last user message so sendMessage can re-add them
    setMessages(prev => prev.slice(0, -2));
    const text = lastError;
    setLastError(null);
    sendMessage(text);
  }, [lastError, streaming]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearSlot = useCallback((field: SlotField) => {
    // Optimistic local clear; server PATCH refreshes authoritative state.
    setSlots(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSlotsComplete(false);
    const deviceId = readBrowserId("sd_vid");
    if (!deviceId) return;
    fetch("/api/ark-ai/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, clear: [field] }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.session) {
          setSlots(data.session.slots || {});
          setSlotsComplete(!!data.session.complete);
        }
      })
      .catch(() => { /* keep optimistic state */ });
  }, []);

  // Step labels for the build animation. Each tick advances the user-facing
  // overlay so the user feels the AI is doing real work — even when the
  // local fast path is essentially instant. Sized to feel deliberate (~1.6s
  // total) without dragging.
  const buildSteps = useCallback((): { label: string }[] => {
    const stepDicts: Record<string, string>[] = [
      { th: "📦 จัดเตรียมทริป...", en: "📦 Gathering trips...", cn: "📦 整理行程...", ja: "📦 ツアーを集めています...", ko: "📦 투어 준비 중...", de: "📦 Touren werden zusammengestellt...", fr: "📦 Collecte des voyages...", ru: "📦 Собираем туры..." },
      { th: "🗓️ ลำดับวันที่...", en: "🗓️ Sequencing dates...", cn: "🗓️ 排序日期...", ja: "🗓️ 日程を並べています...", ko: "🗓️ 날짜 정렬 중...", de: "🗓️ Daten werden sortiert...", fr: "🗓️ Ordonnancement des dates...", ru: "🗓️ Упорядочиваем даты..." },
      { th: "🎒 สร้าง checklist...", en: "🎒 Building checklist...", cn: "🎒 创建清单...", ja: "🎒 チェックリスト作成...", ko: "🎒 체크리스트 생성 중...", de: "🎒 Checkliste wird erstellt...", fr: "🎒 Création de la liste...", ru: "🎒 Создаём чек-лист..." },
      { th: "💰 คำนวณช่วงราคา...", en: "💰 Calculating price range...", cn: "💰 计算价格范围...", ja: "💰 価格帯を計算...", ko: "💰 가격대 계산 중...", de: "💰 Preisspanne berechnen...", fr: "💰 Calcul de la plage de prix...", ru: "💰 Считаем диапазон цен..." },
      { th: "✓ พร้อมแล้ว!", en: "✓ Ready!", cn: "✓ 准备就绪!", ja: "✓ 準備完了!", ko: "✓ 준비 완료!", de: "✓ Fertig!", fr: "✓ Prêt !", ru: "✓ Готово!" },
    ];
    return stepDicts.map(d => ({ label: d[lang] || d.en }));
  }, [lang]);

  // Flush pendingPicks → plan-store with a step animation. Used by the
  // fast path; the slow server-build path runs the animation in parallel
  // with the actual /api/ark-ai/build-plan request.
  //
  // Plan routing tiers:
  //   0 plans  → silent create + toast "✓ สร้าง plan แล้ว"
  //   1 plan   → silent add to that plan + toast with "เปลี่ยน plan" action
  //   2+ plans → open PlanRouteSheet, await user choice (recommended,
  //              another existing plan, or "+ create new")
  const flushPicksToPlan = useCallback(async (picks: PendingPick[], force = false): Promise<string | null> => {
    if (picks.length === 0) return null;

    let plans = getPlans();

    // Trip-set match check — if the user already has a plan whose trips are
    // exactly these picks, surface a 2-button toast (Open existing / Create
    // new) instead of silently merging into it. The "Create new" CTA fires
    // ark-ai-flush-picks-force which retries with force=true so we skip this
    // check on the second pass.
    if (!force) {
      const picksSig = picks
        .map(p => `${p.boatId || ""}:${p.schedule?.scheduleId || ""}`)
        .filter(s => s !== ":")
        .sort()
        .join("|");
      const matchedPlan = picksSig
        ? plans.find(plan => {
            const planSig = plan.trips
              .map(t => `${t.boatId || ""}:${t.schedule?.scheduleId || ""}`)
              .filter(s => s !== ":")
              .sort()
              .join("|");
            return planSig === picksSig;
          })
        : null;
      if (matchedPlan) {
        window.dispatchEvent(new CustomEvent("plan-toast", {
          detail: {
            message: planReusedExistingLabel(lang, matchedPlan.name),
            actionLabel: openPlanLabel(lang),
            actionEvent: "open-myplan",
            actionDetail: { planId: matchedPlan.id },
            actionLabel2: createNewLabel(lang),
            actionEvent2: "ark-ai-flush-picks-force",
          },
        }));
        return null;
      }
    }

    // Resolve routing decision BEFORE the build animation so the sheet
    // doesn't pop after the spinner is half-done. Sheet only opens when 2+
    // existing plans make the choice ambiguous. force=true skips the
    // sheet entirely — the user already chose "create new" via the toast.
    let routingChoice: { type: "existing"; planId: string } | { type: "new" };
    if (force || plans.length === 0) {
      routingChoice = { type: "new" };
    } else if (plans.length === 1) {
      routingChoice = { type: "existing", planId: plans[0].id };
    } else {
      const ranked = rankPlans(plans, picks);
      const userChoice = await new Promise<{ type: "existing"; planId: string } | { type: "new" } | null>(
        (resolve) => setRouteSheet({ picks, ranked, resolve }),
      );
      if (!userChoice) return null; // user dismissed the sheet
      routingChoice = userChoice;
    }

    const steps = buildSteps();
    for (let i = 0; i < steps.length; i++) {
      setBuildStep(i);
      await new Promise(r => setTimeout(r, i === steps.length - 1 ? 300 : 320));
    }

    let planId: string | null = null;
    let createdNewPlan = false;
    if (routingChoice.type === "new") {
      const plan = createPlan(suggestPlanName(picks[0]));
      planId = plan.id;
      createdNewPlan = true;
    } else {
      planId = routingChoice.planId;
      switchPlan(planId); // make user's choice the active plan for next time
    }

    if (planId) {
      for (const pick of picks) addTripToPlan(planId, pick);
    } else {
      for (const pick of picks) addTrip(pick);
      planId = (getPlans()[0] || null)?.id || null;
    }

    clearPendingPicks();
    setPendingPicks([]);
    setBuildStep(null);

    // Toast: only fire for 0/1-plan flows. For 2+ the sheet itself was the
    // confirmation surface — adding a toast on top is noise.
    plans = getPlans();
    const targetPlan = plans.find(p => p.id === planId) || null;
    if (plans.length <= 1 || createdNewPlan) {
      const message = createdNewPlan
        ? planCreatedToast(lang, targetPlan?.name || "")
        : planAddedTripsToast(lang, picks.length, targetPlan?.name || "");
      // Show "Switch plan" undo when the user has *another* plan they could
      // have routed to. Skips when there's only one plan (nothing to switch
      // to) and when we just created the very first plan.
      const otherPlansExist = plans.length > 1;
      const detail: Record<string, unknown> = { message };
      if (otherPlansExist && !createdNewPlan) {
        detail.actionLabel = switchPlanLabel(lang);
        detail.actionEvent = "ark-ai-undo-plan-route";
        detail.actionDetail = { picks, prevPlanId: planId };
      }
      window.dispatchEvent(new CustomEvent("plan-toast", { detail }));
    }
    return planId;
  }, [buildSteps, lang]);

  // Undo handler — called when the toast "เปลี่ยน plan" is tapped. Removes
  // the just-added picks from the destination plan and re-stages them so
  // the next build cycle can show the route sheet.
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { picks: PendingPick[]; prevPlanId: string } | undefined;
      if (!d?.picks?.length || !d.prevPlanId) return;
      // Remove each just-added trip by matching on (boatId, scheduleId).
      // We can't undo via index because the user may have raced edits.
      try {
        const KEY = "siamdive:plans";
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const plans: UserPlan[] = JSON.parse(raw);
          const plan = plans.find(p => p.id === d.prevPlanId);
          if (plan) {
            for (const pick of d.picks) {
              const idx = plan.trips.findIndex(t =>
                t.boatId === pick.boatId &&
                (t.schedule?.scheduleId || "") === (pick.schedule?.scheduleId || ""),
              );
              if (idx >= 0) plan.trips.splice(idx, 1);
            }
            localStorage.setItem(KEY, JSON.stringify(plans));
            window.dispatchEvent(new Event("myplan-change"));
          }
        }
      } catch {}
      // Re-stage picks + force the route sheet on the next build by setting
      // up a fake build immediately.
      const ranked = rankPlans(getPlans(), d.picks);
      setRouteSheet({
        picks: d.picks,
        ranked,
        resolve: (choice) => {
          setRouteSheet(null);
          if (!choice) return;
          // Inline-flush — same as flushPicksToPlan but without animation.
          let planId: string;
          if (choice.type === "new") {
            const np = createPlan(suggestPlanName(d.picks[0]));
            planId = np.id;
          } else {
            planId = choice.planId;
            switchPlan(planId);
          }
          for (const pick of d.picks) addTripToPlan(planId, pick);
          window.dispatchEvent(new CustomEvent("plan-toast", { detail: { message: planMovedToNewToast(lang) } }));
        },
      });
    };
    window.addEventListener("ark-ai-undo-plan-route", handler);
    return () => window.removeEventListener("ark-ai-undo-plan-route", handler);
  }, [lang]);

  // Actual build-plan API call, extracted so BuildTargetSheet.onSelect can
  // invoke it AFTER the user has picked a target plan or typed a custom
  // name. Declared before buildPlan because buildPlan calls into it.
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const doBuildPlanRef = useRef<(selection: { targetPlanId?: string; customName?: string } | null, force: boolean) => void>(() => {});

  const buildPlan = useCallback(async (force = false) => {
    const deviceId = readBrowserId("sd_vid");
    if (!deviceId) return;
    const sessionIdHdr = readBrowserId("sd_sid");

    // Fast path — user has staged trips via "+" (chat or boat-detail page).
    // Run the visible build animation, flush picks into the plan-store,
    // then open My Plan straight to the new plan.
    const stagedPicks = readPendingPicks();
    if (stagedPicks.length > 0) {
      // Pre-flight dedup. The fast path bypasses /api/ark-ai/build-plan,
      // so its slot-signature dedup and recently-deleted guard never fire.
      // Ask the server whether these picks would resurrect a just-deleted
      // plan; if so, surface the confirm toast and stop. The "Create new"
      // action retries flushPicksToPlan with force=true, which skips this
      // pre-flight.
      if (!force) {
        try {
          const checkRes = await fetch("/api/ark-ai/check-pending-picks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deviceId,
              picks: stagedPicks.map(p => ({
                boatId: p.boatId,
                scheduleId: p.schedule?.scheduleId ?? null,
              })),
            }),
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json() as { recentlyDeleted?: boolean; name?: string };
            if (checkData.recentlyDeleted && checkData.name) {
              window.dispatchEvent(new CustomEvent("plan-toast", {
                detail: {
                  message: planRecentlyDeletedLabel(lang, checkData.name),
                  actionLabel: createNewLabel(lang),
                  actionEvent: "ark-ai-flush-picks-force",
                },
              }));
              return;
            }
          }
        } catch (err) {
          // Network blip → fall through. We'd rather create the plan than
          // block on a transient network failure.
          console.error("[ark-ai] check-pending-picks failed:", err);
        }
      }

      const planId = await flushPicksToPlan(stagedPicks, force);
      // null return = toast/sheet was surfaced and we're waiting for the
      // user to choose. Don't close the chat or reopen MyPlan — the user
      // hasn't actually committed to anything yet.
      if (planId === null) return;
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("open-myplan", { detail: { planId } }));
      }, 80);
      return;
    }

    // Slow path — no staged picks, ask the server to auto-build from slots.
    // First defer to BuildTargetSheet so the user can pick where the new
    // trips land (append into an existing plan or create a new one with
    // a custom name). force=true means the user already chose 'Create new'
    // from a duplicate-detected toast — skip the sheet and rebuild with
    // legacy auto-naming behaviour.
    if (!force) {
      setBuildTargetOpen(true);
      return;
    }
    doBuildPlanRef.current(null, true);
  }, [lang, pathname, onClose, flushPicksToPlan]);

  const doBuildPlan = useCallback((selection: { targetPlanId?: string; customName?: string } | null, force: boolean) => {
    const deviceId = readBrowserId("sd_vid");
    if (!deviceId) return;
    const sessionIdHdr = readBrowserId("sd_sid");

    // Open MyPlan in "building" mode so the user sees the new skeleton
    // immediately. force-retries skip the close/animate because MyPlan is
    // already in the right state.
    if (!force) {
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("open-myplan", { detail: { building: true } }));
      }, 80);
    } else {
      window.dispatchEvent(new CustomEvent("open-myplan", { detail: { building: true } }));
    }

    // When the user came through BuildTargetSheet — picked an existing plan
    // OR typed a custom name — they explicitly opted in to that outcome.
    // The legacy 400-fallback that offers to reuse an existing plan would
    // contradict that choice, so suppress it.
    const userOptedIn = !!(selection?.targetPlanId || selection?.customName);

    fetch("/api/ark-ai/build-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId, sessionId: sessionIdHdr, lang, path: pathname, force,
        ...(selection?.targetPlanId ? { targetPlanId: selection.targetPlanId } : {}),
        ...(selection?.customName   ? { customName:   selection.customName   } : {}),
      }),
    })
      .then(async res => {
        if (res.status === 400) {
          const errBody = await res.json().catch(() => null) as { error?: string; reasons?: string[] } | null;
          // If the user already has at least one plan, the typical "Build
          // round 2" intent isn't to start over from incomplete slots — it's
          // to revisit what they made. Offer the existing plan as a 1-button
          // toast instead of the generic "ยังสร้าง plan ไม่ได้" overlay.
          // (Skipping a "Create new" CTA here on purpose: with incomplete
          // slots even force=true would 400 again on the server, so the
          // button wouldn't actually do anything useful.)
          // Skip this fallback when the user came in through BuildTargetSheet
          // — they already told us what they want.
          const userPlansForFallback = (!force && !userOptedIn) ? getPlans() : [];
          if (userPlansForFallback.length > 0) {
            const mostRecent = [...userPlansForFallback].sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            )[0];
            window.dispatchEvent(new CustomEvent("myplan-build-done", { detail: {} }));
            window.dispatchEvent(new CustomEvent("plan-toast", {
              detail: {
                message: planReusedExistingLabel(lang, mostRecent.name),
                actionLabel: openPlanLabel(lang),
                actionEvent: "open-myplan",
                actionDetail: { planId: mostRecent.id },
                actionLabel2: createNewLabel(lang),
                actionEvent2: "ark-ai-clone-plan-and-build",
                actionDetail2: { planId: mostRecent.id },
              },
            }));
            return;
          }
          const reasons = errBody?.error === "no_matching_trips" && errBody.reasons?.length
            ? errBody.reasons
            : [t(lang, "needMoreInfo")];
          window.dispatchEvent(new CustomEvent("myplan-build-error", { detail: { reasons } }));
          return;
        }
        if (!res.ok) throw new Error(`build-plan ${res.status}`);
        const data = await res.json() as { plan?: UserPlan; redirect?: string; reused?: boolean; recentlyDeleted?: boolean; name?: string };

        // Recently-deleted prompt — user just removed an identical plan.
        // Drop the build-progress overlay and surface a confirm toast that
        // retries with `force: true` if the user clicks "Create new".
        if (data.recentlyDeleted && data.name) {
          window.dispatchEvent(new CustomEvent("myplan-build-done", { detail: {} }));
          window.dispatchEvent(new CustomEvent("plan-toast", {
            detail: {
              message: planRecentlyDeletedLabel(lang, data.name),
              actionLabel: createNewLabel(lang),
              actionEvent: "ark-ai-build-plan-force",
            },
          }));
          return;
        }

        if (data.plan?.id) {
          // If the user explicitly opted in (typed a custom name or picked
          // a target plan), never surface the "duplicate detected" choice.
          // Treat the response as a normal success even if the backend
          // somehow returned reused — they already made their decision.
          if (data.reused && data.plan.name && !userOptedIn) {
            // Duplicate detected — present an explicit choice instead of
            // silently routing to the existing plan. User asked for this
            // UX (2026-05-09): "should be a notification — view existing
            // OR create new". The "Create new" event re-runs buildPlan
            // with force: true which bypasses the slot dedup and stores
            // the new plan with planSignature: null.
            upsertServerPlan(data.plan);
            window.dispatchEvent(new CustomEvent("myplan-build-done", { detail: {} }));
            window.dispatchEvent(new CustomEvent("plan-toast", {
              detail: {
                message: planReusedExistingLabel(lang, data.plan.name),
                actionLabel: openPlanLabel(lang),
                actionEvent: "open-myplan",
                actionDetail: { planId: data.plan.id },
                actionLabel2: createNewLabel(lang),
                actionEvent2: "ark-ai-build-plan-force",
              },
            }));
          } else {
            upsertServerPlan(data.plan);
            window.dispatchEvent(new CustomEvent("myplan-build-done", { detail: { planId: data.plan.id } }));
          }
        } else if (data.redirect) {
          window.location.href = data.redirect;
        } else {
          window.dispatchEvent(new CustomEvent("myplan-build-error", { detail: { reasons: [t(lang, "emptyResponse")] } }));
        }
      })
      .catch(err => {
        console.error("[ark-ai] build-plan failed:", err);
        const reason = t(lang, "buildPlanFailedLong");
        window.dispatchEvent(new CustomEvent("myplan-build-error", { detail: { reasons: [reason] } }));
      });
  }, [lang, pathname, onClose, flushPicksToPlan]);

  // Force-retry handlers — both fired by the recently-deleted confirmation
  // toast. Slow path (slot dedup) and fast path (trip dedup) share UX but
  // need separate events because they take different code paths.
  //
  // ark-ai-clone-plan-and-build is the slow-path-400 fallback's "Create new"
  // CTA. Slots are incomplete so the server can't build from scratch — copy
  // the existing plan's trips into pendingPicks and route through the fast
  // path with force=true so a fresh plan is created with the same trip set.
  useEffect(() => {
    const slowHandler = () => { buildPlan(true); };
    const fastHandler = () => { buildPlan(true); };
    const cloneHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ planId?: string }>).detail;
      if (!detail?.planId) return;
      const plan = getPlans().find(p => p.id === detail.planId);
      if (!plan) return;
      for (const trip of plan.trips) {
        const { addedAt: _addedAt, ...pick } = trip;
        addPendingPick(pick);
      }
      buildPlan(true);
    };
    window.addEventListener("ark-ai-build-plan-force", slowHandler);
    window.addEventListener("ark-ai-flush-picks-force", fastHandler);
    window.addEventListener("ark-ai-clone-plan-and-build", cloneHandler);
    return () => {
      window.removeEventListener("ark-ai-build-plan-force", slowHandler);
      window.removeEventListener("ark-ai-flush-picks-force", fastHandler);
      window.removeEventListener("ark-ai-clone-plan-and-build", cloneHandler);
    };
  }, [buildPlan]);

  sendRef.current = sendMessage;
  doBuildPlanRef.current = doBuildPlan;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Desktop + Android: Enter alone sends, Shift+Enter inserts a newline.
    // iOS Safari sometimes reports `key` as Enter but with keyCode==229 while
    // a Thai/CJK IME is composing — in that case Enter is the IME commit
    // key, not a send signal. Bail out when composing.
    const isEnter = e.key === "Enter" || e.keyCode === 13;
    if (!isEnter || e.shiftKey) return;
    const composing = (e.nativeEvent as KeyboardEvent).isComposing || e.keyCode === 229;
    if (composing) return;
    e.preventDefault();
    if (input.trim()) sendMessage(input);
  };

  // Some mobile keyboards (iOS soft "return") sneak past keydown and
  // commit a newline directly into the textarea via input event. Catch
  // that as a fallback: if the user inserted a trailing \n and the
  // resulting text isn't multi-line, treat it as Enter-to-send.
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const trimmed = value.replace(/\n+$/, "");
    const endedWithNewline = value !== trimmed;
    const isMultiline = trimmed.includes("\n");
    if (endedWithNewline && !isMultiline && trimmed.trim()) {
      sendMessage(trimmed);
      setInput("");
      return;
    }
    setInput(value);
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes arkFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        .ark-trip-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Fullscreen panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, "aiAdvisor")}
        style={{
        position: "fixed", left: 0, right: 0, top: 0,
        bottom: keyboardInset, zIndex: 1300,
        background: "#0a0a0a", color: "#e5e5e5",
        display: "flex", flexDirection: "column",
        animation: "arkFadeIn 0.2s ease both",
        overflow: "hidden",
        touchAction: "none",
      }}>
        {/* Header */}
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <button onClick={requestClose}
            aria-label={t(lang, "closeChat")}
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, marginRight: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #1e40af, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
            <img src="/ai-mask.png" alt="AI" width={18} height={18} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#f5f5f5" }}>SIAM AI</p>
          </div>
          <button onClick={() => {
              setMessages([]);
              setFeedbackState({});
              setStreaming(false);
              setSlots({});
              setSlotsComplete(false);
              try { sessionStorage.removeItem("ark-ai-messages"); } catch {}
              const deviceId = readBrowserId("sd_vid");
              if (deviceId) {
                fetch(`/api/ark-ai/session?deviceId=${encodeURIComponent(deviceId)}`, { method: "DELETE" }).catch(() => {});
              }
            }}
            aria-label={t(lang, "clearChat")}
            title={t(lang, "clearChat")}
            style={{ background: "none", border: "1px solid #262626", color: "#888", width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>

        {/* SlotTrackerChips intentionally NOT rendered here. Per user feedback
            (2026-05-04 evening), slot info should be invisible during the
            chat — the AI drives the conversation via $$TRIP$$ recommendations
            and $$ASK$$ clickable follow-ups. The chip summary will live in
            the Phase 3 plan/build view, not in the chat scroll. */}

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions text"
          aria-label={t(lang, "conversationHistory")}
          style={{ flex: 1, overflowY: "auto", padding: "12px 16px", overscrollBehavior: "contain", touchAction: "pan-y", WebkitOverflowScrolling: "touch", position: "relative" }}>
          {messages.length === 0 && (
            <div style={{ padding: "8px 0" }}>
              <ChatMessage role="assistant" content={buildWelcome(lang, pathname)} msgIndex={-1} />
              {Object.keys(slots).length === 0 && (
                <TemplatePicker lang={lang} onPick={(t) => {
                  // Sprint 3 B10 — pre-fill slots on the server BEFORE
                  // sending the primer, so the very first chat turn sees
                  // them in effectiveSlots → category-aware RAG narrowing.
                  const deviceId = readBrowserId("sd_vid");
                  if (deviceId) {
                    fetch("/api/ark-ai/session", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ deviceId, set: t.slots }),
                    })
                      .then(r => r.ok ? r.json() : null)
                      .then(data => {
                        if (data?.session) {
                          setSlots(data.session.slots || {});
                          setSlotsComplete(!!data.session.complete);
                        }
                      })
                      .catch(() => {});
                  }
                  // Track the click for cohort analysis (already in enum).
                  track("ARK_AI_TEMPLATE_SELECTED", { properties: { templateId: t.id } });
                  sendMessage(templatePrimer(t, lang));
                }} />
              )}
              <SuggestionChips lang={lang} onSelect={sendMessage} pathname={pathname} />
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              msgIndex={i}
              isStreaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
              onFeedback={msg.role === "assistant" && !streaming ? handleFeedback : undefined}
              feedbackGiven={feedbackState[i]}
              lang={lang}
              onAskClick={msg.role === "assistant" && i === messages.length - 1 ? sendMessage : undefined}
              onBuildPlan={msg.role === "assistant" ? buildPlan : undefined}
              onCompare={msg.role === "assistant" ? () => setCompareOpen(true) : undefined}
              pendingPicksCount={pendingPicks.length}
              slotDate={slots.dates?.from}
              onScheduleAdded={(info) => {
                // After user picks a schedule from a trip card, ping the AI
                // with a plan-completion framing so it analyzes what info is
                // still needed (cert, hotel, transfer, equipment, kids, etc.)
                // — NOT generic packing tips. Phrasing matters: ask "what's
                // missing for the plan?" not "what should I prepare?".
                const dt = new Date(info.scheduleDate).toLocaleDateString(bcp47Locale(lang), { day: "numeric", month: "short", year: "numeric" });
                // Include the boat type so the AI sees the category and skips
                // the "what kind of trip?" $$ASK$$ — picking from a daytrip
                // card already implies daytrip. Also write the inferred
                // category to the slot session in parallel so the server-side
                // RAG can pre-filter even if the LLM forgets to extract.
                sendMessage(addedToMyPlanMessage(lang, info.boatTitle, dt, info.type));
                const cat = TYPE_TO_CATEGORY[info.type];
                if (cat && !slots.categories?.includes(cat)) {
                  const nextCategories = [...(slots.categories || []), cat];
                  setSlots(prev => ({ ...prev, categories: nextCategories }));
                  const deviceId = readBrowserId("sd_vid");
                  if (deviceId) {
                    fetch("/api/ark-ai/session", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ deviceId, set: { categories: nextCategories } }),
                    }).catch(() => {});
                  }
                }
              }}
            />
          ))}
          {lastError && !streaming && (
            <div style={{ padding: "8px 0 16px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={retry}
                style={{
                  background: "#1e40af", border: "none", color: "#fff",
                  padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                </svg>
                {t(lang, "retry")}
              </button>
              <a
                href="https://lin.ee/siamdive"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "transparent", border: "1px solid #262626", color: "#9ca3af",
                  padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {t(lang, "contactTeam")}
              </a>
            </div>
          )}
        </div>

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            style={{
              position: "absolute",
              bottom: 80,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid #262626",
              background: "rgba(13,17,23,0.9)",
              backdropFilter: "blur(8px)",
              color: "#60a5fa",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              transition: "opacity 0.2s",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        )}

        {/* Sprint 4 fix3 — staged-picks strip removed per user feedback. The
            chat is intentionally minimal above the text input. The Build CTA
            now lives inside the AI's $$BUILD$$ marker (rendered by ChatMessage
            when slots are sufficient), and the Compare button surfaces inside
            the same card when pendingPicks ≥ 2. Discoverability lives in the
            AI's spoken summary, not in persistent chrome. */}

        {/* Input */}
        <div style={{ padding: "10px 16px", paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid #1a1a1a", flexShrink: 0, touchAction: "manipulation" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={t(lang, "askAboutDiving")}
              rows={1}
              style={{
                flex: 1, resize: "none", background: "#161616", border: "1px solid #262626",
                borderRadius: 12, color: "#f5f5f5", fontSize: 16, padding: "10px 14px",
                outline: "none", lineHeight: 1.4, maxHeight: 100,
                fontFamily: "inherit",
              }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 100) + "px";
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              aria-label={t(lang, "sendMessage")}
              style={{
                width: 40, height: 40, borderRadius: 10, border: "none",
                background: input.trim() && !streaming ? "#1e40af" : "#1a1a1a",
                color: "#fff", cursor: input.trim() && !streaming ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Build animation overlay — covers the panel while flushPicksToPlan
            walks the steps. Visible feedback that the AI is shaping the plan
            (matters even when the local fast-path is essentially instant). */}
        {buildStep !== null && (() => {
          const steps = buildSteps();
          return (
            <div style={{
              position: "absolute", inset: 0, zIndex: 20,
              background: "rgba(10,10,10,0.96)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "32px 24px",
              animation: "arkFadeIn 0.2s ease both",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20, boxShadow: "0 8px 28px rgba(59,130,246,0.4)",
              }}>
                <img src="/ai-mask.png" alt="" width={32} height={32} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#f5f5f5", margin: "0 0 18px" }}>
                {t(lang, "buildingYourPlan")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 240 }}>
                {steps.map((s, i) => {
                  const done = i < buildStep;
                  const active = i === buildStep;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      fontSize: 14, fontWeight: 600,
                      color: done ? "#4ade80" : active ? "#f5f5f5" : "rgba(255,255,255,0.3)",
                      opacity: done || active ? 1 : 0.4,
                      transition: "all 0.25s ease",
                    }}>
                      <span style={{ width: 18, textAlign: "center" }}>
                        {done ? "✓" : active ? "•" : "·"}
                      </span>
                      <span>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
      {compareOpen && (
        <CompareSheet
          picks={pendingPicks}
          lang={lang}
          onClose={() => setCompareOpen(false)}
        />
      )}
      {buildTargetOpen && (
        <BuildTargetSheet
          lang={lang}
          onSelect={(s) => {
            setBuildTargetOpen(false);
            doBuildPlanRef.current(s, false);
          }}
          onClose={() => setBuildTargetOpen(false)}
        />
      )}
      {routeSheet && (
        <PlanRouteSheet
          picks={routeSheet.picks}
          ranked={routeSheet.ranked}
          lang={lang}
          onChoose={(choice) => {
            const r = routeSheet.resolve;
            setRouteSheet(null);
            r(choice);
          }}
          onClose={() => {
            const r = routeSheet.resolve;
            setRouteSheet(null);
            r(null);
          }}
        />
      )}
      {sessionFeedbackPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t(lang, "chatFeedbackLabel")}
          style={{
            position: "fixed", inset: 0, zIndex: 1400,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{
            background: "#0f0f0f", color: "#e5e5e5",
            border: "1px solid #262626", borderRadius: 12,
            padding: 20, maxWidth: 360, width: "100%",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#f5f5f5" }}>
              {t(lang, "beforeYouGo")}
            </p>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 14px" }}>
              {t(lang, "takesTwoSeconds")}
            </p>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button
                onClick={() => submitSessionFeedback(true, sessionFeedbackReason.trim() || undefined)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8,
                  background: "#1e40af", color: "#fff", border: "none",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 10v12"/><path d="M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2a3.13 3.13 0 013 3.88z"/>
                </svg>
                {t(lang, "helpfulShort")}
              </button>
              <button
                onClick={() => submitSessionFeedback(false, sessionFeedbackReason.trim() || undefined)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8,
                  background: "#262626", color: "#e5e5e5",
                  border: "1px solid #333",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 14V2"/><path d="M9 18.12L10 14H4.17a2 2 0 01-1.92-2.56l2.33-8A2 2 0 016.5 2H20a2 2 0 012 2v8a2 2 0 01-2 2h-2.76a2 2 0 00-1.79 1.11L12 22a3.13 3.13 0 01-3-3.88z"/>
                </svg>
                {t(lang, "notGreatShort")}
              </button>
            </div>
            <textarea
              value={sessionFeedbackReason}
              onChange={(e) => setSessionFeedbackReason(e.target.value)}
              placeholder={t(lang, "wantToTellWhy")}
              rows={2}
              style={{
                width: "100%", padding: "8px 10px", fontSize: 13, lineHeight: 1.4,
                background: "rgba(255,255,255,0.04)", color: "#e5e5e5",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
                resize: "none", outline: "none", fontFamily: "inherit",
                marginBottom: 10,
              }}
            />
            <button
              onClick={skipSessionFeedback}
              style={{
                width: "100%", padding: "8px", borderRadius: 6,
                background: "transparent", color: "#888",
                border: "none", fontSize: 13, cursor: "pointer",
              }}
            >
              {t(lang, "skipForNow")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
