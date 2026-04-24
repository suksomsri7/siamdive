"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, usePathname } from "next/navigation";
import ChatMessage from "./ChatMessage";
import type { ItineraryData } from "./ItineraryCard";
import SuggestionChips from "./SuggestionChips";
import { readRecentBoats } from "@/lib/recentlyViewed";
import {
  trackChatOpen,
  trackChatMessage,
  trackChatFeedback,
} from "@/lib/analytics/client";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME_BASE: Record<string, string> = {
  th: "สวัสดีครับ! ผมเป็นผู้ช่วยวางแผนทริปดำน้ำในประเทศไทย\n\nผมสามารถ:\n- **สร้างแผนทริป** day-by-day พร้อมงบประมาณ (Save & Share ได้!)\n- **แนะนำทริป** เรือดำน้ำ และ Liveaboard\n- **เปรียบเทียบเรือ** ให้เลือกง่ายขึ้น\n\nลองกดปุ่ม **สร้างแผนทริป** ด้านล่าง หรือพิมพ์ถามได้เลยครับ",
  en: "Hi! I'm your AI dive trip planner for Thailand.\n\nI can:\n- **Create trip plans** day-by-day with budget (Save & Share!)\n- **Recommend trips** — boats, liveaboards, and dive sites\n- **Compare boats** side by side\n\nTap **Create trip plan** below, or just ask me anything!",
  cn: "你好！我是你的泰国潜水旅行AI规划师。\n\n我可以：\n- **制作行程计划** — 按天安排，含预算（可保存和分享！）\n- **推荐潜水行程** — 船只、船宿、潜点\n- **对比船只**\n\n点击下方 **制作行程** 按钮，或直接问我！",
  ja: "こんにちは！タイのダイビングAIプランナーです。\n\nできること：\n- **旅行プラン作成** — 日別スケジュール＆予算（保存＆共有可能！）\n- **トリップ提案** — ボート、リブアボード、ダイビングスポット\n- **ボート比較**\n\n下の **プラン作成** ボタンをタップ、または何でも聞いてください！",
  ko: "안녕하세요! 태국 다이빙 AI 플래너입니다.\n\n할 수 있는 것:\n- **여행 계획 작성** — 일별 일정 & 예산 (저장 & 공유 가능!)\n- **트립 추천** — 보트, 리브어보드, 다이빙 사이트\n- **보트 비교**\n\n아래 **계획 만들기** 버튼을 탭하거나 질문하세요!",
  de: "Hallo! Ich bin dein KI-Tauchreiseplaner für Thailand.\n\nIch kann:\n- **Reisepläne erstellen** — Tag für Tag mit Budget (Speichern & Teilen!)\n- **Trips empfehlen** — Boote, Liveaboards, Tauchplätze\n- **Boote vergleichen**\n\nTippe unten auf **Plan erstellen** oder frag mich einfach!",
  fr: "Bonjour ! Je suis votre planificateur IA pour la Thaïlande.\n\nJe peux :\n- **Créer des itinéraires** jour par jour avec budget (Sauvegarde & Partage !)\n- **Recommander des trips** — bateaux, croisières, sites de plongée\n- **Comparer les bateaux**\n\nAppuyez sur **Créer un plan** ci-dessous ou posez-moi une question !",
  ru: "Привет! Я ваш AI-планировщик для дайвинга в Таиланде.\n\nЯ могу:\n- **Создать план поездки** по дням с бюджетом (Сохранить и Поделиться!)\n- **Рекомендовать трипы** — лодки, ливаборды, дайв-сайты\n- **Сравнить лодки**\n\nНажмите **Создать план** ниже или просто спросите!",
};

