# Redesign notes: storefront v2

Written for: developers and the pharmacy owner reviewing the storefront before release.

This file describes the current state. The v1 redesign (glass cards, video hero, floating dock) is still in place. v2 changes the typography, numbers, animation timing, spacing, and background described below.

## Changes by item

1. **Typography.** The site uses Zain from Fontsource (`@fontsource/zain`), set once through the `--font-arabic` token (see the Zain section below). The earlier family and its files are removed. Sizes follow the v2 scale: body 16px desktop and 15px mobile; section titles 28–34px desktop and 24px mobile; hero title 44–56px desktop and 36–42px mobile, at line-height 1.25 with `padding-block: .1em`; card titles 17px; prices 16px at weight 600. Nothing is set below 14px. No weight above 700 and no negative letter-spacing.
2. **Western digits and currency.** The page uses `Intl.NumberFormat("en-US")` and the code "IQD": "24,000 IQD" (`formatPrice()`). The footer address now reads "شارع 66". The WhatsApp message keeps its original format (Arabic-Indic digits and "د.ع") because you asked us not to change it. See open decision 1.
3. **Arabic plural for product counts.** `productCount()` in `src/lib/arabic-plural.ts`: 0 "لا توجد منتجات", 1 "منتج واحد", 2 "منتجان", 3–10 "{n} منتجات", 11 and above "{n} منتجاً". Used in the category cards, the catalog count, the trust strip and the admin count. The number is always Western digits.
4. **Fly-to-cart.** The dot follows a quadratic arc over 1200ms, with easing `cubic-bezier(.45,.05,.25,1)`. It shrinks from 14px to 10px and fades over the last 15% of the flight. The cart badge pops when the dot arrives (`hayat:cart-arrive` event), not when the item is added. Under `prefers-reduced-motion` the flight is skipped and only the counter updates.
5. **Bottom dock clearance.** The page bottom padding is `calc(96px + env(safe-area-inset-bottom, 0px))`. Product cards have `scroll-margin-bottom: 110px`, so an anchored scroll stops above the dock.
6. **Header spacing.** Desktop search is up to 640px wide. The gap between groups is 28px. Cart and favorites have 44px minimum targets. The logo is 64px on desktop and 48px on mobile. On mobile the logo and the cart and favorites buttons share the top row, and the search has its own row below.
7. **Hero title.** `line-height: 1.25` and `padding-block: .1em` on the hero `h1`.
8. **Background depth.** The page background is a diagonal gradient (`#f4f7fb → #eef3f9 → #f8f4ee`). A soft blurred blob sits behind the category section. Text colours are unchanged, so contrast is unchanged.

## Files changed

- `package.json`, `package-lock.json`: `@fontsource/zain` at `^5.3.0`.
- `src/app/layout.tsx`: Zain 400, 700 and 800 imports.
- `src/app/globals.css`, `src/app/storefront.css`: font family, type scale, hero line-height, background, blob, dock clearance, header widths, pop animation (`.is-pop`).
- `src/components/storefront/product-experience.css`: type scale, scroll margin.
- `src/components/storefront/home.tsx`, `navigation.tsx`: plural helper, Western digits, cart-arrival listener, `data-cart-count` on the badges.
- `src/components/storefront/product-card.tsx`: `formatPrice` for prices.
- `src/components/storefront/count-up.tsx`: `en-US` digits.
- `src/components/storefront/fly-to-cart.ts`: arc, duration, arrival event.
- `src/lib/catalog.ts`: `formatPrice` added. The WhatsApp `money()` is unchanged.
- `src/lib/arabic-plural.ts`: new.
- `src/components/admin.tsx`: `formatPrice` and `productCount`.
- `tests/e2e/milestone.spec.ts`, `premium.spec.ts`, `admin-live.spec.ts`: five UI price expectations changed to the "80,000 IQD" style (see below). No selector changed.
- `docs/design-system.md`, `docs/reference-design-analysis.md`, `docs/verification.md`, `README.md`, `public/images/ASSETS.md`: font and type references.
- Removed: the earlier font files and their references.
- Scripts: `scripts/type-scale-v2.py` (one-off type migration), `scripts/verify-redesign-v2.mjs` (verification).

