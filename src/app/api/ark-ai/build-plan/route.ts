import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isComplete, type Slots } from "@/lib/ark-ai/slots";
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
  if (!deviceId) {
    return Response.json({ error: "deviceId required" }, { status: 400 });
  }

  const session = await prisma.aiPlanSession.findFirst({
    where: { deviceId, status: "active", expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
  });
  const slots = (session?.slots && typeof session.slots === "object" ? session.slots : {}) as Slots;
  if (!isComplete(slots)) {
    return Response.json({ error: "incomplete_slots", slots }, { status: 400 });
  }

  // If the user has already curated trips through the chat picker, that
  // IS their plan — don't auto-build a competing one. Return the most
  // recent PLANNING plan with at least one trip and let the client open
  // it directly. Stops the "MyPlan shows trips I didn't pick" complaint.
  const existingUser = await prisma.planUser.findUnique({ where: { deviceId } });
  if (existingUser) {
    const existingPlan = await prisma.userPlan.findFirst({
      where: { userId: existingUser.id, status: "PLANNING" },
      orderBy: { updatedAt: "desc" },
    });
    if (existingPlan) {
      const existingTrips = Array.isArray(existingPlan.trips) ? existingPlan.trips : [];
      if (existingTrips.length > 0) {
        return Response.json({
          shortId: existingPlan.shortId,
          name: existingPlan.name,
          trips: existingTrips,
          blogs: [],
          warnings: [],
          reused: true,
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

  const topPicks: typeof ranked = [];
  for (const cand of ranked) {
    if (topPicks.length === 0) {
      topPicks.push(cand);
      if (cand.s.boat.type === "LIVEABOARD" || cand.s.boat.type === "DIVE_RESORT") break;
      continue;
    }
    if (topPicks.length >= 3) break;
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
        route: st?.route || (s.boat.type === "DAYTRIP" ? areaTrans?.name || "" : ""),
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

  const planName = buildPlanName(slots, lang);
  const plan = await prisma.userPlan.create({
    data: {
      userId: user.id,
      name: planName,
      coverUrl: trips[0]?.cover ?? null,
      trips: trips as never,
      source: "ARK_AI",
      aiPrompt: JSON.stringify(slots),
      status: "PLANNING",
    },
  });

  if (session) {
    prisma.aiPlanSession
      .update({ where: { id: session.id }, data: { status: "completed" } })
      .catch(err => console.error("[ark-ai/build-plan] session complete failed:", err));
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
