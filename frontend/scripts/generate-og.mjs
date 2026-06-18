// Build-time generator for the static OG fallback image: public/og.png (1200x630).
//
// Why a static fallback exists: the live card is rendered on demand by the edge
// route /api/og, which paints the real worst line of the day. This static file
// is the fallback a scraper sees if that route is unreachable, and the apple
// touch icon source. It must be on brand and it must be honest, so it shows the
// masthead and the positioning line with NO score, never a fabricated number.
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

// True MTA bullet colors for the masthead data stripe. Sacred hex, never tinted.
const STRIPE = [
  "#EE352E", "#00933C", "#B933AD", "#0039A6", "#FF6319",
  "#FCCC0A", "#6CBE45", "#996633", "#A7A9AC", "#808183",
];

// The F bullet is the brand hero: the persona's own line, true BDFM orange.
function fBullet() {
  return {
    type: "div",
    props: {
      style: {
        width: 200,
        height: 200,
        borderRadius: "50%",
        backgroundColor: "#FF6319",
        color: "#ffffff",
        fontSize: 138,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      },
      children: "F",
    },
  };
}

function card() {
  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: TUNNEL,
        // 1px Concrete inner border so the card holds its edge in a dark thread.
        boxShadow: `inset 0 0 0 2px ${CONCRETE}`,
        fontFamily: "sans-serif",
        position: "relative",
      },
      children: [
        // MTA bullet color stripe across the top, the only color as data.
        {
          type: "div",
          props: {
            style: { display: "flex", width: "1200px", height: 8 },
            children: STRIPE.map((c) => ({
              type: "div",
              props: { style: { flex: 1, backgroundColor: c } },
            })),
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: "52px 64px 56px 64px",
            },
            children: [
              // Wordmark, Bebas, wide tracking. Legible at 25 percent zoom.
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Bebas Neue",
                    fontSize: 52,
                    letterSpacing: 14,
                    color: PLATFORM,
                  },
                  children: "THE LOW LINE",
                },
              },
              // Hero: F bullet + the positioning line. No score: this is the
              // static fallback, and inventing a number would be a lie.
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 44,
                    marginTop: "auto",
                  },
                  children: [
                    fBullet(),
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", width: 800 },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                fontFamily: "Bebas Neue",
                                fontSize: 80,
                                lineHeight: 0.94,
                                letterSpacing: 0.5,
                                color: PLATFORM,
                              },
                              children: "WHICH LINE IS RUINING THE MOST MORNINGS RIGHT NOW.",
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // Footer row: the clean positioning line + the red stamp voice.
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "auto",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 30,
                          fontWeight: 600,
                          letterSpacing: 1,
                          color: NEWSPRINT,
                        },
                        children: "Scored, ranked, timestamped.",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 26,
                          fontWeight: 700,
                          letterSpacing: 1,
                          color: SIGNAL_RED,
                        },
                        children: "subway-shame.vercel.app",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
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
