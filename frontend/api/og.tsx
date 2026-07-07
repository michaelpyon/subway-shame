// Vercel Edge function: GET /api/og
//
// Renders the live 1200x630 social card for The Low Line. Pulls today's real
// worst NYC subway line from the same MTA logic that powers /api/status, then
// draws it in the brand style (signal red, dark, bold) so every pasted link
// (r/nyc, group chats, X) becomes the shareable artifact for that day.
//
// Robustness: if the MTA feed is unavailable we render an on-brand FALLBACK
// card instead of crashing, so a link preview never 500s.
//
// Data source: this fetches the same deployed /api/status JSON (which runs the
// MTA GTFS logic in _mta.js). Fetching JSON keeps this route on the edge runtime
// with no Buffer/protobuf dependency, and reuses the exact same scoring the app
// shows. If the fetch fails or returns no winner, we draw the fallback card.

import { ImageResponse } from "@vercel/og";
import { INTER_REGULAR, INTER_BOLD } from "./_fonts.js";

export const config = { runtime: "edge" };

const STATUS_URL = "https://subway-shame.vercel.app/api/status";

// The card draws text at weights 400 through 900. @vercel/og 0.6.8 (satori)
// renders nothing without an explicit font, so we hand it a real regular and a
// real bold TrueType face and let it approximate the in-between weights. These
// are bundled as base64 in _fonts.js, so the render never depends on a font CDN
// at request time. Every text style below uses fontFamily "Inter".
const FONT_FAMILY = "Inter";
const FONTS = [
  { name: FONT_FAMILY, data: INTER_REGULAR, weight: 400 as const, style: "normal" as const },
  { name: FONT_FAMILY, data: INTER_BOLD, weight: 700 as const, style: "normal" as const },
];

// Brand palette (mirrors the app's CSS tokens).
const TUNNEL = "#000000";
const CONCRETE = "#2A2A2A";
const PLATFORM = "#F5F0E8";
const NEWSPRINT = "#999077";
const SIGNAL_RED = "#E8353A";

// MTA line colors (subset that matters for the badge; falls back to grey).
const LINE_COLORS = {
  "1": "#EE352E", "2": "#EE352E", "3": "#EE352E",
  "4": "#00933C", "5": "#00933C", "6": "#00933C",
  "7": "#B933AD",
  A: "#0039A6", C: "#0039A6", E: "#0039A6",
  B: "#FF6319", D: "#FF6319", F: "#FF6319", M: "#FF6319",
  N: "#FCCC0A", Q: "#FCCC0A", R: "#FCCC0A", W: "#FCCC0A",
  G: "#6CBE45",
  J: "#996633", Z: "#996633",
  L: "#A7A9AC",
  S: "#808183", SI: "#0078C6",
};

// Black glyph on light bullets (NQRW yellow, L gray); white everywhere else.
const DARK_TEXT_LINES = ["N", "Q", "R", "W", "L"];

// Severity tiers (mirror SCORE_TIERS in src/constants/lines.js). Dumpster Fire
// red consolidated to Signal Red. Tints mirror the .stamp-* construction.
const SCORE_TIERS = [
  { min: 120, label: "Dumpster Fire", color: "#E8353A", bg: "rgba(232,53,58,0.45)", fg: "#F5F0E8", border: "#E8353A" },
  { min: 60, label: "Full Meltdown", color: "#F97316", bg: "rgba(249,115,22,0.20)", fg: "#F97316", border: "#F97316" },
  { min: 30, label: "Pain Train", color: "#EAB308", bg: "rgba(234,179,8,0.20)", fg: "#EAB308", border: "#EAB308" },
  { min: 1, label: "Limping Along", color: "#9CA3AF", bg: "rgba(156,163,175,0.20)", fg: "#9CA3AF", border: "#9CA3AF" },
  { min: 0, label: "Good Service", color: "#22C55E", bg: "rgba(34,197,94,0.20)", fg: "#22C55E", border: "#22C55E" },
];

function getTier(score) {
  return SCORE_TIERS.find((t) => score >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1];
}

function lineColor(id) {
  return LINE_COLORS[id] || "#808183";
}

function badge(id, size) {
  const color = lineColor(id);
  const dark = DARK_TEXT_LINES.includes(id);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        color: dark ? "#000" : "#fff",
        fontSize: size * 0.52,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {id}
    </div>
  );
}

