"use client";

interface Slice {
  label: string;
  value: number;
  color: string;
}

/** A dependency-free donut chart built with a CSS conic-gradient — no chart
 * library needed for three slices. Values are plain dollars; the chart shows
 * proportion, the legend shows the actual numbers, in plain English. */
export function MoneyDonut({ slices }: { slices: Slice[] }) {
  const values = slices.map((s) => Math.max(0, s.value));
  const total = values.reduce((sum, v) => sum + v, 0) || 1;
  const prefixSums = values.reduce<number[]>(
    (acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v],
    []
  );

  const stops = slices
    .map((s, i) => {
      const start = ((prefixSums[i - 1] ?? 0) / total) * 100;
      const end = (prefixSums[i] / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div
        className="w-32 h-32 rounded-full shrink-0"
        style={{
          background: `conic-gradient(${stops})`,
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 22px), #000 calc(100% - 22px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 22px), #000 calc(100% - 22px))",
        }}
        role="img"
        aria-label="Breakdown of monthly cost, running cost, and savings"
      />
      <div className="space-y-2 min-w-[180px]">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-paper-300">{s.label}</span>
            <span className="ml-auto font-mono text-xs text-paper-100">
              ${Math.round(s.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
