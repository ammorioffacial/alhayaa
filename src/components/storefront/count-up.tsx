"use client";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./use-motion";
const format = new Intl.NumberFormat("en-US");
/** Counts up to a real value once it is visible. Shows the final value without motion. */
export default function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !("IntersectionObserver" in window)) return;
    let frame = 0;
    el.textContent = format.format(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const started = performance.now();
        const step = (now: number) => {
          const progress = Math.min(1, (now - started) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = format.format(Math.round(to * eased));
          if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = format.format(to);
    };
  }, [to, duration, reduced]);
  return <span ref={ref}>{format.format(to)}</span>;
}
