---
name: siamdive-blog
description: สร้าง SEO blog content สำหรับ SiamDive โดยใช้ Perplexity ค้นหาข้อมูล เขียน English content แล้วแปล 8 ภาษา บันทึกลง PostgreSQL เป็น DRAFT
args:
  topic: หัวข้อหรือประเภท content ที่ต้องการ เช่น "จุดดำน้ำในประเทศไทย" หรือ "liveaboard Similan Islands"
  count: จำนวน content ที่ต้องการสร้าง (default: 1)
---

## เป้าหมาย
สร้าง blog post สำหรับ siamdive.com ครบ 8 ภาษา บันทึกลง database เป็น DRAFT

**Project path:** `/root/projects/siamdive/`
**DB:** PostgreSQL via Prisma 7 (Docker container `siamdive-db`)
**Runtime:** Bun (`/root/.bun/bin/bun`)
**Perplexity API Key env:** `PERPLEXITY_API_KEY`
**8 ภาษา:** `en, th, cn, ja, ko, de, fr, ru`

---

## STEP 1 — เลือก Topic

ถ้า user ระบุ topic มาให้ใช้เลย ถ้าไม่ระบุให้คิด topic ที่:
- เกี่ยวกับ scuba diving / liveaboard / dive site ในประเทศไทย
- ยังไม่มีใน database (check ก่อน)
- มี search volume สูง เช่น "Similan Islands", "Koh Tao", "Richelieu Rock", "Koh Bon", "Hin Daeng Hin Muang"

---

## STEP 2 — ค้นหาข้อมูลด้วย Perplexity API

เรียก Perplexity **3 ครั้ง** ด้วย queries ที่ต่างกันเพื่อให้ได้ข้อมูลครอบคลุม:

```bash
export PERPLEXITY_API_KEY="${PERPLEXITY_API_KEY}"

search_perplexity() {
  local QUERY="$1"
  curl -s https://api.perplexity.ai/chat/completions \
    -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"sonar-pro\",
      \"messages\": [{\"role\": \"user\", \"content\": \"$QUERY\"}],
      \"return_citations\": true,
      \"search_recency_filter\": \"month\"
    }" | jq -r '.choices[0].message.content'
}

# Query 1: ภาพรวมและข้อมูลทั่วไป
search_perplexity "<TOPIC> scuba diving Thailand guide 2025"

# Query 2: รายละเอียดเชิงลึก
search_perplexity "<TOPIC> best dive sites marine life visibility depth tips"

# Query 3: practical info
search_perplexity "<TOPIC> Thailand diving when to go how to get there best operators season"
```

รวบรวม facts, ตัวเลข, ชื่อสถานที่, สัตว์ทะเล, เงื่อนไข, ฤดูกาลจากทั้ง 3 queries

---

## STEP 3 — เขียน English Content (SEO)

เขียน content ภาษาอังกฤษจากข้อมูลที่ได้ โดยมีโครงสร้างดังนี้:

### Title
- ดึงดูด มี keyword หลักอยู่ด้านหน้า
- ความยาว 50-60 ตัวอักษร
- ตัวอย่าง: "Koh Tao Diving Guide: Best Sites, Tips & What to Expect in 2025"

### Slug
- lowercase, hyphen-separated, ไม่มี special chars
- ตัวอย่าง: `koh-tao-diving-guide-best-sites-2025`

### Excerpt
- 150-160 ตัวอักษร
- มี keyword หลัก
- ดึงดูดให้อยากอ่านต่อ

### Content (HTML — บังคับ!)
เขียนเป็น HTML ครบ 6-8 paragraphs ตามโครงสร้าง:

```html
<h2>Introduction / Overview</h2>
<p>Hook paragraph — ดึงดูด มี keyword หลัก...</p>

<h2>Why [TOPIC] is a Must-Visit for Divers</h2>
<p>เหตุผลหลัก 3-5 ข้อ พร้อมตัวเลขและข้อเท็จจริง...</p>

<h2>Best Dive Sites at [TOPIC]</h2>
<p>รายละเอียดแต่ละจุด depth, visibility, marine life...</p>
<ul>
  <li><strong>Site Name</strong>: description...</li>
</ul>

<h2>Marine Life You'll Encounter</h2>
<p>สัตว์ทะเลที่พบได้ พร้อมฤดูกาล...</p>

<h2>Best Time to Dive</h2>
<p>ฤดูกาล, สภาพน้ำ, visibility เฉลี่ย...</p>

<h2>How to Get There</h2>
<p>เดินทางอย่างไร ใกล้จังหวัดอะไร...</p>

<h2>Tips for Diving at [TOPIC]</h2>
<p>คำแนะนำสำคัญ certification ที่ต้องมี, equipment...</p>

<h2>Final Thoughts</h2>
<p>สรุป + CTA เชื่อมกับ siamdive.com...</p>
```

