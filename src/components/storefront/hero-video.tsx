"use client";
import { useState } from "react";
import Image from "next/image";
import { heroMedia, type HeroClip } from "@/lib/hero-media";
import { usePrefersReducedMotion } from "./use-motion";
type Playback = { index: number; failures: number };
/**
 * Plays the hero playlist in order and repeats it. A clip that fails is skipped.
 * The poster image is shown when no clip exists, when every clip fails, and
 * always under prefers-reduced-motion.
 */
export default function HeroVideo({ clips }: { clips: HeroClip[] }) {
  const reduced = usePrefersReducedMotion();
  const [playback, setPlayback] = useState<Playback>({ index: 0, failures: 0 });
  const count = clips.length;
  const usable = count > 0 && !reduced && playback.failures < count;
  const index = count ? playback.index % count : 0;
  const clip = clips[index];
  const next = () =>
    setPlayback((p) => ({ index: (p.index + 1) % count, failures: p.failures + 1 }));
  // Rendered inside the card's absolute background layer (.sf-campaign-art).
  return (
    <>
      {usable && clip ? (
        <video
          key={index}
          className="sf-hero-video"
          autoPlay
          muted
          playsInline
          loop={count === 1}
          preload="auto"
          poster={heroMedia.poster}
          aria-hidden="true"
          onEnded={
            count > 1
              ? () =>
                  setPlayback({ index: (playback.index + 1) % count, failures: 0 })
              : undefined
          }
          onPlaying={() =>
            setPlayback((p) => (p.failures ? { ...p, failures: 0 } : p))
          }
        >
          {clip.webm && (
            <source
              src={clip.webm}
              type="video/webm"
              onError={clip.mp4 ? undefined : next}
            />
          )}
          {clip.mp4 && (
            <source src={clip.mp4} type="video/mp4" onError={next} />
          )}
        </video>
      ) : (
        <Image
          className="sf-hero-poster"
          src={heroMedia.poster}
          alt={heroMedia.posterAlt}
          fill
          sizes="100vw"
          priority
        />
      )}
    </>
  );
}
