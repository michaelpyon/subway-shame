import { getScoreTier } from "../constants/lines";

// Canonical worst line URL. Confirmed as the working host (serves 200 with a real
// 1200x630 og.png). The custom domain subway.michaelpyon.com does not resolve, so
// every share path points here so a pasted link renders the live OG card.
export const SHARE_URL = "subway-shame.vercel.app";

// Single source of truth for the share line. Every share path uses this so the
// copied text never drifts. Voice: verdict first, the rider's own framing, and a
// timestamp so the claim is a receipt and not a meme. No em dashes.
export function buildShareText(winner, clock) {
  if (!winner || !winner.id) {
    return `Which line is ruining the most mornings right now. ${SHARE_URL}`;
  }
  const tier = getScoreTier(winner.daily_score);
  const tierName = tier.label.replace(/[^ -~]/g, "").trim();
  const score = (winner.daily_score || 0).toLocaleString();
  const stamp = clock ? ` as of ${clock}` : "";
  return `The ${winner.id} is ${score} shame points of fucked${stamp}. ${tierName}. I have receipts. ${SHARE_URL}`;
}