## Test expectations changed

Page price text moved from Arabic-Indic digits and "د.ع" to Western digits and "IQD":

- `milestone.spec.ts`: `.sf-cart-summary` "٨٠٬٠٠٠" → "80,000 IQD"; "٥٦٬٠٠٠" → "56,000 IQD".
- `premium.spec.ts`: `.sf-detail-total` "٧٢٬٠٠٠" → "72,000 IQD"; `.sf-cart-summary` "٧٢٬٠٠٠" → "72,000 IQD".
- `admin-live.spec.ts`: admin row "١٬٥٠٠" → "1,500 IQD".

WhatsApp message expectations (the `milestone.spec.ts` and `store.spec.ts` previews, the `admin-live.spec.ts` checkout text, and `tests/checkout.test.ts`) are unchanged, because the message format is unchanged.

## Verification

| Command | Result |
| --- | --- |
| `npm run lint` | exit 0, no findings |
| `npm run typecheck` | exit 0, no errors |
| `npm test` | 5 of 5 passed |
| `npx playwright test --workers=1` (DEMO_MODE=true) | 14 passed, 2 failed, 1 skipped (`admin-live`, needs Supabase). Failures: the known desktop-dock expectation in `milestone.spec.ts:168`, and the 360px test, which hit the dev-overlay pointer interception (the same dev-only flake as before). The 360px test passes when run alone. |
| `npm run build` | exit 0, "Compiled successfully" |
| `scripts/verify-redesign-v2.mjs` on production port 3001 | No horizontal scroll at 375, 430, 768, 1024 or 1440px. Zero console errors and zero page errors at every width. |
| Fly-to-cart duration | Web Animations API reports 1200ms at every width. Observed wall-clock time from a DOM observer: 1235–1307ms, which includes event-loop lag. The 1307ms run is just above the 1300ms ceiling. |
| Cart count | Badge reads 1 after the first add and 2 after the second, at every width. |
| Badge pop | Not applied during the flight; applied after arrival, at every width. |
| Arabic-Indic digits in server HTML | 0 characters in the 49,795-byte HTML of `/`. |

Screenshots: `artifacts/redesign-v2/` holds `home-{w}.png` (full page), `cards-{w}.png` (product row) and `cart-{w}.png` for 375, 430, 768, 1024 and 1440px. `metrics.json` holds the raw results.

## Open decisions

1. **WhatsApp message format.** The message still uses Arabic-Indic digits and "د.ع". It is the only place these remain. Switching it to match the page is a small change, but it alters the message you asked us to keep. Say the word and we'll change it along with the test expectations.
2. **Count-up.** The trust strip shows the product count as plural text ("6 منتجات"), not as an animated number, since the helper owns the noun. The category count still runs the count-up.
3. **Poster fallback.** `/images/care-bag.png` does not exist in the repository. The fallback is `care-bag-hero.webp`.
4. **Legacy stylesheet.** Resolved: `src/app/mobile-store.css` has been deleted, and nothing imported it.
5. **Dev-overlay flake (open).** The 360px test failed once in an earlier full dev-server run with pointer interception. It has not reproduced since. See "Follow-up fixes" below.

## Dock v3 (separated layout)

Structure, from the approved option 3:

