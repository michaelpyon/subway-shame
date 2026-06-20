// ShareCard.jsx, hidden 600x315 card rendered off-screen for html2canvas capture.
// Inline styles only so html2canvas captures it reliably. This is the shared
// object: it must carry the same 5 elements in the same arrangement as the in
// page trophy and the live OG image, and read at 25 percent zoom inside a chat:
//   1. THE LOW LINE wordmark
//   2. the bullet in true MTA color
//   3. the score with "shame points"
//   4. the severity stamp
//   5. the receipt line "Data as of HH:MM"
import { LINE_COLORS, getScoreTier } from "../constants/lines";
import { SHARE_URL } from "../utils/shareText";

const DARK_TEXT_LINES = ["N", "Q", "R", "W", "L"];

// Stamp tints mirror index.css .stamp-* so the captured card matches the app.
const STAMP_STYLE = {
  "stamp-good":     { bg: "rgba(34,197,94,0.20)",  fg: "#22C55E", border: "#22C55E" },
  "stamp-limping":  { bg: "rgba(156,163,175,0.20)", fg: "#9CA3AF", border: "#9CA3AF" },
  "stamp-pain":     { bg: "rgba(234,179,8,0.20)",  fg: "#EAB308", border: "#EAB308" },
  "stamp-meltdown": { bg: "rgba(249,115,22,0.20)", fg: "#F97316", border: "#F97316" },
  "stamp-dumpster": { bg: "rgba(232,53,58,0.45)",  fg: "#F5F0E8", border: "#E8353A" },
};

export default function ShareCard({ winner, date, clock }) {
  if (!winner) return null;

  const color = LINE_COLORS[winner.id] || "#808183";
  const dark = DARK_TEXT_LINES.includes(winner.id);
  const tier = getScoreTier(winner.daily_score);
  const st = STAMP_STYLE[tier.stamp] || STAMP_STYLE["stamp-limping"];

  return (
    <div
      id="shame-share-card"
      style={{
        position: "fixed",
        left: "-9999px",
        top: "0",
        width: "600px",
        height: "315px",
        backgroundColor: "#000000",
        // 1px Concrete border so the card holds its edge in an iMessage dark thread.
        boxShadow: "inset 0 0 0 1px #2A2A2A",
        fontFamily: "var(--font-text)",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        padding: "28px 36px",
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
          fontSize: "22px",
          letterSpacing: "6.6px",
          color: "#F5F0E8",
          textTransform: "uppercase",
        }}
      >
        THE LOW LINE
      </div>

      {/* Hero: bullet + score */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "28px",
          marginTop: "auto",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "104px",
            height: "104px",
            borderRadius: "50%",
            backgroundColor: color,
            color: dark ? "#000" : "#fff",
            fontSize: "54px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {winner.id}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <div
              style={{
                fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
                fontSize: "100px",
                color: tier.color,
                lineHeight: 0.9,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {winner.daily_score.toLocaleString()}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#999077" }}>
              {winner.daily_score === 1 ? "shame point" : "shame points"}
            </div>
          </div>
        </div>
      </div>

      {/* Severity stamp + receipt line */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div
          style={{
            fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
            fontSize: "26px",
            letterSpacing: "2.6px",
            textTransform: "uppercase",
            color: st.fg,
            backgroundColor: st.bg,
            borderLeft: `3px solid ${st.border}`,
            padding: "6px 18px",
            borderRadius: "2px",
          }}
        >
          {tier.emoji ? `${tier.emoji} ` : ""}
          {tier.label}
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#999077",
            fontVariantNumeric: "tabular-nums",
            textAlign: "right",
          }}
        >
          Data as of {clock || date}
          <div style={{ color: "#5a5446", marginTop: "3px" }}>{SHARE_URL}</div>
        </div>
      </div>
    </div>
  );
}
