import { ImageResponse } from "@vercel/og";
import { MOCK_DATA } from "@/lib/mock-data";

export const runtime = "edge";

const LINE_COLORS: Record<string, string> = {
  "1": "#EE352E", "2": "#EE352E", "3": "#EE352E",
  "4": "#00933C", "5": "#00933C", "6": "#00933C",
  "7": "#B933AD",
  A: "#0039A6", C: "#0039A6", E: "#0039A6",
  B: "#FF6319", D: "#FF6319", F: "#FF6319", M: "#FF6319",
  N: "#FCCC0A", Q: "#FCCC0A", R: "#FCCC0A", W: "#FCCC0A",
  G: "#6CBE45", J: "#996633", Z: "#996633",
  L: "#A7A9AC", S: "#808183", SI: "#003DA5",
};

const DARK_TEXT = new Set(["N", "Q", "R", "W"]);

export async function GET() {
  // In production, fetch from Flask backend.
  // For now, use mock data.
  const data = MOCK_DATA;
  const top3 = data.podium.slice(0, 3);
  const dateStr = data.date;
  const medals = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"]; // gold, silver, bronze

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
          color: "#F5F0E8",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: "52px",
            fontWeight: 900,
            letterSpacing: "-1px",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Subway Shame
        </div>

        {/* Date */}
        <div
          style={{
            fontSize: "20px",
            color: "#71717A",
            marginTop: "8px",
            fontFamily: "monospace",
            display: "flex",
          }}
        >
          {dateStr}
        </div>

        {/* Podium */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "48px",
            marginTop: "48px",
          }}
        >
          {top3.map((line, i) => (
            <div
              key={line.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "32px", display: "flex" }}>
                {medals[i]}
              </div>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: LINE_COLORS[line.id] || "#808183",
                  color: DARK_TEXT.has(line.id) ? "#000" : "#FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: 900,
                }}
              >
                {line.id}
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 900,
                  display: "flex",
                }}
              >
                {line.daily_score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Tagline */}
        {top3[0] && (
          <div
            style={{
              marginTop: "40px",
              fontSize: "18px",
              color: "#71717A",
              display: "flex",
            }}
          >
            The {top3[0].id} train: {top3[0].alerts.length} alerts,{" "}
            score {top3[0].daily_score.toLocaleString()}
          </div>
        )}

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "16px",
            color: "#3F3F46",
            fontFamily: "monospace",
            display: "flex",
          }}
        >
          subwayshame.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
