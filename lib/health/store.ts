"use client";

import { useSyncExternalStore } from "react";
import type { MetricEntry, MetricKey, Settings } from "./types";

// A tiny typed wrapper around localStorage. Keeping every read/write behind
// this module means swapping to a real DB later is a one-file change (§5).

const KEYS = {
  entries: "health.entries",
  settings: "health.settings",
} as const;

const DEFAULT_SETTINGS: Settings = { lastRange: "today", seeded: false };

// ---- low-level safe storage -------------------------------------------------

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback; // storage disabled or corrupt — degrade gracefully
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / disabled — silently ignore in Phase 1
  }
}

// ---- subscription plumbing (so React re-renders on writes) ------------------

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  // also react to changes from other tabs
  const onStorage = () => cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

// ---- entries API ------------------------------------------------------------

export function getEntries(): MetricEntry[] {
  return read<MetricEntry[]>(KEYS.entries, []);
}

export function addEntry(
  metric: MetricKey,
  date: string,
  values: Record<string, number>,
  note?: string,
): MetricEntry {
  const entry: MetricEntry = {
    id: crypto.randomUUID(),
    metric,
    date,
    values,
    note: note?.trim() || undefined,
    source: "manual",
    createdAt: new Date().toISOString(),
  };
  const next = [...getEntries(), entry];
  write(KEYS.entries, next);
  emit();
  return entry;
}

export function deleteEntry(id: string): void {
  write(
    KEYS.entries,
    getEntries().filter((e) => e.id !== id),
  );
  emit();
}

export function replaceAll(entries: MetricEntry[]): void {
  write(KEYS.entries, entries);
  emit();
}

// ---- settings API -----------------------------------------------------------

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) };
}

export function patchSettings(patch: Partial<Settings>): void {
  write(KEYS.settings, { ...getSettings(), ...patch });
  emit();
}

// ---- React hooks ------------------------------------------------------------

export function useEntries(): MetricEntry[] {
  return useSyncExternalStore(subscribe, getEntries, () => []);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS);
}
