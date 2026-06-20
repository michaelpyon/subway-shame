import { getScoreTier } from "../constants/lines";

// Canonical worst line URL. Confirmed as the working host (serves 200 with a real
// 1200x630 og.png). The custom domain subway.michaelpyon.com does not resolve, so
// every share path points here so a pasted link renders the live OG card.
export const SHARE_URL = "subway-shame.vercel.app";

// Single source of truth for the share line. Every share path uses this so the
// copied text never drifts. Voice: verdict first, the rider's own framing, and a
// timestamp so the claim is a receipt and not a meme. No em dashes.
//
// On a meltdown day the hook is the score. On a quiet day the score is small and
// "30 shame points of fucked" is a soft brag, so the line leans into clean-board
// energy ("screenshot it, nobody will believe you") to keep a postable angle.
// The number and tier stay in frame, so a calm day is still a receipt, not a
// meme. Quiet day = Good Service or Limping Along (the worst line is under 30).
export function buildShareText(winner, clock) {
  if (!winner || !winner.id) {
    return `Which line is ruining the most mornings right now. ${SHARE_URL}`;
  }
  const tier = getScoreTier(winner.daily_score);
  const tierName = tier.label.replace(/[^ -~]/g, "").trim();
  const score = (winner.daily_score || 0).toLocaleString();
  const unit = winner.daily_score === 1 ? "shame point" : "shame points";
  const stamp = clock ? ` as of ${clock}` : "";

  // Quiet day: the worst line is barely scoring. Keep the number and tier honest
  // but switch the hook to the clean-board flex.
  if (winner.daily_score < 30) {
    if (winner.daily_score === 0) {
      return `Every line is running right now${stamp}. Screenshot it, nobody will believe you. ${SHARE_URL}`;
    }
    return `Quietest the subway gets: the ${winner.id} is the worst line and it is only ${score} ${unit}${stamp}. ${tierName}. Screenshot it, nobody will believe you. ${SHARE_URL}`;
  }

  return `The ${winner.id} is ${score} ${unit} of fucked${stamp}. ${tierName}. I have receipts. ${SHARE_URL}`;
}
