"use client";

import { trackBookingIntent, type BookingChannel } from "@/lib/analytics/client";

type Props = {
  boatTitle: string;
  boatId?: string;
  schedule?: string | null;
  price?: number | null;
};

const CHANNELS: { channel: BookingChannel; label: string; icon: string; color: string }[] = [
  { channel: "line", label: "Line", icon: "💬", color: "#06c755" },
  { channel: "whatsapp", label: "WhatsApp", icon: "📱", color: "#25d366" },
  { channel: "messenger", label: "Messenger", icon: "💙", color: "#0084ff" },
  { channel: "wechat", label: "WeChat", icon: "🟢", color: "#07c160" },
  { channel: "kakao", label: "Kakao", icon: "💛", color: "#fee500" },
];

function buildMessage(boatTitle: string, schedule?: string | null, price?: number | null): string {
  let msg = `Hi, I'm interested in "${boatTitle}"`;
  if (schedule) msg += ` on ${schedule}`;
  if (price) msg += ` (฿${price.toLocaleString()}/person)`;
  msg += ". Could you provide more details?";
  return msg;
}

export default function BookingButtons({ boatTitle, boatId, schedule, price }: Props) {
  const handleClick = (channel: BookingChannel) => {
    trackBookingIntent(channel, {
      type: "BOAT",
      id: boatId,
      priceTHB: price ?? undefined,
      scheduleDate: schedule ?? undefined,
    });

    const msg = encodeURIComponent(buildMessage(boatTitle, schedule, price));

    switch (channel) {
      case "line":
        window.open(`https://line.me/R/oaMessage/@siamdive/?${msg}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${msg}`, "_blank");
        break;
      case "messenger":
        window.open("https://m.me/siamdive", "_blank");
        break;
      case "wechat":
        window.open("https://siamdive.com/wechat", "_blank");
        break;
      case "kakao":
        window.open("https://pf.kakao.com/_siamdive", "_blank");
        break;
    }
  };

  return (
    <div style={{ margin: "8px 0", padding: 10, background: "#0f1520", border: "1px solid #1e2d40", borderRadius: 10 }}>
      <p style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        Book This Trip
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {CHANNELS.map(({ channel, label, icon, color }) => (
          <button
            key={channel}
            onClick={() => handleClick(channel)}
            style={{
              flex: 1, minWidth: 70, padding: "8px 4px", borderRadius: 8,
              border: `1px solid ${color}40`, background: `${color}15`,
              color: "#e5e5e5", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${color}30`; e.currentTarget.style.borderColor = color; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${color}15`; e.currentTarget.style.borderColor = `${color}40`; }}
          >
            <span style={{ fontSize: 13 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