- **Pill:** exactly three items: Home ("الرئيسية", `home`), Products ("المنتجات", `categories`), Favorites ("المفضلة", `favorites`). The pill is `rgba(255,255,255,.92)` with `backdrop-filter: blur(16px) saturate(140%)` and shadow `0 12px 32px rgba(15,43,69,.16)`, so content behind it does not show through.
- **Cart:** a separate 60px round button, outside the pill, 12px from it. Navy `#0f2b45` with a gold ring (`box-shadow: 0 0 0 3px #c9a35a`). It is `aria-label="السلة، N قطع"`, which keeps the count in the name, as the existing tests rely on it.
- **Badge:** absolute, `top: -6px; right: -6px`, `min-width: 22px; height: 22px`, `border: 2px solid #fff`, Western digits from the same `count` source.
- **Search:** removed from the dock. It stays in the header.
- **Active item:** a soft light-blue circle (`#dbe9f4`) scales in over 220ms `ease-out`. Its icon and label are navy `#0f2b45`, weight 600. Inactive items use `#5b6b7b`, weight 500.
- **Sizes:** items are 84px wide and 56px tall (44px minimum hit area), icons 22px, labels 14px. The dock is `position: fixed; bottom: calc(14px + env(safe-area-inset-bottom, 0px))`, centred as a group.
- **Focus:** `2px solid #c9a35a` with a 3px offset. Reduced motion disables the transitions and the scale-in (the existing `.storefront *` rule).

Unchanged: the cart count source, cart logic and totals, every link destination, and the page bottom padding.

Deviation: "المنتجات" keeps the existing `categories` destination, which scrolls to the category section. It does not scroll to the product list. Change this if you want it to point at the catalog.

## Follow-up fixes

1. **Desktop dock expectation.** Test "desktop composition and original logo on both surfaces" (`tests/e2e/milestone.spec.ts`). Old: `await expect(page.locator(".sf-bottom-nav")).toBeHidden();`. New: `toBeVisible()`. The dock design is unchanged.
2. **360px interception: trace findings.**
   - Clean probe at 360px (no dialogs open): the dock's cart button is the element at its own centre. The `nextjs-portal` is zero-size and not on top.
   - Full suite with `--trace on`: the 360px test passed. The one failure in that run was the 390px milestone test, a 30-second timeout. Its snapshot shows the cart panel open, and it has no pointer-interception message.
   - Probe with the cart open: the cart backdrop covers the dock, which is expected. The dev overlay was not involved.
   - No trace of a failing 360px run exists, so the cause is not confirmed.
   - `next.config.ts` already sets `devIndicators: false`. No config change was made, since the portal is the dev overlay rather than the indicator.
3. **Fly-to-cart duration.** `DURATION` is now 1150ms in `fly-to-cart.ts`. The Web Animations API reports 1150ms on every run. Wall-clock time from the DOM observer, 10 runs per width:
   - 375px, run 2 (official): min 1181ms, max 1293ms, average 1222ms. All in the 1100–1300ms window.
   - 375px, run 1: min 1173ms, max 1221ms, average 1200ms. All in the window.
   - 1440px, run 2 (official): min 1324ms, max 1664ms, average 1411ms. Not all in the window.
   - 1440px, run 1: min 1350ms, max 1639ms, average 1510ms. Not all in the window.
   - Diagnostic at 1440px, 5 runs each: with the background blobs 1239–1287ms (average 1269ms); with the blobs hidden 1195–1245ms (average 1210ms). This is not a clean cause. It shows run-to-run variance, not a confirmed effect of the blobs.
4. **Legacy stylesheet.** `grep` found no import of `src/app/mobile-store.css`, so the file is deleted. The README's garbled last section still mentions it. That section cannot be recovered from the file, so it is left as is.

## Verification (this round)

| Command | Exit | Result |
| --- | --- | --- |
| `npm run lint` | 0 | No findings |
| `npm run typecheck` | 0 | No errors |
| `npm test` | 0 | 5 of 5 passed |
| `npx playwright test --workers=1` (DEMO_MODE=true) | 0 | 16 passed, 1 skipped (`admin-live`, needs Supabase), 0 failed |
| `npm run build` | 0 | Compiled successfully |

Dock geometry (`scripts/verify-dock-v3.mjs`, cart count 2):

