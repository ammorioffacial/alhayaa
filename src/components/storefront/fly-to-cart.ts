"use client";
/** Fired when the flying dot reaches the cart; the cart badges pop on this event. */
export const CART_ARRIVE_EVENT = "hayat:cart-arrive";
const DURATION = 1150;
const EASE = [0.45, 0.05, 0.25, 1] as const;
const STEPS = 40;
const START_SIZE = 14;
const END_SIZE = 10;
/** Solves cubic-bezier(x1, y1, x2, y2) progress: input time fraction -> eased fraction. */
function bezierEase(x1: number, y1: number, x2: number, y2: number) {
  const sample = (a: number, b: number, t: number) => 3 * a * (1 - t) * (1 - t) * t + 3 * b * (1 - t) * t * t + t * t * t;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (sample(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return sample(y1, y2, (lo + hi) / 2);
  };
}
const ease = bezierEase(...EASE);
/** Visual only: a small gold dot follows a rising arc from the pressed control into the visible cart button. */
export function flyToCart(from: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = Array.from(
    document.querySelectorAll<HTMLElement>("[data-cart-target]"),
  ).find((el) => el.getBoundingClientRect().width > 0);
  if (!target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (!a.width || !b.width) return;
  const sx = a.left + a.width / 2;
  const sy = a.top + a.height / 2;
  const ex = b.left + b.width / 2;
  const ey = b.top + b.height / 2;
  // Quadratic bezier: control point above both ends, so the dot rises first, then descends.
  const cx = (sx + ex) / 2;
  const cy = Math.min(sy, ey) - 180;
  const dot = document.createElement("span");
  dot.className = "sf-fly-dot";
  dot.setAttribute("aria-hidden", "true");
  dot.style.left = `${sx - START_SIZE / 2}px`;
  dot.style.top = `${sy - START_SIZE / 2}px`;
  document.body.appendChild(dot);
  const frames: Keyframe[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const u = i / STEPS;
    const t = ease(u);
    const x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex;
    const y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey;
    const scale = (START_SIZE + (END_SIZE - START_SIZE) * t) / START_SIZE;
    // Fade out over the last 15% of the flight; opacity follows elapsed time, not the arc.
    const opacity = u <= 0.85 ? 1 : Math.max(0, (1 - u) / 0.15);
    frames.push({
      transform: `translate(${x - sx}px, ${y - sy}px) scale(${scale.toFixed(3)})`,
      opacity,
      offset: u,
    });
  }
  const animation = dot.animate(frames, { duration: DURATION, easing: "linear", fill: "forwards" });
  animation.onfinish = () => {
    dot.remove();
    window.dispatchEvent(new Event(CART_ARRIVE_EVENT));
  };
}
