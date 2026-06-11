# BRAND: The Low Line

Brand spec for the AAA relaunch, decided 2026-06-11. The customer is Dani (PERSONA.md): F train rider, designated MTA correspondent of a 7 person iMessage chat, dark mode always, 1 thumb, 10 seconds of attention. This file is the taste contract. DESIGN.md carries the buildable tokens and component laws.

The look in 1 sentence: a tabloid front page printed on MTA signage. Black field, warm white Helvetica facts, true bullet colors, 1 red stamp. The interface is monochrome; the color comes from the trains.

## Positioning line

**Exactly how fucked your train is, with receipts.**

Said with a straight face. It survives being read aloud in the F Train Support Group because it is her own sentence: verdict plus proof. The unit is always "shame points" and the product never winks about it. Where profanity cannot run (App Store metadata, OG description, paid placements), the clean form is: "Which line is ruining the most mornings right now. Scored, ranked, timestamped."

## Palette

Dark only. No light theme, no toggle, `color-scheme: dark` pinned. Rationale tied to use: she is in dark mode always, she checks at 7:40 AM half awake where a white screen is a flashbang, she checks on a platform where black + 1 loud accent reads in 2 seconds, and the growth loop depends on every screenshot in every chat sitting on the same black field so the brand is recognizable at thumbnail size, the way a Wrapped slide is.

Core inks:

- Tunnel `#000000`: page background. Always flat. No gradients, no corner washes.
- Ballast `#1A1A1A`: cards.
- Concrete `#2A2A2A`: raised surfaces, hairline borders, dividers.
- Platform `#F5F0E8`: primary text. Warm white, station bulb light, never pure `#FFF`.
- Newsprint `#999077`: secondary text, captions, the receipt line.

Channels:

- Signal Red `#E8353A`: the villain channel. Severity, alarms, the DUMPSTER FIRE stamp, stale data warnings. The only UI red. Retires `#EF4444`.
- Caution Gold `#FFD700`: Hall of Shame medals only. Never headers, never chrome, never glows on the masthead.
- Service Green `#22C55E`: good service only. Rare by design; a green day should feel like an event.

Severity ramp (stamp and score color): Good Service `#22C55E`, Limping Along `#9CA3AF`, Pain Train `#EAB308`, Full Meltdown `#F97316`, Dumpster Fire `#E8353A`.

MTA bullet colors are sacred data, exact hex, never tinted, never used as decoration: 123 `#EE352E`, 456 `#00933C`, 7 `#B933AD`, ACE `#0039A6`, BDFM `#FF6319`, NQRW `#FCCC0A`, G `#6CBE45`, JZ `#996633`, L `#A7A9AC`, S `#808183`, SIR `#003DA5`.

Usage law: the UI itself stays monochrome (Tunnel, Ballast, Concrete, Platform, Newsprint). Color enters only as data: a bullet, a tier, a stamp. The 1 glow permitted in the whole product is the villain line's color behind the trophy bullet, 20 percent opacity max.

## Type system

2 families. 1 shouts, 1 informs. Nothing else ships.

1. **Bebas Neue** (display). Stack: `'Bebas Neue', 'Arial Narrow', Impact, sans-serif`. The tabloid voice: the hero score, severity stamps, section kickers, list rank numbers, the wordmark THE LOW LINE. Always uppercase. This is the only webfont in the product; preload the woff2, `font-display: swap`.
2. **System sans** (text). Stack: `-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 'Segoe UI', Arial, sans-serif`. On her iPhone this resolves to SF, the same face Carrot Weather speaks in, and it costs 0 bytes on 2 bar platform LTE. It also sits next to the MTA's own signage Helvetica, which is the point.

Scale, 2 ladders with nothing in between:

- Bebas ladder: hero score `clamp(64px, 18vw, 96px)` at -0.02em; list scores 24px; stamp 20px at +0.1em; section kicker 18px at +0.05em; wordmark 18 to 22px at +0.3em.
- System ladder: body 15px/1.5 weight 400; secondary 13px/1.4; receipt micro 11px, caps, +0.08em, tabular-nums; buttons 13px weight 700, caps.

Weight rules: system 400 for body, 700 for emphasis and buttons, 700 to 900 inside bullets. No light weights, no italics anywhere; shout with size and caps, not slant. All numerals that sit in columns or timestamps are tabular.

Retired: Epilogue, Lexend, Space Grotesk, JetBrains Mono, and the 5 family Google Fonts request. 1 webfont on the wire, ever.

## Spacing and layout rhythm

Base unit 4px. Working steps: 8, 12, 16, 20, 24, 32.

- Page gutter 16px. Card padding 20px. Gap between cards in a list 12px. Gap between sections 24px.
- 1 column, max width 672px, centered. Desktop gets the same column. This is a phone product that tolerates laptops, not the reverse; she arrives from a home screen bookmark or a link pasted in her own chat.
- The verdict block (masthead, bullet, score, stamp, receipt line) fits inside the first 560px of viewport height, above the fold on an iPhone 15 with Safari chrome showing. Job 1, "is the F fucked", takes 0 scrolls and 0 taps.
- Density: 1 idea per screen-third. She reads with 1 thumb and half her attention. Nothing sits closer than 12px to anything unrelated.
- Tap targets 44px minimum. Interactive things live in the bottom 2 thirds of reach where possible.
- Corners: 0 radius on cards (signage), 2px on stamps, full circle only for bullets and the live dot. No pill buttons.
- Shadows: hard offset ink-bleed only (`3px 3px 0` black). No soft blur shadows. This is print, not glass.

