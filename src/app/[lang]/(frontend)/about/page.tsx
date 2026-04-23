import type { Metadata } from "next";

const VALID_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

const T: Record<string, Record<string, string>> = {
  title: {
    en: "About SIAMDIVE", th: "เกี่ยวกับ SIAMDIVE", cn: "关于 SIAMDIVE",
    ja: "SIAMDIVEについて", ko: "SIAMDIVE 소개", de: "Über SIAMDIVE",
    fr: "À propos de SIAMDIVE", ru: "О SIAMDIVE",
  },
  meta: {
    en: "SIAMDIVE curates the best scuba diving day trips, liveaboards, and courses across Thailand.",
    th: "SIAMDIVE คัดสรรทริปดำน้ำ Daytrip, Liveaboard และคอร์สเรียนดำน้ำที่ดีที่สุดในประเทศไทย",
    cn: "SIAMDIVE精选泰国最佳水肺潜水一日游、船宿和课程。",
    ja: "SIAMDIVEはタイ全土で最高のスキューバダイビングデイトリップ、リブアボード、コースを厳選しています。",
    ko: "SIAMDIVE는 태국 전역에서 최고의 스쿠버 다이빙 당일치기, 리브어보드, 코스를 엄선합니다.",
    de: "SIAMDIVE kuratiert die besten Scuba-Tagestouren, Liveaboards und Kurse in ganz Thailand.",
    fr: "SIAMDIVE sélectionne les meilleures excursions de plongée, liveaboards et cours en Thaïlande.",
    ru: "SIAMDIVE подбирает лучшие дайв-туры, лайвэборды и курсы по всему Таиланду.",
  },
  intro: {
    en: "SIAMDIVE is Thailand's curated diving platform — connecting divers of every level with handpicked day trips, liveaboards, dive resorts, and professional courses across the country's most spectacular dive sites.",
    th: "SIAMDIVE คือแพลตฟอร์มดำน้ำคัดสรรของประเทศไทย — เชื่อมต่อนักดำน้ำทุกระดับกับทริป Daytrip, Liveaboard, Dive Resort และคอร์สเรียนดำน้ำที่คัดเลือกมาแล้วจากจุดดำน้ำที่สวยที่สุดของประเทศ",
    cn: "SIAMDIVE 是泰国精选潜水平台——为各级潜水员精心挑选一日游、船宿、潜水度假村和专业课程，覆盖全国最壮观的潜水点。",
    ja: "SIAMDIVEはタイの厳選ダイビングプラットフォームです。あらゆるレベルのダイバーを、国内最高のダイブサイトで厳選されたデイトリップ、リブアボード、ダイブリゾート、プロフェッショナルコースにつなぎます。",
    ko: "SIAMDIVE는 태국의 엄선된 다이빙 플랫폼으로, 모든 레벨의 다이버를 엄선된 당일치기, 리브어보드, 다이브 리조트 및 전문 코스와 연결합니다.",
    de: "SIAMDIVE ist Thailands kuratierte Tauchplattform — wir verbinden Taucher aller Niveaus mit handverlesenen Tagestouren, Liveaboards, Tauchresorts und professionellen Kursen an den spektakulärsten Tauchplätzen des Landes.",
    fr: "SIAMDIVE est la plateforme de plongée sélectionnée de Thaïlande — connectant les plongeurs de tous niveaux avec des excursions, liveaboards, resorts de plongée et cours professionnels soigneusement choisis.",
    ru: "SIAMDIVE — курируемая дайвинг-платформа Таиланда, связывающая дайверов любого уровня с лучшими дневными турами, лайвэбордами, дайв-курортами и профессиональными курсами.",
  },
  whyTitle: {
    en: "Why SIAMDIVE?", th: "ทำไมต้อง SIAMDIVE?", cn: "为什么选择 SIAMDIVE？",
    ja: "なぜSIAMDIVE？", ko: "왜 SIAMDIVE인가?", de: "Warum SIAMDIVE?",
    fr: "Pourquoi SIAMDIVE ?", ru: "Почему SIAMDIVE?",
  },
  why1: {
    en: "Every operator on SIAMDIVE is personally vetted — we only list trips and schools we trust.",
    th: "ทุกผู้ให้บริการบน SIAMDIVE ผ่านการคัดกรองด้วยตนเอง — เราลิสต์เฉพาะทริปและโรงเรียนที่เราเชื่อมั่น",
    cn: "SIAMDIVE 上的每个运营商都经过亲自审核——我们只列出我们信赖的行程和学校。",
    ja: "SIAMDIVEの全オペレーターは直接審査済み。信頼できるトリップとスクールのみを掲載しています。",
    ko: "SIAMDIVE의 모든 운영자는 직접 검증됩니다. 우리가 신뢰하는 트립과 스쿨만 등록합니다.",
    de: "Jeder Anbieter auf SIAMDIVE wird persönlich geprüft — wir listen nur Trips und Schulen, denen wir vertrauen.",
    fr: "Chaque opérateur sur SIAMDIVE est personnellement vérifié — nous ne listons que les voyages et écoles de confiance.",
    ru: "Каждый оператор на SIAMDIVE проверен лично — мы размещаем только проверенные туры и школы.",
  },
  why2: {
    en: "Real-time schedules and transparent pricing — no hidden fees, no surprises.",
    th: "ตารางเรือเรียลไทม์และราคาโปร่งใส — ไม่มีค่าใช้จ่ายแอบแฝง ไม่มีเซอร์ไพรส์",
    cn: "实时行程和透明价格——没有隐藏费用，没有惊喜。",
    ja: "リアルタイムスケジュールと透明な料金設定——隠れた費用やサプライズはありません。",
    ko: "실시간 일정과 투명한 가격 — 숨겨진 비용 없이, 놀라운 일 없이.",
    de: "Echtzeit-Fahrpläne und transparente Preise — keine versteckten Gebühren, keine Überraschungen.",
    fr: "Horaires en temps réel et tarifs transparents — pas de frais cachés, pas de surprises.",
    ru: "Расписание в реальном времени и прозрачные цены — никаких скрытых сборов и сюрпризов.",
  },
  why3: {
    en: "Multilingual support in 8 languages so every diver feels at home.",
    th: "รองรับ 8 ภาษา เพื่อให้นักดำน้ำทุกคนรู้สึกเป็นกันเอง",
    cn: "支持8种语言，让每位潜水员宾至如归。",
    ja: "8言語対応で、すべてのダイバーが快適にご利用いただけます。",
    ko: "8개 언어 지원으로 모든 다이버가 편안하게 이용할 수 있습니다.",
    de: "Mehrsprachige Unterstützung in 8 Sprachen, damit sich jeder Taucher willkommen fühlt.",
    fr: "Support multilingue en 8 langues pour que chaque plongeur se sente chez lui.",
    ru: "Поддержка 8 языков, чтобы каждый дайвер чувствовал себя как дома.",
  },
  destTitle: {
    en: "Destinations We Cover", th: "จุดหมายที่เราครอบคลุม", cn: "我们覆盖的目的地",
    ja: "対応エリア", ko: "저희가 다루는 목적지", de: "Unsere Ziele",
    fr: "Destinations couvertes", ru: "Наши направления",
  },
  dest: {
    en: "From the Similan Islands and Richelieu Rock in the Andaman Sea to Koh Tao, Chumphon Pinnacle, and Sail Rock in the Gulf of Thailand — SIAMDIVE covers every major dive destination in the kingdom.",
    th: "ตั้งแต่หมู่เกาะสิมิลัน, เกาะสุรินทร์ และเขาหินปูนริเชลิเยอ ในทะเลอันดามัน ไปจนถึงเกาะเต่า, จุมพร พินนาเคิล และเซลร็อค ในอ่าวไทย — SIAMDIVE ครอบคลุมทุกจุดดำน้ำสำคัญในประเทศไทย",
    cn: "从安达曼海的斯米兰群岛和黎塞留岩，到泰国湾的涛岛、春蓬尖峰和帆岩——SIAMDIVE覆盖泰国每一个重要潜水目的地。",
    ja: "アンダマン海のシミラン諸島やリシュリューロックから、タイ湾のコタオ、チュンポンピナクル、セイルロックまで——SIAMDIVEはタイの主要ダイブスポットをすべてカバーしています。",
    ko: "안다만 해의 시밀란 제도와 리슐리외 록부터 태국만의 코타오, 춤폰 피나클, 세일 록까지 — SIAMDIVE는 태국의 모든 주요 다이빙 목적지를 다룹니다.",
    de: "Von den Similan-Inseln und dem Richelieu Rock in der Andamanensee bis Koh Tao, Chumphon Pinnacle und Sail Rock im Golf von Thailand — SIAMDIVE deckt jeden wichtigen Tauchplatz im Königreich ab.",
    fr: "Des îles Similan et de Richelieu Rock en mer d'Andaman à Koh Tao, Chumphon Pinnacle et Sail Rock dans le golfe de Thaïlande — SIAMDIVE couvre chaque grande destination de plongée du royaume.",
    ru: "От Симиланских островов и скалы Ришелье в Андаманском море до Ко Тао, пиннакла Чумпхон и Сэйл Рок в Сиамском заливе — SIAMDIVE охватывает все основные дайв-направления королевства.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const l = VALID_LANGS.includes(lang) ? lang : "en";
  return { title: T.title[l], description: T.meta[l] };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const l = VALID_LANGS.includes(lang) ? lang : "en";
  const t = (k: string) => T[k]?.[l] ?? T[k]?.["en"] ?? "";

  const h2: React.CSSProperties = { fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", fontWeight: 800, marginBottom: 16, color: "#e5e5e5" };
  const p: React.CSSProperties = { color: "#999", fontSize: 15, lineHeight: 1.8, marginBottom: 24 };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 60px" }}>
      <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 900, marginBottom: 24, color: "#fff" }}>
        {t("title")}
      </h1>
      <p style={p}>{t("intro")}</p>

      <h2 style={h2}>{t("whyTitle")}</h2>
      <ul style={{ ...p, paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 10 }}>
        <li>{t("why1")}</li>
        <li>{t("why2")}</li>
        <li>{t("why3")}</li>
      </ul>

      <h2 style={h2}>{t("destTitle")}</h2>
      <p style={p}>{t("dest")}</p>
    </main>
  );
}
