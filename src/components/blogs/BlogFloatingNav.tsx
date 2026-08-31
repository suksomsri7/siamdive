"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ปุ่มลอยบนหน้า blog view — โผล่เมื่อเลื่อนพ้น hero (แถบบนของเว็บหดหายไปแล้ว)
// ให้ทางกลับ 2 ทาง: หน้าหลัก (/) และ หน้ารวมบทความ (/[lang]/blogs)
// เจ้าของสั่งเพิ่ม 31 ส.ค. 2026 — คู่กับไอคอน < มุมบนซ้ายใน hero (ตอนยังไม่เลื่อน)

type L = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";
const LANGS: L[] = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

const HOME: Record<L, string> = {
  en: "Home", th: "หน้าหลัก", cn: "首页", ja: "ホーム", ko: "홈", de: "Start", fr: "Accueil", ru: "Главная",
};
const BLOG: Record<L, string> = {
  en: "Articles", th: "บทความ", cn: "博客", ja: "ブログ", ko: "블로그", de: "Blog", fr: "Blog", ru: "Блог",
};

const pill: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  background: "rgba(10,10,10,0.72)", backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999,
  padding: "8px 14px 8px 11px", color: "#eaeaea", fontSize: 13, fontWeight: 600,
  textDecoration: "none", whiteSpace: "nowrap",
  boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
};

// articles=false → หน้ารวมบทความใช้ (โชว์แค่ปุ่มกลับหน้าหลัก ไม่ต้องมีปุ่มกลับบทความ)
export default function BlogFloatingNav({ lang, articles = true }: { lang: string; articles?: boolean }) {
  const [show, setShow] = useState(false);
  const l: L = (LANGS.includes(lang as L) ? lang : "en") as L;

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed", zIndex: 1090,
        top: "calc(env(safe-area-inset-top, 0px) + 10px)", left: 10,
        display: "flex", gap: 8,
        animation: "blogNavIn 0.28s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <style>{`@keyframes blogNavIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* กลับหน้าหลัก (/) */}
      <Link href="/" style={pill} aria-label={HOME[l]}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        {HOME[l]}
      </Link>

      {/* กลับหน้าบทความ (/[lang]/blogs) — ซ่อนเมื่ออยู่หน้ารวมบทความเองแล้ว */}
      {articles && (
        <Link href={`/${l}/blogs`} style={pill} aria-label={BLOG[l]}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          {BLOG[l]}
        </Link>
      )}
    </div>
  );
}
