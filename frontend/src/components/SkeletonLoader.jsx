function SkeletonBlock({ className }) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ backgroundColor: '#2A2A2A' }}
    />
  );
}

export default function SkeletonLoader() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Train checker skeleton */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#1A1A1A', boxShadow: 'var(--shadow-card)' }}>
          <SkeletonBlock className="h-7 w-48 mx-auto mb-2" />
          <SkeletonBlock className="h-3 w-32 mx-auto mb-5" />
          <div className="flex flex-wrap gap-1.5 justify-center">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: '#2A2A2A' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Trophy skeleton */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-8 text-center space-y-4" style={{ backgroundColor: '#1A1A1A', boxShadow: 'var(--shadow-card)' }}>
          <SkeletonBlock className="w-16 h-16 rounded-full mx-auto" />
          <SkeletonBlock className="h-4 w-40 mx-auto" />
          <SkeletonBlock className="w-24 h-24 rounded-full mx-auto" />
          <SkeletonBlock className="h-12 w-24 mx-auto" />
          <SkeletonBlock className="h-4 w-32 mx-auto" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-3/4 mx-auto" />
        </div>
      </div>

      {/* Line grid skeleton */}
      <div>
        <SkeletonBlock className="h-5 w-24 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-lg p-4 flex items-center gap-3" style={{ backgroundColor: '#1A1A1A' }}>
              <div className="w-10 h-10 rounded-full animate-pulse shrink-0" style={{ backgroundColor: '#2A2A2A' }} />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-2.5 w-14" />
              </div>
              <SkeletonBlock className="h-6 w-8" />
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-center animate-pulse" style={{ color: 'rgba(245, 240, 232, 0.2)' }}>
        Fetching live MTA alerts and calculating today's shame scores...
      </p>
    </div>
  );
}