const WELCOME_ON_TRIP: Record<string, string> = {
  th: "สวัสดีครับ! เห็นว่ากำลังดูทริปนี้อยู่ 👀\n\nผมช่วยได้เลย:\n- **ถามรายละเอียดทริปนี้** — ดำกี่ไดฟ์ เหมาะกับ cert ไหน\n- **หาวันว่าง** หรือเช็คตารางเรือ\n- **เปรียบเทียบกับเรืออื่น** ในพื้นที่เดียวกัน\n- **วางแผนทริปทั้งหมด** รวมที่พัก การเดินทาง กิจกรรมบนบก\n\nถามได้เลยครับ!",
  en: "Hi! I see you're checking out this trip 👀\n\nI can help you:\n- **Ask about this trip** — how many dives, what cert you need\n- **Check available dates** and schedules\n- **Compare with other boats** in the same area\n- **Plan the full trip** including accommodation, transport & land activities\n\nJust ask!",
  cn: "你好！看到你正在查看这个行程 👀\n\n我可以帮你：\n- **了解行程详情** — 几次潜水、需要什么证书\n- **查看可用日期** 和船期\n- **与同区域其他船只对比**\n- **规划完整行程** 包括住宿、交通和陆上活动\n\n直接问我！",
  ja: "こんにちは！このトリップをご覧になっていますね 👀\n\nお手伝いできます：\n- **このトリップの詳細** — ダイブ回数、必要な資格\n- **空き日程の確認**\n- **同エリアの他のボートと比較**\n- **旅行全体のプラン作成** — 宿泊、交通、陸上アクティビティ込み\n\nお気軽にどうぞ！",
  ko: "안녕하세요! 이 트립을 보고 계시군요 👀\n\n도움을 드릴 수 있어요:\n- **트립 상세 정보** — 다이빙 횟수, 필요한 자격증\n- **가능한 날짜 확인**\n- **같은 지역 다른 보트와 비교**\n- **전체 여행 계획** — 숙박, 교통, 육상 활동 포함\n\n질문하세요!",
  de: "Hallo! Ich sehe, du schaust dir diesen Trip an 👀\n\nIch kann dir helfen:\n- **Details zu diesem Trip** — Anzahl Tauchgänge, benötigtes Zertifikat\n- **Verfügbare Termine prüfen**\n- **Mit anderen Booten vergleichen**\n- **Die gesamte Reise planen** — Unterkunft, Transport & Aktivitäten\n\nFrag einfach!",
  fr: "Bonjour ! Je vois que vous regardez ce trip 👀\n\nJe peux vous aider :\n- **Détails sur ce trip** — nombre de plongées, certificat requis\n- **Vérifier les dates disponibles**\n- **Comparer avec d'autres bateaux**\n- **Planifier le voyage complet** — hébergement, transport & activités\n\nDemandez-moi !",
  ru: "Привет! Вижу, вы смотрите этот трип 👀\n\nМогу помочь:\n- **Подробности о трипе** — сколько погружений, какой сертификат нужен\n- **Проверить доступные даты**\n- **Сравнить с другими лодками**\n- **Спланировать всю поездку** — проживание, транспорт и активности\n\nСпрашивайте!",
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
  th: "ยินดีต้อนรับกลับมาครับ! 🤿\n\nเห็นว่าเพิ่งดูมาหลายทริป ต้องการให้ช่วย:\n- **เปรียบเทียบทริปที่ดูมา** ให้เห็นข้อดี-ข้อเสีย\n- **สร้างแผนทริป** จากทริปที่สนใจ พร้อมงบ\n- **หาทริปเพิ่มเติม** ในพื้นที่หรืองบที่ชอบ\n\nบอกได้เลยครับ!",
  en: "Welcome back! 🤿\n\nI see you've been browsing several trips. Want me to:\n- **Compare the trips you viewed** — pros and cons\n- **Create a trip plan** from your favorites with budget\n- **Find more trips** in the areas or budget you like\n\nJust let me know!",
  cn: "欢迎回来！🤿\n\n看到你浏览了多个行程，需要我：\n- **对比你看过的行程** — 优缺点分析\n- **根据你的收藏制作行程计划** 含预算\n- **查找更多行程**\n\n告诉我！",
  ja: "おかえりなさい！🤿\n\nいくつかのトリップを閲覧されましたね：\n- **閲覧したトリップを比較** — メリット・デメリット\n- **お気に入りから旅行プラン作成** 予算付き\n- **もっとトリップを探す**\n\nお気軽にどうぞ！",
  ko: "다시 오신 것을 환영합니다! 🤿\n\n여러 트립을 둘러보셨군요:\n- **본 트립들 비교** — 장단점 분석\n- **마음에 드는 것으로 여행 계획 작성** 예산 포함\n- **더 많은 트립 찾기**\n\n말씀해 주세요!",
  de: "Willkommen zurück! 🤿\n\nDu hast mehrere Trips angesehen:\n- **Angesehene Trips vergleichen** — Vor- und Nachteile\n- **Reiseplan erstellen** aus deinen Favoriten mit Budget\n- **Weitere Trips finden**\n\nSag Bescheid!",
  fr: "Bon retour ! 🤿\n\nVous avez consulté plusieurs trips :\n- **Comparer les trips consultés** — avantages et inconvénients\n- **Créer un plan** à partir de vos favoris avec budget\n- **Trouver plus de trips**\n\nDites-moi !",
  ru: "С возвращением! 🤿\n\nВижу, вы просматривали несколько трипов:\n- **Сравнить просмотренные трипы** — плюсы и минусы\n- **Составить план** из избранного с бюджетом\n- **Найти больше трипов**\n\nСкажите мне!",
};

