// MTA GTFS-realtime fetching + current-severity scoring.
//
// Ported from backend/mta.py. Pure data logic, no HTTP framework, so it can be
// exercised directly by a local node test script and reused by the Vercel
// serverless handler in status.js.
//
// IMPORTANT: serverless functions are stateless. The original Flask backend
// accumulated cumulative daily points in Postgres. Here we compute a
// CURRENT-SNAPSHOT severity score per line from the live feed instead. The
// daily_score field is populated with that same current-severity value so the
// existing frontend renders unchanged. See status.js header for the datastore
// follow-up note.

import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const { transit_realtime } = GtfsRealtimeBindings;

// ---------------------------------------------------------------------------
// Constants (mirror backend/mta.py)
// ---------------------------------------------------------------------------

export const ALERTS_URL =
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts";

export const TRIP_FEED_URLS = {
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs": [
    "1", "2", "3", "4", "5", "6", "GS",
  ],
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace": [
    "A", "C", "E",
  ],
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm": [
    "B", "D", "F", "M",
  ],
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g": ["G"],
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz": [
    "J", "Z",
  ],
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l": ["L"],
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw": [
    "N", "Q", "R", "W",
  ],
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si": ["SI"],
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-7": ["7"],
};

export const ALL_LINES = [
  "1", "2", "3", "4", "5", "6", "7",
  "A", "C", "E", "B", "D", "F", "M",
  "N", "Q", "R", "W", "G", "J", "Z",
  "L", "S", "SI",
];

const CATEGORY_SCORES = {
  "No Service": 50,
  "Delays": 30,
  "Slow Speeds": 20,
  "Skip Stop": 15,
  "Rerouted": 15,
  "Runs Local": 10,
  "Reduced Freq": 10,
  "Planned Work": 5,
  "Platform Change": 2,
  "Other": 5,
};

const CATEGORY_RULES = [
  ["No Service", ["no [", "no trains", "no service", "suspended", "out of service", "service suspended", "not running"]],
  ["Slow Speeds", ["slow speed", "slow speeds", "reduced speed", "reduced speeds", "running slowly", "speed restriction", "speed restrictions"]],
  ["Delays", ["running with delays", "delays", "running late", "experiencing delays", "longer travel times", "held at", "holding at", "held"]],
  ["Skip Stop", ["skip", "bypassing", "not stopping at", "skipping"]],
  ["Rerouted", ["runs via", "reroute", "rerouted", "diverted", "alternate route"]],
  ["Runs Local", ["runs local", "running local", "making local stops"]],
  ["Reduced Freq", ["runs every", "less frequently", "reduced service", "fewer trains", "running every"]],
  ["Planned Work", ["shuttle", "express skips"]],
  ["Platform Change", ["board from", "platform", "change at"]],
];

const UPTOWN_KEYWORDS = [
  "uptown", "northbound", "bronx-bound", "queens-bound",
  "flushing-bound", "court sq-bound",
];
const DOWNTOWN_KEYWORDS = [
  "downtown", "southbound", "manhattan-bound", "brooklyn-bound",
  "bedford-nostrand", "church av-bound",
];

const ROUTE_NORMALIZE = {
  "GS": "S", "FS": "S", "H": "S",
  "SI": "SI", "SIR": "SI",
  "5X": "5", "6X": "6", "7X": "7", "FX": "F",
};

export const STATUS_LABEL_MAP = {
  "No Service": "Suspended",
  "Delays": "Delays",
  "Slow Speeds": "Slow Speeds",
  "Skip Stop": "Skip Stop",
  "Rerouted": "Rerouted",
  "Runs Local": "Runs Local",
  "Reduced Freq": "Fewer Trains",
  "Platform Change": "Platform Change",
  "Other": "Issues",
};

const FETCH_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Classification helpers (mirror backend/mta.py)
// ---------------------------------------------------------------------------

