// Structure-only skeleton below the masthead. No spinner, ever. Hero space is
// reserved so the verdict paints with 0 layout shift when the data lands. The
// copy is honest and quiet, not loading theater.
function Block({ className }) {
  return <div className={className} style={{ backgroundColor: "var(--color-concrete)" }} />;
}

export default function SkeletonLoader() {
  return (
    <div className="max-w-[672px] mx-auto px-4 pt-5" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Trophy hero placeholder, same footprint as the real card. */}
      <div className="p-5" style={{ backgroundColor: "var(--color-ballast)", boxShadow: "0 0 0 1px var(--color-concrete)" }}>
        <Block className="h-3 w-40 mb-5" />
        <div className="flex items-center gap-4">
          <div className="w-[5.5rem] h-[5.5rem] rounded-full shrink-0" style={{ backgroundColor: "var(--color-concrete)" }} />
          <div className="flex-1">
            <Block className="h-20 w-40 mb-2" />
            <Block className="h-3 w-28" />
          </div>
        </div>
        <Block className="h-8 w-44 mt-4" />
      </div>

      {/* Leaderboard rows placeholder */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "var(--color-ballast)", boxShadow: "0 0 0 1px var(--color-concrete)" }}>
            <Block className="h-6 w-6 shrink-0" />
            <div className="w-9 h-9 rounded-full shrink-0" style={{ backgroundColor: "var(--color-concrete)" }} />
            <div className="flex-1">
              <Block className="h-3 w-24 mb-1.5" />
              <Block className="h-2.5 w-16" />
            </div>
            <Block className="h-6 w-12" />
          </div>
        ))}
      </div>

      <p className="receipt text-center" style={{ color: "var(--color-newsprint)" }}>
        Reading the live MTA feed
      </p>
    </div>
  );
}
