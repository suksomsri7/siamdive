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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Ark AI
      </button>
    </>
  );
}
