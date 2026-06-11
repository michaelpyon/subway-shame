# DESIGN.md: The Low Line (subway-shame)

Source of truth for all design and frontend work in this repo. Updated 2026-06-11 for the AAA relaunch, derived from BRAND.md (read it for the why; this file is the how). The active frontend is `frontend/` (Vite + React). This version supersedes the 2026-04 Stitch token export; the retired material is listed at the bottom under "Superseded".

## Identity

- Product name: **The Low Line**. The repo is subway-shame; the UI never says "Subway Shame".
- Positioning: exactly how fucked your train is, with receipts. Clean form for metadata: "Which line is ruining the most mornings right now. Scored, ranked, timestamped."
- Aesthetic: tabloid front page printed on MTA signage. Black field, warm white facts, true bullet colors, 1 red stamp. The UI is monochrome; color enters only as data.
- Theme: **dark only**. No light theme, no toggle. Keep `<meta name="color-scheme" content="dark">` and `theme-color #000000`.
- The unit is "shame points", abbreviated "pts" only in tight rows; every surface spells it out at least 1 time.

## Color tokens

```css
:root {
  /* Surfaces */
  --color-tunnel:    #000000;  /* page background, always flat */
  --color-ballast:   #1A1A1A;  /* cards */
  --color-concrete:  #2A2A2A;  /* raised surfaces, hairlines, dividers */

  /* Ink */
  --color-platform:  #F5F0E8;  /* primary text, warm white */
  --color-newsprint: #999077;  /* secondary text, captions, receipt line */

  /* Channels */
  --color-signal-red: #E8353A; /* severity, alarms, stale data; the only UI red */
  --color-gold:       #FFD700; /* Hall of Shame medals ONLY */
  --color-good:       #22C55E; /* good service only */

  /* Severity ramp */
  --tier-limping:  #9CA3AF;
  --tier-pain:     #EAB308;
  --tier-meltdown: #F97316;
  --tier-dumpster: #E8353A;

  /* MTA bullets: sacred data, exact hex, never tinted, never decorative */
  --mta-123: #EE352E;  --mta-456: #00933C;  --mta-7:   #B933AD;
  --mta-ace: #0039A6;  --mta-bdfm: #FF6319; --mta-nqrw: #FCCC0A;
  --mta-g:   #6CBE45;  --mta-jz:  #996633;  --mta-l:   #A7A9AC;
  --mta-s:   #808183;  --mta-sir: #003DA5;
}
```

Color laws:

1. Page background is flat `--color-tunnel`. No gradients, no radial corner washes, no textures behind content.
2. UI chrome uses surfaces + ink only. Color appears exclusively as data: a bullet, a tier color, a stamp.
3. 1 glow in the whole product: the villain line's own color behind the trophy bullet, radial, 20 percent opacity max.
4. Gold appears only inside the Hall of Shame tab. The masthead has no gold border and no gold glow.
5. Bullet text is white, except black on NQRW yellow `#FCCC0A` and on L gray `#A7A9AC`.
6. Contrast floors: body text on Ballast at 4.5:1 or better (Platform passes at ~15:1, Newsprint passes for 13px+ secondary only). Never put Newsprint on Concrete.

## Type tokens

```css
:root {
  --font-display: 'Bebas Neue', 'Arial Narrow', Impact, sans-serif;
  --font-text: -apple-system, BlinkMacSystemFont, 'Helvetica Neue',
               Helvetica, 'Segoe UI', Arial, sans-serif;
}
```

