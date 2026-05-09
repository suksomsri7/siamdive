import { prisma } from "@/lib/prisma";

// Tracks the slot signatures of ARK_AI plans the user explicitly deleted,
// so /api/ark-ai/build-plan can prompt "you just deleted this — recreate?"
// instead of silently rebuilding the same trip from a stale chat thread.
//
// Stored on PlanUser.recentlyDeletedSigs as JSON array, capped at MAX_KEEP
// entries. Entries older than TTL_MS are ignored at read time.

const MAX_KEEP = 20;
const TTL_MS = 24 * 60 * 60 * 1000;

export type DeletedSigEntry = { sig: string; name: string; at: string };

function asEntries(raw: unknown): DeletedSigEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is DeletedSigEntry =>
      e != null &&
      typeof e === "object" &&
      typeof (e as DeletedSigEntry).sig === "string" &&
      typeof (e as DeletedSigEntry).name === "string" &&
      typeof (e as DeletedSigEntry).at === "string",
  );
}

export async function recordDeletedSignature(
  userId: string,
  sig: string,
  name: string,
): Promise<void> {
  const user = await prisma.planUser.findUnique({
    where: { id: userId },
    select: { recentlyDeletedSigs: true },
  });
  if (!user) return;
  const existing = asEntries(user.recentlyDeletedSigs);
  const next = [{ sig, name, at: new Date().toISOString() }, ...existing].slice(0, MAX_KEEP);
  await prisma.planUser.update({
    where: { id: userId },
    data: { recentlyDeletedSigs: next as never },
  });
}

export function findRecentDeletion(
  raw: unknown,
  sig: string,
): DeletedSigEntry | null {
  const cutoff = Date.now() - TTL_MS;
  return (
    asEntries(raw).find(
      (e) => e.sig === sig && Date.parse(e.at) > cutoff,
    ) ?? null
  );
}

export async function clearDeletedSignature(userId: string, sig: string): Promise<void> {
  const user = await prisma.planUser.findUnique({
    where: { id: userId },
    select: { recentlyDeletedSigs: true },
  });
  if (!user) return;
  const next = asEntries(user.recentlyDeletedSigs).filter((e) => e.sig !== sig);
  await prisma.planUser.update({
    where: { id: userId },
    data: { recentlyDeletedSigs: next as never },
  });
}
