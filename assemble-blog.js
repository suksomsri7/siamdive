const fs = require('fs');
const { mjPrompt, en, th } = require('./build-blog-payload.js');
const { cn, ja, ko, de, fr, ru } = require('./build-blog-langs2.js');

const payload = {
  status: "DRAFT",
  category: "WORLD_DIVE_SITES",
  covers: [],
  mjPrompt,
  translations: [en, th, cn, ja, ko, de, fr, ru]
};

// word count EN (rough)
const enWords = en.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
const enChars = en.content.length;

fs.writeFileSync('/tmp/blog-payload.json', JSON.stringify(payload));

// report
const rep = payload.translations.map(t => {
  const chars = t.content.length;
  const pct = Math.round(chars * 100 / enChars);
  return `${t.lang}: title="${t.title}" (${[...t.title].length} chars) | content ${chars} (${pct}% of EN)`;
}).join('\n');

console.log('EN word count:', enWords);
console.log('mjPrompt length:', mjPrompt.length);
console.log(rep);
console.log('---VALIDATE---');
