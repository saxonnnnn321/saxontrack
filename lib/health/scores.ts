import type { MetricEntry, MetricKey } from "./types";
import { METRICS } from "./config";

// Bevel-style headline scores. Each is a 0–100 interpretation derived from the
// manually-logged metrics — directional guidance, not medical precision.

export type ScoreKey = "recovery" | "strain" | "sleep" | "stress";

export type Score = {
  key: ScoreKey;
  label: string; // e.g. "Recovery"
  value: number | null; // 0..100, or null if not enough data
  status: string; // e.g. "Primed"
  colorVar: string; // CSS var for the ring colour
  blurb: string; // one short line of context
};

export const SCORE_META: Record<ScoreKey, { label: string; colorVar: string }> = {
  recovery: { label: "Recovery", colorVar: "--score-recovery" },
  strain: { label: "Strain", colorVar: "--score-strain" },
  sleep: { label: "Sleep", colorVar: "--score-sleep" },
  stress: { label: "Stress", colorVar: "--score-stress" },
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const pct = (n: number) => Math.round(clamp01(n) * 100);

/** Most recent value of a metric's primary field within the last `days` days. */
function latest(
  entries: MetricEntry[],
  metric: MetricKey,
  days = 3,
): number | null {
  const field = METRICS[metric].primaryField;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  const rows = entries
    .filter(
      (e) =>
        e.metric === metric &&
        e.date >= cutoffISO &&
        typeof e.values[field] === "number",
    )
    .sort((a, b) =>
      a.date === b.date
        ? a.createdAt.localeCompare(b.createdAt)
        : a.date.localeCompare(b.date),
    );
  return rows.length ? (rows.at(-1)!.values[field] as number) : null;
}

/** All-time average of a metric (for a personal baseline). */
function baseline(entries: MetricEntry[], metric: MetricKey): number | null {
  const field = METRICS[metric].primaryField;
  const vals = entries
    .filter((e) => e.metric === metric && typeof e.values[field] === "number")
    .map((e) => e.values[field] as number);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function statusFor(key: ScoreKey, v: number): string {
  switch (key) {
    case "recovery":
      return v >= 80 ? "Primed" : v >= 60 ? "Ready" : v >= 40 ? "Moderate" : "Low";
    case "sleep":
      return v >= 85 ? "Great" : v >= 70 ? "Good" : v >= 50 ? "Fair" : "Poor";
    case "strain":
      return v >= 70 ? "High" : v >= 40 ? "Moderate" : "Light";
    case "stress":
      return v <= 30 ? "Calm" : v <= 60 ? "Balanced" : "Elevated";
  }
}

export function computeScores(entries: MetricEntry[]): Record<ScoreKey, Score> {
  const sleepH = latest(entries, "sleep");
  const hrv = latest(entries, "hrv");
  const hrvBase = baseline(entries, "hrv");
  const mood = latest(entries, "mood");
  const steps = latest(entries, "steps", 1);
  const trainMin = latest(entries, "workouts", 1);

  // --- Sleep: hours vs an 8h need ---
  const sleepScore = sleepH === null ? null : pct(sleepH / 8);

  // --- Recovery: sleep (50%) + HRV vs baseline (30%) + mood (20%) ---
  let recovery: number | null = null;
  if (sleepH !== null || hrv !== null || mood !== null) {
    const sleepPart = sleepH === null ? 0.6 : clamp01(sleepH / 8);
    const hrvPart =
      hrv === null || !hrvBase ? 0.6 : clamp01(hrv / hrvBase);
    const moodPart = mood === null ? 0.6 : clamp01(mood / 5);
    recovery = pct(0.5 * sleepPart + 0.3 * hrvPart + 0.2 * moodPart);
  }

  // --- Strain: steps (60%) + training minutes (40%), for today ---
  let strain: number | null = null;
  if (steps !== null || trainMin !== null) {
    const stepPart = clamp01((steps ?? 0) / 12000);
    const trainPart = clamp01((trainMin ?? 0) / 60);
    strain = pct(0.6 * stepPart + 0.4 * trainPart);
  }

  // --- Stress: inverse wellbeing — low recovery, high strain, low mood ---
  let stress: number | null = null;
  if (recovery !== null || strain !== null || mood !== null) {
    const recPart = recovery === null ? 0.4 : 1 - recovery / 100;
    const strainPart = strain === null ? 0.3 : strain / 100;
    const moodPart = mood === null ? 0.4 : 1 - mood / 5;
    stress = pct(0.4 * recPart + 0.3 * strainPart + 0.3 * moodPart);
  }

  const build = (key: ScoreKey, value: number | null, blurb: string): Score => ({
    key,
    label: SCORE_META[key].label,
    value,
    status: value === null ? "No data" : statusFor(key, value),
    colorVar: SCORE_META[key].colorVar,
    blurb,
  });

  return {
    recovery: build(
      "recovery",
      recovery,
      recovery === null
        ? "Log sleep to see recovery"
        : recovery >= 70
          ? "Well recovered — good day to push."
          : recovery >= 45
            ? "Middling recovery — train, but listen in."
            : "Low recovery — keep it easy today.",
    ),
    strain: build(
      "strain",
      strain,
      strain === null ? "Log steps or training" : "Today's accumulated load.",
    ),
    sleep: build(
      "sleep",
      sleepScore,
      sleepScore === null ? "Log last night's sleep" : "Last night's rest.",
    ),
    stress: build(
      "stress",
      stress,
      stress === null ? "Needs a bit more data" : "Inferred from load & recovery.",
    ),
  };
}
