"use client";
import { useSyncExternalStore } from "react";
const query = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const snapshot = () => window.matchMedia(query).matches;
// Server output assumes motion is allowed; reduced-motion users switch after hydration.
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
