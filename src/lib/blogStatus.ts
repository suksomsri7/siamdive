import type { BlogStatus } from "@/generated/prisma/client";

export const BLOG_STATUSES = ["DRAFT", "APPROVED", "PUBLISHED"] as const;
export type BlogStatusString = (typeof BLOG_STATUSES)[number];

// Allowed transitions. PUBLISHED is terminal — no transitions away from it.
// DRAFT → PUBLISHED is blocked to force content through the APPROVED gate.
const ALLOWED: Record<BlogStatusString, BlogStatusString[]> = {
  DRAFT: ["DRAFT", "APPROVED"],
  APPROVED: ["DRAFT", "APPROVED", "PUBLISHED"],
  PUBLISHED: ["PUBLISHED"],
};

export function normalizeStatus(raw: unknown): BlogStatusString | null {
  if (typeof raw !== "string") return null;
  const upper = raw.toUpperCase();
  return (BLOG_STATUSES as readonly string[]).includes(upper)
    ? (upper as BlogStatusString)
    : null;
}

export function canTransition(from: BlogStatus, to: BlogStatusString): boolean {
  return ALLOWED[from as BlogStatusString]?.includes(to) ?? false;
}

export function transitionError(from: BlogStatus, to: BlogStatusString): string {
  if (from === "PUBLISHED") {
    return `Cannot change status of a PUBLISHED blog (it is terminal).`;
  }
  if (from === "DRAFT" && to === "PUBLISHED") {
    return `DRAFT cannot go directly to PUBLISHED — must pass through APPROVED first.`;
  }
  return `Invalid status transition: ${from} → ${to}`;
}
