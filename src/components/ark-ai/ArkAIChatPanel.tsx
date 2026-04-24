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

const WELCOME: Record<string, string> = {
  th: "สวัสดีครับ! ผมเป็นผู้ช่วยวางแผนทริปดำน้ำในประเทศไทย\n\nบอกได้เลยว่าอยากไปดำน้ำที่ไหน เมื่อไหร่ งบเท่าไหร่ หรืออยากให้ช่วยวางแผนทั้งทริปก็ได้ครับ",
  en: "Hi! I'm your AI dive trip planner for Thailand.\n\nTell me where you'd like to dive, when, your budget, or I can plan an entire trip for you!",
  cn: "你好！我是你的泰国潜水旅行AI规划师。\n\n告诉我你想去哪里潜水、什么时候去、预算多少，我可以帮你规划整个行程！",
  ja: "こんにちは！タイのダイビングトリップ AI プランナーです。\n\nどこでダイビングしたいか、いつ行きたいか、予算はいくらか教えてください。旅行全体の計画もお手伝いします！",
  ko: "안녕하세요! 태국 다이빙 여행 AI 플래너입니다.\n\n어디서 다이빙하고 싶은지, 언제, 예산이 얼마인지 알려주세요. 전체 여행 계획도 도와드립니다!",
  de: "Hallo! Ich bin dein KI-Tauchreiseplaner für Thailand.\n\nSag mir, wo du tauchen möchtest, wann, dein Budget, oder ich plane die gesamte Reise für dich!",
  fr: "Bonjour ! Je suis votre planificateur de voyage de plongée IA pour la Thaïlande.\n\nDites-moi où vous aimeriez plonger, quand, votre budget, ou je peux planifier tout le voyage pour vous !",
  ru: "Привет! Я ваш AI-планировщик дайвинг-путешествий по Таиланду.\n\nРасскажите, где хотите понырять, когда, какой бюджет, или я могу спланировать всю поездку!",
};

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
                    <ChatMessage role="assistant" content={WELCOME[lang] || WELCOME.en} msgIndex={-1} />
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
