import {
  format,
  parseISO,
  startOfWeek,
  startOfMonth,
  subDays,
  eachDayOfInterval,
} from "date-fns";
import type { MetricEntry, MetricKey, TimeRange } from "./types";
import { METRICS } from "./config";

// en-AU, week starts Monday (§1).
const WEEK_OPTS = { weekStartsOn: 1 as const };

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDayLong(iso: string): string {
  return format(parseISO(iso), "EEE d LLL").toUpperCase();
}

/** First date (inclusive, ISO) covered by a time range. `all` → null. */
function rangeStartISO(range: TimeRange): string | null {
  const now = new Date();
  switch (range) {
    case "today":
      return format(now, "yyyy-MM-dd");
    case "week":
      return format(startOfWeek(now, WEEK_OPTS), "yyyy-MM-dd");
    case "month":
      return format(startOfMonth(now), "yyyy-MM-dd");
    case "all":
      return null;
  }
}

export function entriesFor(
  entries: MetricEntry[],
  metric: MetricKey,
  range: TimeRange,
): MetricEntry[] {
  const start = rangeStartISO(range);
  return entries.filter(
    (e) => e.metric === metric && (start === null || e.date >= start),
  );
}

function primaryValues(entries: MetricEntry[], metric: MetricKey): number[] {
  const field = METRICS[metric].primaryField;
  return entries
    .map((e) => e.values[field])
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
}

/** Aggregate the primary field for a metric over the given entries. */
export function aggregate(
  entries: MetricEntry[],
  metric: MetricKey,
): number | null {
  const vals = primaryValues(entries, metric);
  if (vals.length === 0) return null;
  const cfg = METRICS[metric];
  switch (cfg.aggregation) {
    case "sum":
      return vals.reduce((a, b) => a + b, 0);
    case "avg":
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    case "latest": {
      // latest by entry date, then createdAt
      const sorted = [...entries]
        .filter((e) => typeof e.values[cfg.primaryField] === "number")
        .sort((a, b) =>
          a.date === b.date
            ? a.createdAt.localeCompare(b.createdAt)
            : a.date.localeCompare(b.date),
        );
      return sorted.at(-1)!.values[cfg.primaryField] as number;
    }
  }
}

/** Per-day aggregated series for the last `days` days (for sparklines). */
export function dailySeries(
  entries: MetricEntry[],
  metric: MetricKey,
  days = 7,
): { date: string; value: number | null }[] {
  const end = new Date();
  const start = subDays(end, days - 1);
  const cfg = METRICS[metric];
  return eachDayOfInterval({ start, end }).map((d) => {
    const iso = format(d, "yyyy-MM-dd");
    const dayEntries = entries.filter(
      (e) => e.metric === metric && e.date === iso,
    );
    const vals = primaryValues(dayEntries, metric);
    let value: number | null = null;
    if (vals.length) {
      value =
        cfg.aggregation === "avg"
          ? vals.reduce((a, b) => a + b, 0) / vals.length
          : cfg.aggregation === "latest"
            ? vals.at(-1)!
            : vals.reduce((a, b) => a + b, 0);
    }
    return { date: iso, value };
  });
}

/** Consecutive-day streak ending today/yesterday, plus best ever. */
export function computeStreak(
  entries: MetricEntry[],
  metric: MetricKey,
  target: number | null,
): { current: number; best: number } {
  const cfg = METRICS[metric];
  if (cfg.streakThreshold === null || !target) return { current: 0, best: 0 };
  const threshold = cfg.streakThreshold * target;

  // aggregate per day
  const byDay = new Map<string, number>();
  for (const e of entries.filter((e) => e.metric === metric)) {
    const v = e.values[cfg.primaryField];
    if (typeof v !== "number") continue;
    byDay.set(e.date, (byDay.get(e.date) ?? 0) + (cfg.aggregation === "sum" ? v : v));
  }
  const met = (iso: string) => (byDay.get(iso) ?? 0) >= threshold;

  // current: walk back from today
  let current = 0;
  const today = new Date();
  // allow the streak to be "alive" if today not yet logged but yesterday met
  const startOffset = met(format(today, "yyyy-MM-dd")) ? 0 : 1;
  for (let i = startOffset; i < 400; i++) {
    if (met(format(subDays(today, i), "yyyy-MM-dd"))) current++;
    else break;
  }

  // best: scan sorted days
  const days = [...byDay.keys()].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const iso of days) {
    if (!met(iso)) {
      run = 0;
      prev = parseISO(iso);
      continue;
    }
    const d = parseISO(iso);
    if (prev && (d.getTime() - prev.getTime()) / 86400000 === 1) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best: Math.max(best, current) };
}

/**
 * Placeholder readiness score (0–100) derived from recovery signals.
 * A calm heuristic for Phase 1 — weights last night's sleep most heavily,
 * nudged by recent mood and HRV. Replace with a real model later.
 */
export function readiness(entries: MetricEntry[]): {
  score: number;
  note: string;
} | null {
  const sleepSeries = dailySeries(entries, "sleep", 1);
  const lastSleep = sleepSeries.at(-1)?.value ?? null;
  if (lastSleep === null) return null;

  const sleepScore = Math.min(1, lastSleep / 8) * 70; // up to 70 pts

  const moodVals = primaryValues(
    entriesFor(entries, "mood", "week"),
    "mood",
  );
  const moodAvg = moodVals.length
    ? moodVals.reduce((a, b) => a + b, 0) / moodVals.length
    : 3;
  const moodScore = (moodAvg / 5) * 20; // up to 20 pts

  const hrvVals = primaryValues(entriesFor(entries, "hrv", "week"), "hrv");
  const hrvScore = hrvVals.length ? 10 : 5; // small fixed contribution for now

  const score = Math.round(sleepScore + moodScore + hrvScore);
  const note =
    score >= 80
      ? "Recovered well. Good day for a hard session."
      : score >= 60
        ? "Steady. Train, but listen to your body."
        : "Low recovery — keep it easy today.";
  return { score: Math.min(100, score), note };
}