export function classifyAlert(header) {
  const h = header.toLowerCase();

  let category = "Other";
  for (const [cat, keywords] of CATEGORY_RULES) {
    if (keywords.some((kw) => h.includes(kw))) {
      category = cat;
      break;
    }
  }
  if (category === "Other") {
    return { category: "Other", score: 1, direction: "both" };
  }
  const score = CATEGORY_SCORES[category];

  const hasUp = UPTOWN_KEYWORDS.some((kw) => h.includes(kw));
  const hasDown = DOWNTOWN_KEYWORDS.some((kw) => h.includes(kw));
  let direction;
  if (hasUp && hasDown) direction = "both";
  else if (hasUp) direction = "uptown";
  else if (hasDown) direction = "downtown";
  else if (h.includes("both direction")) direction = "both";
  else direction = "both";

  return { category, score, direction };
}

function normalizeRoute(routeId) {
  const rid = ROUTE_NORMALIZE[routeId] ?? routeId;
  return ALL_LINES.includes(rid) ? rid : null;
}

export function statusLabel(alerts) {
  if (!alerts || alerts.length === 0) return "Good Service";
  let worst = alerts[0];
  for (const a of alerts) {
    if ((CATEGORY_SCORES[a.category] ?? 0) > (CATEGORY_SCORES[worst.category] ?? 0)) {
      worst = a;
    }
  }
  return STATUS_LABEL_MAP[worst.category] ?? "Issues";
}

function addToBreakdown(bd, category, score) {
  bd[category] = (bd[category] ?? 0) + score;
}

function isNoise(header) {
  const h = header.toLowerCase();
  return ["planned work", "planned service", "schedule", "holiday service"].some(
    (kw) => h.includes(kw)
  );
}

// ---------------------------------------------------------------------------
// Feed fetching
// ---------------------------------------------------------------------------

async function fetchProtobuf(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
    const buf = Buffer.from(await resp.arrayBuffer());
    return transit_realtime.FeedMessage.decode(buf);
  } finally {
    clearTimeout(timer);
  }
}

function emptyLine() {
  return {
    score: 0,
    alerts: [],
    breakdown: {},
    by_direction: {
      uptown: { score: 0, breakdown: {} },
      downtown: { score: 0, breakdown: {} },
    },
  };
}

export async function fetchAlerts() {
  const result = {};
  for (const line of ALL_LINES) result[line] = emptyLine();

  let feed;
  try {
    feed = await fetchProtobuf(ALERTS_URL);
  } catch (exc) {
    console.warn("Failed to fetch alerts feed:", exc.message);
    return result;
  }

  const now = Date.now() / 1000;

  for (const entity of feed.entity) {
    if (!entity.alert) continue;
    const alert = entity.alert;

    let header = "";
    const translations = alert.headerText?.translation ?? [];
    for (const t of translations) {
      if (t.language === "en" || !t.language) {
        header = t.text;
        break;
      }
    }
    if (!header && translations.length) header = translations[0].text;
    if (!header) continue;

    if (isNoise(header)) continue;

    let activeNow = false;
    const periods = alert.activePeriod ?? [];
    if (periods.length === 0) {
      activeNow = true;
    } else {
      for (const p of periods) {
        const start = p.start ? Number(p.start) : 0;
        const end = p.end ? Number(p.end) : Infinity;
        if (start <= now && now <= end) {
          activeNow = true;
          break;
        }
      }
    }
    if (!activeNow) continue;

    const { category, score, direction } = classifyAlert(header);

    const routesAffected = new Set();
    for (const ie of alert.informedEntity ?? []) {
      if (ie.routeId) {
        const norm = normalizeRoute(ie.routeId);
        if (norm) routesAffected.add(norm);
      }
    }

    const alertObj = { text: header, category, score, direction };

    for (const route of routesAffected) {
      const r = result[route];
      r.score += score;

      if (!r.alerts.some((a) => a.text === header)) {
        r.alerts.push(alertObj);
      }

      addToBreakdown(r.breakdown, category, score);

      if (direction === "both") {
        const half = score / 2;
        for (const d of ["uptown", "downtown"]) {
          r.by_direction[d].score += half;
          addToBreakdown(r.by_direction[d].breakdown, category, half);
        }
      } else {
        r.by_direction[direction].score += score;
        addToBreakdown(r.by_direction[direction].breakdown, category, score);
      }
    }
  }

  // Round direction scores to ints (mirror Python)
  for (const lineData of Object.values(result)) {
    for (const d of ["uptown", "downtown"]) {
      const dd = lineData.by_direction[d];
      dd.score = Math.round(dd.score);
      const rounded = {};
      for (const [k, v] of Object.entries(dd.breakdown)) rounded[k] = Math.round(v);
      dd.breakdown = rounded;
    }
  }

  return result;
}

