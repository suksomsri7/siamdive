"use client";

import { useEffect, useState } from "react";

const T = {
  loading: {
    en: "Loading your plans…",
    th: "กำลังโหลดแผนของคุณ…",
    cn: "正在加载你的行程…",
    ja: "プランを読み込んでいます…",
    ko: "여정을 불러오는 중…",
    de: "Ihre Pläne werden geladen…",
    fr: "Chargement de vos plans…",
    ru: "Загрузка ваших планов…",
  },
  notInLine: {
    en: "Open this page from the SIAMDIVE LINE OA.",
    th: "เปิดหน้านี้จาก LINE OA ของ SIAMDIVE",
    cn: "请通过 SIAMDIVE LINE 官方账号打开此页面。",
    ja: "SIAMDIVE LINE 公式アカウントから開いてください。",
    ko: "SIAMDIVE LINE 공식 계정에서 열어 주세요.",
    de: "Bitte über den SIAMDIVE LINE OA öffnen.",
    fr: "Veuillez ouvrir depuis le compte LINE OA SIAMDIVE.",
    ru: "Откройте через SIAMDIVE LINE OA.",
  },
  error: {
    en: "Couldn't connect to LINE. Pull to refresh.",
    th: "เชื่อมต่อ LINE ไม่สำเร็จ ลองรีเฟรชใหม่",
    cn: "连接 LINE 失败，请刷新重试。",
    ja: "LINE に接続できませんでした。再読み込みしてください。",
    ko: "LINE 연결에 실패했습니다. 새로고침해 주세요.",
    de: "LINE-Verbindung fehlgeschlagen. Bitte aktualisieren.",
    fr: "Connexion à LINE échouée. Rafraîchissez la page.",
    ru: "Не удалось подключиться к LINE. Обновите страницу.",
  },
} as const;

type Lang = keyof typeof T.loading;

const DEVICE_KEYS = ["sd_vid", "siamdive:deviceId"] as const;

function tx(key: keyof typeof T, lang: string): string {
  const l = (lang as Lang);
  return T[key][l] ?? T[key].en;
}

export default function LiffMyPlanGate({ lang }: { lang: string }) {
  const [status, setStatus] = useState<"loading" | "no-liff-id" | "not-in-line" | "error">("loading");

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID_MYPLAN;
    if (!liffId) {
      setStatus("no-liff-id");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          // Not inside LINE (e.g. user pasted the LIFF URL into desktop browser).
          // Trigger LINE Login — redirects to LINE, then back to this URL.
          liff.login();
          return;
        }

        const profile = await liff.getProfile();

        // The raw ID token lets the server verify the LINE identity (sub +
        // email) instead of trusting the client. Required for the secure path.
        const idToken = liff.getIDToken() || undefined;

        // Email is only available if (1) the LIFF channel has `email` scope
        // approved AND (2) the user granted it. Both are best-effort — proceed
        // without if unavailable. The server prefers the verified email anyway.
        let email: string | undefined;
        try {
          const decoded = liff.getDecodedIDToken() as { email?: string } | null;
          if (decoded?.email) email = decoded.email;
        } catch {
          // ID token may not be available depending on LIFF config — ignore.
        }

        // Pass any existing visitor ID so plans created on this device before
        // linking LINE come along for the ride.
        let existingDeviceId: string | undefined;
        try {
          existingDeviceId = localStorage.getItem(DEVICE_KEYS[0])
            || localStorage.getItem(DEVICE_KEYS[1])
            || undefined;
        } catch { /* localStorage blocked — fine, server creates fresh */ }

        const res = await fetch("/api/plans/line-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            lineUserId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            email,
            deviceId: existingDeviceId,
          }),
        });

        if (!res.ok) throw new Error(`line-link ${res.status}`);
        const data = (await res.json()) as { deviceId: string };

        if (cancelled) return;

        try {
          for (const k of DEVICE_KEYS) localStorage.setItem(k, data.deviceId);
        } catch { /* ignore — drawer will still load by network on next visit */ }

        // Hand off to homepage with the drawer auto-opened. Using replace so
        // the LIFF intermediate URL isn't in the back stack.
        window.location.replace(`/${lang}?menu=myplan&ref=line`);
      } catch (e) {
        console.error("[liff myplan] init failed", e);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, [lang]);

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #0d0d0d, #060606)",
      color: "#f0f0f0",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px", textAlign: "center",
    }}>
      <style>{`
        @keyframes liffPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%      { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        background: "linear-gradient(135deg, #1e40af, #3b82f6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 36px rgba(59,130,246,0.55), 0 0 60px rgba(59,130,246,0.25)",
        animation: "liffPulse 1.6s ease-in-out infinite",
        marginBottom: 24,
      }}>
        <img src="/ai-mask.png" alt="SIAMDIVE" width={56} height={56}
          style={{ filter: "brightness(1.15)" }} />
      </div>
      <div style={{ fontSize: 15, color: "#bbb", maxWidth: 320 }}>
        {status === "loading"     && tx("loading", lang)}
        {status === "no-liff-id"  && "LIFF is not configured yet."}
        {status === "not-in-line" && tx("notInLine", lang)}
        {status === "error"       && tx("error", lang)}
      </div>
    </main>
  );
}
