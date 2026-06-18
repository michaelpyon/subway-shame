// Build-time generator for the static OG fallback image: public/og.png (1200x630).
//
// Why a static fallback exists: the live card is rendered on demand by the edge
// route /api/og, which paints the real worst line of the day. This static file
// is the card a scraper sees if that route cold-starts or fails, and it is
// declared FIRST in index.html so a link preview ALWAYS renders. So it has to
// sell the mechanic on its own, not just the tagline.
//
// Honesty: a static file cannot know today's real winner, so inventing a live
// number would be a lie. Instead this draws a SAMPLE receipt: the same 5
// screenshot-test elements as the live card (wordmark, true F bullet, score with
// "shame points", severity stamp, receipt line) but every number is clearly
// labeled SAMPLE so no one reads it as a real verdict. It teaches the mechanic
// honestly; the live route then shows the day's real villain.
//
// Rendering: @vercel/og ImageResponse runs satori + resvg in Node and embeds the
// real Bebas Neue face, so the static card uses the same display type the live
// card and the in app trophy use. Run: node scripts/generate-og.mjs
import { ImageResponse } from "@vercel/og";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const TUNNEL = "#000000";
const CONCRETE = "#2A2A2A";
const PLATFORM = "#F5F0E8";
const NEWSPRINT = "#999077";
const SIGNAL_RED = "#E8353A";
const BDFM_ORANGE = "#FF6319";

// Sample verdict shown on the static card. Dumpster Fire is the brand's loudest
// tier, so the fallback teaches the worst case. Marked SAMPLE so it is never
// mistaken for a live score.
const SAMPLE_SCORE = "140";
const SAMPLE_TIER = { label: "Dumpster Fire", color: SIGNAL_RED, bg: "rgba(232,53,58,0.45)", fg: PLATFORM, border: SIGNAL_RED };

function div(style, children) {
  return { type: "div", props: { style, children } };
}

// The F bullet: the persona's own line, true BDFM orange. Sacred hex.
function fBullet(size) {
  return div(
    {
      width: size, height: size, borderRadius: "50%",
      backgroundColor: BDFM_ORANGE, color: "#ffffff",
      fontSize: size * 0.52, fontWeight: 800,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    "F"
  );
}

function card() {
  return div(
    {
      width: "1200px", height: "630px", display: "flex", flexDirection: "column",
      backgroundColor: TUNNEL,
      // 1px Concrete inner border so the card holds its edge in a dark thread.
      boxShadow: `inset 0 0 0 2px ${CONCRETE}`,
      padding: "56px 64px", fontFamily: "Bebas Neue", position: "relative",
    },
    [
      // The 1 permitted glow: villain color behind the bullet, low opacity.
      div({ position: "absolute", top: 120, left: 20, width: 560, height: 560, background: `radial-gradient(circle, ${BDFM_ORANGE}33 0%, transparent 70%)` }),

      // Top row: wordmark on the left, a clear SAMPLE tag on the right so the
      // card never reads as a live verdict.
      div(
        { display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" },
        [
          div({ fontFamily: "Bebas Neue", fontSize: 52, letterSpacing: 14, color: PLATFORM }, "THE LOW LINE"),
          div(
            {
              fontSize: 24, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase",
              color: NEWSPRINT, border: `2px solid ${NEWSPRINT}`, borderRadius: 2, padding: "6px 16px",
            },
            "Sample"
          ),
        ]
      ),

      // Hero: F bullet + sample score with "shame points".
      div(
        { display: "flex", alignItems: "center", gap: 56, marginTop: "auto", marginBottom: 28, position: "relative" },
        [
          fBullet(240),
          div(
            { display: "flex", alignItems: "baseline", gap: 18 },
            [
              div({ fontSize: 280, fontWeight: 900, color: SAMPLE_TIER.color, lineHeight: 0.85, letterSpacing: "-0.02em" }, SAMPLE_SCORE),
              div({ fontSize: 40, fontWeight: 600, color: NEWSPRINT }, "shame points"),
            ]
          ),
        ]
      ),

      // Severity stamp + receipt line, sample-labeled.
      div(
        { display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" },
        [
          div(
            {
              fontSize: 48, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase",
              color: SAMPLE_TIER.fg, backgroundColor: SAMPLE_TIER.bg,
              borderLeft: `6px solid ${SAMPLE_TIER.border}`, padding: "12px 32px", borderRadius: 2,
            },
            SAMPLE_TIER.label
          ),
          div(
            { display: "flex", flexDirection: "column", alignItems: "flex-end" },
            [
              div({ fontSize: 26, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: NEWSPRINT }, "Sample verdict, not live"),
              div({ fontSize: 22, color: SIGNAL_RED, letterSpacing: 2, fontWeight: 700, marginTop: 6 }, "subway-shame.vercel.app"),
            ]
          ),
        ]
      ),
    ]
  );
}

const bebas = await readFile(join(here, "BebasNeue.ttf"));

const response = new ImageResponse(card(), {
  width: 1200,
  height: 630,
  fonts: [{ name: "Bebas Neue", data: bebas, weight: 400, style: "normal" }],
});

const buf = Buffer.from(await response.arrayBuffer());
const out = join(here, "..", "public", "og.png");
await writeFile(out, buf);
console.log(`wrote ${out} (${buf.length} bytes)`);
