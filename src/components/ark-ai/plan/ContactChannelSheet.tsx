"use client";

import React from "react";

type Channel = { key: string; label: string; color: string; icon: string; url: string };

type Props = {
  message: string;
  lang: string;
  onClose: () => void;
};

const PHONE = "66953969415";

function buildChannels(msg: string): Channel[] {
  const enc = encodeURIComponent(msg);
  return [
    { key: "line", label: "LINE", color: "#06C755", icon: "line", url: `https://line.me/R/oaMessage/@siamdive/?${enc}` },
    { key: "whatsapp", label: "WhatsApp", color: "#25D366", icon: "whatsapp", url: `https://wa.me/${PHONE}?text=${enc}` },
    { key: "messenger", label: "Messenger", color: "#0084FF", icon: "messenger", url: `https://m.me/siamdive` },
    { key: "wechat", label: "WeChat", color: "#07C160", icon: "wechat", url: `weixin://` },
    { key: "kakao", label: "KakaoTalk", color: "#FEE500", icon: "kakao", url: `https://pf.kakao.com/_siamdive/chat` },
  ];
}

const ICONS: Record<string, (c: string) => React.ReactNode> = {
  line: (color) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.79 8.4.34.07.81.23.93.52.1.27.07.68.03.95l-.15.91c-.05.27-.21 1.07.94.58s6.23-3.67 8.5-6.28C22.88 13.47 22 12.04 22 10.5 22 5.82 17.52 2 12 2zm-2.5 11.2h-2a.45.45 0 01-.45-.45V8.7a.45.45 0 01.9 0v3.6h1.55a.45.45 0 010 .9zm1.5-.45a.45.45 0 01-.9 0V8.7a.45.45 0 01.9 0v4.05zm3.6 0a.45.45 0 01-.36.44.44.44 0 01-.5-.2l-1.78-2.42v2.18a.45.45 0 01-.9 0V8.7a.45.45 0 01.36-.44.44.44 0 01.5.2l1.78 2.42V8.7a.45.45 0 01.9 0v4.05zm2.9-2.7a.45.45 0 010 .9H16v.9h1.5a.45.45 0 010 .9h-2a.45.45 0 01-.45-.45V8.7a.45.45 0 01.45-.45h2a.45.45 0 010 .9H16v.9h1.5z"/>
    </svg>
  ),
  whatsapp: (color) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  messenger: (color) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.2.16.15.26.35.27.57l.05 1.78c.02.56.6.93 1.11.7l1.99-.88c.17-.07.36-.09.53-.05.93.26 1.93.4 2.9.4 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm5.95 7.52l-2.9 4.6c-.46.73-1.45.91-2.12.38l-2.31-1.73a.6.6 0 00-.72 0l-3.12 2.37c-.42.32-.96-.17-.69-.62l2.9-4.6c.46-.73 1.45-.91 2.12-.38l2.31 1.73a.6.6 0 00.72 0l3.12-2.37c.42-.32.96.17.69.62z"/>
    </svg>
  ),
  wechat: (color) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.127 6.127 0 01-.253-1.734c0-3.568 3.312-6.46 7.386-6.46.38 0 .749.034 1.114.08C16.795 4.56 13.143 2.188 8.691 2.188zm-2.77 4.401c.545 0 .988.443.988.988s-.443.988-.988.988-.987-.443-.987-.988.443-.988.988-.988zm5.49 0c.545 0 .988.443.988.988s-.443.988-.988.988-.988-.443-.988-.988.443-.988.988-.988zM16.636 9.5c-3.596 0-6.545 2.53-6.545 5.625S13.04 20.75 16.636 20.75c.708 0 1.39-.103 2.031-.293a.66.66 0 01.546.074l1.445.847a.248.248 0 00.127.041.224.224 0 00.22-.224c0-.054-.022-.11-.036-.162l-.296-1.124a.45.45 0 01.162-.506C22.437 18.242 23.18 16.612 23.18 15.125 23.18 12.03 20.232 9.5 16.636 9.5zm-2.302 3.66c.414 0 .75.337.75.75s-.336.75-.75.75-.75-.337-.75-.75.336-.75.75-.75zm4.604 0c.414 0 .75.337.75.75s-.336.75-.75.75-.75-.337-.75-.75.336-.75.75-.75z"/>
    </svg>
  ),
  kakao: (color) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M12 3c-5.076 0-9.191 3.347-9.191 7.478 0 2.685 1.789 5.037 4.475 6.356l-.907 3.378c-.063.236.005.383.13.457a.42.42 0 00.475-.032l4.015-2.67c.33.037.668.058 1.003.058 5.076 0 9.191-3.347 9.191-7.478C21.191 6.347 17.076 3 12 3z"/>
    </svg>
  ),
};

export default function ContactChannelSheet({ message, lang, onClose }: Props) {
  const isTh = lang === "th";
  const channels = buildChannels(message);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.7)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1501,
        background: "#111", borderRadius: "16px 16px 0 0",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", margin: 0 }}>
              {isTh ? "ติดต่อสอบถาม" : "Contact Us"}
            </p>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0" }}>
            {isTh ? "เลือกช่องทางที่สะดวก" : "Choose your preferred channel"}
          </p>
        </div>

        <div style={{ padding: "12px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {channels.map((ch) => (
            <button
              key={ch.key}
              onClick={() => { window.open(ch.url, "_blank"); onClose(); }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 12,
                background: "#0a0a0a", border: "1px solid #1a1a1a",
                cursor: "pointer", width: "100%",
                transition: "background 0.15s",
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: `${ch.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {ICONS[ch.icon]?.(ch.color)}
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5" }}>{ch.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
