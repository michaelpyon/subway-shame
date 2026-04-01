// MTA official subway line colors
export const LINE_COLORS: Record<string, string> = {
  "1": "#EE352E",
  "2": "#EE352E",
  "3": "#EE352E",
  "4": "#00933C",
  "5": "#00933C",
  "6": "#00933C",
  "7": "#B933AD",
  A: "#0039A6",
  C: "#0039A6",
  E: "#0039A6",
  B: "#FF6319",
  D: "#FF6319",
  F: "#FF6319",
  M: "#FF6319",
  N: "#FCCC0A",
  Q: "#FCCC0A",
  R: "#FCCC0A",
  W: "#FCCC0A",
  G: "#6CBE45",
  J: "#996633",
  Z: "#996633",
  L: "#A7A9AC",
  S: "#808183",
  SI: "#003DA5",
};

// Lines where white text on the bullet needs dark text instead (yellow bullets)
export const DARK_TEXT_LINES = new Set(["N", "Q", "R", "W"]);

// Route corridor names
export const LINE_ROUTES: Record<string, string> = {
  "1": "Broadway Local",
  "2": "7th Ave Express",
  "3": "7th Ave Express",
  "4": "Lex Ave Express",
  "5": "Lex Ave Express",
  "6": "Lex Ave Local",
  "7": "Flushing",
  A: "8th Ave Express",
  C: "8th Ave Local",
  E: "8th Ave Queens",
  B: "6th Ave Express",
  D: "6th Ave Express",
  F: "6th Ave Local",
  M: "6th Ave Local",
  N: "Broadway Express",
  Q: "Broadway Express",
  R: "Broadway Local",
  W: "Broadway Local",
  G: "Crosstown",
  J: "Nassau St",
  Z: "Nassau St",
  L: "14th St-Canarsie",
  S: "42nd St Shuttle",
  SI: "Staten Island",
};

// Scoring weights (from Flask scoring engine)
export const SCORING_WEIGHTS = {
  serviceChange: 25,
  delayPerEvent: 10,
  delayPerMinute: 2,
  suspensionPartial: 50,
  suspensionFull: 100,
  plannedWork: 5,
};

// Category display config
export const CATEGORY_CONFIG: Record<
  string,
  { color: string; label: string }
> = {
  "No Service": { color: "#EF4444", label: "Suspended" },
  Delays: { color: "#F97316", label: "Delays" },
  "Slow Speeds": { color: "#F59E0B", label: "Slow Speeds" },
  "Skip Stop": { color: "#EAB308", label: "Skipping Stops" },
  Rerouted: { color: "#A855F7", label: "Rerouted" },
  "Runs Local": { color: "#6366F1", label: "Running Local" },
  "Reduced Freq": { color: "#8B5CF6", label: "Reduced Service" },
  "Platform Change": { color: "#6B7280", label: "Platform Change" },
  Other: { color: "#9CA3AF", label: "Other" },
};

// Category sort order (worst first)
export const CATEGORY_ORDER = [
  "No Service",
  "Delays",
  "Slow Speeds",
  "Skip Stop",
  "Rerouted",
  "Runs Local",
  "Reduced Freq",
  "Platform Change",
  "Other",
];
