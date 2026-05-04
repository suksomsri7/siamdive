// Ark AI v2 — Behavior profile resolution + caching + cross-device merge.
// Wraps the existing recommendation-ai buildVisitorProfile() helper.

import { prisma } from "@/lib/prisma";
import { buildVisitorProfile } from "@/lib/recommendation-ai/compute";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const COLD_START_MIN_ACTIVITY = 5;

export type ArkAiProfile = {
  deviceId: string;
  mergedDeviceIds: string[];        // devices included in this profile (≥1, == [deviceId] if no email link)
  viewedBoatIds: string[];
  viewedAreaIds: string[];          // raw IDs — resolve to names via formatProfileSummary
  viewedTypes: { type: string; count: number }[];
  searches: string[];
  totalActivity: number;
};

/** Get profile for a device, with email-linked cross-device merge + 1-hour cache. */
export async function getArkAiProfile(deviceId: string): Promise<ArkAiProfile> {
  const cached = await prisma.aiPlanSession.findFirst({
    where: { deviceId },
    orderBy: { lastActiveAt: "desc" },
    select: { id: true, behaviorContext: true, lastActiveAt: true },
  });

  const cacheStillValid = cached?.behaviorContext &&
    cached.lastActiveAt.getTime() > Date.now() - CACHE_TTL_MS;

  if (cacheStillValid) {
    return cached!.behaviorContext as unknown as ArkAiProfile;
  }

  const fresh = await buildFreshProfile(deviceId);

  // Persist into cache (upsert)
  if (cached) {
    await prisma.aiPlanSession.update({
      where: { id: cached.id },
      data: { behaviorContext: fresh as never, lastActiveAt: new Date() },
    });
  } else {
    await prisma.aiPlanSession.create({
      data: {
        deviceId,
        behaviorContext: fresh as never,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  }

  return fresh;
}

async function buildFreshProfile(deviceId: string): Promise<ArkAiProfile> {
  // 1. Resolve email-linked sibling devices for cross-device merge
  let deviceIds = [deviceId];
  const planUser = await prisma.planUser.findFirst({
    where: { deviceId },
    select: { email: true },
  });
  if (planUser?.email) {
    const siblings = await prisma.planUser.findMany({
      where: { email: planUser.email },
      select: { deviceId: true },
    });
    deviceIds = Array.from(new Set([deviceId, ...siblings.map(s => s.deviceId)]));
  }

  // 2. Build a profile per device, then merge
  const profiles = await Promise.all(deviceIds.map(id => buildVisitorProfile(id)));
  return mergeProfiles(deviceId, deviceIds, profiles);
}

type RawProfile = Awaited<ReturnType<typeof buildVisitorProfile>>;

export function mergeProfiles(
  primaryDeviceId: string,
  mergedDeviceIds: string[],
  profiles: RawProfile[],
): ArkAiProfile {
  const viewedBoatIds = uniq(profiles.flatMap(p => p.viewedBoatIds));
  const viewedAreaIds = uniq(profiles.flatMap(p => p.viewedAreas));
  const searches = uniq(profiles.flatMap(p => p.searches)).slice(0, 10);
  const totalActivity = profiles.reduce((s, p) => s + p.totalActivity, 0);

  // Combine type counts across devices
  const typeMap = new Map<string, number>();
  for (const p of profiles) {
    for (const t of p.viewedTypes) {
      typeMap.set(t.type, (typeMap.get(t.type) ?? 0) + t.count);
    }
  }
  const viewedTypes = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return {
    deviceId: primaryDeviceId,
    mergedDeviceIds,
    viewedBoatIds,
    viewedAreaIds,
    viewedTypes,
    searches,
    totalActivity,
  };
}

/**
 * Format profile as a soft hint block for the system prompt.
 * Returns "" for cold-start visitors so the AI does not infer preferences from noise.
 */
export async function formatProfileSummary(profile: ArkAiProfile, lang: string): Promise<string> {
  if (profile.totalActivity < COLD_START_MIN_ACTIVITY) return "";

  const lines: string[] = [];

  if (profile.viewedAreaIds.length > 0) {
    const areaNames = await resolveAreaNames(profile.viewedAreaIds.slice(0, 5), lang);
    if (areaNames.length > 0) lines.push(`- Areas browsed: ${areaNames.join(", ")}`);
  }
  if (profile.viewedTypes.length > 0) {
    const top = profile.viewedTypes.slice(0, 3).map(t => `${t.type} (${t.count})`).join(", ");
    lines.push(`- Trip-type preference: ${top}`);
  }
  if (profile.searches.length > 0) {
    lines.push(`- Recent searches: ${profile.searches.slice(0, 5).join(", ")}`);
  }
  if (profile.viewedBoatIds.length > 0) {
    lines.push(`- Has viewed ${profile.viewedBoatIds.length} boat${profile.viewedBoatIds.length === 1 ? "" : "s"}`);
  }
  if (profile.mergedDeviceIds.length > 1) {
    lines.push(`- (Profile merged across ${profile.mergedDeviceIds.length} devices via shared email)`);
  }

  if (lines.length === 0) return "";

  return [
    "## Visitor Behavior Profile (soft hints — do NOT mention these explicitly to the user)",
    "Use to lightly bias recommendations. If a viewed area aligns with their request, prioritize boats from that area.",
    "Never say things like \"I see you viewed X\" — keep it implicit.",
    "",
    ...lines,
  ].join("\n");
}

async function resolveAreaNames(serviceAreaIds: string[], lang: string): Promise<string[]> {
  if (serviceAreaIds.length === 0) return [];
  const areas = await prisma.serviceArea.findMany({
    where: { id: { in: serviceAreaIds } },
    include: {
      translations: {
        where: { lang: { in: [lang, "en"] } },
        select: { lang: true, name: true },
      },
    },
  });
  return areas
    .map(a => {
      const localized = a.translations.find(t => t.lang === lang)?.name;
      const fallback = a.translations.find(t => t.lang === "en")?.name;
      return (localized || fallback || "").trim();
    })
    .filter(Boolean);
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Internal exports for tests
export const _internal = { COLD_START_MIN_ACTIVITY, CACHE_TTL_MS };