## Motion personality

A rubber stamp, not a weather app intro.

What moves:

- The severity stamp slams in 1 time when data paints: 150ms, scale 1.15 to 1.0, ease-out.
- The live dot pulses on a 2s loop.
- The alert marquee scrolls, 25s linear.
- Presses compress: 120ms, scale 0.96.
- Below-the-fold sections may rise in: 150ms opacity plus 8px translate, 40ms stagger, never blur filters.

What never moves:

- The score. No count-up odometers. The number is just there, like a sign.
- The timestamp.
- Layout. 0 shift; hero space is reserved before data lands.
- Anything on scroll. No parallax, no scroll-triggered reveals, no hover-dependent content.

Duration character: 120 to 200ms, ease-out, done. Nothing exceeds 400ms except the marquee. `prefers-reduced-motion` kills everything except content. The verdict never participates in entrance animation: it paints with the data, inside 2 seconds on 2 bar LTE, or the product has failed regardless of how it looks.

## Voice and tone

The product is the 8th member of the group chat: the deadpan friend who shows up holding the number. 5 rules:

1. **Verdict first, joke second.** The line, the number, the tier, then any flavor.
   - Yes: "F train. 140 shame points. Dumpster Fire."
   - No: "Well, well, well. Someone's having a morning. Scroll down to meet today's loser!"
2. **Straight face, always.** "Shame points" is a unit of measure. No winking at itself, no exclamation points about itself, 1 tier emoji max per surface. Profanity appears only in the rider's own framing ("Is my train fucked?"), 1 time per screen.
   - Yes: "Certified Dumpster Fire. Data as of 8:47 AM."
   - No: "OMG the F is literally DYING rn 💀🔥😭"
3. **Blame the train, never the rider.** No advice that shifts fault to her.
   - Yes: "The F owes you 20 minutes."
   - No: "Pro tip: try leaving 10 minutes earlier!"
4. **Rider words, not transit words.** Say "the F", "no trains", "crawling", "skipping your stop". Banned: dashboard, metrics, GTFS, headway, methodology, "service change", "we apologize for the inconvenience".
   - Yes: "No F trains between Jay St and Church Av."
   - No: "GTFS-RT indicates degraded headways on the BDFM trunk."
5. **Every claim carries a number or a time.** Quantified anger is a receipt. Unquantified anger is a meme.
   - Yes: "3rd Dumpster Fire this week. Worst day since May 28."
   - No: "The F has been pretty rough lately."

Canon copy that already passes the bar and stays: "Is my train fucked?", the footer "All service is theoretical. Do not rely on schedules.", the F M L bullet easter egg. Canon tier names: Good Service, Limping Along, Pain Train, Full Meltdown, Dumpster Fire.

## Taste bar

The 3 references from PERSONA.md and the specific quality each one holds this app to:

1. **Carrot Weather**: the data is never hostage to the bit. Verdict first, joke second, and the verdict renders even when the joke misses. Its lines are screenshot-worthy on their own. The Low Line is Carrot for the subway: a real instrument that happens to be mean.
2. **Hell Gate**: angry but factual. Tabloid headline confidence with real reporting underneath and 0 corporate gloss. Our translation: Bebas stamps on top, verbatim MTA alert text underneath, so the snark always sits on receipts. It has to sound like someone who actually rides the F.
3. **Spotify Wrapped**: the screenshot machine. 1 hero number, huge type, recognizable at 25 percent zoom inside an Instagram story. We take the thumbnail discipline, not the pastel gradients: our recognition system is black field + true bullet color + Bebas score + red stamp + legible wordmark.

## Anti-references

1. **AI template slop (the hackathon special).** Tells: purple-to-blue gradient hero, glassmorphism panels, rounded-2xl everything, Inter at 6 weights, emoji bullet lists, sparkle icons, "Powered by AI", confetti on load, default shadcn gray-on-gray. If a screen could be a Product Hunt template, burn it and start over.
2. **The transit dashboard (MYmta status page, Grafana energy).** Tells: data grids, axes and legends above the fold, filter dropdowns, corporate blue, apologetic officialese, a methodology link before the verdict. She screenshots MYmta today only because nothing better exists. If we look like it, we are it, and she has no reason to switch.
3. **The meme repost page (novelty IG account energy).** Tells: the joke placed above the number, Impact text on photos, emoji spam, rage bait with no timestamp, a mascot. Cute that costs clarity turns a source into a meme page, and being a citable source is the entire product.

## The screenshot test

The shared frame is the trophy card. For Dani to post it unprompted, 1 default screenshot must contain all 5 of these, no cropping skill required:

1. THE LOW LINE wordmark, legible at 25 percent zoom.
2. The bullet in true MTA color (the orange F, full size).
3. The score with its unit: "140 shame points".
4. The severity stamp: DUMPSTER FIRE in Signal Red.
5. The receipt line: "Data as of 8:47 AM". The timestamp is what turns a meme into a citation, so it lives inside the card frame, not in a distant header.

Mechanics: black card with a 1px Concrete border so it does not dissolve into an iMessage dark mode thread. The in-page trophy card, the captured ShareCard (600x315), and the live OG image (1200x630) carry the same 5 elements in the same arrangement, so a pasted link and a screenshot are the same brand object.

Pass condition: in a 7 person chat at thumbnail size, anyone can tell which line won and how bad it is without tapping. On a story, at least 1 person DMs "what site is this". If any of the 5 elements needs a zoom to find, it failed.
