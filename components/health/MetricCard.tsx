"use client";

import type { MetricEntry, MetricKey, TimeRange } from "@/lib/health/types";
import { METRICS } from "@/lib/health/config";
import {
  aggregate,
  computeStreak,
  dailySeries,
  entriesFor,
} from "@/lib/health/compute";
import Sparkline from "./Sparkline";

export default function MetricCard({
  metric,
  entries,
  range,
}: {
  metric: MetricKey;
  entries: MetricEntry[];
  range: TimeRange;
}) {
  const cfg = METRICS[metric];
  const scoped = entriesFor(entries, metric, range);
  const value = aggregate(scoped, metric);
  const series = dailySeries(entries, metric, 7);
  const target = cfg.defaultTarget;
  const streak = computeStreak(entries, metric, target);

  const hasData = value !== null;
  const pct =
    cfg.card === "progress" && target
      ? Math.min(1, (value ?? 0) / target)
      : null;

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="label">{cfg.label}</span>
        {streak.current >= 2 && (
          <span className="text-[11px] font-semibold text-accent tnum">
            🔥 {streak.current}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-[1.7rem] leading-none font-display font-medium tnum">
          {hasData ? cfg.format(value!) : "—"}
        </span>
        {cfg.unit && hasData && (
          <span className="text-xs text-muted font-medium">{cfg.unit}</span>
        )}
      </div>

      {pct !== null ? (
        <div className="h-1 rounded-full bg-hairline overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${pct * 100}%`, background: "var(--accent)" }}
          />
        </div>
      ) : null}

      <Sparkline data={series.map((d) => d.value)} style={cfg.spark} height={34} />
    </div>
  );
}
