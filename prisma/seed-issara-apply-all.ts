/**
 * Apply translations from 7 template schedules to all remaining 55 Issara schedules.
 * - Copies content from the matching template (based on route type)
 * - Keeps Thai title as-is (user already set them)
 * - For generic "อันดามัน" trips, uses N. Andaman content but with adjusted titles
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

// Template schedule IDs (the 7 samples already completed)
const TEMPLATES = {
  N_ANDAMAN:    "cmnrmfir40000tckzp5kvsepr",  // อันดามันเหนือ 4D5N
  S_ANDAMAN:    "cmnrmfitk001ctckz4z2xy09w",  // อันดามันใต้ 4D5N
  HIN_MUANG:    "cmnrmfiut002otckzxu34rnkm",  // หินม่วง-หินแดง 3D4N
  RACHA_PP:     "cmnrmfiw00040tckzgtwwi0nk",  // ราชา-พีพี 3D4N
  KOH_LIPE:     "cmnrmfiwr005ctckzl6mndyww",  // เกาะหลีเป๊ะ 3D4N
  NS_ANDAMAN:   "cmnrmfj0i00cotckzdn5yrmrp",  // อันดามันเหนือ+ใต้ 5D6N
  RACHA_2D:     "cmnrmfj1j00f0tckz9var2ybi",  // ราชา 2D2N
} as const;

const templateIds = new Set(Object.values(TEMPLATES));

// Title overrides for "generic Andaman" trips (different from "North Andaman")
const GENERIC_ANDAMAN_TITLES: Record<string, { title: string; slug: string }> = {
  th: { title: "อันดามัน 4 วัน 5 คืน", slug: "andaman-4d5n" },
  en: { title: "Andaman 4 Days 5 Nights", slug: "andaman-4d5n" },
  cn: { title: "安达曼 4天5夜", slug: "andaman-4d5n" },
  de: { title: "Andamanen 4 Tage 5 Nächte", slug: "andamanen-4t5n" },
  fr: { title: "Andaman 4 Jours 5 Nuits", slug: "andaman-4j5n" },
  ru: { title: "Андаман 4 дня 5 ночей", slug: "andaman-4d5n" },
  ko: { title: "안다만 4일 5박", slug: "andaman-4d5n" },
  ja: { title: "アンダマン 4日間5泊", slug: "andaman-4d5n" },
};

// Map each remaining schedule to its template
function getTemplateId(thTitle: string, thRoute: string): string {
  if (thTitle.includes("เหนือ+ใต้") || thRoute === "N+S. Andaman") return TEMPLATES.NS_ANDAMAN;
  if (thTitle.includes("อันดามันเหนือ") || thRoute === "N. Andaman") return TEMPLATES.N_ANDAMAN;
  if (thTitle.includes("อันดามันใต้") || thRoute === "S. Andaman") return TEMPLATES.S_ANDAMAN;
  if (thTitle.includes("หินม่วง") || thRoute === "Hin Muang-Hin Daeng") return TEMPLATES.HIN_MUANG;
  if (thTitle.includes("ราชา-พีพี") || thRoute === "Racha-PhiPhi") return TEMPLATES.RACHA_PP;
  if (thTitle.includes("หลีเป๊ะ") || thRoute === "Koh Lipe") return TEMPLATES.KOH_LIPE;
  if (thTitle.includes("ราชา") || thRoute === "Racha") return TEMPLATES.RACHA_2D;
  // Generic "อันดามัน" → use N. Andaman content
  if (thTitle.includes("อันดามัน") || thRoute === "Andaman") return TEMPLATES.N_ANDAMAN;
  return TEMPLATES.N_ANDAMAN; // fallback
}

function isGenericAndaman(thTitle: string, thRoute: string): boolean {
  // Not specifically north, south, or N+S — just "อันดามัน"
  if (thTitle.includes("เหนือ") || thTitle.includes("ใต้")) return false;
  if (thRoute === "N. Andaman" || thRoute === "S. Andaman" || thRoute === "N+S. Andaman") return false;
  if (thTitle.includes("อันดามัน") || thRoute === "Andaman") return true;
  return false;
}

async function main() {
  // 1. Get all Issara schedules
  const schedules = await prisma.schedule.findMany({
    where: { boatId: "cmn94ruo8000ctlkz550rc2ul" },
    include: { translations: true },
    orderBy: { departureDate: "asc" },
  });

  console.log(`Found ${schedules.length} Issara schedules total`);

  // 2. Load template translations (indexed by templateId → lang → data)
  const templateTransMap = new Map<string, Map<string, any>>();
  for (const tid of templateIds) {
    const trans = await prisma.scheduleTranslation.findMany({ where: { scheduleId: tid } });
    const langMap = new Map<string, any>();
    for (const t of trans) langMap.set(t.lang, t);
    templateTransMap.set(tid, langMap);
  }

  // 3. Process remaining schedules
  const remaining = schedules.filter(s => !templateIds.has(s.id));
  console.log(`Processing ${remaining.length} remaining schedules...\n`);

  let updated = 0;
  for (const sched of remaining) {
    const thTrans = sched.translations.find(t => t.lang === "th");
    const thTitle = thTrans?.title || "";
    const thRoute = thTrans?.route || "";

    const templateId = getTemplateId(thTitle, thRoute);
    const templateLangs = templateTransMap.get(templateId);
    if (!templateLangs) {
      console.log(`  [SKIP] ${sched.id} — no template found`);
      continue;
    }

    const generic = isGenericAndaman(thTitle, thRoute);
    const depDate = sched.departureDate ? new Date(sched.departureDate).toISOString().slice(0, 10) : "?";
    const templateName = Object.entries(TEMPLATES).find(([, v]) => v === templateId)?.[0] || "?";

    console.log(`${depDate} | ${thTitle} → ${templateName}${generic ? " (generic)" : ""}`);

    // Update each language
    for (const [lang, tmpl] of templateLangs) {
      let title = tmpl.title;
      let slug = tmpl.slug;

      // Override title/slug for generic Andaman trips
      if (generic && GENERIC_ANDAMAN_TITLES[lang]) {
        title = GENERIC_ANDAMAN_TITLES[lang].title;
        slug = GENERIC_ANDAMAN_TITLES[lang].slug;
      }

      await prisma.scheduleTranslation.updateMany({
        where: { scheduleId: sched.id, lang },
        data: {
          title,
          slug,
          excerpt: tmpl.excerpt,
          content: tmpl.content,
          itinerary: tmpl.itinerary,
          route: tmpl.route,
          keywords: tmpl.keywords,
        },
      });
    }
    updated++;
  }

  console.log(`\n✓ Updated ${updated} schedules (all 8 languages each)`);
  console.log(`✓ Total translations: ${updated * 8} rows`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
