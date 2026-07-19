"use client";

import { useEffect, useState } from "react";
import { DASHBOARD_ORDER } from "@/lib/health/config";
import { useEntries, useSettings, patchSettings } from "@/lib/health/store";
import { loadSampleData, clearAllData } from "@/lib/health/seed";
import { formatDayLong, todayISO } from "@/lib/health/compute";
import { computeScores, type ScoreKey } from "@/lib/health/scores";
import { computeInsights } from "@/lib/health/insights";
import type { TimeRange } from "@/lib/health/types";
import MetricCard from "./MetricCard";
import ScoreRing from "./ScoreRing";
import TimeRangeToggle from "./TimeRangeToggle";
import BottomNav from "./BottomNav";
import LogModal from "./LogModal";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const SECONDARY: ScoreKey[] = ["strain", "sleep", "stress"];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const entries = useEntries();
  const settings = useSettings();
  const range = settings.lastRange;

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="flex-1" aria-hidden />;

  const isEmpty = entries.length === 0;
  const scores = computeScores(entries);
  const insights = computeInsights(entries);
  const recovery = scores.recovery;
  const setRange = (r: TimeRange) => patchSettings({ lastRange: r });

  return (
    <div className="flex-1 flex flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-8">
        {/* Header */}
        <header className="pt-8 pb-5">
          <p className="label mb-2">{formatDayLong(todayISO())}</p>
          <h1 className="font-display text-[2.1rem] font-medium leading-tight tracking-tight">
            {greeting()}
          </h1>
          {!isEmpty && (
            <div className="mt-4">
              <TimeRangeToggle value={range} onChange={setRange} />
            </div>
          )}
        </header>

        {isEmpty ? (
          /* ---- Empty / onboarding state ---- */
          <div className="card p-7 text-center rise">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-2xl">
              🌱
            </div>
            <h2 className="font-display text-xl mb-1">Start your day</h2>
            <p className="text-sm text-muted leading-snug mb-5">
              Log your sleep, steps and more — your Recovery, Strain, Sleep and
              Stress scores build from what you track.
            </p>
            <button
              onClick={() => setLogOpen(true)}
              className="w-full rounded-xl bg-ink text-white py-3 font-medium hover:opacity-90 transition-opacity"
            >
              Log your first entry
            </button>
            <button
              onClick={loadSampleData}
              className="mt-3 text-sm text-muted underline underline-offset-4 hover:text-foreground"
            >
              or load sample data to explore
            </button>
          </div>
        ) : (
          <>
            {/* ---- Recovery hero ---- */}
            <section className="card p-6 rise flex flex-col items-center text-center">
              <p
                className="label mb-4"
                style={{ color: `var(${recovery.colorVar})` }}
              >
                Recovery · {recovery.status}
              </p>
              <ScoreRing value={recovery.value} colorVar={recovery.colorVar} size={168} stroke={12}>
                <div>
                  <div className="font-display text-5xl leading-none tnum">
                    {recovery.value ?? "—"}
                  </div>
                  <div className="label mt-1 !tracking-widest">/ 100</div>
                </div>
              </ScoreRing>
              <p className="text-sm text-muted mt-4 max-w-[16rem] leading-snug">
                {recovery.blurb}
              </p>
            </section>

            {/* ---- Score strip ---- */}
            <section className="grid grid-cols-3 gap-3 mt-3">
              {SECONDARY.map((k) => {
                const s = scores[k];
                return (
                  <div key={k} className="card p-3 flex flex-col items-center rise">
                    <ScoreRing value={s.value} colorVar={s.colorVar} size={72} stroke={7}>
                      <span className="font-display text-lg tnum">
                        {s.value ?? "—"}
                      </span>
                    </ScoreRing>
                    <p className="text-xs font-semibold mt-2">{s.label}</p>
                    <p className="text-[11px] text-muted">{s.status}</p>
                  </div>
                );
              })}
            </section>

            {/* ---- Detail metrics ---- */}
            <p className="label mt-7 mb-3">Details</p>
            <section className="grid grid-cols-2 gap-3">
              {DASHBOARD_ORDER.map((m) => (
                <MetricCard key={m} metric={m} entries={entries} range={range} />
              ))}
            </section>

            {/* ---- Insights ---- */}
            <p className="label mt-7 mb-3">Insights</p>
            <section className="space-y-2">
              {insights.map((ins) => (
                <div
                  key={ins.id}
                  className={`rounded-xl border p-3 text-sm leading-snug ${
                    ins.tone === "warning"
                      ? "border-warning/25 bg-warning/5"
                      : ins.tone === "positive"
                        ? "border-accent/25 bg-accent-soft"
                        : "border-border bg-surface"
                  }`}
                >
                  {ins.text}
                </div>
              ))}
            </section>

            {/* ---- Data controls ---- */}
            <div className="mt-8 flex items-center justify-center gap-4 text-xs text-faint">
              <button onClick={loadSampleData} className="hover:text-muted">
                Load sample data
              </button>
              <span>·</span>
              <button
                onClick={() => {
                  if (confirm("Clear all your logged data?")) clearAllData();
                }}
                className="hover:text-warning"
              >
                Clear all
              </button>
            </div>
          </>
        )}
      </main>

      <BottomNav onLog={() => setLogOpen(true)} />
      {logOpen && <LogModal onClose={() => setLogOpen(false)} />}

      <button
        onClick={() => setLogOpen(true)}
        className="fixed bottom-20 right-4 sm:right-[calc(50%-13rem)] h-13 w-13 rounded-full text-white text-2xl shadow-lg hover:opacity-90 transition-opacity grid place-items-center"
        style={{ background: "var(--ink)", height: "3.25rem", width: "3.25rem" }}
        aria-label="Log entry"
      >
        ＋
      </button>
    </div>
  );
}
