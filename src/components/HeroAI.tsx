"use client";

import { useState } from "react";
import { monthName, seasonInfo } from "@/lib/dive-season";

type L = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";

const T = {
  title: {
    en: "Plan Your Thailand Dive Trip with AI",
    th: "วางแผนทริปดำน้ำในไทยด้วย AI",
    cn: "用 AI 规划你的泰国潜水之旅",
    ja: "AI でタイのダイビング旅行を計画",
    ko: "AI 로 태국 다이빙 여행 계획하기",
    de: "Planen Sie Ihren Thailand-Tauchtrip mit AI",
    fr: "Planifiez votre plongée en Thaïlande avec AI",
    ru: "Спланируйте дайвинг в Таиланде с AI",
  },
  subtitle: {
    en: "Trained on 100+ guides by Thai divemasters",
    th: "เรียนรู้จากคู่มือกว่า 100+ เล่มโดย Divemaster ไทย",
    cn: "基于 100+ 泰国潜水教练指南训练",
    ja: "タイのダイブマスターによる 100 以上のガイドで訓練",
    ko: "태국 다이브마스터의 100+ 가이드로 학습",
    de: "Trainiert mit 100+ Guides thailändischer Tauchlehrer",
    fr: "Entraîné sur 100+ guides de moniteurs thaïlandais",
    ru: "Обучен на 100+ руководствах тайских дайвмастеров",
  },
  cta: {
    en: "Ask Siam AI", th: "ถาม Siam AI", cn: "问 Siam AI", ja: "Siam AI に聞く",
    ko: "Siam AI 에게 물어보기", de: "Siam AI fragen", fr: "Demander à Siam AI", ru: "Спросить Siam AI",
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

function buildSuggestions(lang: string): string[] {
  const mn = monthName(lang);
  const s = seasonInfo();
  const out: string[] = [];

  out.push(
    lang === "th" ? `ดำน้ำเดือน${mn} ที่ไหนดี?` :
    lang === "cn" ? `${mn}最佳潜水地?` :
    lang === "ja" ? `${mn}のベストダイブサイトは?` :
    lang === "ko" ? `${mn} 최고의 다이빙 장소?` :
    `Best dive sites in ${mn}?`
  );

  if (s.whaleShark) {
    out.push(
      lang === "th" ? "ดูฉลามวาฬที่ไหนดี?" :
      lang === "cn" ? "哪里能看到鲸鲨?" :
      lang === "ja" ? "ジンベイザメはどこで見れる?" :
      lang === "ko" ? "고래상어 어디서 볼 수 있나요?" :
      "Where to see whale sharks now?"
    );
  } else {
    out.push(
      lang === "th" ? "ช่วงไหนเจอฉลามวาฬ?" :
      lang === "cn" ? "鲸鲨季节是什么时候?" :
      lang === "ja" ? "ジンベイザメのシーズンは?" :
      lang === "ko" ? "고래상어 시즌은 언제?" :
      "When is whale shark season?"
    );
  }

  if (s.coast === "andaman") {
    out.push(
      lang === "th" ? "ทริป Liveaboard สิมิลัน" :
      lang === "cn" ? "斯米兰船宿行程" :
      lang === "ja" ? "シミラン リブアボード" :
      lang === "ko" ? "시밀란 리브어보드" :
      "Similan liveaboard trips"
    );
    out.push(
      lang === "th" ? "สิมิลัน vs สุรินทร์" :
      lang === "cn" ? "斯米兰 vs 素林群岛" :
      lang === "ja" ? "シミラン vs スリン" :
      lang === "ko" ? "시밀란 vs 수린" :
      "Similan vs Surin Islands"
    );
  } else if (s.coast === "gulf") {
    out.push(
      lang === "th" ? "ดำน้ำเกาะเต่า" :
      lang === "cn" ? "龟岛潜水" :
      lang === "ja" ? "タオ島ダイビング" :
      lang === "ko" ? "꼬따오 다이빙" :
      "Diving at Koh Tao"
    );
    out.push(
      lang === "th" ? "Day Trip Sail Rock" :
      lang === "cn" ? "帆船岩一日游" :
      lang === "ja" ? "セイルロック日帰り" :
      lang === "ko" ? "세일록 데이트립" :
      "Sail Rock day trip"
    );
  } else {
    out.push(
      lang === "th" ? "ทริปช่วงเปลี่ยนฤดู" :
      lang === "cn" ? "换季期最佳行程" :
      lang === "ja" ? "シーズン移行期のおすすめ" :
      lang === "ko" ? "시즌 전환기 추천 트립" :
      "Best trips during season change"
    );
    out.push(
      lang === "th" ? "ดำน้ำที่ไหนได้ตอนนี้?" :
      lang === "cn" ? "现在哪里能潜水?" :
      lang === "ja" ? "今どこで潜れる?" :
      lang === "ko" ? "지금 어디서 다이빙 가능?" :
      "Where can I dive right now?"
    );
  }

  out.push(
    lang === "th" ? "ทริป 5 วัน งบ 30,000" :
    lang === "cn" ? "5天行程 预算3万泰铢" :
    lang === "ja" ? "5日間 予算3万バーツ" :
    lang === "ko" ? "5일 여행 예산 3만 바트" :
    "5-day trip, budget 30k THB"
  );

  out.push(
    lang === "th" ? "เพิ่งเริ่มดำน้ำ ต้องเตรียมอะไร?" :
    lang === "cn" ? "第一次潜水需要什么?" :
    lang === "ja" ? "初ダイビング — 何が必要?" :
    lang === "ko" ? "처음 다이빙 — 뭐가 필요?" :
    "First time diving — what do I need?"
  );

  return out.slice(0, 6);
}

export default function HeroAI({ lang }: { lang: string }) {
  const [text, setText] = useState("");
  const l = (lang as L) || "en";
  const t = (key: keyof typeof T) => T[key][l] ?? T[key]["en"];
  const suggestions = buildSuggestions(l);
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
          background: "#fff", borderRadius: 14,
          padding: 3, marginBottom: 20, textAlign: "left",
        }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            rows={2}
            style={{
              width: "100%", background: "transparent",
              border: "none", outline: "none",
              color: "#111", fontSize: 16, lineHeight: 1.5,
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

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}>
          {suggestions.map(q => (
            <button key={q} onClick={() => handleAsk(q)} style={{
              background: "transparent",
              border: "1px solid #1e1e1e",
              borderRadius: 10, padding: "8px 6px",
              color: "#555", fontSize: 11, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s",
              textAlign: "center", lineHeight: 1.3,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#999"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.color = "#555"; }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
