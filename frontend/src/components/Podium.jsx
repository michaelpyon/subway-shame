import { LINE_COLORS, getScoreTier } from "../constants/lines";
import LineBadge from "./LineBadge";

const PLACE_CONFIG = [
  {
    label: "1st",
    emoji: "\uD83E\uDD47",
    height: "h-28",
    order: "order-2",
    badgeSize: "lg",
    accentColor: "#EAB308",
  },
  {
    label: "2nd",
    emoji: "\uD83E\uDD48",
    height: "h-20",
    order: "order-1",
    badgeSize: "md",
    accentColor: "#9CA3AF",
  },
  {
    label: "3rd",
    emoji: "\uD83E\uDD49",
    height: "h-14",
    order: "order-3",
    badgeSize: "md",
    accentColor: "#B45309",
  },
];

/**
 * Group podium entries by score into ranked places, handling ties.
 * Returns an array of { place: 0|1|2, lines: [...] } objects.
 * E.g. if 1st has 1 line, 2nd is a 2-way tie, there is no 3rd.
 */
function groupByPlace(podium) {
  if (!podium || podium.length === 0) return [];

  const groups = [];
  let currentPlace = 0;

  for (let i = 0; i < podium.length; i++) {
    if (i === 0 || podium[i].daily_score !== podium[i - 1].daily_score) {
      // New score group — assign the current rank
      groups.push({ place: currentPlace, lines: [podium[i]] });
      currentPlace = i + 1; // Next distinct score gets the rank after all tied entries
    } else {
      // Same score — tie with previous group
      groups[groups.length - 1].lines.push(podium[i]);
      currentPlace = i + 1;
    }
  }

  // Only keep places 0, 1, 2 (1st, 2nd, 3rd)
  return groups.filter((g) => g.place <= 2);
}

function PlacePedestal({ config, lines }) {
  if (!lines || lines.length === 0) {
    // Empty placeholder
    return (
      <div className={`${config.order} flex-1 max-w-[180px]`}>
        <div
          className={`${config.height} rounded-t-xl flex flex-col items-center justify-end pb-3 opacity-30`}
          style={{
            borderTop: `1px solid ${config.accentColor}30`,
            borderLeft: `1px solid ${config.accentColor}30`,
            borderRight: `1px solid ${config.accentColor}30`,
            background: `linear-gradient(to bottom, ${config.accentColor}15, transparent)`,
          }}
        >
          <span className="text-2xl">{config.emoji}</span>
          <span className="text-xs mt-1" style={{ color: config.accentColor }}>
            {config.label}
          </span>
        </div>
      </div>
    );
  }

  const score = lines[0].daily_score;
  const tier = getScoreTier(score);
  const isTie = lines.length > 1;

  // Use the first line's color for the pedestal gradient, or blend for ties
  const primaryColor = LINE_COLORS[lines[0].id] || "#808183";

  return (
    <div className={`${config.order} flex-1 max-w-[180px]`}>
      {/* Badges floating above pedestal */}
      <div className="flex justify-center gap-1 mb-1 flex-wrap">
        {lines.map((line) => (
          <LineBadge key={line.id} lineId={line.id} size={config.badgeSize} />
        ))}
      </div>

      {/* Medal — outside pedestal so overflow-hidden can't clip it */}
      <div className="flex justify-center mb-1">
        <span className="text-2xl">{config.emoji}</span>
      </div>

      {/* Pedestal */}
      <div
        className={`${config.height} rounded-t-xl flex flex-col items-center justify-center relative overflow-hidden`}
        style={{
          borderTop: `1px solid ${primaryColor}50`,
          borderLeft: `1px solid ${primaryColor}50`,
          borderRight: `1px solid ${primaryColor}50`,
          background: `linear-gradient(to bottom, ${primaryColor}20, transparent)`,
        }}
      >
        {isTie && (
          <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(245, 240, 232, 0.4)' }}>
            TIE
          </span>
        )}
        <span
          className="text-xl sm:text-2xl font-bold tabular-nums"
          style={{ color: tier.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
        >
          {score}
        </span>
        <span className="text-[9px]" style={{ color: 'rgba(245, 240, 232, 0.3)', fontFamily: 'var(--font-mono)' }}>pts today</span>
      </div>

      {/* Line names below */}
      <div className="text-center mt-2">
        <span className="text-xs block" style={{ color: 'rgba(245, 240, 232, 0.3)' }}>
          {lines
            .map((l) => (l.id === "SI" ? "SIR" : `${l.id}`))
            .join(" & ")}{" "}
          {lines.length === 1 ? "Train" : "Trains"}
        </span>
        {isTie && (
          <span className="text-[10px] block" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>
            Tied for {config.label}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Podium({ podium, date }) {
  if (!podium || podium.length === 0) return null;

  const placeGroups = groupByPlace(podium);

  // Build the 3 pedestal slots (some may be empty if ties skip a rank)
  const slots = [null, null, null]; // 1st, 2nd, 3rd
  for (const group of placeGroups) {
    slots[group.place] = group.lines;
  }

  return (
    <div className="px-4 pt-4 pb-4 max-w-2xl mx-auto">
      {/* Date badge */}
      {date && (
        <p className="text-center text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(245, 240, 232, 0.3)' }}>
          {date}
        </p>
      )}

      <h2
        className="text-center mb-4"
        style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'rgba(245, 240, 232, 0.5)', letterSpacing: '0.04em' }}
      >
        TODAY'S PODIUM
      </h2>

      {/* Podium blocks — display order: 2nd | 1st | 3rd */}
      <div className="flex items-end justify-center gap-3 sm:gap-4 mb-6">
        {[0, 1, 2].map((displayIdx) => {
          const placeIdx = [1, 0, 2][displayIdx]; // visual: 2nd | 1st | 3rd
          const config = PLACE_CONFIG[placeIdx];
          const lines = slots[placeIdx];

          return (
            <PlacePedestal
              key={placeIdx}
              config={config}
              lines={lines}
            />
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="h-2 rounded-full max-w-xs mx-auto" style={{ backgroundColor: '#2A2A2A' }} />
    </div>
  );
}
