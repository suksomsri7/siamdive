// Regenerate mjPrompt for all DRAFT blogs using the new NatGeo v2 builder.
// Run: bun run scripts/regenerate-draft-prompts.ts [--dry]
//
// Picks EN translation (title+excerpt) as source. Skips blogs with no EN
// translation. Overwrites existing mjPrompt unconditionally (DRAFT only).

import { prisma } from "@/lib/prisma";
import { buildMjPrompt } from "@/lib/mjPrompt";

const DRY = process.argv.includes("--dry");

const drafts = await prisma.blog.findMany({
  where: { status: "DRAFT" },
  include: { translations: { where: { lang: "en" }, take: 1 } },
});

console.log(`Found ${drafts.length} DRAFT blog(s).${DRY ? " [DRY RUN]" : ""}`);

let updated = 0;
let skipped = 0;

for (const blog of drafts) {
  const en = blog.translations[0];
  if (!en?.title) {
    skipped++;
    console.log(`- SKIP ${blog.id} (no EN title)`);
    continue;
  }
  const newPrompt = buildMjPrompt(en.title, en.excerpt ?? "");
  const changed = newPrompt !== blog.mjPrompt;
  console.log(`${changed ? "*" : "="} ${blog.id} | ${en.title.slice(0, 60)}`);
  if (!DRY && changed) {
    await prisma.blog.update({ where: { id: blog.id }, data: { mjPrompt: newPrompt } });
    updated++;
  }
}

console.log(`\nDone. updated=${updated} skipped=${skipped} unchanged=${drafts.length - updated - skipped}${DRY ? " [DRY RUN — no writes]" : ""}`);
await prisma.$disconnect();
