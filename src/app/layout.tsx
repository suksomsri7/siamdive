import type { Metadata } from "next";
import Script from "next/script";
import { Prompt, Inter, Geist, Noto_Sans_Osage, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const GA_ID = "G-1V6KE2TQMK";

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
  verification: {
    google: "K7-Ah0si_ypaurJTPsJoJm2lC4z5xHJ5aFywn06lcFY",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${prompt.variable} ${inter.variable} ${geist.variable} ${notoSansOsage.variable} ${bebasNeue.variable}`}>
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());gtag('config','${GA_ID}');
        `}</Script>
      </head>
      <body style={{ background: "#0d0d0d" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
