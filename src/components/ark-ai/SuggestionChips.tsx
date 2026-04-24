"use client";

const SUGGESTIONS: Record<string, { label: string; query: string }[]> = {
  th: [
    { label: "📋 สร้างแผนทริป", query: "ช่วยสร้างแผนทริปดำน้ำ 3 วัน งบ 10,000 บาท ช่วยวางแผนแบบ day-by-day ให้หน่อย" },
    { label: "ทริปสิมิลัน", query: "อยากไปดำน้ำสิมิลัน แนะนำทริปให้หน่อย" },
    { label: "Liveaboard เดือนนี้", query: "มี Liveaboard ออกเดือนนี้ไหม" },
    { label: "เปรียบเทียบเรือ", query: "ช่วยเปรียบเทียบเรือ Liveaboard ให้หน่อย" },
    { label: "มือใหม่หัดดำ", query: "ยังไม่เคยดำน้ำ อยากลองดำครั้งแรก แนะนำอะไรดี" },
    { label: "งบ 5,000", query: "งบ 5,000 บาท ไปดำน้ำที่ไหนได้บ้าง" },
  ],
  en: [
    { label: "📋 Create trip plan", query: "Help me create a 3-day dive trip plan with budget around 10,000 THB. Plan it day-by-day for me." },
    { label: "Similan trips", query: "I want to dive at Similan Islands, what do you recommend?" },
    { label: "Liveaboard this month", query: "Any liveaboard departures this month?" },
    { label: "Compare boats", query: "Can you compare liveaboard boats for me?" },
    { label: "First time diving", query: "I've never dived before, what do you recommend?" },
    { label: "Budget ฿5,000", query: "Where can I dive with a budget of 5,000 baht?" },
  ],
};

export default function SuggestionChips({ lang, onSelect }: { lang: string; onSelect: (q: string) => void }) {
  const chips = SUGGESTIONS[lang] || SUGGESTIONS.en;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 0" }}>
      {chips.map(c => (
        <button key={c.label} onClick={() => onSelect(c.query)}
          style={{
            padding: "6px 12px", borderRadius: 16,
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
            color: "#60a5fa", fontSize: 11, fontWeight: 600,
            cursor: "pointer", transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,130,246,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,130,246,0.1)")}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
