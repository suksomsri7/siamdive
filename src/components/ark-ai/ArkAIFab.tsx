"use client";

export default function ArkAIFab() {
  return (
    <>
      <style>{`
        @keyframes aiFabGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(30,64,175,0.5); }
          50% { box-shadow: 0 4px 24px rgba(59,130,246,0.7), 0 0 40px rgba(59,130,246,0.2); }
        }
      `}</style>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-ark-ai"))}
        aria-label="AI Trip Planner"
        style={{
          position: "fixed", bottom: 24, right: 84, zIndex: 1099,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #1e40af, #3b82f6)",
          border: "none", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "aiFabGlow 3s ease-in-out infinite",
          cursor: "pointer",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" opacity="0.5"/>
          <path d="M4 13c2-2.5 4-2.5 6 0s4 2.5 6 0s4-2.5 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.7"/>
          <circle cx="16" cy="7" r="1" fill="currentColor" opacity="0.5"/>
          <circle cx="12" cy="5.5" r="0.8" fill="currentColor" opacity="0.4"/>
        </svg>
      </button>
    </>
  );
}
