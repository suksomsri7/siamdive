/**
 * Set countryId = Thailand for every ServiceArea that doesn't have a country.
 * Idempotent. Run once after deploying the Country feature.
 *   cd /root/projects/siamdive && bun --bun run scripts/migrate-service-areas-to-thailand.ts
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const th = await prisma.country.findUnique({ where: { code: "TH" } });
  if (!th) {
    console.error("✗ Thailand (TH) not found — run scripts/seed-countries.ts first");
    process.exit(1);
  }

  const result = await prisma.serviceArea.updateMany({
    where: { countryId: null },
    data: { countryId: th.id },
  });

  console.log(`✓ Updated ${result.count} service-area(s) → ${th.flag} TH`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