- Badge overlaps neither the icon nor any item label, at 375px or 1440px.
- No label overflow.
- Cart button 60×60.
- Dock 14px from the bottom.
- Pill background `rgba(255,255,255,0.92)`.
- No page errors.

Screenshots: `artifacts/dock-v3/` has `dock-{375,1440}-viewport.png` and `dock-{375,1440}-bar.png`, plus `metrics.json` and `metrics-run1.json`.

## Test expectations changed (this round)

| Test | Old | New |
| --- | --- | --- |
| "desktop composition and original logo on both surfaces" | `.sf-bottom-nav` `toBeHidden()` | `toBeVisible()` |
| "390px milestone … and order message" (dock search step) | `.sf-bottom-nav` `getByRole("button", { name: "البحث", exact: true })` then `.click()` | `getByRole("textbox", { name: "البحث عن المنتجات" }).click()`, then the existing `toBeFocused()` |

No other selectors changed.

## Zain font (site-wide, storefront and admin)

**Change.** Zain from Fontsource (`@fontsource/zain@^5.3.0`) is the only typeface, for the storefront and `/admin`. It is loaded in `src/app/layout.tsx` through the 400, 700, and 800 stylesheets (Arabic and Latin subsets), and set once through `--font-arabic: "Zain", system-ui, sans-serif` on `:root`. `body` and `.storefront` use `var(--font-arabic)`. Form controls already inherit the font through `font: inherit` in `globals.css`. The admin area has no separate layout file, so it inherits the root layout's token.

**Weights.** Zain has no 500 or 600 files, so the stylesheets map them explicitly:
- `font-weight: 500` → `400`: 29 declarations across `globals.css`, `storefront.css`, and `product-experience.css`.
- `font-weight: 600` → `700`: 31 declarations across the same three files.
- One shorthand, `font: 500 8px/1.7 Arial` on the brand sub-label in `globals.css`, → `400`.
No weight above 800 is used. The visible effect is that medium and semibold text renders as regular and bold.

**Sizes.** No font-size was changed. The hero keeps `line-height: 1.25` and `padding-block: .1em`. Screenshots at 375px showed no clipping or overflow in the hero, the cart drawer, the admin login, or the admin dashboard. The 1440px and card-row screenshots were captured but were not individually reviewed.

**Removed.** The previous font dependency was removed with `npm uninstall`, and its `layout.tsx` imports were replaced. A search of `src`, `public`, `docs`, and `README.md` for the previous family names returns no matches, excluding SVG and WebM binaries. The docs name Zain only.

**Files changed.**
- `package.json`, `package-lock.json`: `@fontsource/zain` added, the previous font package removed.
- `src/app/layout.tsx`: Zain 400, 700, and 800 imports.
- `src/app/globals.css`: `--font-arabic` token, `body` font, the 29 and 31 weight mappings, and the shorthand.
- `src/app/storefront.css`: `.storefront` font, the same weight mappings, and a comment.
- `src/components/storefront/product-experience.css`: the same weight mappings.
- `README.md`, `docs/design-system.md`, `docs/verification.md`, `docs/reference-design-analysis.md`, `docs/redesign-notes.md`, `public/images/ASSETS.md`: font references.
- `scripts/capture-zain-font.mjs`: the capture and check script.

**Verification.**

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | exit 0, no findings |
| Typecheck | `npm run typecheck` | exit 0, no errors |
| Unit tests | `npm test` | exit 0, 10 of 10 passed |
| Playwright, first run | `npx playwright test --workers=1`, with `.env.local` in live mode | 14 failed. This was a configuration issue, not a font issue. `.env.local` configures Supabase, so the storefront served the live catalog instead of the demo catalog the tests expect. |
| Playwright, demo run | `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= DEMO_MODE=true npx playwright test --workers=1` | exit 1. 15 passed, 1 failed, 1 skipped (`admin-live`, needs Supabase). The failure is the 360px test, which hit the dev-overlay pointer interception seen in earlier runs. The same test passed when run alone. |
| Build | `npm run build` | exit 0, "Compiled successfully" |
| Built CSS | grep of `.next/static` | Zain `@font-face` rules present for 400 and 700. The 800 files are emitted. The font files are served from `/_next/static/media`. |
| External font hosts | Network capture on the storefront, login, and dashboard | No request to Google Fonts or any other external font host. The only non-local request is a product photo from the project's own Supabase storage. |
| Horizontal scroll | Capture at 375px and 1440px | None on the storefront, the login page, or the dashboard |
| Console errors | Capture at 375px and 1440px | 0 page errors and 0 console errors |