const WELCOME_BROWSING: Record<string, string> = {
  th: "สวัสดีครับ! เห็นว่ากำลังหาทริปดำน้ำอยู่ 🔍\n\nผมช่วยให้เจอทริปที่ใช่ได้เร็วขึ้น:\n- **บอกงบ วัน cert level** แล้วผมแนะนำทริปที่เหมาะ\n- **สร้างแผนทริป** day-by-day พร้อมงบประมาณ\n- **เปรียบเทียบเรือ** ให้เห็นชัดๆ\n\nถามได้เลยครับ!",
  en: "Hi! I see you're looking for a dive trip 🔍\n\nI can help you find the right one faster:\n- **Tell me your budget, dates & cert level** and I'll recommend the best match\n- **Create a day-by-day trip plan** with budget breakdown\n- **Compare boats** side by side\n\nJust ask!",
  cn: "你好！看到你在找潜水行程 🔍\n\n我能帮你更快找到：\n- **告诉我预算、日期和证书等级** 我推荐最合适的\n- **制作每日行程计划** 含预算明细\n- **对比船只**\n\n直接问我！",
  ja: "こんにちは！ダイビングトリップをお探しですね 🔍\n\nもっと早く見つけるお手伝いができます：\n- **予算、日程、資格レベルを教えてください** 最適なものを提案します\n- **日別の旅行プランを作成** 予算内訳付き\n- **ボートを比較**\n\nお気軽にどうぞ！",
  ko: "안녕하세요! 다이빙 트립을 찾고 계시군요 🔍\n\n더 빨리 찾아드릴 수 있어요:\n- **예산, 날짜, 자격증 레벨을 알려주세요** 최적의 것을 추천합니다\n- **일별 여행 계획 작성** 예산 내역 포함\n- **보트 비교**\n\n질문하세요!",
  de: "Hallo! Du suchst einen Tauchtrip 🔍\n\nIch helfe dir schneller:\n- **Sag mir Budget, Termine & Zertifikat** — ich empfehle das Beste\n- **Tagesplan erstellen** mit Budget\n- **Boote vergleichen**\n\nFrag einfach!",
  fr: "Bonjour ! Vous cherchez un voyage de plongée 🔍\n\nJe peux vous aider plus vite :\n- **Dites-moi budget, dates & niveau** — je recommande le meilleur\n- **Créer un plan jour par jour** avec budget\n- **Comparer les bateaux**\n\nDemandez-moi !",
  ru: "Привет! Вижу, вы ищете дайвинг-трип 🔍\n\nПомогу найти быстрее:\n- **Скажите бюджет, даты и уровень сертификата** — подберу лучшее\n- **Составить план по дням** с бюджетом\n- **Сравнить лодки**\n\nСпрашивайте!",
};

