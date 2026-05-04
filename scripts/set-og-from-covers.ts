// Set ogImage = BlogImage.ogUrl (1200x630 JPG, no watermark for new images)
// for all BlogTranslations. Falls back to covers[0] if BlogImage not found.
//
// Run:  cd /root/projects/siamdive && bun run scripts/set-og-from-covers.ts [--dry]

import { prisma } from "../src/lib/prisma";

const DRY = process.argv.includes("--dry");

async function main() {
  const blogs = await prisma.blog.findMany({
    where: { covers: { isEmpty: false } },
    include: { translations: true },
  });

  let updated = 0;

  for (const blog of blogs) {
    const firstCoverUrl = blog.covers[0];
    if (!firstCoverUrl) continue;

    // Look up BlogImage by coverUrl to get the ogUrl (1200x630 JPG)
    const firstImageId = blog.imageIds?.[0];
    let ogImage = firstCoverUrl; // fallback

    if (firstImageId) {
      const blogImage = await prisma.blogImage.findUnique({
        where: { id: firstImageId },
        select: { ogUrl: true },
      });
      if (blogImage?.ogUrl) ogImage = blogImage.ogUrl;
    } else {
      // Try lookup by coverUrl
      const blogImage = await prisma.blogImage.findFirst({
        where: { coverUrl: firstCoverUrl },
        select: { ogUrl: true },
      });
      if (blogImage?.ogUrl) ogImage = blogImage.ogUrl;
    }

    for (const trans of blog.translations) {
      if (trans.ogImage === ogImage) continue;

      console.log(`${DRY ? "[DRY] " : ""}${blog.id} / ${trans.lang}: ogImage → ${ogImage.slice(0, 60)}…`);

      if (!DRY) {
        await prisma.blogTranslation.update({
          where: { id: trans.id },
          data: { ogImage },
        });
      }
      updated++;
    }
  }

  console.log(`\nDone. ${updated} translations ${DRY ? "would be " : ""}updated.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
