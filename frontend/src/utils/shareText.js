import { getScoreTier } from "../constants/lines";

// Canonical worst line URL. Confirmed as the working host (serves 200 with a real
// 1200x630 og.png). The custom domain subway.michaelpyon.com does not resolve, so
// every share path points here so a pasted link renders the live OG card.
export const SHARE_URL = "subway-shame.vercel.app";

// Single source of truth for the share line. Both the Header one tap copy and the
// Trophy share button use this so the copied text never drifts between them.
// Punchy, on brand, no em dashes. Names the real worst line, its live shame points
// and severity tier, plus the canonical URL.
export function buildShareText(winner) {
  if (!winner || !winner.id) {
    return `Find out which NYC subway line is the most delayed right now. ${SHARE_URL}`;
  }
  const tier = getScoreTier(winner.daily_score);
  // Strip emoji and stray non ascii from the tier label so the copied text stays clean.
  const tierName = tier.label.replace(/[^ -~]/g, "").trim();
  const score = (winner.daily_score || 0).toLocaleString();
  return `The [${winner.id}] train is the most delayed line in NYC right now, ${score} shame points (${tierName}). ${SHARE_URL}`;
}
