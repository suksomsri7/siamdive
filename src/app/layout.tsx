import type { Metadata } from "next";
import { Prompt, Inter, Geist, Noto_Sans_Osage, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-prompt",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-geist",
});

const notoSansOsage = Noto_Sans_Osage({
  subsets: ["osage"],
  weight: ["400"],
  display: "swap",
  variable: "--font-osage",
});

// Tall condensed display face for the Netflix-style Top Trips ranking numerals.
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: "SIAMDIVE — ทริปดำน้ำในประเทศไทย",
  description: "ทริปดำน้ำ Scuba Daytrip และ Liveaboard คัดสรรสถานที่ดีที่สุดในประเทศไทย",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${prompt.variable} ${inter.variable} ${geist.variable} ${notoSansOsage.variable} ${bebasNeue.variable}`}>
      <body style={{ background: "#0d0d0d" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
