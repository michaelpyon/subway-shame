import LineBadge from "./LineBadge";

export default function AlertMarquee({ lines }) {
  const disrupted = (lines || []).filter((l) => (l.score || 0) > 0);
  if (disrupted.length === 0) return null;

  const count = disrupted.length;
  const label = `${count} LINE${count !== 1 ? "S" : ""} DISRUPTED RIGHT NOW`;
  const lineSummary = disrupted.map((line) => line.id).join(", ");

  // Render one "segment" of the scrolling content
  const Segment = ({ idx }) => (
    <div className="alert-marquee-segment" key={idx}>
      <span style={{ fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}>
        ⚠ {label}
      </span>
      <span style={{ color: "rgba(245, 240, 232, 0.5)" }}>·</span>
      <span className="inline-flex items-center gap-1">
        {disrupted.map((l) => (
          <LineBadge key={l.id} lineId={l.id} size="xs" />
        ))}
      </span>
    </div>
  );

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {label}: {lineSummary}.
      </p>
      <div
        aria-hidden="true"
        className="alert-marquee"
        style={{
          backgroundColor: "#E8353A",
          color: "#F5F0E8",
          fontSize: "13px",
          fontWeight: 700,
          padding: "6px 0",
        }}
      >
        <div className="alert-marquee-track">
          {/* Duplicate content so the loop is seamless */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Segment idx={i} key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
