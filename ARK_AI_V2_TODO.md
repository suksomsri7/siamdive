# Ark AI v2 — Implementation Checklist

**Master plan:** see `~/.claude/projects/-root/memory/project_siamdive_ark_ai_v2.md`
**Progress tracker:** see `~/.claude/projects/-root/memory/project_siamdive_ark_ai_v2_progress.md`
**Recovery:** `bash scripts/arkai-resume.sh`

**Branch convention:** `arkai-v2-phase-{N}-{slug}`
**Commit format:** `[arkai-v2 P{N}.{step}] description`

---

## Phase 0 — Setup (DONE)
- [x] 0.1 Memory: master plan saved (`project_siamdive_ark_ai_v2.md`)
- [x] 0.2 Memory: v1 audit snapshot (`project_siamdive_ark_ai_v1_audit.md`)
- [x] 0.3 Memory: progress tracker (`project_siamdive_ark_ai_v2_progress.md`)
- [x] 0.4 Repo: this TODO checklist
- [x] 0.5 Repo: recovery script (`scripts/arkai-resume.sh`)
- [x] 0.6 MEMORY.md index updated

---

## Phase 1 — Schema + Cost Guard (1-2 วัน)
**Branch:** `arkai-v2-phase-1-cost-guard`

### Schema migration (additive only)
- [x] 1.1 Add `Blog.category BlogCategory?` + index
- [x] 1.2 Add `Blog.serviceAreaIds String[] @default([])` + GIN index
- [x] 1.3 Add `Schedule` index `[status, departureDate, availableSeats]`
- [x] 1.4 Add `UserPlan` fields: `isPublic`, `publicSlug`, `viewCount`, `expiresAt`, `source`, `aiPrompt`
- [x] 1.5 Add `AiConfig` fields: `enabled`, `dailyBudgetUsd`, `costAlertEmail`, `costAlertThreshold`
- [x] 1.6 Create `AiUsageLog` table (sessionId, inputTokens, outputTokens, costUsd, model, createdAt)
- [x] 1.7 Create `AiPlanSession` table (deviceId, slots JSON, status, behaviorContext JSON, lastActiveAt, expiresAt)
- [x] 1.8 Run migration on dev → verify (applied via direct connection, all 4 col groups + 2 tables + 7 indexes verified)
- [x] 1.9 Test rollback (revert migration script) — `rollback.sql` created alongside `migration.sql`