**Notes on the screenshots.** The `artifacts/zain-font/` screenshots of the storefront were taken from the production build with the live Supabase settings in `.env.local`, so they show the one live product, not the demo catalog. The dashboard screenshots come from a temporary preview route on the dev server, which was removed after the capture.

**Not finished.** The dashboard was not captured on the real logged-in `/admin` page, because that needs your credentials. The 360px interception is still unresolved. The cause is unconfirmed, and it appears only in dev-server runs.

## Dashboard layout and price bands (this step)

**Removed.** The "الأكثر طلباً والأكثر بحثاً" card and its explanatory note. The "أعلى سعراً" card keeps its place, and "متوسط السعر" is now a separate card at the top of the right-hand stack.

**Row order** (desktop, 12-column grid, 20px gap, every card stretches to its row height):
1. Four KPI cards: total products, available, unavailable, featured.
2. Categories breakdown (7 columns) and availability donut (5 columns).
3. Price bands (7 columns) and, in a stack (5 columns): average price on top, then the highest-priced products.
4. "تحتاج انتباهك", full width.

On phones (under 900px) every row collapses to one column in the same order.

**Price bands.** Only bands with at least one product are drawn. The columns use the number of visible bands, so no gap is left. With exactly one band, the card shows a sentence instead of a chart.

**Migration status.** `supabase/migrations/0001_categories.sql` has not been run on any project. The app category changes have not started. Both wait for the test-project result.

**Verification (this step):**

| Check | Result |
| --- | --- |
| `npm run lint` | exit 0, no findings |
| `npm run typecheck` | exit 0, no errors |
| `npm test` | exit 0, 10 of 10 passed |
| Dashboard preview at 375px and 1440px (temporary route, removed afterwards) | no horizontal scroll, no console errors |

Screenshots: `artifacts/admin-dashboard/dashboard-375.png` and `artifacts/admin-dashboard/dashboard-1440.png`. Playwright and the build were not run in this step.

## Categories: managed from the admin

