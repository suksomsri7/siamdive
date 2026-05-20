import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isComplete, type Slots } from "@/lib/ark-ai/slots";
import { buildPlanSignature } from "@/lib/ark-ai/plan-signature";
import { findRecentDeletion, clearDeletedSignature } from "@/lib/ark-ai/deleted-sigs";
import {
  regionMatchesArea,
  dateProximity,
  lowestCert,
  similanClosed,
  buildPlanName,
  packageIsSnorkelFriendly,
} from "@/lib/ark-ai/build-plan";

// Phase 3 — Auto-build a UserPlan from the slot extraction in AiPlanSession.
// Reads slots → matches Schedule rows in a ±3-day window → cert/region filters
// → top 3 by date proximity → gap-fills 2 blogs by area overlap → writes
// UserPlan(source=ARK_AI). Returns redirect target to /[lang]/plan/[shortId].

const DATE_FALLBACK_DAYS = 3;

const pickByLang = <T extends { lang: string }>(arr: T[], lang: string) =>
  arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const deviceId: string | undefined = body?.deviceId;
  const lang: string = typeof body?.lang === "string" ? body.lang : "en";
  const sessionId: string | undefined = typeof body?.sessionId === "string" ? body.sessionId : undefined;
  const path: string = typeof body?.path === "string" ? body.path : "/";
  const force: boolean = body?.force === true;
  // New (2026-05-20): the chat panel asks the user where to land the trips
  // when they already have at least one plan. Either append into an existing
  // plan (targetPlanId) or create a new one with the name they typed
  // (customName). Both fields are optional — when absent we fall back to
  // the original "always create new with auto-generated name" behavior.
  const targetPlanId: string | undefined = typeof body?.targetPlanId === "string" ? body.targetPlanId : undefined;
  const customName: string | undefined = typeof body?.customName === "string" ? body.customName.trim() || undefined : undefined;
  if (!deviceId) {
    return Response.json({ error: "deviceId required" }, { status: 400 });
  }

  // The chat route's slot write is fire-and-forget — the client may receive
  // `complete: true` and click "Build my plan" before the DB row is updated.
  // Retry once after a short wait so that race doesn't surface as "ขอข้อมูล
  // เพิ่มอีกนิด" when the user already provided everything.
  let session = await prisma.aiPlanSession.findFirst({
    where: { deviceId, status: "active", expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
  });
  let slots = (session?.slots && typeof session.slots === "object" ? session.slots : {}) as Slots;
  if (!isComplete(slots)) {
    await new Promise((r) => setTimeout(r, 400));
    session = await prisma.aiPlanSession.findFirst({
      where: { deviceId, status: "active", expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: "desc" },
    });
    slots = (session?.slots && typeof session.slots === "object" ? session.slots : {}) as Slots;
  }
  if (!isComplete(slots)) {
    return Response.json({ error: "incomplete_slots", slots }, { status: 400 });
  }

  const planSignature = buildPlanSignature(slots);

  const respondWithExisting = (existingPlan: {
    id: string;
    shortId: string;
    name: string;
    coverUrl: string | null;
    trips: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }, reason: "signature" | "active-plan") => {
    const existingTrips = Array.isArray(existingPlan.trips) ? existingPlan.trips : [];
    return Response.json({
      shortId: existingPlan.shortId,
      name: existingPlan.name,
      trips: existingTrips,
      blogs: [],
      warnings: [],
      reused: true,
      reusedReason: reason,
      redirect: `/${lang}/plan/${existingPlan.shortId}`,
      plan: {
        id: existingPlan.id,
        shortId: existingPlan.shortId,
        name: existingPlan.name,
        coverUrl: existingPlan.coverUrl,
        startDate: null,
        trips: existingTrips,
        createdAt: existingPlan.createdAt.toISOString(),
        updatedAt: existingPlan.updatedAt.toISOString(),
      },
    });
  };

  // Recently-deleted guard. User-reported bug 2026-05-09: deleted an
  // ARK_AI plan, opened chat, hit Build again — same trip rebuilt from
  // stale slots, felt like the deleted plan came back. Block the rebuild
  // and ask the client to confirm. Bypass when `force: true` (user clicked
  // the confirmation toast's "Create anyway").
  const existingUser = await prisma.planUser.findUnique({ where: { deviceId } });
  if (existingUser && !force) {
    const recentlyDeleted = findRecentDeletion(existingUser.recentlyDeletedSigs, "slot", planSignature);
    if (recentlyDeleted) {
      return Response.json({
        recentlyDeleted: true,
        name: recentlyDeleted.name,
        deletedAt: recentlyDeleted.at,
      });
    }
  }

  // Idempotency layer 1 — slot signature.
  // Repeat clicks on a stale "Build my plan" button were creating up to 3
  // duplicate plans. The signature hashes the slot fingerprint (dates +
  // headcount + region + certs + categories + companions) so any repeat
  // build with identical intent resolves to the existing plan. Skip
  // COMPLETED plans — finished trips; planning a similar future trip
  // should get a fresh plan.
  //
  // force=true means the user already saw the duplicate prompt and chose
  // "Create new". Both the signature dedup AND the legacy active-plan
  // fallback must yield to that choice — earlier I only gated the
  // recently-deleted check on !force, which made "สร้างใหม่" loop right
  // back to the existing plan.
  if (existingUser && !force) {
    const sigMatch = await prisma.userPlan.findFirst({
      where: {
        userId: existingUser.id,
        planSignature,
        status: { not: "COMPLETED" },
      },
      orderBy: { updatedAt: "desc" },
    });
    if (sigMatch) {
      return respondWithExisting(sigMatch, "signature");
    }

    // Layer 2 — legacy "user already curated trips" guard. If they have an
    // active PLANNING plan with at least one trip but no matching signature
    // (predates this feature, or slot extraction differs), still reuse it
    // rather than creating a competing plan. Stops the "MyPlan shows trips I
    // didn't pick" complaint.
    const existingPlan = await prisma.userPlan.findFirst({
      where: { userId: existingUser.id, status: "PLANNING" },
      orderBy: { updatedAt: "desc" },
    });
    if (existingPlan) {
      const existingTrips = Array.isArray(existingPlan.trips) ? existingPlan.trips : [];
      if (existingTrips.length > 0) {
        return respondWithExisting(existingPlan, "active-plan");
      }
    }
  }

  const dates = slots.dates!;
  const region = slots.region!;
  const cert = lowestCert(slots.certs);

  const fromMs = Date.parse(dates.from + "T00:00:00Z");
  const toMs = Date.parse((dates.to || dates.from) + "T23:59:59Z");
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    return Response.json({ error: "invalid_dates" }, { status: 400 });
  }
  const windowStart = new Date(fromMs - DATE_FALLBACK_DAYS * 86_400_000);
  const windowEnd = new Date(toMs + DATE_FALLBACK_DAYS * 86_400_000);

  const schedules = await prisma.schedule.findMany({
    where: {
      status: "OPEN",
      departureDate: { gte: windowStart, lte: windowEnd },
      boat: { status: "PUBLISHED" },
    },
    include: {
      boat: {
        include: {
          translations: { select: { lang: true, title: true, slug: true } },
          serviceAreas: {
            include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } },
          },
        },
      },
      translations: { select: { lang: true, title: true, route: true, itinerary: true, excerpt: true, content: true } },
      packages: {
        include: {
          package: {
            include: {
              translations: { select: { lang: true, title: true, excerpt: true } },
              priceTiers: { select: { tier: true, regularPrice: true, salePrice: true } },
            },
          },
          priceTiers: { select: { tier: true, regularPrice: true, salePrice: true } },
        },
      },
    },
    orderBy: { departureDate: "asc" },
  });

  const inRegion = schedules.filter(s => {
    if (region === "both") return true;
    const areas = s.boat.serviceAreas
      .map(sa => pickByLang(sa.serviceArea.translations, lang)?.name || "")
      .filter(Boolean);
    return areas.some(a => regionMatchesArea(region, a));
  });

  const certFiltered = cert === "none"
    ? inRegion.filter(s => s.packages.some(sp => {
        const tiers = sp.priceTiers.length ? sp.priceTiers : sp.package.priceTiers;
        const title = pickByLang(sp.package.translations, lang)?.title || sp.package.name;
        return packageIsSnorkelFriendly(tiers, title);
      }))
    : inRegion;

  // Pick a single best-fit trip instead of "top 3 alternatives". The
  // earlier slice(0,3) crammed three competing options (often a
  // multi-day liveaboard PLUS two daytrips on the same departure date)
  // into one plan — physically impossible to do them all and confusing
  // for the user. Selection rules:
  //   1. Sort by date proximity first, then by trip type preference
  //      (LIVEABOARD wins over DAYTRIP when both are equally close —
  //      it covers the whole vacation in one go).
  //   2. Take the top match. If it's a LIVEABOARD, stop there — the
  //      multi-day departure already fills the trip window.
  //   3. If it's a DAYTRIP, allow up to 2 more daytrips on DISTINCT
  //      departure dates so multi-day vacations get a real itinerary.
  const TYPE_RANK: Record<string, number> = {
    LIVEABOARD: 0,
    DIVE_RESORT: 1,
    DAYTRIP: 2,
    SNORKELING: 2,
  };
  const ranked = certFiltered
    .map(s => ({
      s,
      score: dateProximity(s.departureDate?.toISOString().slice(0, 10) || null, dates.from, dates.to),
      typeRank: TYPE_RANK[s.boat.type] ?? 9,
    }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => a.score - b.score || a.typeRank - b.typeRank);

  // Daytrip stacking is only useful when the user gave us an actual date
  // RANGE (e.g. "12-15 พ.ค." → fill the multi-day vacation with one trip
  // per day). For a single-day request the stacking misfires: the ±3-day
  // search window includes adjacent days, so the user got
  // "Hug Ocean 11 May + 12 May + 13 May" when they only asked for 12 May.
  // User-reported bug 2026-05-09 (multiple rounds): "ทำไมไปสร้าง hug ocean
  // 3 ทริปติด". Cap to one pick when the request is a single day.
  const isSingleDay = !dates.to || dates.to === dates.from;
  const MAX_DAYTRIP_PICKS = isSingleDay ? 1 : 3;

  const topPicks: typeof ranked = [];
  for (const cand of ranked) {
    if (topPicks.length === 0) {
      topPicks.push(cand);
      if (cand.s.boat.type === "LIVEABOARD" || cand.s.boat.type === "DIVE_RESORT") break;
      if (MAX_DAYTRIP_PICKS === 1) break;
      continue;
    }
    if (topPicks.length >= MAX_DAYTRIP_PICKS) break;
    // Only stack additional DAYTRIPs and only on DISTINCT departure dates,
    // never alongside a liveaboard.
    if (cand.s.boat.type !== "DAYTRIP" && cand.s.boat.type !== "SNORKELING") continue;
    if (topPicks.some(p => p.s.boat.type === "LIVEABOARD" || p.s.boat.type === "DIVE_RESORT")) break;
    const candDate = cand.s.departureDate?.toISOString().slice(0, 10) || "";
    if (topPicks.some(p => (p.s.departureDate?.toISOString().slice(0, 10) || "") === candDate)) continue;
    topPicks.push(cand);
  }

  // Sprint 3 B2 — Group-aware companion pick. If the slot includes
  // non-divers with an explicit programme, look for a parallel schedule
  // (snorkel daytrip / land tour) on the same primary date as the chosen
  // dive trip. Append it AFTER the divers' pick(s) so the plan shows both
  // legs of the day. Stays at most 1 companion pick — we don't want to
  // bloat the plan with mirror options.
  const companions = slots.companions;
  if (companions && companions.nonDivers > 0 && topPicks.length > 0 && companions.activity && companions.activity !== "relax") {
    const primaryDate = topPicks[0].s.departureDate?.toISOString().slice(0, 10);
    const wantedTypes = companions.activity === "snorkel"
      ? new Set(["SNORKELING", "DAYTRIP"])
      : new Set<string>(["LAND_TOUR"]);
    const companionCand = ranked.find(({ s }) => {
      if (topPicks.some(p => p.s.id === s.id)) return false;
      if (!wantedTypes.has(s.boat.type)) return false;
      const sd = s.departureDate?.toISOString().slice(0, 10);
      // Same day as the primary dive trip — companions are travelling
      // together so dates must align.
      if (!primaryDate || sd !== primaryDate) return false;
      // Snorkel companion needs a snorkel-friendly package.
      if (companions.activity === "snorkel") {
        return s.packages.some(sp => {
          const tiers = sp.priceTiers.length ? sp.priceTiers : sp.package.priceTiers;
          const title = pickByLang(sp.package.translations, lang)?.title || sp.package.name;
          return packageIsSnorkelFriendly(tiers, title);
        });
      }
      return true;
    });
    if (companionCand) topPicks.push(companionCand);
  }

  const trips = topPicks.map(({ s }) => {
    const bt = pickByLang(s.boat.translations, lang);
    const areaTrans = s.boat.serviceAreas[0]?.serviceArea
      ? pickByLang(s.boat.serviceAreas[0].serviceArea.translations, lang)
      : null;
    const st = pickByLang(s.translations, lang);
    const eligiblePackages = cert === "none"
      ? s.packages.filter(sp => {
          const tiers = sp.priceTiers.length ? sp.priceTiers : sp.package.priceTiers;
          const title = pickByLang(sp.package.translations, lang)?.title || sp.package.name;
          return packageIsSnorkelFriendly(tiers, title);
        })
      : s.packages;
    // Walk every tier to derive a schedule-wide price range. The plan UI
    // renders "เริ่ม X — Y บาท/คน"; we no longer surface individual packages.
    const allPrices: number[] = [];
    for (const sp of eligiblePackages) {
      const tiers = sp.priceTiers.length ? sp.priceTiers : sp.package.priceTiers;
      for (const t of tiers) {
        const price = t.salePrice ?? t.regularPrice;
        if (price > 0) allPrices.push(price);
      }
    }
    const priceMin = allPrices.length ? Math.min(...allPrices) : 0;
    const priceMax = allPrices.length ? Math.max(...allPrices) : 0;
    return {
      boatId: s.boat.id,
      title: bt?.title || s.boat.name,
      slug: bt?.slug || s.boat.id,
      type: s.boat.type,
      area: areaTrans?.name || "",
      cover: s.boat.covers?.[0] || null,
      addedAt: Date.now(),
      schedule: {
        scheduleId: s.id,
        departureDate: s.departureDate?.toISOString().slice(0, 10) || "",
        returnDate: s.returnDate?.toISOString().slice(0, 10) || null,
        title: st?.title || bt?.title || s.boat.name,
        route: st?.route || (s.boat.type === "DAYTRIP" ? st?.title || "" : ""),
        itinerary: st?.itinerary || "",
        excerpt: st?.excerpt || "",
        // schedule.content carries the operator's <h2>กำหนดการ</h2> block —
        // PlanTimeline parses it for daytrip hour-by-hour rendering, since
        // schedule.itinerary is empty for all prod daytrips.
        content: st?.content || "",
        priceMin,
        priceMax,
      },
    };
  });

  const chosenAreaIds = Array.from(new Set(
    topPicks.flatMap(({ s }) => s.boat.serviceAreas.map(sa => sa.serviceAreaId)),
  ));
  const blogsRaw = chosenAreaIds.length > 0
    ? await prisma.blog.findMany({
        where: {
          status: "PUBLISHED",
          serviceAreaIds: { hasSome: chosenAreaIds },
        },
        include: {
          translations: { where: { lang }, select: { title: true, slug: true, excerpt: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
      })
    : [];
  const blogs = blogsRaw
    .filter(b => b.translations.length > 0)
    .map(b => ({
      blogId: b.id,
      title: b.translations[0].title,
      slug: b.translations[0].slug,
      excerpt: b.translations[0].excerpt,
      cover: b.covers?.[0] || null,
    }));

  // Bail out before persisting an empty plan. Creating UserPlan with
  // trips=[] sends the user to a blank MyPlan with no itinerary, which
  // looks broken. Return the actionable warning to chat instead so the
  // user can adjust their slots (widen dates / switch coast / drop the
  // snorkel-only constraint).
  if (trips.length === 0) {
    const reasons: string[] = [];
    if (region === "andaman" && similanClosed(dates.from)) {
      reasons.push(lang === "th"
        ? "อุทยานสิมิลัน-สุรินทร์ปิด 16 พ.ค. – 14 ต.ค. ทุกปี — ลองช่วง พ.ย.–เม.ย. หรือเปลี่ยนพื้นที่เป็นพีพี/หินม่วง"
        : "Similan/Surin national parks close May 16–Oct 14 each year. Try Nov–Apr or pick another area like Phi Phi/Hin Muang.");
    }
    if (cert === "none") {
      reasons.push(lang === "th"
        ? "ไม่พบทริป snorkel ในช่วงวัน/พื้นที่ที่เลือก — ลองขยายช่วงวันหรือเปลี่ยนพื้นที่"
        : "No snorkel-friendly trips matched. Try widening the dates or switching coast.");
    }
    if (reasons.length === 0) {
      reasons.push(lang === "th"
        ? "ไม่พบทริปที่ตรงเวลา/พื้นที่ที่เลือก ลองขยายช่วงวันหรือเปลี่ยนภูมิภาคดูครับ"
        : "No trips matched your dates and region — try widening the window or switching coast.");
    }
    return Response.json({
      error: "no_matching_trips",
      reasons,
      slots,
    }, { status: 400 });
  }

  const warnings: string[] = [];

  let user = await prisma.planUser.findUnique({ where: { deviceId } });
  if (!user) {
    user = await prisma.planUser.create({ data: { deviceId } });
  }

  // targetPlanId path — caller wants to append into an existing plan
  // instead of creating a new one. Merge trips by (boatId, scheduleId);
  // skip planSignature updates since the signature concept only applies
  // to the original Ark-AI-built plan.
  if (targetPlanId) {
    const existing = await prisma.userPlan.findFirst({
      where: { id: targetPlanId, userId: user.id },
    });
    if (!existing) {
      return Response.json({ error: "target_plan_not_found" }, { status: 404 });
    }
    const existingTrips = Array.isArray(existing.trips) ? (existing.trips as Array<Record<string, unknown>>) : [];
    const tripKey = (t: Record<string, unknown>) => {
      const boatId = typeof t.boatId === "string" ? t.boatId : "";
      const sched = t.schedule as Record<string, unknown> | undefined;
      const schedId = sched && typeof sched.scheduleId === "string" ? sched.scheduleId : "";
      return `${boatId}::${schedId}`;
    };
    const seen = new Set(existingTrips.map(tripKey));
    const additions = trips.filter(t => !seen.has(tripKey(t as Record<string, unknown>)));
    const merged = [...existingTrips, ...additions];
    const plan = await prisma.userPlan.update({
      where: { id: targetPlanId },
      data: {
        trips: merged as never,
        coverUrl: existing.coverUrl ?? trips[0]?.cover ?? null,
      },
    });
    return Response.json({
      plan: { ...plan, createdAt: plan.createdAt.toISOString(), updatedAt: plan.updatedAt.toISOString() },
      appended: true,
      addedCount: additions.length,
    });
  }

  const planName = customName || buildPlanName(slots, lang);
  let plan;
  try {
    plan = await prisma.userPlan.create({
      data: {
        userId: user.id,
        name: planName,
        coverUrl: trips[0]?.cover ?? null,
        trips: trips as never,
        source: "ARK_AI",
        aiPrompt: JSON.stringify(slots),
        // force=true means the user already saw the duplicate prompt and
        // chose "Create new anyway". Store this plan WITHOUT a signature
        // so the partial unique index on (userId, planSignature) doesn't
        // block it. Future builds will still resolve to the original
        // signed plan; this orphaned dup just lives independently.
        // customName triggers the same skip — a user-typed name implies
        // they want an independent plan even if the slots match.
        planSignature: (force || customName) ? null : planSignature,
        status: "PLANNING",
      },
    });
  } catch (err) {
    // Race: a concurrent request with the same slot signature won. Partial
    // unique index ("UserPlan_userId_planSignature_unique") raised P2002.
    // Re-fetch the winner and return it as reused — the client UX is
    // identical to a normal idempotent reuse.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const winner = await prisma.userPlan.findFirst({
        where: { userId: user.id, planSignature },
        orderBy: { createdAt: "asc" },
      });
      if (winner) return respondWithExisting(winner, "signature");
    }
    throw err;
  }

  // Await the session-complete update so concurrent triple-clicks (which
  // all read the active session before any of them commits) don't all
  // sail past the `status: "active"` filter and re-enter the create path.
  // Signature dedup catches the race anyway, but completing the session
  // first means subsequent clicks short-circuit at the slot read.
  if (session) {
    await prisma.aiPlanSession
      .update({ where: { id: session.id }, data: { status: "completed" } })
      .catch(err => console.error("[ark-ai/build-plan] session complete failed:", err));
  }

  // Force-mode reached create — the user explicitly confirmed they wanted
  // a rebuild after the recently-deleted prompt. Drop the stashed sig so
  // the prompt doesn't fire on the next legitimate build for this trip.
  if (force) {
    clearDeletedSignature(user.id, "slot", planSignature).catch(err =>
      console.error("[ark-ai/build-plan] clearDeletedSignature failed:", err),
    );
  }

  if (sessionId) {
    prisma.analyticsEvent
      .createMany({
        data: [
          {
            sessionId, visitorId: deviceId, type: "ARK_AI_PLAN_GENERATED" as never, path, lang,
            properties: {
              planId: plan.id, shortId: plan.shortId, tripCount: trips.length, blogCount: blogs.length, slots,
            } as never,
          },
          {
            sessionId, visitorId: deviceId, type: "ARK_AI_PLAN_SAVED" as never, path, lang,
            properties: { planId: plan.id, shortId: plan.shortId } as never,
          },
        ],
      })
      .catch(err => console.error("[ark-ai/build-plan] analytics failed:", err));
  }

  return Response.json({
    shortId: plan.shortId,
    name: plan.name,
    trips,
    blogs,
    warnings,
    redirect: `/${lang}/plan/${plan.shortId}`,
    // Full plan in localStorage shape so the client can write it straight into
    // plan-store and open the My Plan drawer without an extra round-trip.
    plan: {
      id: plan.id,
      shortId: plan.shortId,
      name: plan.name,
      coverUrl: plan.coverUrl,
      startDate: null,
      trips,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    },
  });
}
