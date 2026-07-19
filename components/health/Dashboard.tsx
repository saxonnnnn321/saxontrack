"use client";

import { useEffect, useState } from "react";
import { DASHBOARD_ORDER } from "@/lib/health/config";
import { useEntries, useSettings, patchSettings } from "@/lib/health/store";
import { seedIfEmpty } from "@/lib/health/seed";
import {
  formatDayLong,
  readiness,
  todayISO,
} from "@/lib/health/compute";
import { computeInsights } from "@/lib/health/insights";
import type { TimeRange } from "@/lib/health/types";
import MetricCard from "./MetricCard";
import ReadinessRing from "./ReadinessRing";
import TimeRangeToggle from "./TimeRangeToggle";
import BottomNav from "./BottomNav";
import LogModal from "./LogModal";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const entries = useEntries();
  const settings = useSettings();
  const range = settings.lastRange;

  // Client-only: seed demo data once and mark mounted (avoids hydration gaps).
  useEffect(() => {
    seedIfEmpty();
    setMounted(true);
  }, []);

  const ready = readiness(entries);
  const insights = computeInsights(entries);

  const setRange = (r: TimeRange) => patchSettings({ lastRange: r });

  if (!mounted) {
    return <div className="flex-1" aria-hidden />; // pre-hydration blank
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-6">
        {/* Header */}
        <header className="pt-8 pb-5">
          <p className="label mb-2">{formatDayLong(todayISO())}</p>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-4xl font-medium leading-tight">
              {greeting()}
            </h1>
          </div>
          <div className="mt-4">
            <TimeRangeToggle value={range} onChange={setRange} />
          </div>
        </header>

        {/* Readiness hero */}
        {ready && (
          <section className="rounded-3xl bg-ink text-white p-5 mb-4 flex items-center justify-between">
            <div className="max-w-[62%]">
              <p className="label text-white/60 mb-1">Readiness</p>
              <p className="font-display text-6xl leading-none tabular-nums">
                {ready.score}
              </p>
              <p className="text-sm text-white/70 mt-3 leading-snug">
                {ready.note}
              </p>
            </div>
            <ReadinessRing value={ready.score} />
          </section>
        )}

        {/* Metric cards */}
        <section className="grid grid-cols-2 gap-3">
          {DASHBOARD_ORDER.map((m) => (
            <MetricCard key={m} metric={m} entries={entries} range={range} />
          ))}
        </section>

        {/* Insights */}
        <section className="mt-5 space-y-2">
          <p className="label">Insights</p>
          {insights.map((ins) => (
            <div
              key={ins.id}
              className={`rounded-xl border p-3 text-sm leading-snug ${
                ins.tone === "warning"
                  ? "border-warning/30 bg-warning/5 text-foreground"
                  : ins.tone === "positive"
                    ? "border-accent/30 bg-accent-soft text-foreground"
                    : "border-border bg-surface text-muted"
              }`}
            >
              {ins.text}
            </div>
          ))}
        </section>
      </main>

      <BottomNav onLog={() => setLogOpen(true)} />
      {logOpen && <LogModal onClose={() => setLogOpen(false)} />}

      {/* Floating quick-add for larger screens */}
      <button
        onClick={() => setLogOpen(true)}
        className="fixed bottom-20 right-4 sm:right-[calc(50%-13rem)] h-12 w-12 rounded-full bg-accent text-white text-2xl shadow-lg hover:opacity-90 transition-opacity"
        aria-label="Log entry"
      >
        ＋
      </button>
    </div>
  );
}
