"use client";

// SharePlanSheet — bottom sheet for sharing a plan with a permission tier.
// Two-step UX:
//   Step 1 — toggle role: VIEWER (read-only) or EDITOR (full edit)
//   Step 2 — pick a channel: Copy link / LINE / WhatsApp / Messenger /
//            WeChat / KakaoTalk
//
// The first channel click for each role triggers POST /api/plans/[id]/
// share-tokens, which is idempotent — one token per (plan, role). The result
// is cached client-side so subsequent channel clicks for the same role reuse
// it without a round-trip.

import { useEffect, useState } from "react";
import { getDeviceId } from "@/lib/plan-store";

type Role = "VIEWER" | "EDITOR";

type Channel = {
  key: string;
  label: string;
  bg: string;
  icon: React.ReactNode;
  buildUrl?: (joinUrl: string, msg: string) => string;
  copy?: boolean;
};

type Props = {
  planId: string;
  planShortId: string;
  planName: string;
  lang: string;
  onClose: () => void;
};

const T: Record<string, Record<string, string>> = {
  title:       { th: "แชร์แผนทริป",          en: "Share trip plan",
                 cn: "分享行程计划", ja: "旅行プランを共有", ko: "여행 플랜 공유",
                 de: "Reiseplan teilen", fr: "Partager le plan de voyage", ru: "Поделиться планом поездки" },
  permission:  { th: "ให้ผู้รับทำอะไรได้?", en: "What can recipients do?",
                 cn: "接收者可以做什么？", ja: "受信者にできること", ko: "받는 사람이 할 수 있는 것은?",
                 de: "Was dürfen die Empfänger?", fr: "Que peuvent faire les destinataires ?", ru: "Что могут делать получатели?" },
  view:        { th: "ดูอย่างเดียว",          en: "View only",
                 cn: "仅查看", ja: "閲覧のみ", ko: "보기 전용",
                 de: "Nur ansehen", fr: "Lecture seule", ru: "Только просмотр" },
  viewDesc:    { th: "ดูได้ ไม่แก้ไข",        en: "Read-only access",
                 cn: "可查看，不可编辑", ja: "閲覧可能、編集不可", ko: "보기 가능, 편집 불가",
                 de: "Anzeigen, nicht bearbeiten", fr: "Consulter sans modifier", ru: "Просмотр без изменений" },
  edit:        { th: "ดู + แก้ไข",            en: "View + edit",
                 cn: "查看 + 编辑", ja: "閲覧 + 編集", ko: "보기 + 편집",
                 de: "Ansehen + bearbeiten", fr: "Voir + modifier", ru: "Просмотр + редактирование" },
  editDesc:    { th: "ปรับเปลี่ยนแผนร่วมกัน", en: "Collaborate as editor",
                 cn: "共同修改计划", ja: "プランを一緒に編集", ko: "함께 플랜 수정",
                 de: "Gemeinsam am Plan arbeiten", fr: "Modifier le plan ensemble", ru: "Совместное редактирование плана" },
  pickChannel: { th: "ส่งไปที่ไหน?",          en: "Send via",
                 cn: "通过哪里发送？", ja: "どこに送る？", ko: "어디로 보낼까요?",
                 de: "Senden über", fr: "Envoyer via", ru: "Отправить через" },
  copyLink:    { th: "คัดลอกลิงก์",            en: "Copy link",
                 cn: "复制链接", ja: "リンクをコピー", ko: "링크 복사",
                 de: "Link kopieren", fr: "Copier le lien", ru: "Копировать ссылку" },
  copied:      { th: "คัดลอกแล้ว ✓",           en: "Copied ✓",
                 cn: "已复制 ✓", ja: "コピーしました ✓", ko: "복사됨 ✓",
                 de: "Kopiert ✓", fr: "Copié ✓", ru: "Скопировано ✓" },
  loading:     { th: "กำลังสร้างลิงก์…",       en: "Generating link…",
                 cn: "正在生成链接…", ja: "リンクを生成中…", ko: "링크 생성 중…",
                 de: "Link wird erstellt…", fr: "Génération du lien…", ru: "Создание ссылки…" },
  err:         { th: "สร้างลิงก์ไม่สำเร็จ",   en: "Couldn't generate link",
                 cn: "无法生成链接", ja: "リンクを生成できませんでした", ko: "링크를 만들 수 없습니다",
                 de: "Link konnte nicht erstellt werden", fr: "Échec de la génération du lien", ru: "Не удалось создать ссылку" },
  invite:      { th: "ขอชวนมาร่วมแผนทริปดำน้ำ", en: "Join my dive trip plan",
                 cn: "邀请你加入我的潜水行程计划", ja: "私のダイビング旅行プランに参加しませんか", ko: "제 다이빙 여행 플랜에 함께해요",
                 de: "Mach bei meinem Tauchreiseplan mit", fr: "Rejoins mon plan de voyage plongée", ru: "Присоединяйтесь к моему плану дайвинг-поездки" },
};
const L = (k: keyof typeof T, lang: string) => T[k][lang] || T[k].en;

