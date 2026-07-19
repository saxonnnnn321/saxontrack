"use client";

// Bevel-style score ring: a rounded progress arc with the score in the middle.
// Handles the empty state (dashed track, "—") gracefully.

export default function ScoreRing({
  value,
  colorVar,
  size = 120,
  stroke = 10,
  children,
}: {
  value: number | null; // 0..100
  colorVar: string; // CSS var name, e.g. "--score-recovery"
  size?: number;
  stroke?: number;
  children?: React.ReactNode; // centre content
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const has = value !== null;
  const pct = has ? Math.max(0, Math.min(100, value)) / 100 : 0;
  const color = `var(${colorVar})`;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={stroke}
          strokeDasharray={has ? undefined : "2 6"}
          strokeLinecap="round"
        />
        {has && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
