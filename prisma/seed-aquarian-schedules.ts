import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

const BOAT_ID = "cmn94rye1000ftlkzjc9c32lv"; // Aquarian Liveaboard
const PACKAGE_IDS = [
  "pkg_aquarian_dtwin_001",    // Deluxe Twin Cabin
  "pkg_aquarian_dking_001",    // Deluxe King Seaview Cabin
  "pkg_aquarian_dtwinsv_001",  // Deluxe Twin Seaview Cabin
  "pkg_aquarian_bunk_001",     // Low Deck Bunk Cabin
];
const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];

type Trip = {
  num: number;
  route: string;
  titleEn: string;
  titleTh: string;
  departure: string;
  returnDate: string;
  dives: number;
  status: "OPEN" | "FULL";
  organizer: string;
  holiday: string;
};

const trips: Trip[] = [
  // APR 2026
  { num: 109, route: "North Andaman", titleEn: "North Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-04-08", returnDate: "2026-04-13", dives: 15, status: "OPEN", organizer: "ครูหนุน (เปิดจอย)", holiday: "สงกรานต์" },
  { num: 110, route: "North Andaman", titleEn: "North Andaman 3D4N", titleTh: "อันดามันเหนือ 3 วัน 4 คืน", departure: "2026-04-15", returnDate: "2026-04-19", dives: 15, status: "OPEN", organizer: "Honeymoon Trip ครูกบ Private", holiday: "สงกรานต์" },
  { num: 111, route: "North Andaman", titleEn: "North Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-04-22", returnDate: "2026-04-27", dives: 15, status: "OPEN", organizer: "Siam Dive (-5%)", holiday: "" },
  { num: 112, route: "South Andaman", titleEn: "South Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-04-29", returnDate: "2026-05-04", dives: 15, status: "OPEN", organizer: "Let's Dive Thailand", holiday: "วันแรงงาน + วันฉัตรมงคล" },

  // MAY 2026
  { num: 113, route: "North Andaman", titleEn: "North Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-05-05", returnDate: "2026-05-10", dives: 15, status: "FULL", organizer: "K Dive by ครูชิต", holiday: "" },
  // #114 SKIP — ขึ้นคาน Annual Ship Service 11-20 May

  // MAY-JUN 2026 — Koh Tao
  { num: 115, route: "Koh Tao", titleEn: "Koh Tao 3D4N", titleTh: "เกาะเต่า 3 วัน 4 คืน", departure: "2026-05-30", returnDate: "2026-06-03", dives: 12, status: "OPEN", organizer: "Phuket Diving Club + Weekday Diving", holiday: "วันวิสาขบูชา" },
  { num: 116, route: "Koh Tao", titleEn: "Koh Tao 3D4N", titleTh: "เกาะเต่า 3 วัน 4 คืน", departure: "2026-06-03", returnDate: "2026-06-07", dives: 12, status: "OPEN", organizer: "Private Trip", holiday: "วันเฉลิมฯพระบรมราชินี" },
  { num: 117, route: "Koh Tao", titleEn: "Koh Tao 3D4N", titleTh: "เกาะเต่า 3 วัน 4 คืน", departure: "2026-06-11", returnDate: "2026-06-15", dives: 12, status: "OPEN", organizer: "Scubajam (Credit)", holiday: "" },
  { num: 118, route: "Koh Tao", titleEn: "Koh Tao 3D4N", titleTh: "เกาะเต่า 3 วัน 4 คืน", departure: "2026-06-18", returnDate: "2026-06-22", dives: 12, status: "OPEN", organizer: "Recon Diver Club", holiday: "" },
  { num: 119, route: "Koh Tao", titleEn: "Koh Tao 3D4N", titleTh: "เกาะเต่า 3 วัน 4 คืน", departure: "2026-06-25", returnDate: "2026-06-29", dives: 12, status: "OPEN", organizer: "Crazy Dive", holiday: "" },

  // JUL 2026 — Losin
  { num: 120, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-07-03", returnDate: "2026-07-07", dives: 11, status: "OPEN", organizer: "The Living Sea ครูต้อ", holiday: "" },
  { num: 121, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-07-09", returnDate: "2026-07-13", dives: 11, status: "OPEN", organizer: "ครูดนัย", holiday: "" },
  { num: 122, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-07-16", returnDate: "2026-07-20", dives: 11, status: "OPEN", organizer: "Blackwater Schoolba Club", holiday: "" },
  { num: 123, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-07-24", returnDate: "2026-07-28", dives: 11, status: "OPEN", organizer: "Blxck Diamond", holiday: "King's Birthday" },
  { num: 124, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-07-29", returnDate: "2026-08-02", dives: 11, status: "OPEN", organizer: "Dive Terminal", holiday: "อาสาฬหบูชา+เข้าพรรษา" },

  // AUG 2026 — Losin
  { num: 125, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-08-06", returnDate: "2026-08-10", dives: 11, status: "OPEN", organizer: "Shall We Dive", holiday: "" },
  { num: 126, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-08-12", returnDate: "2026-08-16", dives: 11, status: "OPEN", organizer: "Seasun Scuba", holiday: "วันเฉลิมฯพระนางเจ้าสิริกิต์+วันแม่" },
  { num: 127, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-08-20", returnDate: "2026-08-24", dives: 11, status: "OPEN", organizer: "Scuba Paradive", holiday: "" },
  { num: 128, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-08-27", returnDate: "2026-08-31", dives: 11, status: "OPEN", organizer: "Let's Dive Thailand", holiday: "" },

  // SEP 2026 — Losin
  { num: 129, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-09-03", returnDate: "2026-09-07", dives: 11, status: "OPEN", organizer: "Shall We Dive + Dive Info", holiday: "" },
  { num: 130, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-09-10", returnDate: "2026-09-14", dives: 11, status: "OPEN", organizer: "Crazy Dive", holiday: "" },
  { num: 131, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-09-17", returnDate: "2026-09-21", dives: 11, status: "OPEN", organizer: "Seasun Scuba", holiday: "" },
  { num: 132, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2026-09-24", returnDate: "2026-09-28", dives: 11, status: "OPEN", organizer: "Padum", holiday: "" },
  // อ้อมแหลม 28 Sep - 2 Oct 2026 — SKIP

  // OCT 2026 — South Andaman
  { num: 135, route: "South Andaman", titleEn: "South Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-10-08", returnDate: "2026-10-13", dives: 15, status: "OPEN", organizer: "Just Dive", holiday: "King Rama 9 Memorial Day" },
  { num: 136, route: "South Andaman", titleEn: "South Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-10-13", returnDate: "2026-10-18", dives: 15, status: "OPEN", organizer: "Crazy Dive", holiday: "King Rama 9 Memorial Day" },
  { num: 137, route: "South Andaman", titleEn: "South Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-10-21", returnDate: "2026-10-26", dives: 15, status: "OPEN", organizer: "Dive Terminal", holiday: "วันปิยมหาราช" },
  { num: 138, route: "South Andaman", titleEn: "South Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-10-28", returnDate: "2026-11-02", dives: 15, status: "OPEN", organizer: "ScubaJam (Credit)", holiday: "" },

  // NOV 2026
  { num: 139, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-11-04", returnDate: "2026-11-09", dives: 15, status: "OPEN", organizer: "Tuapiak Watersports", holiday: "" },
  { num: 140, route: "North Andaman", titleEn: "North Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-11-11", returnDate: "2026-11-16", dives: 15, status: "OPEN", organizer: "Let's Dive Thailand", holiday: "" },
  { num: 141, route: "South Andaman", titleEn: "South Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2026-11-17", returnDate: "2026-11-22", dives: 15, status: "OPEN", organizer: "Recon Diver Club", holiday: "" },
  { num: 142, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-11-25", returnDate: "2026-11-30", dives: 15, status: "OPEN", organizer: "Blxckdiamond", holiday: "" },

  // DEC 2026
  { num: 143, route: "North Andaman", titleEn: "North Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-12-02", returnDate: "2026-12-07", dives: 15, status: "OPEN", organizer: "Seasun Scuba", holiday: "วันพ่อ" },
  { num: 144, route: "North Andaman", titleEn: "North Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-12-09", returnDate: "2026-12-14", dives: 15, status: "OPEN", organizer: "Scuba Paradive", holiday: "วันรัฐธรรมนูญ" },
  { num: 145, route: "North Andaman", titleEn: "North Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2026-12-16", returnDate: "2026-12-21", dives: 15, status: "OPEN", organizer: "Phuket Diving Club ครูเจด (เปิดจอย)", holiday: "" },
  { num: 146, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-12-23", returnDate: "2026-12-28", dives: 15, status: "OPEN", organizer: "", holiday: "Christmas" },
  { num: 147, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2026-12-30", returnDate: "2027-01-04", dives: 15, status: "OPEN", organizer: "Duo Dive", holiday: "New Year" },

  // JAN 2027
  { num: 148, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-01-06", returnDate: "2027-01-11", dives: 15, status: "OPEN", organizer: "(Charter Price Discount 5%)", holiday: "" },
  { num: 149, route: "Andaman", titleEn: "Andaman 3D4N", titleTh: "อันดามัน 3 วัน 4 คืน", departure: "2027-01-14", returnDate: "2027-01-18", dives: 15, status: "OPEN", organizer: "Blxck Diamond", holiday: "" },
  { num: 150, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-01-20", returnDate: "2027-01-25", dives: 15, status: "OPEN", organizer: "", holiday: "" },
  { num: 151, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-01-27", returnDate: "2027-02-01", dives: 15, status: "OPEN", organizer: "Muanjai ม่วนใจ๋ Diving", holiday: "" },

  // FEB 2027
  { num: 152, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-02-03", returnDate: "2027-02-08", dives: 15, status: "OPEN", organizer: "", holiday: "" },
  { num: 153, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-02-10", returnDate: "2027-02-15", dives: 15, status: "OPEN", organizer: "ครูหนุน", holiday: "" },
  { num: 154, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-02-18", returnDate: "2027-02-23", dives: 15, status: "OPEN", organizer: "Dive Terminal", holiday: "วันมาฆบูชา" },
  { num: 155, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-02-24", returnDate: "2027-03-01", dives: 15, status: "OPEN", organizer: "Padum", holiday: "" },

  // MAR 2027
  { num: 156, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-03-03", returnDate: "2027-03-08", dives: 15, status: "OPEN", organizer: "Let's Dive Thailand", holiday: "" },
  { num: 157, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-03-10", returnDate: "2027-03-15", dives: 15, status: "OPEN", organizer: "Scuba Paradive", holiday: "" },
  { num: 158, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-03-16", returnDate: "2027-03-21", dives: 15, status: "OPEN", organizer: "Recon Diver Club", holiday: "" },
  { num: 159, route: "North Andaman", titleEn: "North Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2027-03-24", returnDate: "2027-03-29", dives: 15, status: "OPEN", organizer: "Shall We Dive", holiday: "" },

  // APR 2027
  { num: 160, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-04-02", returnDate: "2027-04-07", dives: 15, status: "OPEN", organizer: "Dive Terminal", holiday: "วันจักรี" },
  { num: 161, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-04-08", returnDate: "2027-04-13", dives: 15, status: "OPEN", organizer: "", holiday: "วันสงกรานต์" },
  { num: 162, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-04-14", returnDate: "2027-04-19", dives: 15, status: "OPEN", organizer: "Duo Dive", holiday: "วันสงกรานต์" },
  { num: 163, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-04-21", returnDate: "2027-04-26", dives: 15, status: "OPEN", organizer: "(Charter Price Discount 5%)", holiday: "" },
  { num: 164, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-04-29", returnDate: "2027-05-04", dives: 15, status: "OPEN", organizer: "Dive Terminal", holiday: "วันแรงงาน" },

  // MAY 2027
  { num: 165, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-05-04", returnDate: "2027-05-09", dives: 15, status: "OPEN", organizer: "Let's Dive Thailand", holiday: "วันฉัตรมงคล" },
  // อ้อมแหลม 10-30 May 2027 — SKIP

  // JUN 2027 — Koh Tao
  { num: 167, route: "Koh Tao", titleEn: "Koh Tao 3D4N", titleTh: "เกาะเต่า 3 วัน 4 คืน", departure: "2027-06-02", returnDate: "2027-06-06", dives: 13, status: "OPEN", organizer: "", holiday: "วันเฉลิมพระราชินี" },
  { num: 168, route: "Koh Tao", titleEn: "Koh Tao 3D4N", titleTh: "เกาะเต่า 3 วัน 4 คืน", departure: "2027-06-06", returnDate: "2027-06-10", dives: 13, status: "OPEN", organizer: "(Charter Price Discount 5%)", holiday: "" },
  { num: 169, route: "Koh Tao", titleEn: "Koh Tao 3D4N", titleTh: "เกาะเต่า 3 วัน 4 คืน", departure: "2027-06-10", returnDate: "2027-06-14", dives: 13, status: "OPEN", organizer: "Recon Diver Club", holiday: "" },
  { num: 170, route: "Koh Tao", titleEn: "Koh Tao 3D4N", titleTh: "เกาะเต่า 3 วัน 4 คืน", departure: "2027-06-17", returnDate: "2027-06-21", dives: 13, status: "OPEN", organizer: "", holiday: "" },
  { num: 171, route: "Koh Tao", titleEn: "Koh Tao 3D4N", titleTh: "เกาะเต่า 3 วัน 4 คืน", departure: "2027-06-24", returnDate: "2027-06-28", dives: 13, status: "OPEN", organizer: "", holiday: "" },

  // JUL 2027 — Losin
  { num: 172, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-07-01", returnDate: "2027-07-05", dives: 11, status: "OPEN", organizer: "", holiday: "" },
  { num: 173, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-07-05", returnDate: "2027-07-09", dives: 11, status: "OPEN", organizer: "", holiday: "" },
  { num: 174, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-07-09", returnDate: "2027-07-13", dives: 11, status: "OPEN", organizer: "", holiday: "" },
  { num: 175, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-07-15", returnDate: "2027-07-19", dives: 11, status: "OPEN", organizer: "Let's Dive Thailand", holiday: "" },
  { num: 176, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-07-22", returnDate: "2027-07-26", dives: 11, status: "OPEN", organizer: "", holiday: "" },
  { num: 177, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-07-28", returnDate: "2027-08-01", dives: 11, status: "OPEN", organizer: "Padum", holiday: "King's Birthday" },

  // AUG 2027 — Losin
  { num: 178, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-08-05", returnDate: "2027-08-09", dives: 11, status: "OPEN", organizer: "", holiday: "" },
  { num: 179, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-08-11", returnDate: "2027-08-15", dives: 11, status: "OPEN", organizer: "Seasun Scuba", holiday: "วันแม่" },
  { num: 180, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-08-15", returnDate: "2027-08-19", dives: 11, status: "OPEN", organizer: "", holiday: "" },
  { num: 181, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-08-19", returnDate: "2027-08-23", dives: 11, status: "OPEN", organizer: "Crazy Dive", holiday: "" },
  { num: 182, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-08-26", returnDate: "2027-08-30", dives: 11, status: "OPEN", organizer: "", holiday: "" },

  // SEP 2027 — Losin
  { num: 183, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-09-02", returnDate: "2027-09-06", dives: 11, status: "OPEN", organizer: "", holiday: "" },
  { num: 184, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-09-09", returnDate: "2027-09-13", dives: 11, status: "OPEN", organizer: "Let's Dive Thailand", holiday: "" },
  { num: 185, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-09-16", returnDate: "2027-09-20", dives: 11, status: "OPEN", organizer: "Dive Terminal", holiday: "" },
  { num: 186, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-09-23", returnDate: "2027-09-27", dives: 11, status: "OPEN", organizer: "", holiday: "" },
  { num: 187, route: "Losin", titleEn: "Losin 3D4N", titleTh: "โลซิน 3 วัน 4 คืน", departure: "2027-09-30", returnDate: "2027-10-04", dives: 11, status: "OPEN", organizer: "", holiday: "" },
  // อ้อมแหลม 5-10 Oct 2027 — SKIP

  // OCT 2027 — Andaman
  { num: 188, route: "South Andaman", titleEn: "South Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2027-10-13", returnDate: "2027-10-18", dives: 15, status: "OPEN", organizer: "Dive Terminal", holiday: "King Bhumibol Memorial Day" },
  { num: 189, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-10-20", returnDate: "2027-10-25", dives: 15, status: "OPEN", organizer: "Scuba Paradive", holiday: "วันปิยมหาราช" },
  { num: 190, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-10-27", returnDate: "2027-11-01", dives: 15, status: "OPEN", organizer: "", holiday: "" },

  // NOV 2027
  { num: 191, route: "South Andaman", titleEn: "South Andaman 4D5N", titleTh: "อันดามันใต้ 4 วัน 5 คืน", departure: "2027-11-02", returnDate: "2027-11-07", dives: 15, status: "OPEN", organizer: "Recon Diver Club", holiday: "" },
  { num: 192, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-11-10", returnDate: "2027-11-15", dives: 15, status: "OPEN", organizer: "Divescape", holiday: "" },
  { num: 193, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-11-17", returnDate: "2027-11-22", dives: 15, status: "OPEN", organizer: "Padum", holiday: "" },
  { num: 194, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-11-24", returnDate: "2027-11-29", dives: 15, status: "OPEN", organizer: "", holiday: "" },

  // DEC 2027
  { num: 195, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-12-01", returnDate: "2027-12-06", dives: 15, status: "OPEN", organizer: "Seasun Scuba", holiday: "วันพ่อ" },
  { num: 196, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-12-08", returnDate: "2027-12-13", dives: 15, status: "OPEN", organizer: "Just Dive", holiday: "Constitution Day" },
  { num: 197, route: "North Andaman", titleEn: "North Andaman 4D5N", titleTh: "อันดามันเหนือ 4 วัน 5 คืน", departure: "2027-12-15", returnDate: "2027-12-20", dives: 15, status: "OPEN", organizer: "Dive Terminal", holiday: "" },
  { num: 198, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-12-22", returnDate: "2027-12-27", dives: 15, status: "OPEN", organizer: "Let's Dive Thailand", holiday: "Christmas" },
  { num: 199, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2027-12-29", returnDate: "2028-01-03", dives: 15, status: "OPEN", organizer: "Crazy Dive", holiday: "New Year Trip" },
  { num: 200, route: "Andaman", titleEn: "Andaman 4D5N", titleTh: "อันดามัน 4 วัน 5 คืน", departure: "2028-01-05", returnDate: "2028-01-10", dives: 15, status: "OPEN", organizer: "(Charter Price Discount 5%)", holiday: "" },
];

async function main() {
  console.log(`Seeding ${trips.length} schedules for Aquarian Liveaboard...`);

  let created = 0;
  for (const trip of trips) {
    const scheduleId = `sch_aquarian_${trip.num}`;

    // Build note from organizer + holiday
    const noteParts: string[] = [];
    if (trip.organizer) noteParts.push(trip.organizer);
    if (trip.holiday) noteParts.push(trip.holiday);
    const note = noteParts.join(" | ") || null;

    // Upsert schedule
    await prisma.schedule.upsert({
      where: { id: scheduleId },
      update: {
        departureDate: new Date(trip.departure),
        returnDate: new Date(trip.returnDate),
        status: trip.status,
        note,
      },
      create: {
        id: scheduleId,
        boatId: BOAT_ID,
        dateType: "range",
        departureDate: new Date(trip.departure),
        returnDate: new Date(trip.returnDate),
        totalSeats: 28,
        availableSeats: trip.status === "FULL" ? 0 : null,
        status: trip.status,
        note,
        translations: {
          create: LANGS.map((lang) => ({
            lang,
            title: lang === "th" ? trip.titleTh : trip.titleEn,
            slug: `aquarian-trip-${trip.num}`,
            route: lang === "th" ? trip.titleTh.replace(/ \d.*/, "") : trip.route,
          })),
        },
        packages: {
          create: PACKAGE_IDS.map((pkgId) => ({
            packageId: pkgId,
          })),
        },
      },
    });
    created++;
    if (created % 10 === 0) console.log(`  ... ${created}/${trips.length}`);
  }

  console.log(`Done! Created/updated ${created} schedules.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
