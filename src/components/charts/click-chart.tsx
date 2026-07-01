"use client";

type DataPoint = { date: string; count: number };

type Props = { data: DataPoint[] };

export default function ClickChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">
        No click data yet
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const hasClicks = data.some((d) => d.count > 0);

  if (!hasClicks) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-zinc-400 text-sm gap-2">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <p>Share your link to see click analytics here</p>
      </div>
    );
  }

  return (
    <div className="relative h-48">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-xs text-zinc-400">
        <span>{maxCount}</span>
        <span>{Math.round(maxCount / 2)}</span>
        <span>0</span>
      </div>

      {/* Bars */}
      <div className="absolute left-12 right-0 top-0 bottom-6 flex items-end gap-0.5">
        {data.map((point) => {
          const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0;
          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col justify-end group relative"
            >
              <div
                className="bg-zinc-900 rounded-t-sm transition-all hover:bg-zinc-700 min-h-[2px]"
                style={{ height: `${Math.max(height, point.count > 0 ? 4 : 0)}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                {point.date}: {point.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs text-zinc-400">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
