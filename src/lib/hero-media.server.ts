import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { heroMedia, type HeroClip } from "./hero-media";
/**
 * Checked on the server, so a missing file never causes a browser request or console error.
 * Returns only the playlist entries that have at least one file; an empty list means poster only.
 */
export function availableHeroVideos(): HeroClip[] {
  const root = path.join(process.cwd(), "public");
  const has = (url: string) => existsSync(path.join(root, url));
  return heroMedia.videos
    .map((name) => {
      const webm = `/videos/${name}.webm`;
      const mp4 = `/videos/${name}.mp4`;
      return {
        webm: has(webm) ? webm : null,
        mp4: has(mp4) ? mp4 : null,
      };
    })
    .filter((clip) => clip.webm || clip.mp4);
}
