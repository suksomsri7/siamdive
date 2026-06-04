"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children into document.body via a portal.
 *
 * Plan overlays use position:fixed expecting the viewport as their containing
 * block. But the My Plan drawer (and other animated/transformed ancestors)
 * create a new containing block, which traps fixed children inside the
 * container — so modals centre within the drawer instead of the screen.
 * Wrapping a modal's return in <BodyPortal> moves its DOM to document.body so
 * position:fixed resolves against the viewport again.
 *
 * Mounts client-side only (after the first effect) to stay SSR-safe.
 */
export default function BodyPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