2 families, no exceptions. Bebas Neue is the only webfont: load 1 woff2 from Google Fonts, `<link rel="preload">`, `font-display: swap`. Everything else is the system stack (resolves to SF on the persona's iPhone, 0 bytes on LTE).

| Role               | Face    | Size                       | Weight | Tracking | Case | Numerals |
|--------------------|---------|----------------------------|--------|----------|------|----------|
| Hero score         | display | `clamp(64px, 18vw, 96px)`  | 400    | -0.02em  | n/a  | default  |
| List/rank score    | display | 24px                       | 400    | 0        | n/a  | default  |
| Severity stamp     | display | 20px                       | 400    | +0.1em   | caps | n/a      |
| Section kicker     | display | 18px                       | 400    | +0.05em  | caps | n/a      |
| Wordmark           | display | 18 to 22px                 | 400    | +0.3em   | caps | n/a      |
| Body               | text    | 15px / 1.5                 | 400    | 0        | sentence | tabular in columns |
| Secondary          | text    | 13px / 1.4                 | 400    | 0        | sentence | tabular |
| Receipt micro      | text    | 11px                       | 600    | +0.08em  | caps | tabular  |
| Button label       | text    | 13px                       | 700    | +0.02em  | caps | n/a      |
| Bullet glyph       | text    | scales with bullet         | 700 to 900 | 0    | caps | n/a      |

Rules: no light weights, no italics anywhere (emphasis comes from size and caps). Timestamps and score columns always `font-variant-numeric: tabular-nums`.

## Layout and spacing

- Base unit 4px. Working steps: 8, 12, 16, 20, 24, 32.
- Page gutter 16px. Card padding 20px. Card gap in lists 12px. Section gap 24px.
- 1 column, `max-width: 672px`, centered, on every breakpoint. Desktop gets the same column.
- The verdict block (masthead + bullet + score + stamp + receipt line) fits in the first 560px of viewport height on a 393px-wide iPhone. 0 scrolls to answer "is the F fucked".
- Page order is law: 1 masthead, 2 trophy/verdict, 3 leaderboard, 4 line grid by severity, 5 everything else (chart, explainer), 6 footer. Nothing analytic jumps the verdict.
- Tap targets 44px minimum.
- Corners: 0 radius on cards, 2px on stamps, full circle only for bullets and the live dot. No pill buttons.
- Borders: 1px Concrete hairlines. Trophy card adds the shame shadow at Meltdown and above.
- Shadows, print not glass:

```css
--shadow-card:       0 0 0 1px rgba(245,240,232,0.06), 3px 3px 0 0 rgba(0,0,0,0.5);
--shadow-card-hover: 0 0 0 1px rgba(245,240,232,0.12), 4px 4px 0 0 rgba(0,0,0,0.6);
--shadow-card-shame: 0 0 0 1px rgba(232,53,58,0.30),  4px 4px 0 0 rgba(232,53,58,0.15);
```

## Severity tiers (canon)

Calibrated for the live snapshot scorer in `frontend/api` (sums currently active alert points; realistic range 0 to a few hundred).

| Tier          | Live pts  | Color                | Stamp text     | Emoji allowed |
|---------------|-----------|----------------------|----------------|---------------|
| Good Service  | 0         | `--color-good`       | GOOD SERVICE   | ✓ only        |
| Limping Along | 1 to 29   | `--tier-limping`     | LIMPING ALONG  | none          |
| Pain Train    | 30 to 59  | `--tier-pain`        | PAIN TRAIN     | none          |
| Full Meltdown | 60 to 119 | `--tier-meltdown`    | FULL MELTDOWN  | none          |
| Dumpster Fire | 120+      | `--tier-dumpster`    | DUMPSTER FIRE  | 🔥 only       |

Stamp construction: display face 20px, +0.1em, caps, 2px radius, 6px 16px padding, tinted background of its tier color at ~20 percent, 2px left border in tier color. Dumpster Fire uses Platform text on a 45 percent Signal Red field. A score never renders without its stamp; an unanchored number reads as fake authority and the persona is allergic to fake authority.

## Motion

Personality: a rubber stamp, not a weather app intro. Durations 120 to 200ms, ease-out; hard ceiling 400ms except the marquee.

| Element                  | Motion                                    | Duration | Loop |
|--------------------------|-------------------------------------------|----------|------|
| Severity stamp           | scale 1.15 to 1.0 + fade, on data paint   | 150ms    | runs 1 time |
| Live dot                 | pulse                                     | 2s       | yes  |
| Alert marquee            | linear scroll                             | 25s      | yes  |
| Press (any interactive)  | scale to 0.96                             | 120ms    | no   |
| Tab / details toggle     | opacity                                   | 150ms    | no   |
| Below-fold section entry | opacity + 8px rise, 40ms stagger          | 150ms    | no   |

Never animate: the score digits (no count-up), timestamps, layout (0 CLS, hero space reserved before data), anything scroll-triggered, any `filter: blur()` transition. The verdict block is exempt from all entrance animation: it paints with data. `prefers-reduced-motion` disables everything above; marquee becomes wrapped static text.

## Component laws

**Masthead.** THE LOW LINE wordmark in display face, +0.3em, Platform. Right side: the receipt micro line `DATA AS OF 8:47 AM`. 1px Concrete bottom border. No gold, no glow, no tagline competing with the verdict.

**Trophy card (the shared object).** Ballast field, 1px Concrete border, shame shadow at Meltdown+. Contents top to bottom: live label, bullet at 64 to 88px with the only permitted glow, hero score + "shame points", severity stamp, receipt line. The receipt line ("Data as of 8:47 AM") lives inside this card frame so a lazy screenshot still carries the citation. Details (breakdown, directions, verbatim MTA alert text) stay collapsed behind 1 tap.

**Freshness stamp.** Newsprint normally. If data age exceeds 10 minutes, it flips to Signal Red and reads `OLD NEWS: DATA FROM 8:21 AM` with a retry affordance. Staleness is a brand event, not a console warning; 1 stale lie mid-meltdown loses her forever.

**Leaderboard rows.** Rank in display face 24px, bullet 36px, line name in body, score right-aligned tabular with tier color, stamp in micro size. 1 villain per day; ties share the crown explicitly.

**Line grid.** Grouped by severity, worst group first, display-face kickers as group headers. Good Service lines collapse into a single quiet row ("18 lines: fine"), they are not the story.

**ShareCard (600x315) and OG image (1200x630).** Same 5 elements, same arrangement: wordmark, true-color bullet, score + "shame points", severity stamp, receipt timestamp. Black field, 1px Concrete border so the card holds its edge inside an iMessage dark thread. Must read at 25 percent zoom. The live OG route keeps its ~10 minute edge cache.

**Buttons.** System 700, 13px caps, 44px min height, 0 radius, 1px border in Concrete (or tier color when contextual). No pills, no gradients, no icon-only mystery buttons.

**TrainChecker.** Canon name "Is my train fucked?". Answer pattern: stamp + score + 1 deadpan line, in that order.

**Footer.** Canon, keep verbatim: "All service is theoretical. Do not rely on schedules." plus the F M L bullet easter egg and the data source line in receipt micro.

## Copy rules

Full voice spec in BRAND.md. Quick checks for any string in a PR:

- Verdict before joke. Number or timestamp in every claim.
- Straight face: no exclamation points about the product, 1 tier emoji max per surface. Decorative category emoji (🐌 🐢 ⏭️ etc.) are retired; categories get text labels.
- Say "the F", never "the F line". Blame the train, never the rider.
- Banned words in UI copy: dashboard, metrics, GTFS, headway, methodology, "service change", "we apologize for the inconvenience". (The footer's `DATA: MTA GTFS-RT` source line is the 1 sanctioned exception: fine print is a receipt.)
- Profanity: only in the rider's own framing, 1 time per screen.

## Performance and accessibility budget

- The verdict paints inside 2 seconds on 2 bar LTE. No full-screen spinner, ever. Skeleton allowed only below the masthead, structure only.
- 1 webfont request (Bebas Neue woff2, preloaded). Body text renders on system fonts with 0 font network cost.
- 0 layout shift on data arrival: hero space reserved.
- No signup wall, no notification prompt, no cookie banner. A gate kills the product.
- `:focus-visible` 2px Platform outline. 44px targets. `prefers-reduced-motion` respected. Tier is never communicated by color alone (the stamp text is the anchor).

## Builder deltas from current code

Brand-phase notes only, no code changed in this phase. The current `frontend/` implementation is close; these are the gaps to close in the build phase, smallest diffs that get to spec:

1. `frontend/index.html`: replace the 5 family Google Fonts request with Bebas Neue only; preload it. Update `--font-*` usage accordingly.
2. `frontend/src/index.css`: retire Epilogue/Lexend/Space Grotesk/JetBrains Mono variables, gold header classes (`.gold-glow`, `.gold-border-header`), and blur in `.stagger-section`; map old names to the tokens above.
3. `frontend/src/App.jsx`: flatten the page background (remove the 2 radial corner washes).
4. `frontend/src/components/Trophy.jsx`: move the receipt line into the card frame; drop decorative emoji except the tier rules above; square the share button.
5. `frontend/src/components/ShareCard.jsx` and `frontend/api/og.jsx`: add the severity stamp and the `Data as of` timestamp so all 3 share surfaces carry the same 5 elements; add the 1px Concrete border.
6. `frontend/src/constants/lines.js`: consolidate Dumpster Fire red `#EF4444` to `#E8353A`; category emoji to text labels.

Keep as-is (already on brand): hard offset shadows, severity stamp classes, `press-scale`, reduced motion handling, the receipt-edge clip path (signature detail, 1 use max per page), the footer, the FML easter egg, severity tier names and thresholds, `buildShareText` voice.

## Superseded

Marked retired on 2026-06-11. Listed so nobody resurrects them:

- **The entire 2026-04 Stitch token export** that previously filled this file (47 tokens, `.stitch/design-reference.html`). Its `Background #A7A9AC` was the L train gray and never matched the shipped app. Archived reference only.
- Stitch headline/body/label faces (Space Grotesk, Inter, Lexend) and the later Epilogue/JetBrains Mono additions. Replaced by the 2 family system above.
- Stitch gold-as-primary system (`primary-container #FFD700`, `on-primary #3A3000`, `inverse-primary #705D00`, gold masthead glow). Gold survives only as Hall of Shame medals.
- Stitch surface scale (`#131313`, `#1F1F1F`, `#2A2A2A`, `#353535`, `#1B1B1B`, `#393939`). Collapsed to Tunnel / Ballast / Concrete.
- Stitch warm tans for text (`on-surface-variant #D0C6AB`, `primary #FFF6DF` as ink). Replaced by Platform and Newsprint.
- `#EF4444` as the Dumpster Fire red. Consolidated into Signal Red `#E8353A`.
- Page background radial color washes, pill buttons, blur-in entrance animations, count-up number animations.
