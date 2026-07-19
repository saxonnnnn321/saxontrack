"use client";

import type { TimeRange } from "@/lib/health/types";

const RANGES: { key: TimeRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All" },
];

export default function TimeRangeToggle({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-surface border border-border p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            value === r.key
              ? "bg-ink text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
