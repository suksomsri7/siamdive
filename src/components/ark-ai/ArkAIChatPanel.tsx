"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, usePathname } from "next/navigation";
import ChatMessage from "./ChatMessage";
import SuggestionChips from "./SuggestionChips";
import SlotTrackerChips from "./SlotTrackerChips";
import { readRecentBoats } from "@/lib/recentlyViewed";
import { monthName, seasonInfo, seasonLabel } from "@/lib/dive-season";
import { setTripSelectedPackage, getPlans, getActivePlan, upsertServerPlan, type UserPlan } from "@/lib/plan-store";
import {
  trackChatOpen,
  trackChatMessage,
  trackChatFeedback,
} from "@/lib/analytics/client";
import type { Slots, SlotField } from "@/lib/ark-ai/slots";

type Msg = { role: "user" | "assistant"; content: string };

// Read browser-managed identifiers written by the analytics SDK
// (src/lib/analytics/client.ts). We don't import the getter because the SDK
// stores them as module-level vars without an exported accessor; localStorage
// is the same source of truth.
function readBrowserId(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

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

function buildSeasonLine(lang: string): string {
  const mn = monthName(lang);
  const s = seasonInfo();
  const label = seasonLabel(lang);

  if (lang === "th") {
    let line = `\n\n🌊 **เดือน${mn}** — ${label}`;
    if (s.whaleShark) line += " ช่วงนี้มีโอกาสเจอฉลามวาฬ!";
    else if (s.coast === "andaman") line += " สิมิลัน-สุรินทร์ เปิดอยู่!";
    else if (s.coast === "gulf") line += " เกาะเต่า-Sail Rock สภาพดี!";
    return line;
  }

  let line = `\n\n🌊 **${mn}** — ${label}`;
  if (s.whaleShark) line += " — whale shark season!";
  else if (s.coast === "andaman") line += " — Similan & Surin are open!";
  else if (s.coast === "gulf") line += " — Koh Tao & Sail Rock at their best!";
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
  // boatTitle → packageName the user has clicked. Drives the "✓ Selected" badge
  // on PackageTable and survives across renders. Persists in sessionStorage so
  // re-opening the chat the same session keeps the visual selection.
  const [selectedPackages, setSelectedPackages] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = sessionStorage.getItem("ark-ai-selected-packages");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
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
  // The trip the user most recently added via TripSchedulePicker. The AI's
  // next $$PACKAGES$$ block targets THIS trip — when the user clicks a row,
  // we use these IDs to call setTripSelectedPackage. Falls back to a
  // boatTitle scan over plans if the marker is from an older message.
  const lastAddedTripRef = useRef<{ boatId: string; scheduleId: string; boatTitle: string } | null>(null);

  useEffect(() => {
    if (open && !trackedOpenRef.current) {
      trackChatOpen();
      trackedOpenRef.current = true;
    }
  }, [open]);

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
    try { sessionStorage.setItem("ark-ai-selected-packages", JSON.stringify(selectedPackages)); } catch {}
  }, [selectedPackages]);

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
      if (e.key === "Escape") onClose();
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

  const handleFeedback = useCallback((msgIndex: number, positive: boolean) => {
    setFeedbackState(prev => ({ ...prev, [msgIndex]: positive }));
    trackChatFeedback(positive, msgIndex);
  }, []);

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

  const handlePackageSelect = useCallback((boatTitle: string, packageName: string) => {
    let boatId: string | undefined;
    let scheduleId: string | undefined;
    if (lastAddedTripRef.current?.boatTitle === boatTitle) {
      boatId = lastAddedTripRef.current.boatId;
      scheduleId = lastAddedTripRef.current.scheduleId;
    } else {
      // Older message — scan plans for any trip with this boatTitle that has a schedule.
      const plans = getPlans();
      for (const plan of plans) {
        const trip = plan.trips.find(t => t.title === boatTitle && t.schedule?.scheduleId);
        if (trip) { boatId = trip.boatId; scheduleId = trip.schedule?.scheduleId; break; }
      }
    }

    // Always reflect the choice in the UI + ping the AI, even when the
    // user hasn't added a schedule for this boat yet. The previous
    // `if (!boatId) return` made the click silently fail when the AI
    // surfaced $$PACKAGES$$ before the user had picked a schedule.
    setSelectedPackages(prev => ({ ...prev, [boatTitle]: packageName }));

    let priceText = "";
    if (boatId) {
      const result = setTripSelectedPackage(boatId, scheduleId, packageName);
      if (result && result.minPrice > 0) {
        priceText = lang === "th"
          ? ` (เริ่ม ${result.minPrice.toLocaleString()} บาท/คน)`
          : ` (from ${result.minPrice.toLocaleString()} THB/person)`;
      }
    }

    const text = lang === "th"
      ? `เลือก package: ${packageName}${priceText} — ใน plan ยังขาดข้อมูลอะไรอีกครับ?`
      : `Selected package: ${packageName}${priceText} — what else is missing in the plan?`;
    // Route through sendRef.current so we always invoke the LATEST
    // sendMessage closure. Calling the captured sendMessage from this
    // memoized callback used a stale `messages` array and wiped prior
    // chat history on every package click.
    sendRef.current?.(text);
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildPlan = useCallback(() => {
    const deviceId = readBrowserId("sd_vid");
    if (!deviceId) return;
    const sessionIdHdr = readBrowserId("sd_sid");

    // Fast path — user already curated trips through the chat picker.
    // Their plan IS in localStorage with the exact schedule + package
    // they picked. Skip the server auto-build entirely (which would race
    // the debounced sync, ignore their selection, and replace it with
    // top-N picks). Open the plan detail straight away.
    const curated = getActivePlan() || getPlans().find(p => p.trips.length > 0);
    if (curated && curated.trips.length > 0) {
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("open-myplan", { detail: { planId: curated.id } }));
      }, 80);
      return;
    }

    // Slow path — no manual picks yet, ask the server to auto-build.
    // Open MyPlan in "building" mode so the user sees progress while we
    // wait for /api/ark-ai/build-plan to resolve.
    onClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-myplan", { detail: { building: true } }));
    }, 80);

    fetch("/api/ark-ai/build-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, sessionId: sessionIdHdr, lang, path: pathname }),
    })
      .then(async res => {
        if (res.status === 400) {
          const errBody = await res.json().catch(() => null) as { error?: string; reasons?: string[] } | null;
          const reasons = errBody?.error === "no_matching_trips" && errBody.reasons?.length
            ? errBody.reasons
            : [lang === "th"
                ? "ขอข้อมูลเพิ่มอีกนิดก่อนสร้าง plan — วันที่ จำนวนคน และฝั่ง (อันดามัน/อ่าวไทย)"
                : "Need more info — please share dates, headcount, and coast (Andaman/Gulf)."];
          window.dispatchEvent(new CustomEvent("myplan-build-error", { detail: { reasons } }));
          return;
        }
        if (!res.ok) throw new Error(`build-plan ${res.status}`);
        const data = await res.json() as { plan?: UserPlan; redirect?: string };
        if (data.plan?.id) {
          upsertServerPlan(data.plan);
          window.dispatchEvent(new CustomEvent("myplan-build-done", { detail: { planId: data.plan.id } }));
        } else if (data.redirect) {
          window.location.href = data.redirect;
        } else {
          window.dispatchEvent(new CustomEvent("myplan-build-error", { detail: { reasons: [lang === "th" ? "ระบบไม่ตอบสนอง ลองอีกครั้ง" : "Empty response, please retry"] } }));
        }
      })
      .catch(err => {
        console.error("[ark-ai] build-plan failed:", err);
        const reason = lang === "th"
          ? "สร้าง plan ไม่สำเร็จ ลองอีกครั้งหรือทักเราผ่าน LINE ครับ"
          : "Couldn't build the plan. Please try again or contact us via LINE.";
        window.dispatchEvent(new CustomEvent("myplan-build-error", { detail: { reasons: [reason] } }));
      });
  }, [lang, pathname, onClose]);

  sendRef.current = sendMessage;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
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
        aria-label={lang === "th" ? "ผู้ช่วย AI วางแผนทริปดำน้ำ" : "AI dive trip advisor"}
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
          <button onClick={onClose}
            aria-label={lang === "th" ? "ปิดแชท" : "Close chat"}
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
              setSelectedPackages({});
              lastAddedTripRef.current = null;
              try { sessionStorage.removeItem("ark-ai-messages"); } catch {}
              try { sessionStorage.removeItem("ark-ai-selected-packages"); } catch {}
              const deviceId = readBrowserId("sd_vid");
              if (deviceId) {
                fetch(`/api/ark-ai/session?deviceId=${encodeURIComponent(deviceId)}`, { method: "DELETE" }).catch(() => {});
              }
            }}
            aria-label={lang === "th" ? "ล้างแชท" : "Clear chat"}
            title={lang === "th" ? "ล้างแชท" : "Clear chat"}
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
          aria-label={lang === "th" ? "ประวัติการสนทนา" : "Conversation history"}
          style={{ flex: 1, overflowY: "auto", padding: "12px 16px", overscrollBehavior: "contain", touchAction: "pan-y", WebkitOverflowScrolling: "touch", position: "relative" }}>
          {messages.length === 0 && (
            <div style={{ padding: "8px 0" }}>
              <ChatMessage role="assistant" content={buildWelcome(lang, pathname)} msgIndex={-1} />
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
              onPackageSelect={msg.role === "assistant" ? handlePackageSelect : undefined}
              selectedPackages={selectedPackages}
              slotDate={slots.dates?.from}
              onScheduleAdded={(info) => {
                // After user picks a schedule from a trip card, ping the AI
                // with a plan-completion framing so it analyzes what info is
                // still needed (cert, hotel, transfer, equipment, kids, etc.)
                // — NOT generic packing tips. Phrasing matters: ask "what's
                // missing for the plan?" not "what should I prepare?".
                lastAddedTripRef.current = { boatId: info.boatId, scheduleId: info.scheduleId, boatTitle: info.boatTitle };
                const dt = new Date(info.scheduleDate).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
                const text = lang === "th"
                  ? `เพิ่ม ${info.boatTitle} (${dt}) เข้า MyPlan แล้ว — แนะนำ package/cabin ที่เหมาะสมให้หน่อยครับ แล้วบอกว่าใน plan ยังขาดข้อมูลอะไรอีก`
                  : `Added ${info.boatTitle} (${dt}) to MyPlan — recommend the right package/cabin and tell me what else is missing in the plan.`;
                sendMessage(text);
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
                {lang === "th" ? "ลองใหม่" : "Try again"}
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
                {lang === "th" ? "ติดต่อทีมงาน" : "Contact us"}
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

        {/* Input */}
        <div style={{ padding: "10px 16px", paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid #1a1a1a", flexShrink: 0, touchAction: "manipulation" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lang === "th" ? "ถามเกี่ยวกับทริปดำน้ำ..." : "Ask about diving trips..."}
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
              aria-label={lang === "th" ? "ส่งข้อความ" : "Send message"}
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
      </div>
    </>
  );
}
