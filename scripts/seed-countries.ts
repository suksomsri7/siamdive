/**
 * Seed default countries (TH + dive neighbours). Idempotent — upserts on code.
 * Run with:
 *   cd /root/projects/siamdive && bun --bun run scripts/seed-countries.ts
 */
import { prisma } from "../src/lib/prisma";

const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"] as const;

const COUNTRIES: {
  code: string;
  flag: string;
  order: number;
  names: Partial<Record<typeof LANGS[number], string>>;
}[] = [
  {
    code: "TH", flag: "🇹🇭", order: 1,
    names: { en: "Thailand", th: "ประเทศไทย", cn: "泰国", de: "Thailand", fr: "Thaïlande", ru: "Таиланд", ko: "태국", ja: "タイ" },
  },
  {
    code: "MV", flag: "🇲🇻", order: 2,
    names: { en: "Maldives", th: "มัลดีฟส์", cn: "马尔代夫", de: "Malediven", fr: "Maldives", ru: "Мальдивы", ko: "몰디브", ja: "モルディブ" },
  },
  {
    code: "ID", flag: "🇮🇩", order: 3,
    names: { en: "Indonesia", th: "อินโดนีเซีย", cn: "印度尼西亚", de: "Indonesien", fr: "Indonésie", ru: "Индонезия", ko: "인도네시아", ja: "インドネシア" },
  },
  {
    code: "PH", flag: "🇵🇭", order: 4,
    names: { en: "Philippines", th: "ฟิลิปปินส์", cn: "菲律宾", de: "Philippinen", fr: "Philippines", ru: "Филиппины", ko: "필리핀", ja: "フィリピン" },
  },
  {
    code: "MY", flag: "🇲🇾", order: 5,
    names: { en: "Malaysia", th: "มาเลเซีย", cn: "马来西亚", de: "Malaysia", fr: "Malaisie", ru: "Малайзия", ko: "말레이시아", ja: "マレーシア" },
  },
  {
    code: "EG", flag: "🇪🇬", order: 6,
    names: { en: "Egypt", th: "อียิปต์", cn: "埃及", de: "Ägypten", fr: "Égypte", ru: "Египет", ko: "이집트", ja: "エジプト" },
  },
  {
    code: "PW", flag: "🇵🇼", order: 7,
    names: { en: "Palau", th: "ปาเลา", cn: "帕劳", de: "Palau", fr: "Palaos", ru: "Палау", ko: "팔라우", ja: "パラオ" },
  },
];

async function main() {
  for (const c of COUNTRIES) {
    const country = await prisma.country.upsert({
      where: { code: c.code },
      update: {
        flag: c.flag,
        order: c.order,
        status: "ACTIVE",
      },
      create: {
        code: c.code,
        flag: c.flag,
        order: c.order,
        status: "ACTIVE",
      },
    });

    for (const lang of LANGS) {
      const name = c.names[lang] ?? "";
      await prisma.countryTranslation.upsert({
        where: { countryId_lang: { countryId: country.id, lang } },
        update: { name },
        create: { countryId: country.id, lang, name },
      });
    }

    console.log(`✓ ${c.flag} ${c.code} (${c.names.th ?? c.names.en})`);
  }

  console.log(`\nDone — ${COUNTRIES.length} countries seeded.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