### Code wiring
- [x] 1.10 Wire `AiConfig.enabled` → master kill switch ใน `/api/ark-ai/chat/route.ts` (503 friendly)
- [x] 1.11 Token tracking middleware: capture usage from stream events (Anthropic message_start/delta, OpenAI include_usage, Google usageMetadata) → `logUsage()` after stream closes
- [x] 1.12 Daily budget gate: `checkDailyBudget()` SUM(today's costUsd) vs `AiConfig.dailyBudgetUsd` → 429 friendly error
- [x] 1.13 Add cost calculator (`lib/ark-ai/cost.ts`): tokens × per-model price → USD (Anthropic 4.x, OpenAI 4o/4.1, Gemini 2.x)

### Backoffice UI
- [x] 1.14 Extend `/backoffice/settings/ai/page.tsx` — section "Cost Guard"
- [x] 1.15 Master toggle "Ark AI Enabled" (green/red banner + slide switch)
- [x] 1.16 Inputs: dailyBudgetUsd, costAlertEmail, costAlertThreshold
- [x] 1.17 Display: today's usage progress bar (color-coded by threshold)
- [x] 1.18 Display: 7-day usage mini chart (vertical bars)
- [x] 1.19 Display: top spenders table (sessionId / calls / tokens / cost) — backed by new `/api/ark-ai/usage`

### Tests
- [x] 1.20 Unit test: cost calculator (`bun test src/lib/ark-ai/cost.test.ts` — 9/9 pass)
- [ ] 1.21 API test: chat returns 503 when `enabled=false` — **deferred**, no test infra in repo. Verified manually via Vercel smoke (1.24)
- [ ] 1.22 API test: chat returns 429 when daily budget exceeded — **deferred**, same reason. Verify via 1.24
- [ ] 1.23 Integration test: AiUsageLog row created after chat — **deferred**, same reason. Verify via 1.24 (check Supabase table after a chat)
- [x] 1.24 Smoke test on Vercel preview Step 2+3 + production Step 4 — all 4 steps PASS (verified via curl + DB inspection 2026-05-04)

**Phase 1 done:** all boxes checked + Vercel preview confirmed working

---

## Phase 1.5 — Behavior Integration (1-2 วัน)
**Branch:** `arkai-v2-phase-1.5-behavior`

- [x] 1.5.1 Add 7 events to `AnalyticsEventType` enum + migration applied to prod + Set updated in `/api/track` + types.ts mirror
- [x] 1.5.2 Wire `buildVisitorProfile()` into chat route (called via `getArkAiProfile` wrapper)
- [x] 1.5.3 Cache profile in `AiPlanSession.behaviorContext` (TTL 1 ชม., 30-day expiresAt for the row)
- [x] 1.5.4 Inject profile summary into system prompt — *Anthropic prompt caching deferred (current prod uses openrouter, can revisit when switching back to Anthropic)*
- [x] 1.5.5 Bot filter check via `isBotUa()` at top of chat route → 403 before any DB hit
- [x] 1.5.6 Cross-device merge: PlanUser.email → resolve sibling deviceIds → merge their profiles
- [x] 1.5.7 Test: profile injects soft hints (unit test "warm-visitor hints" passes)
- [x] 1.5.8 Test: cold start (totalActivity < 5) → empty summary (unit test passes)
- [x] 1.5.9 Smoke test on Vercel preview — A. Bot 403, B. Kill 503, C. Budget 429 + ARK_AI_BUDGET_BLOCKED event tracked. End-to-end warm-profile injection deferred to prod (preview ENCRYPTION_KEY mismatch — same as P1 Step 4)

---

## Phase 1.7 — Error/Fallback + Hallucination Guards (1 วัน)
**Branch:** `arkai-v2-phase-1.7-safety`

### Error UX
- [ ] 1.7.1 Claude API error → friendly message + LINE escape hatch
- [ ] 1.7.2 Network drop / SSE disconnect → resume or retry button
- [ ] 1.7.3 Daily budget hit → friendly "ลองพรุ่งนี้" + LINE link
- [ ] 1.7.4 Rate limit 429 → countdown timer
- [ ] 1.7.5 Empty/garbage AI response → fallback trip cards from `viewedAreas`

### Hallucination Guards
- [ ] 1.7.6 Update system prompt — hard rules (boat names, prices, medical, depth/cert)
- [ ] 1.7.7 Server-side validator: regex scan response → reject if boat/site not in RAG context
- [ ] 1.7.8 Cert/depth validator: AI ห้ามแนะนำ depth > cert allows
- [ ] 1.7.9 Medical advice redirect: detect medical keywords → redirect to doctor
- [ ] 1.7.10 Test: validator catches fabricated boat name
- [ ] 1.7.11 Test: validator catches OW user → 30m site recommendation

---

## Phase 2 — Slot Extraction (Anthropic Tool Use, 3-5 วัน)
**Branch:** `arkai-v2-phase-2-slots`

- [ ] 2.1 Define tool schema: `update_slots(dates, headcount, region, certs[], budget, style, interests[])`
- [ ] 2.2 Wire tool_use into chat route (parse tool calls per turn)
- [ ] 2.3 Persist slots to `AiPlanSession.slots` (upsert)
- [ ] 2.4 Slot validation per field (date format, region enum, cert enum)
- [ ] 2.5 Resume logic: เปิด Ark AI ครั้งหน้า → check active session → ทักทายต่อ
- [ ] 2.6 SlotTrackerChips component (เหนือ ChatPanel)
- [ ] 2.7 Chip i18n bundle (8 ภาษา)
- [ ] 2.8 Click-to-edit chip
- [ ] 2.9 Required-3 logic: dates + headcount + region complete → unlock CTA
- [ ] 2.10 CTA button "สร้าง plan เลย" (8 ภาษา)
- [ ] 2.11 Track ARK_AI_SLOT_FILLED / ARK_AI_SLOT_SKIPPED events
- [ ] 2.12 Test: free text "อยากไป Similan 5 วัน 2 คน" → slots extracted correctly
- [ ] 2.13 Test: 8 ภาษา ทดสอบ TH/EN ละเอียด, sample CN/JP
- [ ] 2.14 Smoke test on Vercel preview

**🚦 USER CHECKPOINT REQUIRED:** Phase 2 ต้อง user test conversation จริง 5-10 ครั้ง ก่อนไป Phase 3

---

## Phase 3 — Auto-Build Plan + Cert/Date (3-5 วัน)
**Branch:** `arkai-v2-phase-3-build`

- [ ] 3.1 New endpoint `POST /api/ark-ai/build-plan` (slots → UserPlan)
- [ ] 3.2 Date matching engine: ตรงวัน priority > ±3 วัน fallback
- [ ] 3.3 Season warning: Similan May-Oct closed
- [ ] 3.4 Cert filter: OW≤18m, AOW≤30m, no cert → snorkel only
- [ ] 3.5 Multi-cert split day suggestion logic
- [ ] 3.6 Gap-fill: Blog `serviceAreaIds` match boat area
- [ ] 3.7 Land tour gap-fill: Boat type=LAND_TOUR/SNORKELING area-matched
- [ ] 3.8 Create UserPlan with source=ARK_AI, isPublic=false, expiresAt set
- [ ] 3.9 Preview card in chat (ItineraryCard component)
- [ ] 3.10 "Save" button → redirect /plan/[shortId]
- [ ] 3.11 Track ARK_AI_PLAN_GENERATED + ARK_AI_PLAN_SAVED
- [ ] 3.12 Test: 5+ slot combinations → reasonable plans
- [ ] 3.13 Test: cert filter blocks deep dives correctly
- [ ] 3.14 Test: gap-fill with no matching blogs → graceful fallback

**🚦 USER CHECKPOINT REQUIRED:** Phase 3 ต้อง user ดู plan ที่ AI สร้าง 3-5 ตัวอย่าง quality OK

---

## Phase 4 — Itinerary → UserPlan Unify (2-3 วัน)
**Branch:** `arkai-v2-phase-4-unify`

**Strategy:** additive code changes (read both tables; data migration deferred to user with DB snapshot per 4.5 ⚠️).

- [x] 4.1 Migration SQL: `prisma/scripts/migrate-itinerary-to-userplan.sql` (idempotent, preserves shortId, NOT auto-run)
- [x] 4.2 Plan page already supports both Itinerary and UserPlan (legacy → ItineraryPageClient, modern → SharedPlanClient)
- [x] 4.3 `GET /api/ark-ai/itinerary?mode=popular` unions Itinerary + UserPlan WHERE source=ARK_AI, dedupes by shortId
- [x] 4.4 OG image route falls back to UserPlan when shortId missing in Itinerary
- [ ] 4.5 Manual DB snapshot before migration ⚠️ — **user-driven**
- [ ] 4.6 Verify /plan/[shortId] URLs still work post-migration — **user verifies**
- [x] 4.7 Popular endpoint regression: 4 Itinerary rows still return; UserPlan ARK_AI rows additive
- [ ] 4.8 Drop Itinerary table after 30 days — **deferred to Phase 7 cleanup cron**

**Phase 4 done (additive scope):** code is ready to handle ARK_AI UserPlans without breaking legacy URLs. Data migration deferred to user.

---

## Phase 5 — Blog Tagging (1-2 วัน)
**Branch:** `arkai-v2-phase-5-blog-tags`

### Skill update
- [ ] 5.1 Add STEP ใน `siamdive-blog-websearch/SKILL.md` — extract serviceAreaIds + category
- [ ] 5.2 Update STEP 11 POST payload: include `category` + `serviceAreaIds`
- [ ] 5.3 Test skill end-to-end with new payload

### Backoffice tool
- [ ] 5.4 Create `/backoffice/blogs/bulk-tag/page.tsx`
- [ ] 5.5 List blogs WHERE category IS NULL OR serviceAreaIds = []
- [ ] 5.6 AI suggest button (Haiku) → return suggestion
- [ ] 5.7 Admin approve/edit → save
- [ ] 5.8 Bulk approve all-suggestion mode

### RAG enhancement
- [ ] 5.9 Update `searchBlogs()` in `lib/ark-ai/rag.ts` — boost category + area match
- [ ] 5.10 Test: RAG prefers area-matching blogs

---

## Phase 6 — Templates + Personalize (2 วัน)
**Branch:** `arkai-v2-phase-6-templates`

- [ ] 6.1 Create PlanTemplate seed (5 templates × 8 ภาษา)
  - Couple Weekend (3 days)
  - Family Snorkel (4-5 days)
  - First-timer + OW Course (5-7 days)
  - Hardcore Liveaboard (7 days)
  - Photographer Special
- [ ] 6.2 Template selector UI ใน Ark AI panel (first open)
- [ ] 6.3 Click template → seed slots → AI fine-tunes
- [ ] 6.4 Personalize order by behavior profile match score
- [ ] 6.5 Cold start: generic order
- [ ] 6.6 "Recommended for you" badge for top match
- [ ] 6.7 Track ARK_AI_TEMPLATE_SELECTED

---

## Phase 7 — Privacy + Safety + Expiration (1-2 วัน)
**Branch:** `arkai-v2-phase-7-privacy`

### Privacy
- [ ] 7.1 Update `/[lang]/(frontend)/privacy/page.tsx` — section AI usage
- [ ] 7.2 Add "ใช้ AI แบบ generic" opt-out toggle
- [ ] 7.3 PDPA/GDPR consent checkbox on email collection

### Safety
- [ ] 7.4 Safety disclaimer in plan output (DAN, no fly 18hr, ปรึกษาแพทย์)
- [ ] 7.5 Update system prompt — show price RANGE only ("8,500-12,000 บาท")

### Expiration
- [ ] 7.6 Cron `/api/cron/cleanup-expired-plans` daily
- [ ] 7.7 Logic: anonymous=30d, with email=1y after trip date, AI public viewCount=0=7d, viewCount≥3=90d
- [ ] 7.8 Test cron + reseed

---

## Phase 7.5 — Monitoring + a11y (1 วัน)
**Branch:** `arkai-v2-phase-7.5-monitor`

### Monitoring
- [ ] 7.5.1 Sentry setup (free tier 5k events/mo)
- [ ] 7.5.2 Wire Sentry into chat route + Vercel functions
- [ ] 7.5.3 Cron health alert (use existing CronAuditLog)

### Accessibility
- [ ] 7.5.4 Keyboard nav through chips
- [ ] 7.5.5 aria-live="polite" for streaming text
- [ ] 7.5.6 Focus trap in modal
- [ ] 7.5.7 Lighthouse audit pass (a11y score ≥ 95)
- [ ] 7.5.8 100dvh + Visual Viewport API for mobile drawer
- [ ] 7.5.9 navigator.share() native share

---

## Phase 8 — Soft Launch (TH only, 1-2 wk monitoring)
- [ ] 8.1 Set `AiConfig.enabled = true`
- [ ] 8.2 Set `dailyBudgetUsd = 5`
- [ ] 8.3 Gate: TH header lang only (or feature flag)
- [ ] 8.4 Monitor cost, errors, slot fill rate, conversion
- [ ] 8.5 Daily check first week
- [ ] 8.6 Bug fixes hot path
- [ ] 8.7 Iterate before expand

**🚦 USER CHECKPOINT REQUIRED:** Phase 8 user review cost dashboard 1 week before expand

---

## Phase 9 — Hard Launch + Feedback Loop (post-launch)
- [ ] 9.1 Expand to 8 languages
- [ ] 9.2 Adjust budget ceiling based on real data
- [ ] 9.3 CHAT_FEEDBACK UI (thumbs up/down)
- [ ] 9.4 Backoffice funnel dashboard
- [ ] 9.5 Auto-seed BlogTopic from top user questions
- [ ] 9.6 Weekly admin email digest

---

## Phase 10 — SEO/GEO + Cultural Calendar (post-launch) 🟢
- [ ] 10.1 JSON-LD `TouristTrip` in /plan/[slug]
- [ ] 10.2 Sitemap dynamic include public plans (viewCount≥5)
- [ ] 10.3 noindex default → index when threshold met
- [ ] 10.4 llms.txt at root
- [ ] 10.5 Plan dynamic OG image (next/og)
- [ ] 10.6 Cultural calendar static knowledge file (Lunar NY, Golden Week, Obon, Chuseok, Christmas, Songkran)
- [ ] 10.7 AI warning for high-demand seasons
