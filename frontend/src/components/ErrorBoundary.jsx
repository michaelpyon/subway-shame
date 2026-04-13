import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Subway Shame caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--color-tunnel)', color: 'var(--color-cream)' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🚇</div>
            <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--color-cream)' }}>
              The Low Line
            </h1>
            {/* MTA line color bar */}
            <div className="flex justify-center gap-1 mt-3">
              {["#EE352E","#00933C","#B933AD","#0039A6","#FF6319","#FCCC0A","#6CBE45","#A7A9AC"].map((c,i) => (
                <div key={i} className="w-6 h-1.5" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Error card */}
          <div className="p-8 max-w-md w-full text-center" style={{ backgroundColor: 'var(--color-ballast)', border: '1px solid var(--color-outline-variant)', boxShadow: 'var(--shadow-card)' }}>
            <div className="text-5xl mb-4">💀</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-cream)' }}>
              Something derailed
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-outline)' }}>
              The app hit an unexpected error. Even our tracker occasionally delays.
              Try refreshing. It usually works on the second attempt, much like the MTA.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 font-bold text-sm transition-colors press-scale"
              style={{ backgroundColor: 'var(--color-signal-red)', color: 'var(--color-cream)', border: '2px solid var(--color-cream)' }}
              type="button"
            >
              Refresh
            </button>
            {this.state.error && (
              <p className="text-[10px] mt-4 font-mono break-all" style={{ color: 'var(--color-outline-variant)' }}>
                {this.state.error.message}
              </p>
            )}
          </div>

          <p className="text-xs mt-8" style={{ color: 'var(--color-outline-variant)' }}>
            For entertainment purposes. The MTA has enough problems.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
