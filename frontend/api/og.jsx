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

export const config = { runtime: "edge" };

const STATUS_URL = "https://subway-shame.vercel.app/api/status";

// Brand palette (mirrors the app's CSS tokens).
const TUNNEL = "#0A0A0A";
const BALLAST = "#141414";
const CREAM = "#F5F0E8";
const SIGNAL_RED = "#E8353A";
const OUTLINE = "#9CA3AF";

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

const YELLOW_LINES = ["N", "Q", "R", "W"];

// Severity tiers (mirror SCORE_TIERS in src/constants/lines.js, emoji stripped).
// Calibrated for the live snapshot score, not a daily cumulative total.
const SCORE_TIERS = [
  { min: 120, label: "Dumpster Fire", color: "#EF4444" },
  { min: 60, label: "Full Meltdown", color: "#F97316" },
  { min: 30, label: "Pain Train", color: "#EAB308" },
  { min: 1, label: "Limping Along", color: "#9CA3AF" },
  { min: 0, label: "Good Service", color: "#22C55E" },
];

function getTier(score) {
  return SCORE_TIERS.find((t) => score >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1];
}

function lineColor(id) {
  return LINE_COLORS[id] || "#808183";
}

function badge(id, size) {
  const color = lineColor(id);
  const isYellow = YELLOW_LINES.includes(id);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        color: isYellow ? "#000" : "#fff",
        fontSize: size * 0.52,
        fontWeight: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 60px ${color}55`,
      }}
    >
      {id}
    </div>
  );
}

// On-brand card used when we DO have live data.
function liveCard(status) {
  const winner = status.winner;
  const tier = getTier(winner.daily_score || winner.score || 0);
  const podium = (status.podium || []).slice(0, 3);
  const score = (winner.daily_score ?? winner.score ?? 0).toLocaleString("en-US");

  return (
    <div style={shell(lineColor(winner.id))}>
      <div style={accentBar(lineColor(winner.id))} />

      {/* Eyebrow */}
      <div style={eyebrowRow}>
        <div style={dot} />
        <div style={eyebrowText}>Today's worst NYC subway line</div>
        <div style={{ flex: 1 }} />
        <div style={brandText}>THE LOW LINE</div>
      </div>

      {/* Hero: badge + score + severity */}
      <div style={{ display: "flex", alignItems: "center", gap: 48, marginTop: 8 }}>
        {badge(winner.id, 220)}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <div style={{ fontSize: 168, fontWeight: 900, color: tier.color, lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: OUTLINE }}>pts</div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: CREAM, marginTop: 8 }}>
            {winner.id} Train
          </div>
          <div
            style={{
              marginTop: 14,
              alignSelf: "flex-start",
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: tier.color,
              backgroundColor: `${tier.color}22`,
              padding: "8px 22px",
              borderRadius: 10,
            }}
          >
            {tier.label}
          </div>
        </div>
      </div>

      {/* Podium beneath */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: "auto" }}>
        <div style={{ fontSize: 24, color: OUTLINE, letterSpacing: 2, textTransform: "uppercase" }}>
          Today's podium
        </div>
        {podium.map((l, i) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28, color: OUTLINE, fontWeight: 800 }}>{i + 1}</div>
            {badge(l.id, 56)}
            <div style={{ fontSize: 30, fontWeight: 800, color: CREAM }}>
              {(l.daily_score ?? l.score ?? 0).toLocaleString("en-US")}
            </div>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 22, color: "#4B5563", letterSpacing: 1 }}>
          {status.date}
        </div>
      </div>

      <div style={watermark}>subway-shame.vercel.app</div>
    </div>
  );
}

// On-brand fallback when there is no winner (clean day) or the feed is down.
function fallbackCard(date, reason) {
  return (
    <div style={shell(SIGNAL_RED)}>
      <div style={accentBar(SIGNAL_RED)} />
      <div style={eyebrowRow}>
        <div style={dot} />
        <div style={eyebrowText}>{reason}</div>
        <div style={{ flex: 1 }} />
        <div style={brandText}>THE LOW LINE</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 40, gap: 16 }}>
        <div style={{ fontSize: 96, fontWeight: 900, color: CREAM, lineHeight: 1.05 }}>
          Which NYC subway line is the worst right now?
        </div>
        <div style={{ fontSize: 40, color: OUTLINE, fontWeight: 600 }}>
          Live MTA data, scored and ranked.
        </div>
      </div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center" }}>
        <div style={{ fontSize: 22, color: "#4B5563", letterSpacing: 1 }}>{date || ""}</div>
        <div style={{ flex: 1 }} />
        <div style={watermarkInline}>subway-shame.vercel.app</div>
      </div>
    </div>
  );
}

// --- shared style fragments -------------------------------------------------

function shell(glow) {
  return {
    width: "1200px",
    height: "630px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: TUNNEL,
    backgroundImage: `radial-gradient(circle at 50% -10%, ${glow}30 0%, transparent 60%)`,
    padding: "56px 64px",
    fontFamily: "sans-serif",
    position: "relative",
  };
}

function accentBar(color) {
  return { position: "absolute", top: 0, left: 0, right: 0, height: 8, backgroundColor: color };
}

const eyebrowRow = { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 };
const dot = { width: 16, height: 16, borderRadius: "50%", backgroundColor: SIGNAL_RED };
const eyebrowText = {
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: 3,
  textTransform: "uppercase",
  color: OUTLINE,
};
const brandText = { fontSize: 26, fontWeight: 800, letterSpacing: 6, color: CREAM };
const watermark = {
  position: "absolute",
  bottom: 24,
  left: 64,
  fontSize: 20,
  color: "#374151",
  letterSpacing: 2,
};
const watermarkInline = { fontSize: 24, color: SIGNAL_RED, fontWeight: 700, letterSpacing: 1 };

// --- handler ----------------------------------------------------------------

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
    if (status && status.winner) {
      element = liveCard(status);
    } else {
      // Clean day: no line scored. Stay honest and on-brand.
      element = fallbackCard(status && status.date, "All clear right now");
    }
  } catch (err) {
    console.error("og handler failed:", err);
    element = fallbackCard(null, "Live MTA data");
  }

  return new ImageResponse(element, { width: 1200, height: 630, headers });
}