function buildWelcome(lang: string, pathname: string): string {
  const tripMatch = pathname.match(/\/trips\/([^/]+)/);
  if (tripMatch) return WELCOME_ON_TRIP[lang] || WELCOME_ON_TRIP.en;

  const blogMatch = pathname.match(/\/blogs\/([^/]+)/);
  if (blogMatch) return WELCOME_ON_BLOG[lang] || WELCOME_ON_BLOG.en;

  const recentBoats = readRecentBoats();
  if (recentBoats.length >= 3) return WELCOME_RETURNING[lang] || WELCOME_RETURNING.en;
  if (recentBoats.length > 0) return WELCOME_BROWSING[lang] || WELCOME_BROWSING.en;

  return WELCOME_BASE[lang] || WELCOME_BASE.en;
}

const PLAN_STARTER: Record<string, string> = {
  th: "ช่วยวางแผนทริปดำน้ำให้หน่อยครับ",
  en: "Help me plan a dive trip",
  cn: "帮我规划一次潜水旅行",
  ja: "ダイビングトリップを計画してください",
  ko: "다이빙 여행 계획을 세워주세요",
  de: "Hilf mir einen Tauchtrip zu planen",
  fr: "Aidez-moi à planifier un voyage de plongée",
  ru: "Помогите спланировать дайвинг-поездку",
};

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

  const [tab, setTab] = useState<"chat" | "plans">("chat");
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem("ark-ai-messages");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [savedPlans, setSavedPlans] = useState<string[]>([]);
  const [plansData, setPlansData] = useState<Record<string, unknown>[]>([]);
  const [feedbackState, setFeedbackState] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const trackedOpenRef = useRef(false);

  useEffect(() => {
    if (open && !trackedOpenRef.current) {
      trackChatOpen();
      trackedOpenRef.current = true;
    }
  }, [open]);

  useEffect(() => {
    if (messages.length > 0) {
      try { sessionStorage.setItem("ark-ai-messages", JSON.stringify(messages)); } catch {}
    }
  }, [messages]);

  useEffect(() => {
    if (open && tab === "plans") {
      const ids: string[] = JSON.parse(localStorage.getItem("ark-ai-plans") || "[]");
      setSavedPlans(ids);
      if (ids.length) {
        fetch(`/api/ark-ai/itinerary?ids=${ids.join(",")}`)
          .then(r => r.ok ? r.json() : [])
          .then(setPlansData)
          .catch(() => {});
      }
    }
  }, [open, tab]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const handleFeedback = useCallback((msgIndex: number, positive: boolean) => {
    setFeedbackState(prev => ({ ...prev, [msgIndex]: positive }));
    trackChatFeedback(positive, msgIndex);
  }, []);

  const handleItinerarySave = useCallback((_data: ItineraryData) => {
    const ids: string[] = JSON.parse(localStorage.getItem("ark-ai-plans") || "[]");
    setSavedPlans(ids);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
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
      const res = await fetch("/api/ark-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          lang,
          pageContext,
          recentlyViewed: recentBoatIds.length ? recentBoatIds.slice(0, 10).join(",") : undefined,
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

      trackChatMessage("assistant", accumulated.length);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Connection error. Please try again." };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, lang, pathname]);

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
        @keyframes arkSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        .ark-trip-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1299, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />

      {/* Panel */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1300,
        display: "flex", justifyContent: "center", pointerEvents: "none",
      }}>
        <div style={{
          pointerEvents: "auto",
          width: "min(480px, 100%)",
          height: "min(85vh, 700px)",
          background: "#0d0d0d", color: "#e5e5e5",
          borderRadius: "20px 20px 0 0",
          border: "1px solid #1f1f1f", borderBottom: "none",
          display: "flex", flexDirection: "column",
          boxShadow: "0 -8px 60px rgba(0,0,0,0.7)",
          animation: "arkSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          {/* Handle */}
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#3a3a3a" }} />
          </div>

          {/* Header */}
          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #1a1a1a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #1e40af, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.8" opacity="0.5"/>
                  <path d="M4 13c2-2.5 4-2.5 6 0s4 2.5 6 0s4-2.5 6 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <circle cx="8" cy="8" r="1.5" fill="#fff" opacity="0.7"/>
                  <circle cx="16" cy="7" r="1" fill="#fff" opacity="0.5"/>
                  <circle cx="12" cy="5.5" r="0.8" fill="#fff" opacity="0.4"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#f5f5f5" }}>SIAM AI</p>
                <p style={{ fontSize: 9, color: "#555" }}>Dive Trip Planner</p>
              </div>
            </div>
            <div style={{ flex: 1 }} />

            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, background: "#161616", borderRadius: 8, padding: 2, marginRight: 8 }}>
              {(["chat", "plans"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 700,
                    background: tab === t ? "#1e40af" : "transparent",
                    color: tab === t ? "#fff" : "#666", cursor: "pointer",
                  }}>
                  {t === "chat" ? "Chat" : "My Plans"}
                </button>
              ))}
            </div>

            <button onClick={() => {
                setMessages([]);
                setFeedbackState({});
                setStreaming(false);
                try { sessionStorage.removeItem("ark-ai-messages"); } catch {}
              }}
              title={lang === "th" ? "ล้างแชท" : "Clear chat"}
              style={{ background: "#1a1a1a", border: "1px solid #262626", color: "#aaa", width: 28, height: 28, borderRadius: "50%", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
            <button onClick={onClose}
              style={{ background: "#1a1a1a", border: "1px solid #262626", color: "#aaa", width: 28, height: 28, borderRadius: "50%", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              x
            </button>
          </div>

          {/* Chat tab */}
          {tab === "chat" && (
            <>
              <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                {/* Welcome */}
                {messages.length === 0 && (
                  <div style={{ padding: "8px 0" }}>
                    <ChatMessage role="assistant" content={buildWelcome(lang, pathname)} msgIndex={-1} />
                    <SuggestionChips lang={lang} onSelect={sendMessage} />
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
                    onItinerarySave={handleItinerarySave}
                    lang={lang}
                  />
                ))}
              </div>

              {/* Input */}
              <div style={{ padding: "10px 16px 20px", borderTop: "1px solid #1a1a1a" }}>
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
                      borderRadius: 12, color: "#f5f5f5", fontSize: 13, padding: "10px 14px",
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
                    style={{
                      width: 40, height: 40, borderRadius: 10, border: "none",
                      background: input.trim() && !streaming ? "#1e40af" : "#1a1a1a",
                      color: "#fff", cursor: input.trim() && !streaming ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "background 0.15s",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Plans tab */}
          {tab === "plans" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {savedPlans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
                  <p style={{ fontSize: 13, color: "#555" }}>
                    {lang === "th" ? "ยังไม่มีแผนที่บันทึกไว้" : "No saved plans yet"}
                  </p>
                  <p style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
                    {lang === "th" ? "ลองให้ AI วางแผนทริปให้คุณ!" : "Ask AI to plan a trip for you!"}
                  </p>
                  <button onClick={() => {
                      setTab("chat");
                      setTimeout(() => sendMessage(PLAN_STARTER[lang] || PLAN_STARTER.en), 100);
                    }}
                    style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "none", background: "#1e40af", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {lang === "th" ? "สร้างแผนใหม่" : "Create a plan"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {plansData.map((plan: Record<string, unknown>) => (
                    <a key={plan.shortId as string} href={`/${lang}/plan/${plan.shortId}`}
                      style={{
                        display: "block", padding: 12, background: "#161616",
                        border: "1px solid #262626", borderRadius: 10,
                        textDecoration: "none", transition: "border-color 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "#262626")}
                    >
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5" }}>{plan.title as string}</p>
                      <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 10, color: "#666" }}>
                        <span>{plan.durationDays as number} days</span>
                        <span>{plan.totalDives as number} dives</span>
                        {(plan.areas as string[])?.length > 0 && <span>{(plan.areas as string[]).join(", ")}</span>}
                        <span style={{ marginLeft: "auto" }}>{plan.viewCount as number} views</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
