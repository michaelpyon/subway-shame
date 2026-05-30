export const LINE_COLORS = {
  "1": "#EE352E", "2": "#EE352E", "3": "#EE352E",
  "4": "#00933C", "5": "#00933C", "6": "#00933C",
  "7": "#B933AD",
  "A": "#0039A6", "C": "#0039A6", "E": "#0039A6",
  "B": "#FF6319", "D": "#FF6319", "F": "#FF6319", "M": "#FF6319",
  "N": "#FCCC0A", "Q": "#FCCC0A", "R": "#FCCC0A", "W": "#FCCC0A",
  "G": "#6CBE45",
  "J": "#996633", "Z": "#996633",
  "L": "#A7A9AC",
  "S": "#808183",
  "SI": "#003DA5",
};

export const LINE_NAMES = {
  "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7",
  "A": "A", "C": "C", "E": "E", "B": "B", "D": "D", "F": "F", "M": "M",
  "N": "N", "Q": "Q", "R": "R", "W": "W", "G": "G", "J": "J", "Z": "Z",
  "L": "L", "S": "S", "SI": "SI",
};

export const SHAME_HEADLINES = [
  "Today's worst line",
  "A difficult day for this one",
  "Most delays today",
  "This line had a hard day",
  "Today's delay leader",
  "More delays than the others",
  "The day's most-delayed service",
  "This line was the problem today",
];

export const ALL_GOOD_MESSAGES = [
  "All lines running normally.",
  "No delays to report.",
  "Nothing to report today.",
  "The trains are fine.",
  "All clear.",
];

/**
 * SCORE TIERS, calibrated for a LIVE SNAPSHOT severity score.
 *
 * The deployed backend (frontend/api) is stateless on Vercel, so it scores
 * each line by the alerts active RIGHT NOW, not a running daily total. A line
 * adds up the points of its currently active alerts, for example
 * No Service 50 plus Delays 30 plus Skip Stop 15 equals 95 right now. A clean
 * line is 0. So realistic live scores run roughly 0 to a few hundred, not the
 * thousands a full day of accumulation would have produced.
 *
 * Tiers:
 *   0       to Good Service  (no active alerts)
 *   1 to 29    Limping Along (one minor alert: skip stop, platform change)
 *   30 to 59   Pain Train    (active delays or a reroute right now)
 *   60 to 119  Full Meltdown (delays stacked with skips and reroutes)
 *   120+       Dumpster Fire (suspended plus multiple compounding alerts)
 */
export const SCORE_TIERS = [
  { min: 120, label: "Dumpster Fire 🔥", color: "#EF4444", emoji: "🔥", severityClass: "severity-dumpster" },
  { min: 60,  label: "Full Meltdown",    color: "#F97316", emoji: "😤", severityClass: "severity-meltdown" },
  { min: 30,  label: "Pain Train",       color: "#EAB308", emoji: "😒", severityClass: "severity-pain-train" },
  { min: 1,   label: "Limping Along",    color: "#9CA3AF", emoji: "😐", severityClass: "severity-limping" },
  { min: 0,   label: "Good Service",     color: "#22C55E", emoji: "✓", severityClass: "" },
];

export function getScoreTier(score) {
  return SCORE_TIERS.find(t => score >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1];
}

// Category colors and labels for score breakdown.
// label = short display name (plain English, no jargon)
// sublabel = what it actually means in plain terms
export const CATEGORY_CONFIG = {
  "No Service":     { color: "#EF4444", icon: "🚫", label: "No Service",       sublabel: "Not running" },
  "Delays":         { color: "#F97316", icon: "🐌", label: "Delays",            sublabel: "Running late" },
  "Slow Speeds":    { color: "#F59E0B", icon: "🐢", label: "Slow Speeds",       sublabel: "Speed restrictions" },
  "Skip Stop":      { color: "#EAB308", icon: "⏭️", label: "Skipping Stops",   sublabel: "Bypassing stations" },
  "Rerouted":       { color: "#A855F7", icon: "↪️", label: "Rerouted",          sublabel: "Running alternate route" },
  "Runs Local":     { color: "#6366F1", icon: "🔄", label: "Running Local",     sublabel: "Express running local" },
  "Reduced Freq":   { color: "#8B5CF6", icon: "⏳", label: "Reduced Service",   sublabel: "Fewer trains running" },
  "Platform Change":{ color: "#6B7280", icon: "🔀", label: "Platform Change",   sublabel: "Different platform" },
  "Other":          { color: "#9CA3AF", icon: "⚠️", label: "Other Issue",       sublabel: "Unspecified problem" },
};

