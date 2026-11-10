# Reference analysis — interactive storefront

## Audit and direction

All ten JPGs in `References/` and all ten assets in `icon/` were inspected in the contact sheets and the commerce references individually. The previous page used the colors but missed the references' hierarchy: a tall three-tier header, small text, similar white boxes everywhere and a passive bag dominated the experience. The new direction is **a Baghdad care boutique with a friendly medical assistant**, using navy, porcelain, ice blue and a restrained blush character accent.

| Reference filename prefix | Observed principle | Application / boundary |
| --- | --- | --- |
| `185092` | A character gives a functional app personality; floating layers have clear light direction | One original layered character, soft platform shadow, independent face and hand; no copied rocket |
| `26805b` | Oversized object, very clear headline, compact commerce controls | Hero character and headline share the main stage; prices and purchase controls have strong weight; reject purple branding |
| `51af89` | Search near the top, category shortcuts, generous product photographs, accessible hearts | Compact search-first mobile header; two-column product grid; independent favorite controls |
| `56a891` | Grouped information, consistent alignment, active navigation pills | Clear filter toolbar and result count; do not import dashboard statistics into commerce |
| `66d82d` | Pharmacy listing/detail/cart hierarchy; quantity adjacent to purchase action | Large product image, actual stock, prominent price, quantity, sticky mobile purchase area; no invented ratings or discounts |
| `71a533` | Useful grouping and orderly whitespace | Restrained secondary text and stronger primary information; reject multicolor analytics tiles |
| `7a4880` | Compact campaign, distinctive product cutouts, floating pill navigation | Rounded floating mobile dock, navy active pill, clean photo wells and large product titles |
| `c66552` | Clear current section and consistently spaced controls | Selected categories/filters are explicit; no decorative metrics or rainbow gradients |
| `e62ce2` | Soft dimensional objects and tactile interaction | Supplied coherent category cutouts, responsive mascot, restrained hover lift; omit saturated candy gradients |
| `e7a7cc` | Ice-blue porcelain surfaces, recessed wells and elevated controls | Blue hero stage, white controls, soft shadow hierarchy; avoid low-contrast neumorphic inputs |

## Composition and type

Desktop: compact brand / search / shopping row, quiet category navigation, then an asymmetrical stage: large right-aligned Zain copy, a light sculpted medical character scene on the left, and an integrated service rail. Categories form four roomy image-led shortcuts. Product collections use equal image wells with strong names, clear prices and solid navy actions. Editorial and sun-care campaigns become a paired composition, separate from product cards. The footer becomes a navy anchor with readable location and contact information.

Mobile: brand/actions, full-width search, a compact two-column character campaign with 36px headline, horizontally scrollable category tiles, two-column products and a floating five-item dock. Main text never shrinks merely to fit the first screen. Filters expand on request; detail and cart use the viewport intentionally.

Zain is served locally through Fontsource (400, 700, 800). Desktop hero 64px, sections 34px, names 18px, price 24px, body/buttons 16–18px. Mobile names remain 16px, prices 21px, categories 14px, navigation 12px. Latin and numbers use the same font's glyphs with `bdi` isolation.

## Interaction

The mascot is the single continuous motion focal point. Its actual layered SVG eyes track the pointer separately from the head; eyelids blink, smile changes, and the forearm waves. A controller coordinates welcome, idle, look, smile and wave, with pause, visibility suspension and reduced-motion support. Commerce motion answers actions: cards lift slightly, favorite hearts respond, addition confirms, filters switch and dialogs enter. No blanket scroll-reveal dependency or heavy WebGL runtime is necessary.

## Assets and rights

Selected supplied assets: pump/cotton (`beauty-make-up-3d-icon (4)`), blue bathroom tray, peach tube (`(3)`), pink polish (`(5)`), as local WebP derivatives. The bag leaves the hero. No pink nurse reference, GLB, glTF or rig was found in the project. The new mascot is original code-native artwork created for this project. The supplied assets have no accompanying commercial license documentation: rights cannot be verified from the files. Sources are preserved; deployment owner must retain/obtain the underlying licenses. Reference images are analysis inputs only and are not shipped as site artwork.

## Avoid

Tiny Arabic text; three tall header rows; uniform rounded boxes with equal weight; artificial statistics/ratings/claims; fake galleries; excessive gradients/glass; copying reference brands; pretending a moving bitmap is a rigged character; continuous animation outside the hero; hiding products behind excessive decorative content.
