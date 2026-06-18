// Local API shim for running The Low Line end to end without Vercel.
//
// Why this exists: the production API is Vercel serverless (api/status.js) and
// edge (api/og.jsx) functions. There is no Vercel CLI on this machine, so this
// tiny Node http server stands in for them locally. It imports the REAL feed
// logic from api/_mta.js (public MTA GTFS-realtime feeds, no API key, no
// fabrication) so /api/status returns real MTA severity, and renders the live
// OG card with the same @vercel/og path the edge route uses.
//
// It serves exactly two routes, matching production:
//   GET /api/status  real current-severity ranking from the live MTA feed
//   GET /api/og      live 1200x630 social card for today's worst line
//
// `vite preview` proxies /api here (see vite.config.js preview.proxy), so the
// built app talks to real data over the same /api paths it uses in production.
// If the MTA feed is unreachable, /api/status returns 503 and the frontend's
// honest OfflineState takes over. No score is ever invented.
//
// Run: node scripts/local-api.mjs   (defaults to port 5001)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildStatus } from "../api/_mta.js";
import { ImageResponse } from "@vercel/og";

const PORT = Number(process.env.LOCAL_API_PORT || 5001);
const here = dirname(fileURLToPath(import.meta.url));

// Brand palette (mirrors api/og.jsx and the app's CSS tokens).
const TUNNEL = "#000000";
const CONCRETE = "#2A2A2A";
const PLATFORM = "#F5F0E8";
const NEWSPRINT = "#999077";
const SIGNAL_RED = "#E8353A";

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
const DARK_TEXT_LINES = ["N", "Q", "R", "W", "L"];
const SCORE_TIERS = [
  { min: 120, label: "Dumpster Fire", color: "#E8353A", bg: "rgba(232,53,58,0.45)", fg: "#F5F0E8", border: "#E8353A" },
  { min: 60, label: "Full Meltdown", color: "#F97316", bg: "rgba(249,115,22,0.20)", fg: "#F97316", border: "#F97316" },
  { min: 30, label: "Pain Train", color: "#EAB308", bg: "rgba(234,179,8,0.20)", fg: "#EAB308", border: "#EAB308" },
  { min: 1, label: "Limping Along", color: "#9CA3AF", bg: "rgba(156,163,175,0.20)", fg: "#9CA3AF", border: "#9CA3AF" },
  { min: 0, label: "Good Service", color: "#22C55E", bg: "rgba(34,197,94,0.20)", fg: "#22C55E", border: "#22C55E" },
];

const getTier = (s) => SCORE_TIERS.find((t) => s >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1];
const lineColor = (id) => LINE_COLORS[id] || "#808183";
const clockFromIso = (iso) => {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  } catch {
    return "";
  }
};

function badge(id, size) {
  return {
    type: "div",
    props: {
      style: {
        width: size, height: size, borderRadius: "50%",
        backgroundColor: lineColor(id),
        color: DARK_TEXT_LINES.includes(id) ? "#000" : "#fff",
        fontSize: size * 0.52, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center",
      },
      children: id,
    },
  };
}

const shellStyle = {
  width: "1200px", height: "630px", display: "flex", flexDirection: "column",
  backgroundColor: TUNNEL, boxShadow: `inset 0 0 0 2px ${CONCRETE}`,
  padding: "56px 64px", fontFamily: "Bebas Neue", position: "relative",
};
const brandText = { fontSize: 36, fontWeight: 800, letterSpacing: 9, color: PLATFORM };

