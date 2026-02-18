import SubwayLineCard from "./SubwayLineCard";

export default function LineGrid({ lines }) {
  return (
    <div className="px-4 pb-8 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold text-gray-400 mb-4 px-1">
        All Lines
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {lines.map((line) => (
          <SubwayLineCard key={line.id} line={line} />
        ))}
      </div>
    </div>
  );
}