// Sort order for breakdown display (worst first)
export const CATEGORY_ORDER = [
  "No Service", "Delays", "Slow Speeds", "Skip Stop",
  "Rerouted", "Runs Local", "Reduced Freq", "Platform Change", "Other",
];

// Editorial one-liners by category (sardonic, short, factual)
// Used in LineCard when alert text is too long or generic
export const EDITORIAL_LINES = {
  "No Service": [
    "Not running. Don't bother.",
    "Service suspended. Walk it.",
    "Completely shut down.",
  ],
  "Delays": [
    "Signal failure. Again.",
    "Running late. No surprise.",
    "Expect unexplained pauses.",
    "Delays in both directions.",
  ],
  "Slow Speeds": [
    "Crawling through tunnels.",
    "Speed restrictions in effect.",
    "Moving, but barely.",
  ],
  "Skip Stop": [
    "Skipping your stop, probably.",
    "Bypassing stations. Good luck.",
  ],
  "Rerouted": [
    "Taking the scenic route.",
    "Running on a different line.",
  ],
  "Runs Local": [
    "Express? Not today.",
    "All stops, all the time.",
  ],
  "Reduced Freq": [
    "Fewer trains. Longer waits.",
    "Service cut. Pack in tight.",
  ],
  "Platform Change": [
    "Wrong platform. Move.",
  ],
  "Other": [
    "Something's wrong.",
    "Unspecified problem.",
  ],
};

// Get a short editorial line for a line's worst category
export function getEditorialLine(line) {
  if (!line.alerts || line.alerts.length === 0) {
    if (line.peak_alerts && line.peak_alerts.length > 0) return "Issues earlier. Recovering.";
    return null;
  }
  const alert = line.alerts[0];
  const a = typeof alert === "string" ? { text: alert } : alert;
  // Use the actual alert text if it's short enough
  if (a.text && a.text.length <= 45) return a.text;
  // Fall back to editorial quips
  const cat = a.category || "Other";
  const lines = EDITORIAL_LINES[cat] || EDITORIAL_LINES["Other"];
  // Deterministic pick based on line ID
  const idx = (line.id || "A").charCodeAt(0) % lines.length;
  return lines[idx];
}

// Route names for line cards (short, recognizable corridor names)
export const LINE_ROUTES = {
  "1": "Broadway Local", "2": "7th Ave Express", "3": "7th Ave Express",
  "4": "Lex Ave Express", "5": "Lex Ave Express", "6": "Lex Ave Local",
  "7": "Flushing", "A": "8th Ave Express", "C": "8th Ave Local",
  "E": "8th Ave Queens", "B": "6th Ave Express", "D": "6th Ave Express",
  "F": "6th Ave Local", "M": "6th Ave Local",
  "N": "Broadway Express", "Q": "Broadway Express",
  "R": "Broadway Local", "W": "Broadway Local",
  "G": "Crosstown", "J": "Nassau St", "Z": "Nassau St",
  "L": "14th St-Canarsie", "S": "42nd St Shuttle",
  "SI": "Staten Island",
};

// Direction labels per line (what uptown/downtown means for each)
export const LINE_DIRECTIONS = {
  "1": ["Uptown", "Downtown"], "2": ["Uptown", "Downtown"], "3": ["Uptown", "Downtown"],
  "4": ["Uptown", "Downtown"], "5": ["Uptown", "Downtown"], "6": ["Uptown", "Downtown"],
  "7": ["Flushing", "Manhattan"],
  "A": ["Uptown", "Downtown"], "C": ["Uptown", "Downtown"], "E": ["Uptown", "Downtown"],
  "B": ["Uptown", "Downtown"], "D": ["Uptown", "Downtown"],
  "F": ["Uptown", "Downtown"], "M": ["Uptown", "Downtown"],
  "N": ["Uptown", "Downtown"], "Q": ["Uptown", "Downtown"],
  "R": ["Uptown", "Downtown"], "W": ["Uptown", "Downtown"],
  "G": ["Court Sq", "Church Av"],
  "J": ["Manhattan", "Jamaica"], "Z": ["Manhattan", "Jamaica"],
  "L": ["8 Av", "Canarsie"],
  "S": ["Times Sq", "Grand Central"],
  "SI": ["St George", "Tottenville"],
};
