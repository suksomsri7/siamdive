"use client";

export default function ArkAIButton({ onClick }: { onClick: () => void }) {
  return (
    <>
      <style>{`
        @keyframes arkGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 16px rgba(59,130,246,0.6), 0 0 32px rgba(59,130,246,0.2); }
        }
      `}</style>
      <button
        onClick={onClick}
        aria-label="Ark AI"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "linear-gradient(135deg, #1e40af, #3b82f6)",
          border: "1px solid rgba(96,165,250,0.3)",
          borderRadius: 8, padding: "5px 10px",
          cursor: "pointer", color: "#fff",
          fontSize: 11, fontWeight: 700,
          animation: "arkGlow 3s ease-in-out infinite",
          transition: "transform 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          {/* Diving compass: circle + wave + bubbles */}
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" opacity="0.5"/>
          <path d="M4 13c2-2.5 4-2.5 6 0s4 2.5 6 0s4-2.5 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.7"/>
          <circle cx="16" cy="7" r="1" fill="currentColor" opacity="0.5"/>
          <circle cx="12" cy="5.5" r="0.8" fill="currentColor" opacity="0.4"/>
        </svg>
        SIAM AI
      </button>
    </>
  );
}