export default function SharePlanSheet({ planId, planShortId, planName, lang, onClose }: Props) {
  const [role, setRole]   = useState<Role>("VIEWER");
  const [tokens, setTokens] = useState<Record<Role, string | null>>({ VIEWER: null, EDITOR: null });
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Pre-warm the VIEWER token on open so the most common case (copy + paste)
  // doesn't pause on the first click. EDITOR loads lazily on toggle.
  useEffect(() => { void fetchToken("VIEWER"); /* eslint-disable-line */ }, []);

  async function fetchToken(r: Role): Promise<string | null> {
    if (tokens[r]) return tokens[r];
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/plans/${planId}/share-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: getDeviceId(), role: r }),
      });
      if (!res.ok) { setError(true); return null; }
      const data = await res.json() as { token: string };
      setTokens(prev => ({ ...prev, [r]: data.token }));
      return data.token;
    } catch {
      setError(true);
      return null;
    } finally {
      setLoading(false);
    }
  }

  const handleRoleChange = (r: Role) => {
    setRole(r);
    setCopied(false);
    void fetchToken(r);
  };

  const buildJoinUrl = (token: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/${lang}/plan/${planShortId}/join?t=${token}`;

  const handleChannel = async (ch: Channel) => {
    const token = await fetchToken(role);
    if (!token) return;
    const url = buildJoinUrl(token);
    const msg = `${L("invite", lang)} — ${planName}\n${url}`;

    if (ch.copy) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Older browsers: fall back to a prompt so the user can copy manually.
        window.prompt("Copy link:", url);
      }
      return;
    }
    if (ch.buildUrl) {
      const target = ch.buildUrl(url, msg);
      window.open(target, "_blank", "noopener,noreferrer");
    }
  };

  // Channel icons — flat brand-coloured discs with white minimal glyphs so
  // they read at a glance. Keep the set tight: copy + the 5 messengers the
  // contact sheet already covers, no email/SMS clutter.
  const channels: Channel[] = [
    {
      key: "copy", label: L("copyLink", lang), bg: "#475569", copy: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      ),
    },
    {
      key: "line", label: "LINE", bg: "#06C755",
      buildUrl: (_url, msg) => `https://line.me/R/share?text=${encodeURIComponent(msg)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}>
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.494.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
      ),
    },
    {
      key: "whatsapp", label: "WhatsApp", bg: "#25D366",
      buildUrl: (_url, msg) => `https://wa.me/?text=${encodeURIComponent(msg)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      key: "messenger", label: "Messenger", bg: "#0084FF",
      buildUrl: (url) => `fb-messenger://share/?link=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}>
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/>
        </svg>
      ),
    },
    {
      key: "wechat", label: "WeChat", bg: "#07C160",
      // WeChat has no public web share API; copy as fallback so the user can
      // paste into chat themselves.
      copy: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}>
          <path d="M8.5 4C4.91 4 2 6.69 2 10c0 1.87 1.01 3.54 2.58 4.61L4 16.74l2.38-1.18c.66.2 1.37.31 2.12.31.24 0 .47-.01.7-.04A5.77 5.77 0 0 1 9 14c0-3.31 2.91-6 6.5-6 .53 0 1.04.05 1.53.15C16.14 5.75 12.6 4 8.5 4zM6.5 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          <path d="M22 14c0-2.76-2.69-5-6-5s-6 2.24-6 5 2.69 5 6 5c.73 0 1.43-.1 2.07-.3l1.93 1.05-.42-1.57C21.13 16.99 22 15.58 22 14zm-8-1a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm4 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z"/>
        </svg>
      ),
    },
    {
      key: "kakao", label: "KakaoTalk", bg: "#FEE500",
      // KakaoTalk JS SDK requires app init — fall back to copy.
      copy: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="#000" width={22} height={22}>
          <path d="M12 3C7.03 3 3 6.14 3 10c0 2.49 1.66 4.68 4.14 5.93-.13.47-.82 3.02-.85 3.21 0 0-.02.14.07.19.09.06.2.02.2.02.27-.04 3.12-2.04 3.56-2.34.93.13 1.89.2 2.88.2 4.97 0 9-3.14 9-7s-4.03-7-9-7z"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        animation: "shareFade 0.2s ease-out both",
      }}
    >
      <style>{`
        @keyframes shareFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shareSlide { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "var(--plan-bg, #0d0d0d)",
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          padding: "16px 18px 24px",
          borderTop: "1px solid var(--plan-border-soft)",
          animation: "shareSlide 0.25s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <div style={{ width: 36, height: 4, background: "var(--plan-border)", borderRadius: 2, margin: "0 auto 14px" }} />
        <p style={{ fontSize: 16, fontWeight: 800, color: "var(--plan-fg)", margin: "0 0 14px", textAlign: "center" }}>
          {L("title", lang)}
        </p>

        {/* Permission toggle */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--plan-fg-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
          {L("permission", lang)}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          {(["VIEWER", "EDITOR"] as const).map(r => {
            const active = role === r;
            return (
              <button key={r} onClick={() => handleRoleChange(r)}
                style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: active ? "rgba(59,130,246,0.18)" : "var(--plan-surface)",
                  border: `1px solid ${active ? "#3b82f6" : "var(--plan-border-soft)"}`,
                  color: "var(--plan-fg)",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  transition: "background 0.15s, border-color 0.15s",
                }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "var(--plan-fg)", margin: 0 }}>
                  {r === "VIEWER" ? L("view", lang) : L("edit", lang)}
                </p>
                <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", margin: "2px 0 0" }}>
                  {r === "VIEWER" ? L("viewDesc", lang) : L("editDesc", lang)}
                </p>
              </button>
            );
          })}
        </div>

        {/* Channel grid */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--plan-fg-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
          {L("pickChannel", lang)}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
          {channels.map(ch => {
            const isCopyButton = ch.key === "copy";
            return (
              <button key={ch.key} onClick={() => handleChannel(ch)} disabled={loading && !tokens[role]}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "10px 4px",
                  background: "transparent", border: "none",
                  cursor: loading && !tokens[role] ? "wait" : "pointer",
                  fontFamily: "inherit",
                  opacity: loading && !tokens[role] ? 0.55 : 1,
                  transition: "opacity 0.15s",
                }}>
                <span style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: ch.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: ch.key === "kakao" ? "#000" : "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}>
                  {ch.icon}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--plan-fg-muted)" }}>
                  {isCopyButton && copied ? L("copied", lang) : ch.label}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p style={{ fontSize: 12, color: "#ef4444", textAlign: "center", margin: "0 0 8px" }}>
            {L("err", lang)}
          </p>
        )}
        {loading && !error && (
          <p style={{ fontSize: 11, color: "var(--plan-fg-subtle)", textAlign: "center", margin: "0 0 8px" }}>
            {L("loading", lang)}
          </p>
        )}
      </div>
    </div>
  );
}
