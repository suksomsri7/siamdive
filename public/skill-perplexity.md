---
name: perplexity
description: Search the web using Perplexity AI API (sonar models with real-time web access). Use for research, fact-checking, diving destinations, travel info, or any live data query.
args:
  query: The search query or question to ask Perplexity
  model: "Optional: sonar (default), sonar-pro, sonar-reasoning, sonar-reasoning-pro"
---

Use the Perplexity API to answer the query with real-time web search.

## How to call the Perplexity API

Perplexity uses an OpenAI-compatible REST API. Make the request via Bash:

```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar",
    "messages": [
      {
        "role": "system",
        "content": "Be precise and concise. Always cite sources."
      },
      {
        "role": "user",
        "content": "<QUERY>"
      }
    ],
    "return_citations": true,
    "return_images": false,
    "search_recency_filter": "month"
  }'
```

Replace `<QUERY>` with the user's search query.

## Models

| Model | ความสามารถ | เหมาะกับ |
|-------|-----------|----------|
| `sonar` | Fast, web search | ค้นหาทั่วไป, ราคาถูก |
| `sonar-pro` | Advanced, web search | ค้นหาเชิงลึก, รายละเอียด |
| `sonar-reasoning` | Chain-of-thought + search | วิเคราะห์, เปรียบเทียบ |
| `sonar-reasoning-pro` | Extended thinking + search | ซับซ้อน, research จริงจัง |

## Environment variable

ต้อง set `PERPLEXITY_API_KEY` ก่อนใช้:

```bash
export PERPLEXITY_API_KEY="pplx-xxxxxxxxxxxx"
# หรือใส่ใน .env.local ของ project
```

## ตัวอย่างสำหรับ SiamDive

```bash
# ค้นหาข้อมูลแหล่งดำน้ำ
QUERY="best scuba diving spots in Koh Tao Thailand 2025 conditions"

# ค้นหาข้อมูลสัตว์ทะเล
QUERY="manta ray season Similan Islands Thailand"

# ค้นหา liveaboard reviews
QUERY="Thailand liveaboard diving reviews Similan Andaman Sea 2025"
```

## Steps

1. Check ว่ามี `PERPLEXITY_API_KEY` หรือไม่ — ถ้าไม่มีให้บอก user
2. Run curl command ด้วย Bash tool
3. Parse JSON response: `.choices[0].message.content`
4. แสดงผล + citations จาก `.citations[]` (ถ้ามี)
5. ถ้า model ไม่ได้ระบุ ให้ใช้ `sonar` เป็น default

## Parse response (jq)

```bash
RESPONSE=$(curl -s ...)
echo "$RESPONSE" | jq -r '.choices[0].message.content'
echo "--- Sources ---"
echo "$RESPONSE" | jq -r '.citations[]? // empty'
```
