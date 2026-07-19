"use client";

import { useSyncExternalStore } from "react";
import type { MetricEntry, MetricKey, Settings } from "./types";

// A tiny typed wrapper around localStorage. Keeping every read/write behind
// this module means swapping to a real DB later is a one-file change (§5).
//
// IMPORTANT: the snapshot getters below must return a STABLE reference between
// renders (only changing when the data actually changes). useSyncExternalStore
// compares snapshots by identity — returning a freshly-parsed array/object on
// every call causes an infinite render loop. Hence the in-memory caches.

const KEYS = {
  entries: "health.entries",
  settings: "health.settings",
} as const;

const DEFAULT_SETTINGS: Settings = { lastRange: "today", seeded: false };
const EMPTY_ENTRIES: MetricEntry[] = [];

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

// ---- cached snapshots (stable references for useSyncExternalStore) ----------

let entriesCache: MetricEntry[] | null = null;
let settingsCache: Settings | null = null;

function loadEntries(): MetricEntry[] {
  if (entriesCache === null) {
    entriesCache = read<MetricEntry[]>(KEYS.entries, EMPTY_ENTRIES);
  }
  return entriesCache;
}

function loadSettings(): Settings {
  if (settingsCache === null) {
    settingsCache = {
      ...DEFAULT_SETTINGS,
      ...read<Partial<Settings>>(KEYS.settings, {}),
    };
  }
  return settingsCache;
}

// ---- subscription plumbing (so React re-renders on writes) ------------------

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  // changes from other tabs invalidate our caches, then notify
  const onStorage = () => {
    entriesCache = null;
    settingsCache = null;
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

// ---- entries API ------------------------------------------------------------

export function getEntries(): MetricEntry[] {
  return loadEntries();
}

function commitEntries(next: MetricEntry[]): void {
  entriesCache = next; // update cache first so the next snapshot is stable
  write(KEYS.entries, next);
  emit();
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
  commitEntries([...loadEntries(), entry]);
  return entry;
}

export function deleteEntry(id: string): void {
  commitEntries(loadEntries().filter((e) => e.id !== id));
}

export function replaceAll(entries: MetricEntry[]): void {
  commitEntries(entries);
}

// ---- settings API -----------------------------------------------------------

export function getSettings(): Settings {
  return loadSettings();
}

export function patchSettings(patch: Partial<Settings>): void {
  settingsCache = { ...loadSettings(), ...patch };
  write(KEYS.settings, settingsCache);
  emit();
}

// ---- React hooks ------------------------------------------------------------

export function useEntries(): MetricEntry[] {
  return useSyncExternalStore(subscribe, loadEntries, () => EMPTY_ENTRIES);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, loadSettings, () => DEFAULT_SETTINGS);
}
