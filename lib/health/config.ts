import type { MetricKey } from "./types";

// How each metric is aggregated across a time range.
export type Aggregation = "sum" | "avg" | "latest";

// Visual treatment on the dashboard card.
export type CardStyle = "progress" | "trend";
export type SparkStyle = "bar" | "line";

export type MetricConfig = {
  key: MetricKey;
  label: string;
  /** The main numeric field stored in entry.values */
  primaryField: string;
  unit: string;
  /** Default daily/period target for the primary field (user-editable later) */
  defaultTarget: number | null;
  aggregation: Aggregation;
  card: CardStyle;
  spark: SparkStyle;
  /** Streak counts a day when the primary field is >= this fraction of target.
   *  null → no streak for this metric. */
  streakThreshold: number | null;
  /** Format the primary value for display. */
  format: (v: number) => string;
};

const int = (v: number) => Math.round(v).toLocaleString("en-AU");

export const METRICS: Record<MetricKey, MetricConfig> = {
  steps: {
    key: "steps",
    label: "Steps",
    primaryField: "steps",
    unit: "",
    defaultTarget: 10000,
    aggregation: "sum",
    card: "progress",
    spark: "bar",
    streakThreshold: 1,
    format: int,
  },
  sleep: {
    key: "sleep",
    label: "Sleep",
    primaryField: "hours",
    unit: "h",
    defaultTarget: 8,
    aggregation: "avg",
    card: "progress",
    spark: "bar",
    streakThreshold: 7 / 8, // day counts if sleep >= 7h
    format: (v) => {
      const h = Math.floor(v);
      const m = Math.round((v - h) * 60);
      return m ? `${h}h ${m}m` : `${h}h`;
    },
  },
  water: {
    key: "water",
    label: "Water",
    primaryField: "ml",
    unit: "L",
    defaultTarget: 2000,
    aggregation: "sum",
    card: "progress",
    spark: "bar",
    streakThreshold: 1,
    format: (v) => `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)} L`,
  },
  workouts: {
    key: "workouts",
    label: "Training",
    primaryField: "minutes",
    unit: "min",
    defaultTarget: 30,
    aggregation: "sum",
    card: "progress",
    spark: "bar",
    streakThreshold: 1,
    format: (v) => `${int(v)} min`,
  },
  mood: {
    key: "mood",
    label: "Mood",
    primaryField: "mood",
    unit: "/5",
    defaultTarget: null,
    aggregation: "avg",
    card: "trend",
    spark: "line",
    streakThreshold: null,
    format: (v) => v.toFixed(1),
  },
  weight: {
    key: "weight",
    label: "Weight",
    primaryField: "kg",
    unit: "kg",
    defaultTarget: null,
    aggregation: "latest",
    card: "trend",
    spark: "line",
    streakThreshold: null,
    format: (v) => `${v.toFixed(1)}`,
  },
  hrv: {
    key: "hrv",
    label: "HRV",
    primaryField: "ms",
    unit: "ms",
    defaultTarget: null,
    aggregation: "avg",
    card: "trend",
    spark: "line",
    streakThreshold: null,
    format: (v) => `${Math.round(v)}`,
  },
  nutrition: {
    key: "nutrition",
    label: "Nutrition",
    primaryField: "kcal",
    unit: "kcal",
    defaultTarget: 2200,
    aggregation: "sum",
    card: "progress",
    spark: "bar",
    streakThreshold: 0.9,
    format: int,
  },
};

// Order the cards appear on the dashboard (first version shows these).
export const DASHBOARD_ORDER: MetricKey[] = [
  "steps",
  "sleep",
  "water",
  "workouts",
  "mood",
  "weight",
];
