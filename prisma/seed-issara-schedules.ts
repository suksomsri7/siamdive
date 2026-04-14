import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

const BOAT_ID = "cmn94ruo8000ctlkz550rc2ul";
const PACKAGE_IDS = [
  "pkg_issara_master_001",
  "pkg_issara_deluxe_001",
  "pkg_issara_standard_001",
];
const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];

type Trip = {
  num: number;
  dest: string;
  titleEn: string;
  titleTh: string;
  departure: string; // ISO date
  returnDate: string; // ISO date
  duration: string; // e.g. "4D5N"
  status: "OPEN" | "FULL";
};

// All trips from the Google Sheet, starting from trip 30 (Apr 10, 2026 onward)
const trips: Trip[] = [
  // APR 2026
  { num: 30, dest: "N. Andaman", titleEn: "N. Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-04-10", returnDate: "2026-04-15", duration: "4D5N", status: "OPEN" },
  { num: 31, dest: "N. Andaman", titleEn: "N. Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-04-16", returnDate: "2026-04-21", duration: "4D5N", status: "FULL" },
  { num: 32, dest: "N. Andaman", titleEn: "N. Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-04-22", returnDate: "2026-04-27", duration: "4D5N", status: "FULL" },
  { num: 33, dest: "S. Andaman", titleEn: "S. Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-04-29", returnDate: "2026-05-04", duration: "4D5N", status: "FULL" },

  // MAY 2026
  { num: 34, dest: "S. Andaman", titleEn: "S. Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-05-06", returnDate: "2026-05-11", duration: "4D5N", status: "OPEN" },
  { num: 35, dest: "S. Andaman", titleEn: "S. Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-05-13", returnDate: "2026-05-18", duration: "4D5N", status: "OPEN" },
  { num: 36, dest: "S. Andaman", titleEn: "S. Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-05-20", returnDate: "2026-05-25", duration: "4D5N", status: "OPEN" },
  { num: 37, dest: "S. Andaman", titleEn: "S. Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-05-28", returnDate: "2026-06-02", duration: "4D5N", status: "OPEN" },

  // JUN 2026
  { num: 38, dest: "Hin Muang-Hin Daeng", titleEn: "Hin Muang-Hin Daeng 3D4N", titleTh: "หินม่วง-หินแดง 3 วัน 4 คืน", departure: "2026-06-03", returnDate: "2026-06-07", duration: "3D4N", status: "OPEN" },
  { num: 39, dest: "Hin Muang-Hin Daeng", titleEn: "Hin Muang-Hin Daeng 3D4N", titleTh: "หินม่วง-หินแดง 3 วัน 4 คืน", departure: "2026-06-11", returnDate: "2026-06-15", duration: "3D4N", status: "OPEN" },
  { num: 40, dest: "Hin Muang-Hin Daeng", titleEn: "Hin Muang-Hin Daeng 3D4N", titleTh: "หินม่วง-หินแดง 3 วัน 4 คืน", departure: "2026-06-18", returnDate: "2026-06-22", duration: "3D4N", status: "OPEN" },
  { num: 41, dest: "Hin Muang-Hin Daeng", titleEn: "Hin Muang-Hin Daeng 3D4N", titleTh: "หินม่วง-หินแดง 3 วัน 4 คืน", departure: "2026-06-25", returnDate: "2026-06-29", duration: "3D4N", status: "OPEN" },

  // JUL 2026
  { num: 42, dest: "Racha-PhiPhi", titleEn: "Racha-Phi Phi 3D4N", titleTh: "ราชา-พีพี 3 วัน 4 คืน", departure: "2026-07-02", returnDate: "2026-07-06", duration: "3D4N", status: "OPEN" },
  { num: 43, dest: "Racha-PhiPhi", titleEn: "Racha-Phi Phi 3D4N", titleTh: "ราชา-พีพี 3 วัน 4 คืน", departure: "2026-07-09", returnDate: "2026-07-13", duration: "3D4N", status: "OPEN" },
  { num: 44, dest: "Racha-PhiPhi", titleEn: "Racha-Phi Phi 3D4N", titleTh: "ราชา-พีพี 3 วัน 4 คืน", departure: "2026-07-16", returnDate: "2026-07-20", duration: "3D4N", status: "OPEN" },
  { num: 45, dest: "Racha-PhiPhi", titleEn: "Racha-Phi Phi 3D4N", titleTh: "ราชา-พีพี 3 วัน 4 คืน", departure: "2026-07-23", returnDate: "2026-07-27", duration: "3D4N", status: "OPEN" },

  // AUG 2026
  { num: 46, dest: "Koh Lipe", titleEn: "Koh Lipe 3D4N", titleTh: "เกาะหลีเป๊ะ 3 วัน 4 คืน", departure: "2026-07-28", returnDate: "2026-08-01", duration: "3D4N", status: "OPEN" },
  { num: 47, dest: "Koh Lipe", titleEn: "Koh Lipe 3D4N", titleTh: "เกาะหลีเป๊ะ 3 วัน 4 คืน", departure: "2026-08-05", returnDate: "2026-08-09", duration: "3D4N", status: "OPEN" },
  { num: 48, dest: "Koh Lipe", titleEn: "Koh Lipe 3D4N", titleTh: "เกาะหลีเป๊ะ 3 วัน 4 คืน", departure: "2026-08-12", returnDate: "2026-08-16", duration: "3D4N", status: "OPEN" },
  { num: 49, dest: "Koh Lipe", titleEn: "Koh Lipe 3D4N", titleTh: "เกาะหลีเป๊ะ 3 วัน 4 คืน", departure: "2026-08-20", returnDate: "2026-08-24", duration: "3D4N", status: "OPEN" },
  { num: 50, dest: "Koh Lipe", titleEn: "Koh Lipe 3D4N", titleTh: "เกาะหลีเป๊ะ 3 วัน 4 คืน", departure: "2026-08-27", returnDate: "2026-08-31", duration: "3D4N", status: "OPEN" },

  // SEP 2026
  { num: 51, dest: "Koh Lipe", titleEn: "Koh Lipe 3D4N", titleTh: "เกาะหลีเป๊ะ 3 วัน 4 คืน", departure: "2026-09-03", returnDate: "2026-09-07", duration: "3D4N", status: "OPEN" },
  { num: 52, dest: "Koh Lipe", titleEn: "Koh Lipe 3D4N", titleTh: "เกาะหลีเป๊ะ 3 วัน 4 คืน", departure: "2026-09-10", returnDate: "2026-09-14", duration: "3D4N", status: "OPEN" },
  { num: 53, dest: "Koh Lipe", titleEn: "Koh Lipe 3D4N", titleTh: "เกาะหลีเป๊ะ 3 วัน 4 คืน", departure: "2026-09-17", returnDate: "2026-09-21", duration: "3D4N", status: "OPEN" },
  { num: 54, dest: "Koh Lipe", titleEn: "Koh Lipe 3D4N", titleTh: "เกาะหลีเป๊ะ 3 วัน 4 คืน", departure: "2026-09-24", returnDate: "2026-09-28", duration: "3D4N", status: "OPEN" },

  // OCT 2026
  { num: 55, dest: "S. Andaman", titleEn: "S. Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-09-30", returnDate: "2026-10-05", duration: "4D5N", status: "OPEN" },
  { num: 56, dest: "S. Andaman", titleEn: "S. Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-10-07", returnDate: "2026-10-12", duration: "4D5N", status: "OPEN" },
  { num: 57, dest: "S. Andaman", titleEn: "S. Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-10-13", returnDate: "2026-10-18", duration: "4D5N", status: "OPEN" },
  { num: 58, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-10-21", returnDate: "2026-10-26", duration: "4D5N", status: "OPEN" },
  { num: 59, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-10-28", returnDate: "2026-11-02", duration: "4D5N", status: "OPEN" },

  // NOV 2026
  { num: 60, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-11-04", returnDate: "2026-11-09", duration: "4D5N", status: "OPEN" },
  { num: 61, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-11-11", returnDate: "2026-11-16", duration: "4D5N", status: "OPEN" },
  { num: 62, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-11-18", returnDate: "2026-11-23", duration: "4D5N", status: "OPEN" },
  { num: 63, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-11-25", returnDate: "2026-11-30", duration: "4D5N", status: "OPEN" },

  // DEC 2026
  { num: 64, dest: "N. Andaman", titleEn: "N. Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-12-03", returnDate: "2026-12-08", duration: "4D5N", status: "FULL" },
  { num: 65, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-12-09", returnDate: "2026-12-14", duration: "4D5N", status: "OPEN" },
  { num: 66, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-12-16", returnDate: "2026-12-21", duration: "4D5N", status: "OPEN" },
  { num: 67, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-12-23", returnDate: "2026-12-28", duration: "4D5N", status: "OPEN" },

  // JAN 2027
  { num: 68, dest: "N+S. Andaman", titleEn: "N+S Andaman 5D6N", titleTh: "อันดามันเหนือ+ใต้ 5 วัน 6 คืน", departure: "2026-12-29", returnDate: "2027-01-04", duration: "5D6N", status: "OPEN" },
  { num: 69, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-01-06", returnDate: "2027-01-11", duration: "4D5N", status: "OPEN" },
  { num: 70, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-01-13", returnDate: "2027-01-18", duration: "4D5N", status: "OPEN" },
  { num: 71, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-01-20", returnDate: "2027-01-25", duration: "4D5N", status: "OPEN" },
  { num: 72, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-01-27", returnDate: "2027-02-01", duration: "4D5N", status: "OPEN" },

  // FEB 2027
  { num: 73, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-02-03", returnDate: "2027-02-08", duration: "4D5N", status: "OPEN" },
  { num: 74, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-02-10", returnDate: "2027-02-15", duration: "4D5N", status: "OPEN" },
  { num: 75, dest: "Racha", titleEn: "Racha 2D2N", titleTh: "ราชา 2 วัน 2 คืน", departure: "2027-02-15", returnDate: "2027-02-17", duration: "2D2N", status: "OPEN" },
  { num: 76, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-02-18", returnDate: "2027-02-23", duration: "4D5N", status: "OPEN" },
  { num: 77, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-02-24", returnDate: "2027-03-01", duration: "4D5N", status: "OPEN" },

  // MAR 2027
  { num: 78, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-03-03", returnDate: "2027-03-08", duration: "4D5N", status: "OPEN" },
  { num: 79, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-03-10", returnDate: "2027-03-15", duration: "4D5N", status: "OPEN" },
  { num: 80, dest: "N. Andaman", titleEn: "N. Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2027-03-17", returnDate: "2027-03-22", duration: "4D5N", status: "FULL" },
  { num: 81, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-03-24", returnDate: "2027-03-29", duration: "4D5N", status: "OPEN" },
  { num: 82, dest: "Racha", titleEn: "Racha 2D2N", titleTh: "ราชา 2 วัน 2 คืน", departure: "2027-03-29", returnDate: "2027-03-31", duration: "2D2N", status: "OPEN" },

  // APR 2027
  { num: 83, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-04-01", returnDate: "2027-04-06", duration: "4D5N", status: "OPEN" },
  { num: 84, dest: "Racha", titleEn: "Racha 2D2N", titleTh: "ราชา 2 วัน 2 คืน", departure: "2027-04-06", returnDate: "2027-04-08", duration: "2D2N", status: "OPEN" },
  { num: 85, dest: "N+S. Andaman", titleEn: "N+S Andaman 5D6N", titleTh: "อันดามันเหนือ+ใต้ 5 วัน 6 คืน", departure: "2027-04-09", returnDate: "2027-04-15", duration: "5D6N", status: "OPEN" },
  { num: 86, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-04-16", returnDate: "2027-04-21", duration: "4D5N", status: "OPEN" },
  { num: 87, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-04-21", returnDate: "2027-04-26", duration: "4D5N", status: "OPEN" },
  { num: 88, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-04-29", returnDate: "2027-05-04", duration: "4D5N", status: "OPEN" },

  // MAY 2027
  { num: 89, dest: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-05-05", returnDate: "2027-05-10", duration: "4D5N", status: "OPEN" },
  { num: 90, dest: "S. Andaman", titleEn: "S. Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2027-05-12", returnDate: "2027-05-17", duration: "4D5N", status: "OPEN" },
  { num: 91, dest: "S. Andaman", titleEn: "S. Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2027-05-19", returnDate: "2027-05-24", duration: "4D5N", status: "OPEN" },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log(`Inserting ${trips.length} schedules for Issara Liveaboard...`);

  // Verify boat exists
  const boat = await prisma.boat.findUnique({ where: { id: BOAT_ID } });
  if (!boat) {
    console.error("Boat not found!");
    process.exit(1);
  }
  console.log(`Boat: ${boat.name} (${boat.id})`);

  // Verify packages exist
  const packages = await prisma.package.findMany({ where: { id: { in: PACKAGE_IDS } } });
  console.log(`Packages found: ${packages.length}`);
  if (packages.length !== 3) {
    console.error("Expected 3 packages, aborting");
    process.exit(1);
  }

  let created = 0;
  let failed = 0;

  for (const trip of trips) {
    try {
      const slug = slugify(`issara-${trip.dest}-${trip.departure}`);

      const schedule = await prisma.schedule.create({
        data: {
          boatId: BOAT_ID,
          dateType: "single",
          departureDate: new Date(trip.departure),
          returnDate: new Date(trip.returnDate),
          totalSeats: 22,
          availableSeats: trip.status === "FULL" ? 0 : 22,
          status: trip.status,
          season: null,
          note: `Trip #${trip.num}`,
          itinerary: "",
          translations: {
            create: LANGS.map(lang => ({
              lang,
              title: lang === "th" ? trip.titleTh : trip.titleEn,
              slug: slug,
              excerpt: "",
              content: "",
              itinerary: "",
              route: trip.dest,
              keywords: [],
            })),
          },
          packages: {
            create: PACKAGE_IDS.map(pkgId => ({
              packageId: pkgId,
              availableSeats: trip.status === "FULL" ? 0 : null,
              isFull: trip.status === "FULL",
              appendScheduleDetail: false,
            })),
          },
        },
      });

      created++;
      console.log(`  [${created}/${trips.length}] Trip #${trip.num}: ${trip.titleEn} (${trip.departure}) → ${schedule.id}`);
    } catch (err) {
      failed++;
      console.error(`  FAILED Trip #${trip.num}: ${err}`);
    }
  }

  console.log(`\nDone! Created: ${created}, Failed: ${failed}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
