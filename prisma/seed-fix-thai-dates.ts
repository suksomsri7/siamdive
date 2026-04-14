/**
 * Fix Thai itinerary dates for all 62 Issara schedules.
 *
 * The user edited Thai content with dates in format "DD เดือน" (e.g., "10 เม.ย.")
 * instead of "วันที่ N". Each schedule's itinerary was copied from a template
 * with the TEMPLATE's dates — we need to replace with the ACTUAL departure dates.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

const BOAT_ID = "cmn94ruo8000ctlkz550rc2ul";

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

// Escape dots for regex
const TH_MONTHS_RE = TH_MONTHS.map(m => m.replace(/\./g, "\\.")).join("|");

// Pattern: <h3>DD เดือน — (captures day number and month)
const TH_DATE_PATTERN = new RegExp(`<h3>(\\d{1,2})\\s+(${TH_MONTHS_RE})`, "g");

function formatThaiDate(date: Date): string {
  const d = date.getUTCDate();
  const m = date.getUTCMonth(); // 0-based
  return `${d} ${TH_MONTHS[m]}`;
}

function fixThaiDates(itinerary: string, departureDate: Date): string {
  // Find all dates in order, replace each with departureDate + offset
  let dayOffset = 0;

  return itinerary.replace(TH_DATE_PATTERN, (match, dayStr, monthStr) => {
    const date = new Date(departureDate);
    date.setUTCDate(date.getUTCDate() + dayOffset);
    const newDateStr = formatThaiDate(date);
    dayOffset++;
    return `<h3>${newDateStr}`;
  });
}

async function main() {
  const schedules = await prisma.schedule.findMany({
    where: { boatId: BOAT_ID },
    include: { translations: { where: { lang: "th" } } },
    orderBy: { departureDate: "asc" },
  });

  console.log(`Fixing Thai dates for ${schedules.length} schedules...\n`);

  let fixed = 0;
  for (const sched of schedules) {
    if (!sched.departureDate) continue;
    const depDate = new Date(sched.departureDate);
    const depStr = depDate.toISOString().slice(0, 10);
    const thTrans = sched.translations[0];
    if (!thTrans?.itinerary) continue;

    const updated = fixThaiDates(thTrans.itinerary, depDate);
    if (updated !== thTrans.itinerary) {
      await prisma.scheduleTranslation.updateMany({
        where: { scheduleId: sched.id, lang: "th" },
        data: { itinerary: updated },
      });

      // Show first h3 for verification
      const firstH3 = updated.match(/<h3>[^<]+<\/h3>/)?.[0] || "";
      console.log(`  ${depStr} | ${firstH3}`);
      fixed++;
    } else {
      console.log(`  ${depStr} | (no Thai dates found to fix)`);
    }
  }

  console.log(`\n✓ Fixed Thai dates for ${fixed} schedules`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