### Keywords (EN) — อย่างน้อย 8 คำ
เน้น long-tail keywords ที่มี search intent ชัด เช่น:
`["koh tao diving", "scuba diving koh tao thailand", "best dive sites koh tao", ...]`

### OG Title
เหมือน Title แต่อาจปรับให้ engaging บน social

### OG Description
150-160 chars, มี CTA เช่น "Discover...", "Explore..."

---

## STEP 4 — แปล 7 ภาษา

แปลจาก English ต้นฉบับ โดย:
- **ไม่แปลตรงตัว** — เรียบเรียงให้เป็นธรรมชาติในแต่ละภาษา
- **keywords** ให้คิดใหม่ให้เหมาะกับ search behavior ของแต่ละภาษา ไม่ใช่แค่แปล
- **slug** ให้ใช้ภาษาอังกฤษทั้งหมด แต่เพิ่ม suffix ภาษา เช่น `koh-tao-diving-guide-th`, `koh-tao-diving-guide-cn`
- **content** คง HTML structure เดิม

| lang | ภาษา | หมายเหตุ |
|------|------|---------|
| `th` | ภาษาไทย | ใช้คำท่องเที่ยวไทยตามธรรมชาติ |
| `cn` | 中文 (Simplified) | ใช้คำค้นหาจีนที่นักท่องเที่ยวจีนใช้ |
| `ja` | 日本語 | เน้น safety, nature, experience |
| `ko` | 한국어 | เน้น experience, instagram-worthy |
| `de` | Deutsch | เน้น adventure, Naturerlebnis |
| `fr` | Français | เน้น culture, découverte |
| `ru` | Русский | เน้น экзотика, приключение |

---

## STEP 5 — บันทึกลง Database

สร้าง Bun script แล้ว run เลย:

```typescript
// /tmp/insert-blog.ts
import { PrismaClient } from "/root/projects/siamdive/src/generated/prisma/client"
import pg from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const pool = new pg.Pool({ connectionString: "postgresql://siamdive:siamdive@localhost:5432/siamdive" })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const blog = await prisma.blog.create({
    data: {
      status: "DRAFT",
      covers: [],
      translations: {
        create: [
          // EN
          {
            lang: "en",
            title: "...",
            slug: "...",
            excerpt: "...",
            content: `...HTML...`,
            keywords: ["...", "..."],
            ogTitle: "...",
            ogDescription: "...",
          },
          // TH
          { lang: "th", title: "...", slug: "...-th", excerpt: "...", content: `...`, keywords: [...], ogTitle: "...", ogDescription: "..." },
          // CN
          { lang: "cn", title: "...", slug: "...-cn", excerpt: "...", content: `...`, keywords: [...], ogTitle: "...", ogDescription: "..." },
          // JA
          { lang: "ja", title: "...", slug: "...-ja", excerpt: "...", content: `...`, keywords: [...], ogTitle: "...", ogDescription: "..." },
          // KO
          { lang: "ko", title: "...", slug: "...-ko", excerpt: "...", content: `...`, keywords: [...], ogTitle: "...", ogDescription: "..." },
          // DE
          { lang: "de", title: "...", slug: "...-de", excerpt: "...", content: `...`, keywords: [...], ogTitle: "...", ogDescription: "..." },
          // FR
          { lang: "fr", title: "...", slug: "...-fr", excerpt: "...", content: `...`, keywords: [...], ogTitle: "...", ogDescription: "..." },
          // RU
          { lang: "ru", title: "...", slug: "...-ru", excerpt: "...", content: `...`, keywords: [...], ogTitle: "...", ogDescription: "..." },
        ]
      }
    }
  })

  console.log("✅ Blog created:", blog.id)
  await prisma.$disconnect()
  await pool.end()
}

main().catch(console.error)
```

Run ด้วย:
```bash
cd /root/projects/siamdive && /root/.bun/bin/bun run /tmp/insert-blog.ts
```

---

## STEP 6 — ยืนยันผล

```bash
# ตรวจสอบว่า insert สำเร็จ
docker exec siamdive-db psql -U siamdive -d siamdive \
  -c "SELECT b.id, bt.lang, bt.title FROM \"Blog\" b JOIN \"BlogTranslation\" bt ON bt.\"blogId\" = b.id ORDER BY b.\"createdAt\" DESC LIMIT 8;"
```

แสดง Blog ID และ title ทั้ง 8 ภาษาให้ user ยืนยัน

---

## หมายเหตุสำคัญ

- ถ้าไม่มี `PERPLEXITY_API_KEY` ใน env ให้บอก user ก่อน run
- slug ต้อง unique — ถ้า slug ซ้ำให้เพิ่ม `-2`, `-3` ต่อท้าย
- content HTML ต้อง escape backtick และ single quote ใน template literal
- ทุก field ต้องไม่เป็น empty string โดยเฉพาะ title, slug, excerpt
