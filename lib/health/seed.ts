import { format, subDays } from "date-fns";
import type { MetricEntry } from "./types";
import { replaceAll } from "./store";

// Optional demo data — NOT loaded automatically. The dashboard starts empty so
// the user logs their own; they can tap "Load sample data" to preview a filled
// dashboard, or "Clear" to wipe it.
function makeDemo(): MetricEntry[] {
  const out: MetricEntry[] = [];
  const now = new Date();
  const push = (
    daysAgo: number,
    metric: MetricEntry["metric"],
    values: Record<string, number>,
  ) => {
    out.push({
      id: crypto.randomUUID(),
      metric,
      date: format(subDays(now, daysAgo), "yyyy-MM-dd"),
      values,
      source: "manual",
      createdAt: subDays(now, daysAgo).toISOString(),
    });
  };

  for (let d = 13; d >= 0; d--) {
    const wobble = Math.sin(d) * 0.5;
    push(d, "steps", { steps: Math.round(8200 + Math.sin(d / 2) * 2600) });
    push(d, "sleep", { hours: +(7.4 + wobble * 0.8).toFixed(1) });
    push(d, "water", { ml: 1500 + ((d * 137) % 900) });
    push(d, "mood", { mood: 3 + (d % 3 === 0 ? 1 : d % 4 === 0 ? -1 : 0) });
    push(d, "weight", { kg: +(74.6 - (13 - d) * 0.04).toFixed(1) });
    if (d % 2 === 0) push(d, "workouts", { minutes: 35 + (d % 3) * 10 });
    push(d, "hrv", { ms: Math.round(58 + wobble * 8) });
  }
  return out;
}

export function loadSampleData(): void {
  replaceAll(makeDemo());
}

export function clearAllData(): void {
  replaceAll([]);
}