function clockFromIso(iso) {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  } catch {
    return "";
  }
}

// Live card: the same 5 elements as the in-page trophy and the captured share
// card, same arrangement. Flat black field, 1px Concrete inner border, the 1
// permitted glow behind the bullet at 20 percent.
function liveCard(status) {
  const winner = status.winner;
  const tier = getTier(winner.daily_score ?? winner.score ?? 0);
  const color = lineColor(winner.id);
  const score = (winner.daily_score ?? winner.score ?? 0).toLocaleString("en-US");
  const clock = clockFromIso(status.timestamp);

  return (
    <div style={shell()}>
      {/* The 1 permitted glow: villain color behind the bullet. */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 20,
          width: 560,
          height: 560,
          background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
        }}
      />

      <div style={{ ...brandText, position: "relative" }}>THE LOW LINE</div>

      {/* Hero: bullet + score */}
      <div style={{ display: "flex", alignItems: "center", gap: 56, marginTop: "auto", marginBottom: 28, position: "relative" }}>
        {badge(winner.id, 240)}
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <div style={{ fontSize: 280, fontWeight: 900, color: tier.color, lineHeight: 0.85, letterSpacing: "-0.02em" }}>
            {score}
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, color: NEWSPRINT }}>{score === 1 ? "shame point" : "shame points"}</div>
        </div>
      </div>

      {/* Severity stamp + receipt line */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: tier.fg,
            backgroundColor: tier.bg,
            borderLeft: `6px solid ${tier.border}`,
            padding: "12px 32px",
            borderRadius: 2,
          }}
        >
          {tier.label}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: NEWSPRINT }}>
            {`Data as of ${clock}`}
          </div>
          <div style={{ fontSize: 22, color: "#5a5446", letterSpacing: 2, marginTop: 6 }}>
            subway-shame.vercel.app
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback when there is no winner (clean day) or the feed is down. Stays honest:
// no fabricated score, on-brand black field.
function fallbackCard(date, reason) {
  return (
    <div style={shell()}>
      <div style={{ ...brandText, position: "relative" }}>THE LOW LINE</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: 40, gap: 18, position: "relative" }}>
        <div style={{ fontSize: 100, fontWeight: 900, color: PLATFORM, lineHeight: 1.02 }}>
          Which line is ruining the most mornings right now.
        </div>
        <div style={{ fontSize: 40, color: NEWSPRINT, fontWeight: 600 }}>
          Scored, ranked, timestamped.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: NEWSPRINT }}>
          {reason}
        </div>
        <div style={{ fontSize: 24, color: SIGNAL_RED, fontWeight: 700, letterSpacing: 1 }}>
          subway-shame.vercel.app
        </div>
      </div>
    </div>
  );
}

// --- shared style fragments -------------------------------------------------

function shell() {
  return {
    width: "1200px",
    height: "630px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: TUNNEL,
    boxShadow: `inset 0 0 0 2px ${CONCRETE}`,
    padding: "56px 64px",
    fontFamily: FONT_FAMILY,
    position: "relative",
  };
}

const brandText = { fontSize: 36, fontWeight: 800, letterSpacing: 9, color: PLATFORM };

// --- handler ----------------------------------------------------------------

// Build the card element from a status payload. Exported so a local harness can
// render the exact same JSX the live route does.
export function buildElement(status) {
  if (status && status.winner) return liveCard(status);
  // Clean day: no line scored. Stay honest and on-brand.
  return fallbackCard(status && status.date, "All clear right now");
}

// Shared render options: real fonts (required) plus the fixed card size.
export const IMAGE_OPTIONS = { width: 1200, height: 630, fonts: FONTS };

export default async function handler() {
  const headers = {
    // ~10 min edge cache with revalidation so the card tracks the day's villain
    // without hammering the MTA feeds on every paste/scrape.
    "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=1200",
  };

  let element;
  try {
    const resp = await fetch(STATUS_URL, { headers: { accept: "application/json" } });
    if (!resp.ok) throw new Error(`status ${resp.status}`);
    const status = await resp.json();
    element = buildElement(status);
  } catch (err) {
    console.error("og handler failed:", err);
    element = fallbackCard(null, "Live MTA data, scored and ranked");
  }

  return new ImageResponse(element, { ...IMAGE_OPTIONS, headers });
}
