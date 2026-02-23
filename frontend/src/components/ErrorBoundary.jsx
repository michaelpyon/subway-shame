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
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🚇</div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              Subway Shame
            </h1>
            {/* MTA line color bar */}
            <div className="flex justify-center gap-1 mt-3">
              {["#EE352E","#00933C","#B933AD","#0039A6","#FF6319","#FCCC0A","#6CBE45","#A7A9AC"].map((c,i) => (
                <div key={i} className="w-6 h-1.5 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Error card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">💀</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Something derailed
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              The app hit an unexpected error. Even our tracker occasionally delays.
              Try refreshing — it usually works on the second attempt, much like the MTA.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-white text-black font-bold rounded-full text-sm hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
            {this.state.error && (
              <p className="text-[10px] text-gray-700 mt-4 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-700 mt-8">
            For entertainment purposes. The MTA has enough problems.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
