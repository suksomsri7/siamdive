import { prisma } from "@/lib/prisma";

export type PlanRole = "OWNER" | "EDITOR" | "VIEWER";

export type PlanAccessResult = {
  /** Canonical plan row (null when the plan id doesn't exist). */
  plan: { id: string; userId: string } | null;
  /** Caller's relationship to the plan; null when they have none. */
  role: PlanRole | null;
  /** The caller's PlanUser (null when the deviceId is unknown). */
  user: { id: string; email: string | null } | null;
};

/**
 * Resolve a caller's relationship to a plan from their (unverified) deviceId.
 *
 * By design "My Plan" is login-free: the deviceId is a bearer identifier and
 * knowing it grants owner access. The job of this helper is NOT to add a login
 * — it's to stop a caller acting on a plan they have NO relationship to (e.g.
 * by guessing/leaking a plan id). Writes must require `canEdit(role)`.
 *
 * Resolution: owner (deviceId matches plan.user) → OWNER; otherwise an invited
 * PlanMember matched by the caller's email → that member's role; else null.
 *
 * `planId` must be the canonical cuid id (not shortId).
 */
export async function getPlanAccess(
  planId: string,
  deviceId: string | null | undefined,
): Promise<PlanAccessResult> {
  const plan = await prisma.userPlan.findUnique({
    where: { id: planId },
    select: { id: true, userId: true, user: { select: { deviceId: true } } },
  });
  if (!plan) return { plan: null, role: null, user: null };

  const base = { id: plan.id, userId: plan.userId };

  if (deviceId && plan.user.deviceId === deviceId) {
    return { plan: base, role: "OWNER", user: { id: plan.userId, email: null } };
  }
  if (!deviceId) return { plan: base, role: null, user: null };

  const user = await prisma.planUser.findUnique({
    where: { deviceId },
    select: { id: true, email: true },
  });
  if (user?.email) {
    const membership = await prisma.planMember.findUnique({
      where: { planId_email: { planId: plan.id, email: user.email } },
      select: { role: true },
    });
    if (membership) return { plan: base, role: membership.role as PlanRole, user };
  }
  return { plan: base, role: null, user: user ?? null };
}

/** Owner or editor may mutate a plan and its children. */
export function canEdit(role: PlanRole | null): boolean {
  return role === "OWNER" || role === "EDITOR";
}

/** Any resolved relationship (owner / editor / viewer) may read. */
export function canView(role: PlanRole | null): boolean {
  return role !== null;
}
