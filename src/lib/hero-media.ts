// Single switch for the storefront hero videos.
// Each entry is a base name in public/videos/: hero-1.webm / hero-1.mp4 (either or both).
// Entries play in order and repeat. A missing file is skipped; if none exist,
// the poster image below is shown and no video is requested.
export const heroMedia = {
  videos: ["hero-1", "hero-2", "hero-3"],
  poster: "/images/care-bag-hero.webp",
  posterAlt: "حقيبة عناية بيضاء وزرقاء على خلفية دائرية في صيدلية حياة المجد",
} as const;
/** One playlist entry; each source is null when its file is absent. */
export type HeroClip = { webm: string | null; mp4: string | null };
