// Pending picks — trips the user has clicked "+" on but hasn't committed to
// a plan yet. Lives in sessionStorage so it survives chat reopen but vanishes
// at session end (clearing the slate for a fresh visit). The Build CTA is the
// only thing that flushes pendingPicks → My Plan; until then, picks are pure
// intent and the user can drop or swap them via the chat without polluting
// their long-term plan history.

import type { PlanTrip } from "./plan-store";

const KEY = "siamdive:pending-picks";

export type PendingPick = Omit<PlanTrip, "addedAt">;

function readSafe(): PendingPick[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSafe(picks: PendingPick[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(picks));
    window.dispatchEvent(new CustomEvent("pending-picks-changed"));
  } catch {}
}

export function readPendingPicks(): PendingPick[] {
  return readSafe();
}

const pickKey = (p: PendingPick): string =>
  `${p.boatId}:${p.schedule?.scheduleId || ""}`;

export function addPendingPick(pick: PendingPick): boolean {
  const current = readSafe();
  const key = pickKey(pick);
  if (current.some(p => pickKey(p) === key)) return false;
  writeSafe([...current, pick]);
  return true;
}

export function removePendingPick(boatId: string, scheduleId?: string): void {
  const current = readSafe();
  const targetKey = `${boatId}:${scheduleId || ""}`;
  writeSafe(current.filter(p => pickKey(p) !== targetKey));
}

export function clearPendingPicks(): void {
  writeSafe([]);
}

export function pendingPickCount(): number {
  return readSafe().length;
}
