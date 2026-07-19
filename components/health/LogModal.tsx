"use client";

import { useState } from "react";
import type { MetricKey } from "@/lib/health/types";
import { DASHBOARD_ORDER, METRICS } from "@/lib/health/config";
import { addEntry } from "@/lib/health/store";
import { todayISO } from "@/lib/health/compute";

// Field definitions per metric for the quick-add form. The primary field maps
// to config; a few metrics expose an extra optional field.
const FIELDS: Record<
  MetricKey,
  { field: string; label: string; min: number; max: number; step?: number }[]
> = {
  steps: [{ field: "steps", label: "Steps", min: 0, max: 100000 }],
  sleep: [{ field: "hours", label: "Hours slept", min: 0, max: 24, step: 0.1 }],
  water: [{ field: "ml", label: "Water (mL)", min: 0, max: 6000 }],
  workouts: [{ field: "minutes", label: "Duration (min)", min: 0, max: 600 }],
  mood: [{ field: "mood", label: "Mood (1–5)", min: 1, max: 5, step: 1 }],
  weight: [{ field: "kg", label: "Weight (kg)", min: 20, max: 300, step: 0.1 }],
  hrv: [{ field: "ms", label: "HRV (ms)", min: 0, max: 250 }],
  nutrition: [{ field: "kcal", label: "Calories (kcal)", min: 0, max: 8000 }],
};

export default function LogModal({ onClose }: { onClose: () => void }) {
  const [metric, setMetric] = useState<MetricKey>("steps");
  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fields = FIELDS[metric];

  function submit() {
    const parsed: Record<string, number> = {};
    for (const f of fields) {
      const raw = values[f.field];
      const num = Number(raw);
      if (raw === undefined || raw === "" || Number.isNaN(num)) {
        setError(`Enter a value for ${f.label.toLowerCase()}.`);
        return;
      }
      if (num < f.min || num > f.max) {
        setError(`${f.label} must be between ${f.min} and ${f.max}.`);
        return;
      }
      parsed[f.field] = num;
    }
    addEntry(metric, date, parsed, note);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface border border-border p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Log entry</h2>
          <button onClick={onClose} className="text-muted text-xl leading-none">
            ×
          </button>
        </div>

        <label className="label block mb-1">Metric</label>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {DASHBOARD_ORDER.concat(["nutrition", "hrv"]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMetric(m);
                setValues({});
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                metric === m
                  ? "bg-ink text-white border-ink"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {METRICS[m].label}
            </button>
          ))}
        </div>

        {fields.map((f) => (
          <div key={f.field} className="mb-3">
            <label className="label block mb-1">{f.label}</label>
            <input
              type="number"
              inputMode="decimal"
              step={f.step ?? 1}
              value={values[f.field] ?? ""}
              onChange={(e) => {
                setValues((v) => ({ ...v, [f.field]: e.target.value }));
                setError(null);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-lg tabular-nums outline-none focus:border-accent"
              autoFocus
            />
          </div>
        ))}

        <div className="mb-3">
          <label className="label block mb-1">Date</label>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <div className="mb-4">
          <label className="label block mb-1">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent"
            placeholder="How did it feel?"
          />
        </div>

        {error && <p className="text-warning text-sm mb-3">{error}</p>}

        <button
          onClick={submit}
          className="w-full rounded-lg bg-ink text-white py-2.5 font-medium hover:opacity-90 transition-opacity"
        >
          Save
        </button>
      </div>
    </div>
  );
}
