import { LINE_COLORS, getScoreTier } from "../constants/lines";
import LineBadge from "./LineBadge";

const PLACE_CONFIG = [
  {
    label: "1st",
    emoji: "🥇",
    height: "h-28",
    order: "order-2",
    bgGradient: "from-yellow-500/20 to-transparent",
    borderColor: "border-yellow-500/40",
    textClass: "text-yellow-400",
    badgeSize: "lg",
  },
  {
    label: "2nd",
    emoji: "🥈",
    height: "h-20",
    order: "order-1",
    bgGradient: "from-gray-400/15 to-transparent",
    borderColor: "border-gray-400/30",
    textClass: "text-gray-400",
    badgeSize: "md",
  },
  {
    label: "3rd",
    emoji: "🥉",
    height: "h-14",
    order: "order-3",
    bgGradient: "from-amber-700/15 to-transparent",
    borderColor: "border-amber-700/30",
    textClass: "text-amber-600",
    badgeSize: "md",
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
          className={`${config.height} rounded-t-xl border-t border-x ${config.borderColor} bg-gradient-to-b ${config.bgGradient} flex flex-col items-center justify-end pb-3 opacity-30`}
        >
          <span className="text-2xl">{config.emoji}</span>
          <span className={`text-xs ${config.textClass} mt-1`}>
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
  const MAX_BADGES = 4;
  const extraCount = lines.length - MAX_BADGES;
  const displayedLines = lines.length > MAX_BADGES ? lines.slice(0, MAX_BADGES) : lines;

  return (
    <div className={`${config.order} flex-1 max-w-[180px]`}>
      {/* Badges floating above pedestal */}
      <div className="flex justify-center gap-1 mb-2 flex-wrap">
        {displayedLines.map((line) => (
          <LineBadge key={line.id} lineId={line.id} size={config.badgeSize} />
        ))}
        {extraCount > 0 && (
          <span className="text-[10px] text-gray-400 self-center ml-0.5">+{extraCount}</span>
        )}
      </div>

      {/* Pedestal */}
      <div
        className={`${config.height} rounded-t-xl border-t border-x ${config.borderColor} bg-gradient-to-b ${config.bgGradient} flex flex-col items-center justify-center relative overflow-hidden`}
        style={{
          borderColor: `${primaryColor}50`,
          background: `linear-gradient(to bottom, ${primaryColor}20, transparent)`,
        }}
      >
        <span className="text-2xl mb-1">{config.emoji}</span>
        {isTie && (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
            TIE
          </span>
        )}
        <span
          className="text-xl sm:text-2xl font-bold tabular-nums"
          style={{ color: tier.color }}
        >
          {score}
        </span>
        <span className="text-[9px] text-gray-400">pts today</span>
      </div>

      {/* Line names below */}
      <div className="text-center mt-2">
        <span className="text-xs text-gray-500 block">
          {lines.length <= 4
            ? lines
                .map((l) => (l.id === "SI" ? "SIR" : `${l.id}`))
                .join(" & ")
            : `${lines.slice(0, 3).map((l) => (l.id === "SI" ? "SIR" : `${l.id}`)).join(", ")} +${lines.length - 3} more`}{" "}
          {lines.length === 1 ? "Train" : "Trains"}
        </span>
        {isTie && (
          <span className="text-[10px] text-gray-400 block">
            {lines.length}-way tie for {config.label}
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
        <p className="text-center text-xs text-gray-400 uppercase tracking-widest mb-2">
          {date}
        </p>
      )}

      <h2 className="text-center text-lg sm:text-xl font-bold text-gray-300 mb-4">
        Today's Podium
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
      <div className="h-2 rounded-full bg-gray-800 max-w-xs mx-auto" />
    </div>
  );
}
