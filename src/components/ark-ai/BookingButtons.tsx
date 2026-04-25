"use client";

import { trackBookingIntent, type BookingChannel } from "@/lib/analytics/client";

type Props = {
  boatTitle: string;
  boatId?: string;
  schedule?: string | null;
  price?: number | null;
};

function LineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#06c755">
      <path d="M12 2C6.48 2 2 5.64 2 10.14c0 4.03 3.57 7.4 8.4 8.04.33.07.77.22.88.5.1.26.07.66.03.92l-.14.87c-.04.26-.2 1.01.88.55s5.87-3.46 8.02-5.92C21.94 13.07 22 11.66 22 10.14 22 5.64 17.52 2 12 2zm-3.5 10.86h-2a.49.49 0 01-.5-.49V8.49c0-.27.22-.49.5-.49s.5.22.5.49v3.39h1.5c.28 0 .5.22.5.49a.49.49 0 01-.5.49zm1.5-.49V8.49c0-.27.22-.49.5-.49s.5.22.5.49v3.88c0 .27-.22.49-.5.49s-.5-.22-.5-.49zm4.5.49h-2a.49.49 0 01-.5-.49V8.49c0-.27.22-.49.5-.49s.5.22.5.49v3.39h1.5c.28 0 .5.22.5.49a.49.49 0 01-.5.49zm3.06-2.17l-1.56 2.1a.5.5 0 01-.7.1.5.5 0 01-.1-.7l1.3-1.75h-1.5a.49.49 0 01-.5-.49V8.49c0-.27.22-.49.5-.49s.5.22.5.49v2.37l1.56-2.1a.5.5 0 01.7-.1.5.5 0 01.1.7l-1.3 1.75h1.5c.28 0 .5.22.5.49v1.49z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0084ff">
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.15.16.14.26.35.27.57l.05 1.78c.02.62.67 1.03 1.24.78l1.99-.88c.17-.07.36-.09.54-.05.93.25 1.93.39 2.96.39 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm5.89 7.47l-2.9 4.6c-.46.73-1.42.91-2.09.39l-2.3-1.73a.57.57 0 00-.69 0l-3.11 2.36c-.41.31-.95-.19-.67-.63l2.9-4.6c.46-.73 1.42-.91 2.09-.39l2.3 1.73c.21.16.5.16.69 0l3.11-2.36c.41-.31.95.19.67.63z" />
    </svg>
  );
}

function WeChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#07c160">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.093 6.093 0 01-.247-1.723c0-3.571 3.306-6.47 7.38-6.47.242 0 .479.012.715.031C16.709 4.853 13.098 2.188 8.691 2.188zm-2.41 4.278a.963.963 0 110 1.926.963.963 0 010-1.926zm4.822 0a.963.963 0 110 1.926.963.963 0 010-1.926zM24 14.472c0-3.247-3.317-5.883-7.136-5.883-3.94 0-7.136 2.636-7.136 5.883 0 3.247 3.197 5.883 7.136 5.883.71 0 1.394-.088 2.04-.256a.71.71 0 01.59.082l1.38.808a.266.266 0 00.138.044c.13 0 .236-.107.236-.24 0-.058-.023-.117-.04-.174l-.283-1.074a.483.483 0 01.174-.543C22.997 18.059 24 16.387 24 14.472zm-9.498-1.205a.774.774 0 110 1.547.774.774 0 010-1.547zm4.724 0a.774.774 0 110 1.547.774.774 0 010-1.547z" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#3C1E1E">
      <path d="M12 3c-5.076 0-9.192 3.272-9.192 7.31 0 2.596 1.725 4.88 4.324 6.162-.14.527-.907 3.393-.937 3.616 0 0-.019.157.074.217.093.06.202.044.202.044.267-.036 3.091-2.02 3.578-2.363.627.089 1.275.134 1.951.134 5.076 0 9.192-3.272 9.192-7.31S17.076 3 12 3z" />
    </svg>
  );
}

const CHANNELS: { channel: BookingChannel; label: string; Icon: () => React.JSX.Element; color: string }[] = [
  { channel: "line", label: "Line", Icon: LineIcon, color: "#06c755" },
  { channel: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon, color: "#25d366" },
  { channel: "messenger", label: "Messenger", Icon: MessengerIcon, color: "#0084ff" },
  { channel: "wechat", label: "WeChat", Icon: WeChatIcon, color: "#07c160" },
  { channel: "kakao", label: "Kakao", Icon: KakaoIcon, color: "#fee500" },
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
    <div style={{ margin: "4px 0 2px", padding: "10px 12px", background: "#0d1117", border: "1px solid #1e2d40", borderRadius: 10 }}>
      <p style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
        Contact Us
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {CHANNELS.map(({ channel, label, Icon, color }) => (
          <button
            key={channel}
            onClick={() => handleClick(channel)}
            style={{
              flex: "1 1 0",
              minWidth: 56,
              padding: "8px 2px",
              borderRadius: 8,
              border: "1px solid #1e2d40",
              background: "#161b22",
              color: "#ccc",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1e2d40"; e.currentTarget.style.borderColor = color; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#161b22"; e.currentTarget.style.borderColor = "#1e2d40"; }}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
