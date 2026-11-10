# Storefront image

- Saved asset: `public/images/care-editorial.png`
- Generated using the built-in `image_gen` tool, not the CLI.
- Purpose: decorative conceptual skincare still life, not a representation of pharmacy inventory.
- Original user-provided logo: `public/logo.png` (copied unchanged from workspace file `logo`).

## Final generation prompt

Create a premium editorial skincare still-life photograph for the hero of an Arabic pharmacy beauty ecommerce website. Landscape 3:2 composition. Three unbranded real cosmetic containers: a frosted ivory glass pump bottle, a small amber glass serum dropper with brushed champagne gold cap, and a low ivory cream jar. Arrange closely together on pale warm travertine steps, a natural olive branch entering at the top left, sheer ivory curtain softly in background, warm directional sunlight and clear elegant shadows. Restrained palette warm ivory, champagne gold, amber, hints of deep navy. High-end real commercial photography, tactile stone and glass, credible physical reflections, beautiful art direction. Products occupy central 65 percent, no excessive empty space. No text, no logos, no lettering, no watermarks. This is decorative conceptual photography, not specific real inventory.

## Redesign assets (hero and motion)

- Hero poster: `public/images/care-bag-hero.webp` (1024 × 1024, transparent). Shown whenever no video file exists, and always under `prefers-reduced-motion`. The brief named `/images/care-bag.png`; that file is not in the repository, so the existing WebP is used instead.
- Hero videos: `public/videos/hero-1`, `hero-2`, `hero-3` (WebM primary, MP4 fallback), 1920×1080, 8 s, muted, under 3 MB each. Playlist and poster in `src/lib/hero-media.ts`; encoding notes in `public/videos/README.md`.
- Fonts: Zain (SIL Open Font License 1.1), self-hosted through Fontsource (`@fontsource/zain`) at weights 400, 700 and 800. Licence text ships with the package in `node_modules`.
- Category artwork, product SVGs and the editorial image are unchanged.
