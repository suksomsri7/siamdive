/**
 * Seed ~120 starter topics into BlogTopic. Each entry carries a specific
 * angle, not a generic keyword, so the generator cron can pick up a topic
 * and hand it straight to the writer. Run with:
 *   cd /root/projects/siamdive && bun --bun run scripts/seed-blog-topics.ts
 */
import { prisma } from "../src/lib/prisma";

type Seed = { category: "DIVE_SITES" | "MARINE_LIFE" | "GEAR" | "WHY_THAILAND" | "SAFETY" | "EDUCATION" | "CONSERVATION" | "WORLD_DIVE_SITES"; title: string; keywords: string[]; note?: string };

const TOPICS: Seed[] = [
  // ── 1. DIVE_SITES (จุดดำน้ำน่าสนใจทั่วไทย — ไซต์ + ไฮไลต์) ──
  { category: "DIVE_SITES", title: "Why Thailand's Andaman Sea Beats the Gulf in March", keywords: ["Andaman vs Gulf", "best March diving Thailand"] },
  { category: "DIVE_SITES", title: "One Week, Three Coasts: A Thailand Dive Sampler Route", keywords: ["Thailand dive route", "7-day itinerary"] },
  { category: "DIVE_SITES", title: "The Case for Diving Koh Tao Over Labour Day Weekend", keywords: ["Koh Tao long weekend diving"] },
  { category: "DIVE_SITES", title: "Richelieu Rock at Dawn: What You Actually See in the First 5 Minutes", keywords: ["Richelieu Rock morning dive", "whale shark time"] },
  { category: "DIVE_SITES", title: "Purple Coral Season: When Hin Daeng Lights Up", keywords: ["Hin Daeng soft coral", "Hin Muang purple season"] },
  { category: "DIVE_SITES", title: "7 Dive Sites in Thailand That Still Aren't on Instagram", keywords: ["underrated Thailand dive sites"] },
  { category: "DIVE_SITES", title: "Manta Ray Odds at Koh Bon by Month (Data From 2024-2025)", keywords: ["manta season Koh Bon", "probability sightings"] },
  { category: "DIVE_SITES", title: "The Khao Lak Liveaboard: Why Divers Keep Coming Back", keywords: ["Khao Lak liveaboard", "Similan trip"] },
  { category: "DIVE_SITES", title: "Leopard Sharks at Shark Point: Where to Look, When to Wait", keywords: ["Shark Point Phuket", "leopard shark diving"] },
  { category: "DIVE_SITES", title: "Cape Panwa to Phi Phi: The Day-Trip That Beats Most Liveaboards", keywords: ["Phi Phi day trip Phuket"] },
  { category: "DIVE_SITES", title: "Why We Keep Picking Koh Lipe for February Diving", keywords: ["Koh Lipe diving February"] },
  { category: "DIVE_SITES", title: "Night Diving at Koh Tao: The Species You Never See in Daylight", keywords: ["Koh Tao night dive"] },
  { category: "DIVE_SITES", title: "Pattaya Navy Wrecks After Ten Years: Coral Recovery Report", keywords: ["Pattaya wrecks coral", "HTMS Khram"] },
  { category: "DIVE_SITES", title: "Koh Haa's Cathedral: Why Cavern Divers Go Silent Inside", keywords: ["Koh Haa cathedral dive"] },
  { category: "DIVE_SITES", title: "The Quiet Case for Chumphon Over the Similans", keywords: ["Chumphon diving", "alternative to Similans"] },
  { category: "DIVE_SITES", title: "Whale Sharks in April: Three Places That Still Deliver", keywords: ["whale shark April Thailand"] },
  { category: "DIVE_SITES", title: "Turtle Season on Koh Tao: Practical Honest Odds", keywords: ["Koh Tao turtles season"] },
  { category: "DIVE_SITES", title: "Trang's Emerald Cave: The Dive-Adjacent Day Everyone Skips", keywords: ["Trang Emerald Cave", "Koh Mook"] },
  { category: "DIVE_SITES", title: "Why the Similan Liveaboard Season Ends on May 15 (And What to Do Before)", keywords: ["Similan season closing"] },
  { category: "DIVE_SITES", title: "Racha Noi's West Ridge at Slack Tide: The Big-Fish Window", keywords: ["Racha Noi pelagics"] },

  // ── 2. MARINE_LIFE (สัตว์ทะเล ความมหัศจรรย์/แปลก) ──
  { category: "MARINE_LIFE", title: "30 Days on Koh Tao Without Going Broke: A Real Budget", keywords: ["Koh Tao long stay cost"] },
  { category: "MARINE_LIFE", title: "Digital Nomad with a Regulator: Working Remote from Koh Lanta", keywords: ["digital nomad diver", "Koh Lanta coworking"] },
  { category: "MARINE_LIFE", title: "What a Monthly Dive Club Membership Actually Includes in Thailand", keywords: ["dive club Thailand monthly"] },
  { category: "MARINE_LIFE", title: "Divers Who Stayed: Three Expats on What Made Them Move", keywords: ["Koh Tao expat divers"] },
  { category: "MARINE_LIFE", title: "The Unpublished Etiquette of the Thai Dive Boat", keywords: ["dive boat etiquette Thailand"] },
  { category: "MARINE_LIFE", title: "Why Divemasters in Thailand Seem to Drink a Lot of Coffee", keywords: ["divemaster life Thailand"] },
  { category: "MARINE_LIFE", title: "Shoulder-Season Rent on Phuket: Real Numbers From 2026", keywords: ["Phuket shoulder season rent"] },
  { category: "MARINE_LIFE", title: "Finding a Dive Buddy When You Arrive Alone in Thailand", keywords: ["solo diver Thailand"] },
  { category: "MARINE_LIFE", title: "What Divers Eat After Six Dives: Koh Tao Restaurant Picks", keywords: ["Koh Tao restaurants divers"] },
  { category: "MARINE_LIFE", title: "Workouts That Actually Match a Thailand Dive Week", keywords: ["diver fitness routine"] },
  { category: "MARINE_LIFE", title: "The Quiet Friendship Economy of Liveaboard Life", keywords: ["liveaboard community"] },
  { category: "MARINE_LIFE", title: "Tipping Crew in Thailand: What Is Normal and What Isn't", keywords: ["tipping dive crew Thailand"] },
  { category: "MARINE_LIFE", title: "Rainy Day in Phuket: How Dive Instructors Spend Them", keywords: ["rest days diver life"] },
  { category: "MARINE_LIFE", title: "Learning Thai on the Boat: The Three Phrases Worth Memorising", keywords: ["Thai phrases diver"] },
  { category: "MARINE_LIFE", title: "Why So Many Divers End Up Teaching Yoga on Koh Phangan", keywords: ["yoga diver community"] },
  { category: "MARINE_LIFE", title: "Slow Travel Diving: Two Weeks on One Island, Not Twelve", keywords: ["slow travel diving Thailand"] },
  { category: "MARINE_LIFE", title: "The Working-Holiday Divemaster: Real Income, Real Days", keywords: ["divemaster trainee income"] },
  { category: "MARINE_LIFE", title: "Full Moon Party and Morning Dive: A Survival Note", keywords: ["Koh Phangan party diver"] },
  { category: "MARINE_LIFE", title: "What to Pack for Three Months on a Thai Dive Island", keywords: ["long stay packing list diver"] },
  { category: "MARINE_LIFE", title: "Why a Dive Shop Is the Best Place to Meet People in Thailand", keywords: ["dive shop social"] },

  // ── 3. GEAR & REVIEW ──
  { category: "GEAR", title: "BCD Bladder Flush: The Five-Minute Step That Doubles Its Life", keywords: ["BCD bladder flush"] },
  { category: "GEAR", title: "Why Your Regulator's Second Stage Breathes Harder at Depth (And When to Worry)", keywords: ["regulator breathing effort"] },
  { category: "GEAR", title: "Mask Fog: Four Fixes That Actually Hold for a Full Dive", keywords: ["dive mask defog"] },
  { category: "GEAR", title: "3mm vs 5mm Wetsuit for Thailand: The Honest Call by Month", keywords: ["wetsuit thickness Thailand"] },
  { category: "GEAR", title: "Reef-Safe Sunscreen That Doesn't Sting Your Eyes: A Real Shortlist", keywords: ["reef safe sunscreen Thailand"] },
  { category: "GEAR", title: "How to Store Your Dive Computer Between Trips Without Killing the Battery", keywords: ["dive computer storage"] },
  { category: "GEAR", title: "Tank Valves: Why DIN Is Now the Default in Thailand", keywords: ["DIN valve Thailand"] },
  { category: "GEAR", title: "Dive Torch Buying Guide: Lumens vs Burn Time Honestly Compared", keywords: ["dive torch buying"] },
  { category: "GEAR", title: "SMB Deployment Drill: Practising on a Sandy Bottom First", keywords: ["SMB deploy practice"] },
  { category: "GEAR", title: "Why Your Rental Mask Leaks (And What to Ask Instead)", keywords: ["rental mask fit"] },
  { category: "GEAR", title: "Fin Strap vs Spring Strap: The Break-Point Math", keywords: ["spring straps fins"] },
  { category: "GEAR", title: "Cheap Dive Computers That Still Pass a Safe Dive Check", keywords: ["budget dive computer"] },
  { category: "GEAR", title: "Wetsuit Shampoo or Dish Soap: What Actually Kills the Smell", keywords: ["wetsuit cleaning"] },
  { category: "GEAR", title: "Torch Batteries on Liveaboards: Lithium Rules Decoded", keywords: ["dive torch battery flight"] },
  { category: "GEAR", title: "Hood, Gloves, Boots: When You Actually Need Them in Thailand", keywords: ["dive accessories Thailand"] },
  { category: "GEAR", title: "Storing Gear for Six Months: The Pre-Monsoon Checklist", keywords: ["dive gear long storage"] },
  { category: "GEAR", title: "First-Stage Service: What Shops in Thailand Actually Do (And Charge)", keywords: ["regulator service Thailand"] },
  { category: "GEAR", title: "Underwater Camera for Beginners: When It Stops Being Worth It", keywords: ["beginner underwater camera"] },
  { category: "GEAR", title: "Fin Kicks by Body Type: Why Pros Switch Depending on Site", keywords: ["fin kicks diver"] },
  { category: "GEAR", title: "Dive Knife or Shears: The Thai Reef Case for Shears", keywords: ["dive knife vs shears"] },

  // ── 4. WHY_THAILAND (ทำไมต้องมาดำน้ำที่ประเทศไทย — ข้อดี) ──
  { category: "WHY_THAILAND", title: "Phuket Diving Guide: Every Major Site, Ranked by Entry Port", keywords: ["Phuket dive sites guide"] },
  { category: "WHY_THAILAND", title: "Koh Tao Diving Guide: Schools, Reefs, and the One Site Nobody Books", keywords: ["Koh Tao diving guide"] },
  { category: "WHY_THAILAND", title: "Khao Lak Diving Guide: Liveaboard Piers and Shoulder-Season Day Trips", keywords: ["Khao Lak diving"] },
  { category: "WHY_THAILAND", title: "Koh Lipe Diving Guide: Sites, Season, and the Ferry That Actually Runs", keywords: ["Koh Lipe guide diving"] },
  { category: "WHY_THAILAND", title: "Pattaya Diving Guide: Wrecks, Artificial Reefs, and When Viz Holds", keywords: ["Pattaya diving guide"] },
  { category: "WHY_THAILAND", title: "Koh Chang Diving Guide: The Gulf's East Coast Surprise", keywords: ["Koh Chang diving"] },
  { category: "WHY_THAILAND", title: "Koh Kood Diving Guide: Quiet Reefs Off the Eastern Border", keywords: ["Koh Kood diving"] },
  { category: "WHY_THAILAND", title: "Chumphon Diving Guide: The Pinnacle Route Most Divers Miss", keywords: ["Chumphon diving"] },
  { category: "WHY_THAILAND", title: "Samaesan Diving Guide: Thailand's Wreck Training Corridor", keywords: ["Samaesan diving"] },
  { category: "WHY_THAILAND", title: "Prachuap Diving Guide: Fisher Towns and Offshore Reefs", keywords: ["Prachuap diving"] },
  { category: "WHY_THAILAND", title: "Koh Phi Phi Diving Guide: Bida Nok, Bida Nai, and the King Cruiser Corridor", keywords: ["Phi Phi diving guide"] },
  { category: "WHY_THAILAND", title: "Trang Diving Guide: Koh Haa, Koh Rok, and the Andaman's Quiet South", keywords: ["Trang diving"] },
  { category: "WHY_THAILAND", title: "Krabi Diving Guide: Ao Nang Boats and Shark Point Day Trips", keywords: ["Krabi diving"] },
  { category: "WHY_THAILAND", title: "Similan Islands Diving Guide: Every Ranked Site by Trip Day", keywords: ["Similan dive sites"] },
  { category: "WHY_THAILAND", title: "Koh Racha Diving Guide: The Phuket Day-Trip That Pays for Itself", keywords: ["Racha Yai diving"] },
  { category: "WHY_THAILAND", title: "Koh Samui Diving Guide: Gateway to the Gulf's Signature Pinnacles", keywords: ["Koh Samui diving"] },
  { category: "WHY_THAILAND", title: "Koh Phangan Diving Guide: Sail Rock and the North Shore Reefs", keywords: ["Koh Phangan diving"] },
  { category: "WHY_THAILAND", title: "Hin Daeng and Hin Muang: What a Liveaboard Briefing Actually Says", keywords: ["Hin Daeng guide", "Hin Muang guide"] },
  { category: "WHY_THAILAND", title: "Koh Bon and Koh Tachai Day Trips From Khao Lak", keywords: ["Koh Bon Koh Tachai day trip"] },
  { category: "WHY_THAILAND", title: "Koh Yao Noi Diving: The In-Between Island Nobody Books", keywords: ["Koh Yao Noi diving"] },

  // ── 5. SAFETY / TRUST ──
  { category: "SAFETY", title: "Decompression Sickness Risk in Thailand: By Site, By Month", keywords: ["DCS risk Thailand"] },
  { category: "SAFETY", title: "DAN Insurance vs World Nomads: The Fine Print for Thailand", keywords: ["dive insurance Thailand"] },
  { category: "SAFETY", title: "What Happens If You Miss Your Safety Stop in Thailand", keywords: ["missed safety stop"] },
  { category: "SAFETY", title: "Hyperbaric Chambers in Thailand: The Three That Still Operate", keywords: ["chamber Thailand DCS"] },
  { category: "SAFETY", title: "Sea Sickness on the Liveaboard: Prevention That Actually Works", keywords: ["seasickness liveaboard"] },
  { category: "SAFETY", title: "Lost Diver Protocol: The Five-Minute Surface Drill", keywords: ["lost buddy procedure"] },
  { category: "SAFETY", title: "Why 18 Hours No-Fly Is the Safe Minimum (Not 12)", keywords: ["no fly after diving"] },
  { category: "SAFETY", title: "Reverse Block: The Descent-Time Ear Problem Divers Miss", keywords: ["reverse block ear"] },
  { category: "SAFETY", title: "Thai Instructor Qualifications: How to Verify a Real Number", keywords: ["PADI instructor verify Thailand"] },
  { category: "SAFETY", title: "Red Flags When Choosing a Thai Dive Shop (A Real Checklist)", keywords: ["choose dive shop Thailand"] },
  { category: "SAFETY", title: "Boat Safety Briefing: What Should Take Three Minutes", keywords: ["dive boat briefing"] },
  { category: "SAFETY", title: "Night Diving Panic: The Three Things Divers Wish They'd Practised", keywords: ["night dive safety"] },
  { category: "SAFETY", title: "Currents Past 1.5 Knots: When to Call a Dive Off", keywords: ["strong currents diving"] },
  { category: "SAFETY", title: "Marine Stingers in Thailand: Jellyfish, Fire Coral, and What to Do", keywords: ["marine stings Thailand"] },
  { category: "SAFETY", title: "Out-of-Air Drill: Why It Feels Different at 18 Metres", keywords: ["air share drill"] },
  { category: "SAFETY", title: "Mask Off at Depth: The Panic Recovery You Should Rehearse", keywords: ["mask off drill"] },
  { category: "SAFETY", title: "Depth Limits by Certification in Thailand: Actually Enforced", keywords: ["recreational depth limits"] },
  { category: "SAFETY", title: "Safety Stop Etiquette When There's a Line of Six Divers", keywords: ["safety stop multiple divers"] },
  { category: "SAFETY", title: "First-Aid Kits on Thai Dive Boats: What Should Be There", keywords: ["boat first aid"] },
  { category: "SAFETY", title: "Oxygen on Board: The Overlooked Liveaboard Must-Have", keywords: ["O2 first aid liveaboard"] },

  // ── 6. EDUCATION / HOW-TO ──
  { category: "EDUCATION", title: "Equalization Techniques: Frenzel, Valsalva, and When Each Wins", keywords: ["equalization diving"] },
  { category: "EDUCATION", title: "Open Water vs Advanced: What the Advanced Actually Teaches", keywords: ["Open Water Advanced difference"] },
  { category: "EDUCATION", title: "Why Beginners Breathe Air Twice as Fast (And How to Cut That)", keywords: ["air consumption beginner"] },
  { category: "EDUCATION", title: "The 200m Swim Test: How to Train for It in 30 Days", keywords: ["200m swim test diving"] },
  { category: "EDUCATION", title: "Neutral Buoyancy: The Drill That Matters Most After Certification", keywords: ["neutral buoyancy drill"] },
  { category: "EDUCATION", title: "Reading a Dive Plan: What Those Numbers Actually Mean", keywords: ["dive plan reading"] },
  { category: "EDUCATION", title: "Why You Fail Your First Compass Nav (And How to Not)", keywords: ["compass navigation diving"] },
  { category: "EDUCATION", title: "Hand Signals: The Twelve That Actually Get Used in Thailand", keywords: ["dive hand signals"] },
  { category: "EDUCATION", title: "Pre-Dive Safety Check (BWRAF): The Thai Instructor Version", keywords: ["BWRAF Thailand"] },
  { category: "EDUCATION", title: "Why Your Ears Hurt Even Though You're Equalizing", keywords: ["ear pain diving"] },
  { category: "EDUCATION", title: "Reading Dive Tables After You Have a Computer", keywords: ["dive tables diving"] },
  { category: "EDUCATION", title: "Mask Clearing Practice You Can Do in a Hotel Pool", keywords: ["mask clear practice"] },
  { category: "EDUCATION", title: "Boat Entry Styles: Giant Stride vs Back Roll vs Negative", keywords: ["boat entry dive"] },
  { category: "EDUCATION", title: "The 5-Point Descent: Why Instructors Teach It Over and Over", keywords: ["5 point descent"] },
  { category: "EDUCATION", title: "Rescue Diver: What Week-Long Training Actually Feels Like", keywords: ["Rescue Diver course"] },
  { category: "EDUCATION", title: "What to Read Before Your Open Water Course Starts", keywords: ["open water pre-study"] },
  { category: "EDUCATION", title: "Breathing Techniques That Lower Your SAC Rate in Two Days", keywords: ["SAC rate training"] },
  { category: "EDUCATION", title: "Specialty Courses Worth Actually Paying For in Thailand", keywords: ["dive specialty Thailand"] },
  { category: "EDUCATION", title: "Dry-Land Ear Training: Why Ten Minutes a Day Pays Off", keywords: ["ear training land"] },
  { category: "EDUCATION", title: "Why the DSD Doesn't Feel Like 'Real' Diving (And Why That's OK)", keywords: ["Discover Scuba Diving"] },
];

async function main() {
  const count = await prisma.blogTopic.count();
  if (count > 0) {
    console.log(`BlogTopic already has ${count} rows — skipping seed.`);
    return;
  }
  const rows = TOPICS.map((t, i) => ({
    category: t.category as any,
    title: t.title,
    keywords: t.keywords,
    note: t.note ?? "",
    order: i,
  }));
  await prisma.blogTopic.createMany({ data: rows });
  const created = await prisma.blogTopic.count();
  console.log(`Seeded ${created} topics:`);
  for (const cat of ["DIVE_SITES", "MARINE_LIFE", "GEAR", "WHY_THAILAND", "SAFETY", "EDUCATION"] as const) {
    const n = await prisma.blogTopic.count({ where: { category: cat as any } });
    console.log(`  ${cat}: ${n}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