**Migrations (run once, in order, in the target project's SQL editor).**
- `supabase/migrations/0001_categories.sql` (already applied to the test project): the `categories` table, RLS (public sees visible rows; admins see, insert, update, and delete everything), the 8-category limit (trigger with an advisory lock), slug immutability, `updated_at`, `products.category_id` (`ON DELETE RESTRICT`), `products.category` made nullable and its name check dropped (the column is kept), four seeded categories, and a backfill that stops and rolls back if any product has no `category_id`.
- `supabase/migrations/0002_category_functions.sql` (applied to the test project; the editor reported success, both functions exist, 4 categories, 0 products without category_id): `categories_move(p_id, p_direction)` (reorder one step, keeping `sort_order` consecutive) and `categories_delete(p_id, p_target)` (delete, moving products first, in one transaction). Both run as `SECURITY INVOKER`, check `is_admin()`, and are granted to `authenticated` only. The app's reorder and delete buttons need this file, so run it before using them.

**Delete rule (enforced on the server).** `src/lib/category-rules.ts` `deleteRule()` runs first in `DELETE /api/admin/categories`. The database function repeats the same checks:
- the last remaining category cannot be deleted: "يجب أن يبقى تصنيف واحد على الأقل."
- a category with products needs another category as the target: "هذا التصنيف فيه {n} منتجات. اختر تصنيفاً لنقلها إليه قبل الحذف."
- an empty category is deleted directly.
- success: "تم حذف التصنيف ونقل {n} منتجات."

**Other rules.** The slug is generated once at creation (`c` plus six random characters, checked for collisions) and cannot change; the edit payload has no slug field. Name is required and at most 40 characters. Description is optional and at most 120. Accent is one of the six palette colors. Image is optional and uploaded to `product-images/categories/`. A category without an image shows a circular badge in its accent color. Hidden categories disappear from the storefront, and so do their products. Products in hidden categories stay in the admin.

**Files changed (this step).**
- Database: `supabase/migrations/0001_categories.sql`, `supabase/migrations/0002_category_functions.sql`.
- Rules and types: `src/lib/category-rules.ts` (new), `src/lib/catalog.ts` (hardcoded list removed; `Category` type; `category_id` validation), `src/lib/demo.ts` (demo categories fixture), `src/lib/products.ts` (`getStorefrontData`, `PRODUCT_SELECT`), `src/lib/admin-stats.ts` (categories from the table; `nonEmptyPriceBands`).
- Storefront: `src/components/storefront/home.tsx`, `navigation.tsx` (shortcut row reads the table; slugs for selection), `product-card.tsx`, `product-detail.tsx`, `src/app/page.tsx`, `src/app/storefront.css` (badge sizing, phone card layout, image box).
- Admin: `src/app/admin/page.tsx`, `src/app/admin/categories/page.tsx` (new), `src/components/admin.tsx` (dropdown from the table; a hidden category appears only for products already in it; "التصنيفات" link), `src/components/admin-categories.tsx` (new), `src/components/admin-dashboard.tsx`, `src/app/api/admin/categories/route.ts` (new: GET, POST, PUT, PATCH, DELETE), `src/app/api/admin/upload/route.ts` (`folder=categories`).
- Tests: `tests/categories.test.ts` (new, 14 tests), `tests/checkout.test.ts` (the category check now uses `category_id`), `tests/admin-stats.test.ts` (new `categories` argument), `tests/e2e/categories-demo.spec.ts` (new), `tests/e2e/categories-live.spec.ts` (new, skipped without credentials), `artifacts/premium-review/render-admin.tsx` (passes the categories).
- Check: `scripts/check-hardcoded-categories.mjs` (new), `scripts/grep-allowlist.txt` (new), `package.json` (`check:categories` script).

**Hardcoded-category check.** Demo fixture names and marketing copy are allowed by `scripts/grep-allowlist.txt`: the demo fixture file, the hero button copy, and the meta description. The check fails on any other match in `src/`. Verified by planting a violation (exit 1) and removing it (exit 0).

**Verification.**

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | exit 0 |
| Typecheck | `npm run typecheck` | exit 0 |
| Unit tests | `npm test` | exit 0, 24 of 24 passed (includes the 14 category tests) |
| Category check | `npm run check:categories` | exit 0, 8 matches, all allowed |
| Build | `npm run build` | exit 0, "Compiled successfully", new routes listed (`/admin/categories`, `/api/admin/categories`) |
| Playwright, last full run | `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= DEMO_MODE=true npx playwright test --workers=1` | exit 1: 16 passed, 2 failed, 2 skipped. The failures are the 360px and 430px tests, which time out on the dock cart click with the Next dev overlay's pointer interception, the same message as earlier runs. The 430px test has passed alone and failed alone in different runs. No console warnings or errors appear on the storefront page in dev. The two skipped tests are `admin-live` and `categories-live`, which need admin credentials. |
| Local dry run, migration 0001 | PGlite, no Supabase project | Covered in the earlier report |
| Local dry run, migration 0002 | PGlite, no Supabase project | Admin reorder moves items up and down; a non-admin reorder is refused ("غير مصرح."); deleting a category with products and no target gives the Arabic message; deleting with a target moves the products (count returned); deleting an empty category works; deleting the last category is refused ("يجب أن يبقى تصنيف واحد على الأقل.") |
| Arabic-Indic digits in rendered HTML | grep of U+0660–U+0669 | 0 in the storefront (`/`), the admin categories page, and the admin products page (includes the dashboard) |
| Unauthenticated access | `/admin/categories`, `/api/admin/categories` | redirect to `/admin/login`; the API returns 401 |

**Screenshots** (375px and 1440px):
- `artifacts/categories/categories-list-{375,1440}.png`: the category list with five rows, including one hidden category and one with no image.
- `artifacts/categories/categories-form-{375,1440}.png`: the add form.
- `artifacts/categories/product-form-dropdown-{375,1440}.png`: the product form's category dropdown.
- `artifacts/categories/storefront-categories-{375,1440}.png`: the storefront category row. The hidden category is absent, and the category without an image shows the badge.
- `artifacts/dashboard-v2/dashboard-{375,1440}.png`: the dashboard overview.
- `artifacts/categories/metrics.json`: the page checks behind these screenshots.

The screenshots were taken from temporary preview routes, which were removed afterwards.

**Fixes made while checking the screenshots.** The placeholder badge overlapped the category name on phones, so it is now 66px there and 96px from the tablet width up. A long category name overflowed its card on phones, so phone cards stack the art above the name. A duplicate image rule made the artwork on desktop too tall and overlapped the names, so it was removed, and the image now fills its art box. The storefront product filter now also excludes products in hidden categories.

**Not finished.**
- Migration `0002_category_functions.sql` is applied to the test project. The live admin flow still needs an admin login to run (see categories-live.spec.ts).
- The live admin flow (`categories-live.spec.ts`) has not run, because it needs admin credentials. Nothing in the live database has been tested against the admin API.
- The 360px and 430px dock-click failures are still unexplained. They look like the dev overlay, not the category code.
- The checkout route still accepts a product whose category is hidden if it's already in a cart. Blocking that would change the purchase rule, so it needs your decision.
- Products without a category do not appear on the storefront. The migration makes sure every existing product has one, but a product added without a category stays hidden until the admin form sets one.

## Decision: products in a hidden category cannot be ordered

Approved by the owner (option B). A product is orderable only if it is available and its category is present and visible (`isOrderable` in `src/lib/catalog.ts`). Checkout refuses any other product with the existing 409 path and the existing message: "لم يعد المنتج متاحاً، يرجى حذفه للمتابعة." The cart keeps the item until the customer removes it. The check uses an explicit `is_visible` test, so visitors and signed-in admins get the same answer. Price and totals rules are unchanged.

Checks: `npm test` 27 of 27 passed (3 new checkout tests: hidden category refused, no category refused, visible category still orderable). Lint and typecheck exit 0. Playwright order-related tests (store, milestone, categories-demo): 8 passed, 1 failed. The failure is the known 360px dock-click interception.


## Subcategories (migration 0003)

- Two levels: main sections (parent_id null) and subcategories inside one main section. No deeper levels.
- Limits: 8 main sections, 15 subcategories per section. The old limit of 8 total no longer applies.
- A subcategory's parent is set at creation and cannot change. A section that holds products cannot get subcategories (checked by the API and the admin; the database checks the product side).
- Products belong to leaf categories only: a section that has subcategories cannot hold products.
- Storefront: a section is shown when it or one of its subcategories has products. Choosing a section opens its subcategories in a row below. A hidden section hides its subcategories.
- Migration 0003 seeds: العناية بالفم (oral-care) and العناية بالجسم (body-care) as main sections, and 14 subcategories under العناية بالبشرة, العناية بالفم, and العناية بالجسم. The existing sections (hair-care, sun-care, cosmetics, and the existing ادوية section) stay as main sections.
- The migration moves products that sat in skin-care to الغسول (skin-cleanser). Move them in the admin if that is wrong.
- Verified with a local in-memory Postgres dry run: the migration commits; the limits, the hierarchy rules, the product rule, sibling moves, and deletes behave as specified.
