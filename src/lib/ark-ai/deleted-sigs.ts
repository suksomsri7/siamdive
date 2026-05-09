import { prisma } from "@/lib/prisma";

// Tracks signatures of ARK_AI plans the user explicitly deleted, so build
// flows can prompt "you just deleted this — recreate?" instead of silently
// rebuilding from a stale chat thread or stale staged picks.
//
// Two signature kinds:
//   slot — hash of normalized chat slots (dates+headcount+region+certs+...)
//          covers the slow-path /api/ark-ai/build-plan rebuild.
//   trip — hash of sorted (boatId:scheduleId) pairs from the plan's trips,
//          covers the fast-path "staged picks → flushPicksToPlan" rebuild.
//
// Stored on PlanUser.recentlyDeletedSigs as JSON array, capped at MAX_KEEP
// entries. Entries older than TTL_MS are ignored at read time. Pre-existing
// rows without a `kind` field are treated as kind="slot" for backward compat.

const MAX_KEEP = 30;
const TTL_MS = 24 * 60 * 60 * 1000;

export type SigKind = "slot" | "trip";
export type DeletedSigEntry = { kind: SigKind; sig: string; name: string; at: string };

function asEntries(raw: unknown): DeletedSigEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e): DeletedSigEntry | null => {
      if (e == null || typeof e !== "object") return null;
      const o = e as Record<string, unknown>;
      if (typeof o.sig !== "string" || typeof o.name !== "string" || typeof o.at !== "string") {
        return null;
      }
      const kind: SigKind = o.kind === "trip" ? "trip" : "slot";
      return { kind, sig: o.sig, name: o.name, at: o.at };
    })
    .filter((e): e is DeletedSigEntry => e !== null);
}

export async function recordDeletedSignatures(
  userId: string,
  sigs: Array<{ kind: SigKind; sig: string }>,
  name: string,
): Promise<void> {
  if (sigs.length === 0) return;
  const user = await prisma.planUser.findUnique({
    where: { id: userId },
    select: { recentlyDeletedSigs: true },
  });
  if (!user) return;
  const existing = asEntries(user.recentlyDeletedSigs);
  const at = new Date().toISOString();
  const newEntries: DeletedSigEntry[] = sigs.map(({ kind, sig }) => ({ kind, sig, name, at }));
  const next = [...newEntries, ...existing].slice(0, MAX_KEEP);
  await prisma.planUser.update({
    where: { id: userId },
    data: { recentlyDeletedSigs: next as never },
  });
}

export function findRecentDeletion(
  raw: unknown,
  kind: SigKind,
  sig: string,
): DeletedSigEntry | null {
  const cutoff = Date.now() - TTL_MS;
  return (
    asEntries(raw).find(
      (e) => e.kind === kind && e.sig === sig && Date.parse(e.at) > cutoff,
    ) ?? null
  );
}

export async function clearDeletedSignature(
  userId: string,
  kind: SigKind,
  sig: string,
): Promise<void> {
  const user = await prisma.planUser.findUnique({
    where: { id: userId },
    select: { recentlyDeletedSigs: true },
  });
  if (!user) return;
  const next = asEntries(user.recentlyDeletedSigs).filter(
    (e) => !(e.kind === kind && e.sig === sig),
  );
  await prisma.planUser.update({
    where: { id: userId },
    data: { recentlyDeletedSigs: next as never },
  });
}
