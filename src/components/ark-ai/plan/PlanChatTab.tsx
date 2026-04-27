"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type ChatMessage = {
  id: string; authorEmail: string; authorName: string;
  message: string; imageUrl: string | null; pinned: boolean;
  createdAt: string;
};

type Props = {
  planId: string;
  deviceId: string;
  lang: string;
};

const POLL_INTERVAL = 5000;

export default function PlanChatTab({ planId, deviceId, lang }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimestampRef = useRef<string | null>(null);

  const isTh = lang === "th";

  const fetchMessages = useCallback(async (after?: string) => {
    try {
      const qs = after ? `?after=${encodeURIComponent(after)}` : "";
      const res = await fetch(`/api/plans/${planId}/chat${qs}`);
      if (!res.ok) return;
      const data = await res.json();
      const msgs = data.messages as ChatMessage[];
      if (msgs.length > 0) {
        lastTimestampRef.current = msgs[msgs.length - 1].createdAt;
        if (after) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const newMsgs = msgs.filter((m) => !ids.has(m.id));
            return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
          });
        } else {
          setMessages(msgs);
        }
      }
    } catch {}
  }, [planId]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("siamdive:planEmail") : null;
    setUserEmail(stored);
  }, []);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(() => {
      fetchMessages(lastTimestampRef.current || undefined);
    }, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/plans/${planId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, message: trimmed }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        lastTimestampRef.current = msg.createdAt;
        setText("");
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const handlePin = async (msgId: string, pinned: boolean) => {
    try {
      await fetch(`/api/plans/${planId}/chat`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId, pinned }),
      });
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, pinned } : m));
    } catch {}
  };

  const pinnedMessages = messages.filter((m) => m.pinned);

  const isOwnMessage = (msg: ChatMessage) => {
    return msg.authorEmail === userEmail || msg.authorEmail === deviceId;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return isTh ? "เมื่อกี้" : "now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Pinned */}
      {pinnedMessages.length > 0 && (
        <div style={{ padding: "8px 16px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          {pinnedMessages.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
              <span style={{ fontSize: 10, color: "#f59e0b" }}>📌</span>
              <span style={{ fontSize: 11, color: "#888", flex: 1 }}>
                <strong style={{ color: "#e5e5e5" }}>{m.authorName}</strong>: {m.message.slice(0, 60)}{m.message.length > 60 ? "..." : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", display: "flex", flexDirection: "column", gap: 6, padding: "12px 16px" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 14, color: "#555" }}>
              {isTh ? "เริ่มแชทกับเพื่อนร่วมทริป" : "Start chatting with your trip crew"}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const own = isOwnMessage(msg);
            return (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: own ? "flex-end" : "flex-start" }}>
                {!own && (
                  <span style={{ fontSize: 10, color: "#555", marginBottom: 2, paddingLeft: 4 }}>
                    {msg.authorName}
                  </span>
                )}
                <div
                  onDoubleClick={() => handlePin(msg.id, !msg.pinned)}
                  style={{
                    maxWidth: "80%", padding: "8px 12px", borderRadius: 12,
                    background: own ? "#1a1a2e" : "#1a1a1a",
                    borderBottomRightRadius: own ? 4 : 12,
                    borderBottomLeftRadius: own ? 12 : 4,
                    cursor: "default",
                  }}
                >
                  {msg.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.imageUrl} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: msg.message ? 6 : 0 }} />
                  )}
                  {msg.message && (
                    <p style={{ fontSize: 13, color: own ? "#fff" : "#e5e5e5", lineHeight: 1.5, wordBreak: "break-word" }}>
                      {msg.message}
                    </p>
                  )}
                  <p style={{ fontSize: 9, color: own ? "rgba(255,255,255,0.4)" : "#444", marginTop: 2, textAlign: "right" }}>
                    {msg.pinned && "📌 "}{formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: "flex", gap: 8, alignItems: "center",
        padding: "8px 16px", paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
        borderTop: "1px solid #1a1a1a",
        flexShrink: 0, background: "#0a0a0a",
      }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={isTh ? "พิมพ์ข้อความ..." : "Type a message..."}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 20, background: "#1a1a1a",
            border: "1px solid #262626", color: "#f5f5f5", fontSize: 13,
            fontFamily: "inherit", outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: text.trim() ? "#1a1a2e" : "#1a1a1a",
            color: text.trim() ? "#fff" : "#555",
            cursor: text.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
