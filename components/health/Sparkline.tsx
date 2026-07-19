"use client";

// Lightweight inline-SVG sparkline (bar or line). Kept dependency-free and
// tiny for the dashboard cards; Recharts is reserved for the detail views.

type Props = {
  data: (number | null)[];
  style: "bar" | "line";
  height?: number;
  className?: string;
  /** index of the bar to emphasise (defaults to last) */
};

export default function Sparkline({
  data,
  style,
  height = 40,
  className,
}: Props) {
  const values = data.map((v) => (v == null ? 0 : v));
  const present = data.map((v) => v != null);
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const n = values.length;
  const W = 100;
  const H = height;

  if (style === "bar") {
    const gap = 3;
    const bw = (W - gap * (n - 1)) / n;
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={className}
        style={{ width: "100%", height }}
        aria-hidden
      >
        {values.map((v, i) => {
          const h = present[i] ? Math.max(2, (v / max) * (H - 2)) : 2;
          const last = i === n - 1;
          return (
            <rect
              key={i}
              x={i * (bw + gap)}
              y={H - h}
              width={bw}
              height={h}
              rx={1.5}
              fill={last ? "var(--ink)" : "var(--border)"}
              opacity={present[i] ? 1 : 0.4}
            />
          );
        })}
      </svg>
    );
  }

  // line
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (n - 1 || 1)) * W;
    const y = H - 3 - ((v - min) / range) * (H - 6);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
      aria-hidden
    >
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {pts.length > 0 && (
        <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r={2.5} fill="var(--accent)" />
      )}
    </svg>
  );
}
