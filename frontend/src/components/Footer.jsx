// Footer. Canon copy, kept verbatim. The FML easter egg and the data source
// line in receipt micro. Source line stays in rider language: no GTFS, no
// jargon, even in the fine print (it is on the persona repel list).
const FML = [
  { id: "F", color: "var(--mta-bdfm)" },
  { id: "M", color: "var(--mta-bdfm)" },
  { id: "L", color: "var(--mta-l)" },
];

export default function Footer() {
  return (
    <footer className="max-w-[672px] mx-auto px-4 py-10">
      <div className="text-center py-5 mb-5" style={{ border: "1px solid var(--color-concrete)" }}>
        <p
          className="font-display mb-2"
          style={{ fontSize: "18px", letterSpacing: "0.05em", color: "var(--color-newsprint)", lineHeight: 1.1 }}
        >
          ALL SERVICE IS THEORETICAL.
          <br />
          DO NOT RELY ON SCHEDULES.
        </p>
        <p className="receipt" style={{ color: "var(--color-newsprint)" }}>
          DATA: LIVE FROM THE MTA &middot; REFRESHES EVERY 5 MIN &middot; 24 LINES TRACKED
        </p>
      </div>

      <div className="text-center">
        <div
          className="flex items-center justify-center gap-1.5 mb-3"
          title="F M L"
          aria-label="F M L train lines"
        >
          {FML.map(({ id, color }) => {
            const dark = id === "L";
            return (
              <div
                key={id}
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: color,
                  color: dark ? "#000" : "#fff",
                  fontFamily: "var(--font-text)",
                  fontWeight: 800,
                  fontSize: "11px",
                }}
              >
                {id}
              </div>
            );
          })}
          <span className="receipt ml-1" style={{ color: "var(--color-newsprint)" }}>
            14 St &middot; 6 Av
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-newsprint)" }}>
          Built by{" "}
          <a
            href="https://pyon.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--color-platform)" }}
          >
            Michael Pyon
          </a>
        </p>
      </div>
    </footer>
  );
}
