import { Component } from "react";

// Last-resort error state. On brand, honest, no emoji spam. The verdict the
// product cannot give becomes a plain "we broke, try again".
const MTA_COLORS = [
  "var(--mta-123)", "var(--mta-456)", "var(--mta-7)", "var(--mta-ace)",
  "var(--mta-bdfm)", "var(--mta-nqrw)", "var(--mta-g)", "var(--mta-l)",
];

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("The Low Line caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-dvh flex flex-col items-center justify-center px-4"
          style={{ backgroundColor: "var(--color-tunnel)", color: "var(--color-platform)" }}
        >
          <div className="text-center mb-6">
            <div className="flex justify-center gap-1 mb-4">
              {MTA_COLORS.map((c, i) => (
                <div key={i} className="w-6 h-1.5" style={{ backgroundColor: c }} />
              ))}
            </div>
            <h1 className="font-display" style={{ fontSize: "22px", letterSpacing: "0.3em", color: "var(--color-platform)" }}>
              THE LOW LINE
            </h1>
          </div>

          <div
            className="p-6 max-w-md w-full text-center"
            style={{ backgroundColor: "var(--color-ballast)", boxShadow: "var(--shadow-card)" }}
          >
            <span className="stamp stamp-dumpster">Something derailed</span>
            <p className="mt-4 mb-6" style={{ fontSize: "15px", lineHeight: 1.5, color: "var(--color-platform)" }}>
              The app hit an error. Even our tracker delays sometimes. Refresh and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="font-display press-scale"
              style={{
                fontSize: "20px",
                letterSpacing: "0.04em",
                minHeight: "48px",
                padding: "0 24px",
                backgroundColor: "var(--color-signal-red)",
                color: "var(--color-platform)",
                border: "none",
                borderRadius: 0,
                cursor: "pointer",
              }}
              type="button"
            >
              REFRESH
            </button>
            {this.state.error && (
              <p className="receipt mt-4 break-all" style={{ color: "var(--color-newsprint)" }}>
                {this.state.error.message}
              </p>
            )}
          </div>

          <p className="receipt mt-8" style={{ color: "var(--color-newsprint)" }}>
            For entertainment. The MTA has enough problems.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
