// ShareCard.jsx — Hidden 600x315 card rendered off-screen for html2canvas capture
// Uses only inline styles so html2canvas can reliably capture it.
import { LINE_COLORS, getScoreTier } from "../constants/lines";

export default function ShareCard({ winner, lines = [], date }) {
  if (!winner) return null;

  const color = LINE_COLORS[winner.id] || "#808183";
  const isYellow = ["N", "Q", "R", "W"].includes(winner.id);
  const tier = getScoreTier(winner.daily_score);
  const delayedCount = lines.filter((l) => (l.daily_score || 0) > 0).length;
  const onTimeCount = lines.length - delayedCount;
  const delayedPct = lines.length > 0 ? (delayedCount / lines.length) * 100 : 0;

  return (
    <div
      id="shame-share-card"
      style={{
        position: "fixed",
        left: "-9999px",
        top: "0",
        width: "600px",
        height: "315px",
        backgroundColor: "#0A0A0A",
        fontFamily: "'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          backgroundColor: color,
        }}
      />

      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% -20%, ${color}50 0%, transparent 65%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          width: "100%",
          padding: "24px 40px",
          boxSizing: "border-box",
        }}
      >
        {/* App title — Bebas Neue */}
        <div
          style={{
            fontSize: "18px",
            letterSpacing: "6px",
            color: "#F5F0E8",
            textTransform: "uppercase",
            marginBottom: "16px",
            fontFamily: "'Bebas Neue', 'Helvetica Neue', sans-serif",
          }}
        >
          THE LOW LINE
        </div>

        {/* Row: badge + scores side by side */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "28px",
            marginBottom: "20px",
          }}
        >
          {/* Line badge */}
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              backgroundColor: color,
              color: isYellow ? "#000" : "#fff",
              fontSize: "42px",
              fontWeight: "900",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 0 32px ${color}60`,
            }}
          >
            {winner.id}
          </div>

          {/* Score block */}
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: "14px",
                color: "#9ca3af",
                marginBottom: "2px",
              }}
            >
              WORST LINE · {date}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "2px" }}>
              <div
                style={{
                  fontSize: "56px",
                  fontWeight: "900",
                  color: tier.color,
                  lineHeight: "1",
                  fontFamily: "'Bebas Neue', 'Space Grotesk', sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                {winner.daily_score.toLocaleString()}
              </div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>pts</div>
            </div>
            <div
              style={{
                fontSize: "14px",
                color: tier.color,
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              {tier.label.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Delayed / on-time bar */}
        <div
          style={{
            maxWidth: "360px",
            margin: "0 auto 20px",
          }}
        >
          <div
            style={{
              height: "8px",
              borderRadius: "4px",
              backgroundColor: "#1A1A1A",
              overflow: "hidden",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                width: `${delayedPct}%`,
                height: "100%",
                backgroundColor: "#E8353A",
                borderRadius: "4px",
              }}
            />
          </div>
          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
            <span style={{ color: "#E8353A", fontWeight: "700" }}>
              {delayedCount} lines delayed
            </span>
            &nbsp;·&nbsp;
            <span style={{ color: "#22C55E" }}>{onTimeCount} on time</span>
          </div>
        </div>
      </div>

      {/* URL watermark */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "10px",
          color: "#374151",
          letterSpacing: "1px",
        }}
      >
        subway.michaelpyon.com
      </div>
    </div>
  );
}