export async function fetchTripCounts() {
  const counts = {};
  for (const line of ALL_LINES) counts[line] = 0;

  async function fetchOne(url) {
    try {
      const feed = await fetchProtobuf(url);
      const local = {};
      for (const entity of feed.entity) {
        if (entity.tripUpdate) {
          const rid = normalizeRoute(entity.tripUpdate.trip?.routeId ?? "");
          if (rid) local[rid] = (local[rid] ?? 0) + 1;
        }
      }
      return local;
    } catch (exc) {
      console.warn(`Failed to fetch trip feed ${url}:`, exc.message);
      return {};
    }
  }

  const results = await Promise.all(
    Object.keys(TRIP_FEED_URLS).map((url) => fetchOne(url))
  );
  for (const local of results) {
    for (const [route, count] of Object.entries(local)) {
      counts[route] = (counts[route] ?? 0) + count;
    }
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Response builder (mirrors backend/app.py build_status shape)
// ---------------------------------------------------------------------------

const ET_TZ = "America/New_York";

function etDateString(now) {
  // e.g. "Monday, January 6" with non-padded day
  const weekday = now.toLocaleString("en-US", { timeZone: ET_TZ, weekday: "long" });
  const month = now.toLocaleString("en-US", { timeZone: ET_TZ, month: "long" });
  const day = Number(now.toLocaleString("en-US", { timeZone: ET_TZ, day: "numeric" }));
  return `${weekday}, ${month} ${day}`;
}

export async function buildStatus() {
  const [alertsData, tripCounts] = await Promise.all([
    fetchAlerts(),
    fetchTripCounts(),
  ]);

  const lines = ALL_LINES.map((lineId) => {
    const ad = alertsData[lineId] ?? emptyLine();
    const liveBreakdown = ad.breakdown ?? {};
    const liveByDirection = ad.by_direction ?? {
      uptown: { score: 0, breakdown: {} },
      downtown: { score: 0, breakdown: {} },
    };
    // current-severity score (the live snapshot); daily_score mirrors it because
    // serverless cannot accumulate across polls without a datastore.
    const score = ad.score ?? 0;
    return {
      id: lineId,
      score,
      daily_score: score,
      status: statusLabel(ad.alerts),
      alerts: ad.alerts ?? [],
      peak_alerts: ad.alerts ?? [],
      breakdown: liveBreakdown,
      live_breakdown: liveBreakdown,
      by_direction: liveByDirection,
      live_by_direction: liveByDirection,
      trip_count: tripCounts[lineId] ?? 0,
    };
  });

  lines.sort((a, b) => {
    if (b.daily_score !== a.daily_score) return b.daily_score - a.daily_score;
    if (b.score !== a.score) return b.score - a.score;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  // Podium: top 3 distinct daily_score tiers (ties share a place)
  const scored = lines.filter((l) => l.daily_score > 0);
  const podium = [];
  let place = 0;
  let prevScore = null;
  for (const l of scored) {
    if (l.daily_score !== prevScore) {
      place = podium.length + 1;
      prevScore = l.daily_score;
    }
    if (place > 3) break;
    podium.push(l);
  }

  const winner = lines.length && lines[0].daily_score > 0 ? lines[0] : null;

  const now = new Date();
  return {
    timestamp: now.toISOString(),
    date: etDateString(now),
    winner,
    podium,
    lines,
    // Single current-snapshot bucket. Without a datastore we cannot rebuild the
    // intraday timeseries; one point keeps the chart from rendering a broken
    // empty axis while staying honest about what we can know statelessly.
    timeseries: buildTimeseries(now, scored),
  };
}

function buildTimeseries(now, scoredLines) {
  if (scoredLines.length === 0) return [];
  const minute = Math.floor(Number(now.toLocaleString("en-US", { timeZone: ET_TZ, minute: "numeric" })) / 15) * 15;
  const hour = now.toLocaleString("en-US", { timeZone: ET_TZ, hour: "2-digit", hour12: false });
  const time = `${hour}:${String(minute).padStart(2, "0")}`;
  const scores = {};
  for (const l of scoredLines) scores[l.id] = l.score;
  return [{ time, scores }];
}
