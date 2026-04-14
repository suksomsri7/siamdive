import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function thaiDate(d: Date): string {
  return `${d.getUTCDate()} ${THAI_MONTHS[d.getUTCMonth()]}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

// Checkout day HTML to append
const checkoutHtml = (dateStr: string) =>
  `\n\n<h3>${dateStr} — Check Out</h3>\n<p>อาหารเช้าบนเรือ<br>\n09:00 เช็คเอาท์ เก็บสัมภาระ<br>\nรถส่งกลับสนามบินภูเก็ต (แนะนำจองเที่ยวบินหลังเที่ยง)</p>`;

async function main() {
  const BOAT_ID = "cmn94ruo8000ctlkz550rc2ul";

  // Get 7 trips that have itinerary data
  const trips = await prisma.scheduleTranslation.findMany({
    where: {
      lang: "th",
      itinerary: { not: "" },
      schedule: { boatId: BOAT_ID },
    },
    include: { schedule: true },
    orderBy: { schedule: { departureDate: "asc" } },
  });

  console.log(`Found ${trips.length} trips to update`);

  for (const trip of trips) {
    const dep = trip.schedule.departureDate!;
    const ret = trip.schedule.returnDate!;
    console.log(`\nTrip: ${trip.title} (${dep.toISOString().slice(0, 10)} → ${ret.toISOString().slice(0, 10)})`);

    let itinerary = trip.itinerary;

    // Replace "วันที่ N" with actual dates
    // Find all "วันที่ N" patterns and replace with actual date
    const totalDaysInItinerary = (itinerary.match(/วันที่\s+\d+/g) || []).length;
    console.log(`  Days in itinerary: ${totalDaysInItinerary}`);

    for (let i = 1; i <= totalDaysInItinerary; i++) {
      const actualDate = addDays(dep, i - 1);
      const dateStr = thaiDate(actualDate);
      const regex = new RegExp(`วันที่\\s+${i}\\s+—`, "g");
      itinerary = itinerary.replace(regex, `${dateStr} —`);
    }

    // Add checkout day (return date)
    const lastDayInItinerary = addDays(dep, totalDaysInItinerary - 1);
    const returnDateNorm = ret.toISOString().slice(0, 10);
    const lastDayNorm = lastDayInItinerary.toISOString().slice(0, 10);

    if (returnDateNorm > lastDayNorm) {
      const checkout = checkoutHtml(thaiDate(ret));
      itinerary += checkout;
      console.log(`  Added checkout day: ${thaiDate(ret)}`);
    } else {
      console.log(`  Return date already covered, no checkout added`);
    }

    // Update itinerary column
    await prisma.scheduleTranslation.update({
      where: { id: trip.id },
      data: { itinerary },
    });

    // Also update content column where itinerary was merged
    let content = trip.content;
    // Find the old itinerary block inside content (between "โปรแกรมรายวัน" and "รวมในราคา")
    const startMarker = "<h3>โปรแกรมรายวัน (Itinerary)</h3>";
    const endMarker = "<h3>รวมในราคา";
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);

    if (startIdx !== -1 && endIdx !== -1) {
      // Replace the itinerary portion inside content
      const newBlock = startMarker + "\n" + itinerary + "\n\n";
      content = content.substring(0, startIdx) + newBlock + content.substring(endIdx);

      await prisma.scheduleTranslation.update({
        where: { id: trip.id },
        data: { content },
      });
      console.log(`  Updated content field`);
    } else {
      console.log(`  WARNING: Could not find itinerary markers in content`);
    }

    // Preview first line
    const firstLine = itinerary.split("\n")[0];
    console.log(`  Preview: ${firstLine}`);
  }

  console.log("\nDone!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
