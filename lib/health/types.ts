// Core data model for the Health module (Phase 1, local-only).
// See docs/health-tracker-dashboard-tutorial.md §5.

export type MetricKey =
  | "weight"
  | "steps"
  | "sleep"
  | "workouts"
  | "nutrition"
  | "water"
  | "mood"
  | "hrv";

export type EntrySource = "manual" | "garmin" | "strava"; // future-proofed (§11)

export type MetricEntry = {
  id: string; // uuid
  metric: MetricKey;
  date: string; // ISO 'YYYY-MM-DD'
  values: Record<string, number>; // e.g. { kg: 74.2, bodyFat: 15 }
  note?: string;
  source: EntrySource;
  createdAt: string; // ISO timestamp
};

export type Targets = Record<MetricKey, Record<string, number>>;

export type Streak = { current: number; best: number; lastMet: string | null };
export type Streaks = Record<MetricKey, Streak>;

export type TimeRange = "today" | "week" | "month" | "all";

export type Settings = {
  lastRange: TimeRange;
  seeded: boolean; // whether demo data has been loaded once
};
