"use client";

const SHIMMER_KEYFRAMES = `
  @keyframes ark-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes ark-pulse {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 0.85; }
  }
`;

const SHIMMER_BG = "linear-gradient(90deg, #161616 0%, #222 50%, #161616 100%)";
const SHIMMER_STYLE = {
  backgroundImage: SHIMMER_BG,
  backgroundSize: "200% 100%",
  animation: "ark-shimmer 1.4s linear infinite",
} as const;

export function ChatThinkingSkeleton({ lang }: { lang: string }) {
  const isTh = lang === "th";
  return (
    <div style={{ padding: "4px 0" }}>
      <style>{SHIMMER_KEYFRAMES}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ display: "inline-flex", gap: 4 }}>
          {[0, 0.2, 0.4].map((d, i) => (
            <span key={i} style={{
              width: 6, height: 6, borderRadius: "50%", background: "#60a5fa",
              animation: `ark-pulse 1s ease-in-out ${d}s infinite`,
            }} />
          ))}
        </span>
        <span style={{ fontSize: 12, color: "#666", fontWeight: 600 }}>
          {isTh ? "กำลังคิด…" : "Thinking…"}
        </span>
      </div>
      {/* Two fake text rows */}
      <div style={{ height: 10, borderRadius: 4, ...SHIMMER_STYLE, width: "85%", marginBottom: 6 }} />
      <div style={{ height: 10, borderRadius: 4, ...SHIMMER_STYLE, width: "60%", marginBottom: 12 }} />
      {/* Fake trip card row */}
      <div style={{ display: "flex", gap: 8, overflow: "hidden", paddingBottom: 4 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flexShrink: 0, width: 130, aspectRatio: "2/3",
            borderRadius: 12, ...SHIMMER_STYLE,
          }} />
        ))}
      </div>
    </div>
  );
}

export function PlanDetailSkeleton() {
  return (
    <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
      <style>{SHIMMER_KEYFRAMES}</style>
      {/* Cover */}
      <div style={{ height: 140, borderRadius: 14, ...SHIMMER_STYLE, marginBottom: 14 }} />
      {/* Title */}
      <div style={{ height: 18, borderRadius: 4, ...SHIMMER_STYLE, width: "55%", marginBottom: 10 }} />
      <div style={{ height: 12, borderRadius: 4, ...SHIMMER_STYLE, width: "35%", marginBottom: 18 }} />
      {/* Trip cards */}
      {[0, 1].map(i => (
        <div key={i} style={{
          background: "#111",
          border: "1px solid #1a1a1a",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
        }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 48, height: 36, borderRadius: 8, ...SHIMMER_STYLE, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 9, borderRadius: 3, ...SHIMMER_STYLE, width: "30%", marginBottom: 6 }} />
              <div style={{ height: 13, borderRadius: 4, ...SHIMMER_STYLE, width: "70%", marginBottom: 5 }} />
              <div style={{ height: 10, borderRadius: 3, ...SHIMMER_STYLE, width: "50%" }} />
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 3, ...SHIMMER_STYLE, width: "85%", marginBottom: 4 }} />
          <div style={{ height: 8, borderRadius: 3, ...SHIMMER_STYLE, width: "65%" }} />
        </div>
      ))}
    </div>
  );
}

export function ScheduleDetailSkeleton({ lang }: { lang: string }) {
  const isTh = lang === "th";
  return (
    <div style={{ padding: "10px 0" }}>
      <style>{SHIMMER_KEYFRAMES}</style>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 8, fontWeight: 600 }}>
        {isTh ? "กำลังโหลดรายละเอียด…" : "Loading details…"}
      </div>
      <div style={{ height: 12, borderRadius: 3, ...SHIMMER_STYLE, width: "92%", marginBottom: 6 }} />
      <div style={{ height: 12, borderRadius: 3, ...SHIMMER_STYLE, width: "75%", marginBottom: 6 }} />
      <div style={{ height: 12, borderRadius: 3, ...SHIMMER_STYLE, width: "88%", marginBottom: 6 }} />
      <div style={{ height: 12, borderRadius: 3, ...SHIMMER_STYLE, width: "55%" }} />
    </div>
  );
}

export function TripCardSkeleton() {
  return (
    <div style={{
      flexShrink: 0, width: 130, aspectRatio: "2/3",
      borderRadius: 12,
      ...SHIMMER_STYLE,
    }}>
      <style>{SHIMMER_KEYFRAMES}</style>
    </div>
  );
}
