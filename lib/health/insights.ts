import type { MetricEntry } from "./types";
import { aggregate, dailySeries, entriesFor } from "./compute";
import { METRICS } from "./config";

export type Insight = {
  id: string;
  text: string;
  tone: "positive" | "neutral" | "warning";
  priority: number;
};

// Deterministic if/then rules over the data — NOT AI (§9).
// Returns the highest-priority firing insights.
export function computeInsights(entries: MetricEntry[]): Insight[] {
  const out: Insight[] = [];

  // Water: behind today
  const waterToday = aggregate(entriesFor(entries, "water", "today"), "water") ?? 0;
  const waterTarget = METRICS.water.defaultTarget!;
  if (waterToday > 0 && waterToday < waterTarget * 0.5) {
    out.push({
      id: "water-behind",
      text: `You're behind on water today — about ${waterTarget - waterToday} mL to go.`,
      tone: "warning",
      priority: 6,
    });
  }

  // Sleep: light week
  const sleepWeek = dailySeries(entries, "sleep", 7)
    .map((d) => d.value)
    .filter((v): v is number => v !== null);
  if (sleepWeek.length >= 3) {
    const avg = sleepWeek.reduce((a, b) => a + b, 0) / sleepWeek.length;
    if (avg < 6.5) {
      out.push({
        id: "sleep-light",
        text: `Sleep's been light this week (${avg.toFixed(1)} h avg). Worth an earlier night.`,
        tone: "warning",
        priority: 7,
      });
    }
  }

  // Steps: streak
  const stepDays = dailySeries(entries, "steps", 5)
    .map((d) => (d.value ?? 0) >= METRICS.steps.defaultTarget!);
  let run = 0;
  for (let i = stepDays.length - 1; i >= 0 && stepDays[i]; i--) run++;
  if (run >= 3) {
    out.push({
      id: "steps-streak",
      text: `Nice — ${run}-day step streak going.`,
      tone: "positive",
      priority: 5,
    });
  }

  // Mood: low for a few days (gentle, supportive)
  const moodWeek = dailySeries(entries, "mood", 3)
    .map((d) => d.value)
    .filter((v): v is number => v !== null);
  if (moodWeek.length >= 3) {
    const avg = moodWeek.reduce((a, b) => a + b, 0) / moodWeek.length;
    if (avg <= 2) {
      out.push({
        id: "mood-low",
        text: "Mood's been low for a few days. Be kind to yourself — and consider reaching out to someone you trust.",
        tone: "warning",
        priority: 9,
      });
    }
  }

  // Fallback when nothing else fires
  if (out.length === 0) {
    out.push({
      id: "steady",
      text: "Things look steady. Keep logging to unlock more insights.",
      tone: "neutral",
      priority: 1,
    });
  }

  return out.sort((a, b) => b.priority - a.priority).slice(0, 3);
}