// Live OG card. Same 5 elements and arrangement as the in-page trophy, the
// captured ShareCard, and the edge route in api/og.jsx.
function liveCard(status) {
  const winner = status.winner;
  const score = winner.daily_score ?? winner.score ?? 0;
  const tier = getTier(score);
  const color = lineColor(winner.id);
  return {
    type: "div",
    props: {
      style: shellStyle,
      children: [
        { type: "div", props: { style: { position: "absolute", top: 120, left: 20, width: 560, height: 560, background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` } } },
        { type: "div", props: { style: { ...brandText, position: "relative" }, children: "THE LOW LINE" } },
        { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 56, marginTop: "auto", marginBottom: 28, position: "relative" }, children: [
          badge(winner.id, 240),
          { type: "div", props: { style: { display: "flex", alignItems: "baseline", gap: 18 }, children: [
            { type: "div", props: { style: { fontSize: 280, fontWeight: 900, color: tier.color, lineHeight: 0.85, letterSpacing: "-0.02em" }, children: score.toLocaleString("en-US") } },
            { type: "div", props: { style: { fontSize: 40, fontWeight: 600, color: NEWSPRINT }, children: "shame points" } },
          ] } },
        ] } },
        { type: "div", props: { style: { display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }, children: [
          { type: "div", props: { style: { fontSize: 48, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: tier.fg, backgroundColor: tier.bg, borderLeft: `6px solid ${tier.border}`, padding: "12px 32px", borderRadius: 2 }, children: tier.label } },
          { type: "div", props: { style: { display: "flex", flexDirection: "column", alignItems: "flex-end" }, children: [
            { type: "div", props: { style: { fontSize: 26, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: NEWSPRINT }, children: `Data as of ${clockFromIso(status.timestamp)}` } },
            { type: "div", props: { style: { fontSize: 22, color: "#5a5446", letterSpacing: 2, marginTop: 6 }, children: "subway-shame.vercel.app" } },
          ] } },
        ] } },
      ],
    },
  };
}

function fallbackCard(reason) {
  return {
    type: "div",
    props: {
      style: shellStyle,
      children: [
        { type: "div", props: { style: { ...brandText, position: "relative" }, children: "THE LOW LINE" } },
        { type: "div", props: { style: { display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: 40, gap: 18, position: "relative" }, children: [
          { type: "div", props: { style: { fontSize: 100, fontWeight: 900, color: PLATFORM, lineHeight: 1.02 }, children: "Which line is ruining the most mornings right now." } },
          { type: "div", props: { style: { fontSize: 40, color: NEWSPRINT, fontWeight: 600 }, children: "Scored, ranked, timestamped." } },
        ] } },
        { type: "div", props: { style: { display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }, children: [
          { type: "div", props: { style: { fontSize: 26, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: NEWSPRINT }, children: reason } },
          { type: "div", props: { style: { fontSize: 24, color: SIGNAL_RED, fontWeight: 700, letterSpacing: 1 }, children: "subway-shame.vercel.app" } },
        ] } },
      ],
    },
  };
}

let bebasFont = null;
async function loadFont() {
  if (!bebasFont) bebasFont = await readFile(join(here, "BebasNeue.ttf"));
  return bebasFont;
}

const server = createServer(async (req, res) => {
  const url = (req.url || "").split("?")[0];

  if (url === "/api/status") {
    try {
      const status = await buildStatus();
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=60",
      });
      res.end(JSON.stringify(status));
    } catch (err) {
      console.error("status handler failed:", err);
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "MTA feed unavailable", detail: String(err && err.message) }));
    }
    return;
  }

  if (url === "/api/og") {
    try {
      const font = await loadFont();
      const status = await buildStatus();
      const element = status && status.winner ? liveCard(status) : fallbackCard("All clear right now");
      const image = new ImageResponse(element, {
        width: 1200,
        height: 630,
        fonts: [{ name: "Bebas Neue", data: font, weight: 400, style: "normal" }],
      });
      const buf = Buffer.from(await image.arrayBuffer());
      res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=0, s-maxage=600" });
      res.end(buf);
    } catch (err) {
      console.error("og handler failed:", err);
      // Render the on-brand fallback rather than a 500 so a link preview still resolves.
      try {
        const font = await loadFont();
        const image = new ImageResponse(fallbackCard("Live MTA data, scored and ranked"), {
          width: 1200, height: 630,
          fonts: [{ name: "Bebas Neue", data: font, weight: 400, style: "normal" }],
        });
        const buf = Buffer.from(await image.arrayBuffer());
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(buf);
      } catch (err2) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("og render failed");
      }
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`local-api: real MTA data on http://localhost:${PORT}/api/status and /api/og`);
});
