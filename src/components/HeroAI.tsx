"use client";

import { useState } from "react";
import { monthName, seasonInfo } from "@/lib/dive-season";

type L = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";

const T = {
  title: {
    en: "Plan Your Trip",
    th: "วางแผนทริปของคุณ",
    cn: "规划你的旅程",
    ja: "あなたの旅を計画",
    ko: "당신의 여행을 계획하세요",
    de: "Planen Sie Ihre Reise",
    fr: "Planifiez votre voyage",
    ru: "Спланируйте свою поездку",
  },
  subtitle: {
    en: "With AI that understands the sea",
    th: "ด้วย AI ที่เข้าใจทะเล",
    cn: "由懂海的 AI 驱动",
    ja: "海を知る AI とともに",
    ko: "바다를 아는 AI와 함께",
    de: "Mit KI, die das Meer versteht",
    fr: "Avec une IA qui comprend la mer",
    ru: "С ИИ, который понимает море",
  },
  cta: {
    en: "Plan", th: "วางแผน", cn: "规划", ja: "計画する",
    ko: "계획하기", de: "Planen", fr: "Planifier", ru: "Планировать",
  },
} as const;

function buildPlaceholder(lang: string): string {
  const mn = monthName(lang);
  const s = seasonInfo();
  if (lang === "th") {
    return s.whaleShark
      ? `จะมาเดือน${mn} 10 วัน งบ 50,000 มี AOW อยากเจอฉลามวาฬ...`
      : `จะมาเดือน${mn} 10 วัน งบ 50,000 มี AOW อยากดำน้ำ${s.coast === "andaman" ? "สิมิลัน" : "เกาะเต่า"}...`;
  }
  if (lang === "cn") {
    return s.whaleShark
      ? `${mn}来10天，预算5万，有AOW，想看鲸鲨...`
      : `${mn}来10天，预算5万，有AOW，想潜水...`;
  }
  if (lang === "ja") {
    return s.whaleShark
      ? `${mn}に10日間、予算5万、AOW持ち、ジンベイザメが見たい...`
      : `${mn}に10日間、予算5万、AOW持ち、ダイビングしたい...`;
  }
  if (lang === "ko") {
    return s.whaleShark
      ? `${mn} 10일간, 예산 5만, AOW 보유, 고래상어...`
      : `${mn} 10일간, 예산 5만, AOW 보유, 다이빙...`;
  }
  return s.whaleShark
    ? `Coming in ${mn} for 10 days, budget 50k, AOW cert, want to see whale sharks...`
    : `Coming in ${mn} for 10 days, budget 50k, AOW cert, ${s.coast === "andaman" ? "want to dive Similan" : "want to dive Koh Tao"}...`;
}

export default function HeroAI({ lang }: { lang: string }) {
  const [text, setText] = useState("");
  const l = (lang as L) || "en";
  const t = (key: keyof typeof T) => T[key][l] ?? T[key]["en"];
  const placeholder = buildPlaceholder(l);

  const handleAsk = (message?: string) => {
    const msg = (message || text).trim();
    if (msg) sessionStorage.setItem("ark-ai-pending", msg);
    window.dispatchEvent(new CustomEvent("open-ark-ai"));
    setText("");
  };

  const titleText = t("title");
  const titleParts = titleText.split(/(AI)/);

  return (
    <section style={{
      padding: "72px 20px 32px",
      display: "flex", flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <h1 style={{
          fontSize: "clamp(1.4rem, 4.5vw, 2.2rem)",
          fontWeight: 900, lineHeight: 1.2,
          letterSpacing: "-0.02em", marginBottom: 8,
        }}>
          {titleParts.map((part, i) =>
            part === "AI"
              ? <span key={i} style={{ color: "#3b82f6" }}>{part}</span>
              : <span key={i} style={{ color: "#f5f5f5" }}>{part}</span>
          )}
        </h1>

        <p style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>
          {t("subtitle")}
        </p>

        <div style={{
          background: "rgba(255,255,255,0.08)", borderRadius: 16,
          padding: 3, marginBottom: 20, textAlign: "left",
          border: "none",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            rows={2}
            style={{
              width: "100%", background: "transparent",
              border: "none", outline: "none",
              color: "#f0f0f0", fontSize: 16, lineHeight: 1.5,
              padding: "12px 14px", resize: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 6px 6px" }}>
            <button onClick={() => handleAsk()} style={{
              background: "#1e40af", color: "#fff",
              border: "none", borderRadius: 8,
              padding: "8px 18px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}>
              {t("cta")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
