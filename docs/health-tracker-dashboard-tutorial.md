# Health Tracker — Dashboard Build Tutorial

**For:** Horde Codes
**Module:** Health section of a larger life-tracker app
**Status:** Phase 1 spec (manual-first, local-only)

---

## 1. What we're building

A single **Health overview dashboard** inside a larger life-tracker web app. It shows eight health metrics at a glance, lets the user log data manually, tracks goals and streaks, renders simple charts, and surfaces short written insights based on the numbers.

Build this as a **self-contained module** (`/health`) so it can slot into the wider life tracker later without rework.

### Guiding principles

- **Local-first.** No accounts, no backend, no database in Phase 1. All data lives on the user's device (see §5).
- **Manual entry is the primary path.** Device sync (Garmin, Strava) is **Phase 2** — see §11 for why and how.
- **Metric units, Australian locale.** kg, cm, mL/L, km, °C, 24h or `en-AU` date formatting. Week starts **Monday**.
- **Clean & minimal.** Restrained, calm, lots of whitespace. Not a colourful gamified dashboard (see §12).
- **Toggleable time ranges** everywhere it makes sense: Today / Week / Month / All.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts (lightweight, composable) |
| State | React state + a small store (Zustand or Context) |
| Persistence | `localStorage` via a typed wrapper (Phase 1) |
| Dates | `date-fns` (locale `en-AU`, `weekStartsOn: 1`) |

Keep dependencies minimal. Don't pull in a UI kit unless it earns its place.

---

## 3. The eight metrics

All eight appear on the dashboard. Each has: a display card, a manual-entry form, a default target, streak logic, and a chart on its detail view.

| # | Metric | Logged value(s) | Unit | Default target | Streak rule |
|---|---|---|---|---|---|
| 1 | **Weight / body composition** | Weight (+ optional body-fat %) | kg / % | User-set goal weight | — (trend-focused, no streak) |
| 2 | **Steps & activity** | Steps, active minutes | count / min | 10,000 steps | Day counts if steps ≥ target |
| 3 | **Sleep** | Hours slept (+ optional quality 1–5) | hours | 8 h | Day counts if sleep ≥ 7 h |
| 4 | **Workouts / training** | Type, duration, notes | min | 4 sessions / week | Week counts if sessions ≥ target |
| 5 | **Nutrition** | Calories, protein, carbs, fat | kcal / g | User-set kcal + macro goals | Day counts if within ±10% of kcal goal |
| 6 | **Water intake** | Volume | mL (show as L) | 2,000 mL | Day counts if intake ≥ target |
| 7 | **Mood / mental health** | Mood (1–5) + optional note | scale | — (log-focused) | Day counts if a mood is logged |
| 8 | **Heart rate / HRV** | Resting HR, HRV | bpm / ms | — (trend-focused) | — |

> **Targets are user-editable.** Ship the defaults above, but every target must be changeable in a Settings panel. Persist overrides locally.

### Streaks — general logic

- A streak = consecutive **days** (or weeks, for workouts) where the metric's streak rule is met.
- Store `currentStreak` and `bestStreak` per metric.
- A missed day resets `currentStreak` to 0 but never lowers `bestStreak`.
- Show streaks as a small flame/number badge on the card — subtle, not loud.

---

## 4. Dashboard layout

**You have latitude on the exact layout** — the priority is a clean single-screen overview that reads at a glance. A reasonable structure:

- **Header bar:** "Health" title, the **time-range toggle** (Today / Week / Month / All), and a "＋ Log" quick-add button.
- **Metric cards:** one card per metric. Each card shows the current value (or latest reading), progress toward target (progress ring or bar), streak badge where relevant, and a sparkline. Cards are tappable → open that metric's detail view.
- **Insights strip:** a row/column of 2–4 short written insights (see §9).

Group related cards if it helps (e.g. activity cluster: steps, workouts; recovery cluster: sleep, HRV, resting HR). Weight and mood/HRV are trend-focused, so lean on sparklines rather than progress bars for those.

Make it responsive — cards reflow to a single column on mobile widths.

---

## 5. Data model & storage (Phase 1)

No backend. Use `localStorage` behind a **typed wrapper module** so swapping to a real DB later is a one-file change.

Suggested shape:

```ts
type MetricEntry = {
  id: string;          // uuid
  metric: MetricKey;   // 'weight' | 'steps' | 'sleep' | ...
  date: string;        // ISO 'YYYY-MM-DD'
  values: Record<string, number | string>; // e.g. { kg: 74.2, bodyFat: 15 }
  note?: string;
  source: 'manual' | 'garmin' | 'strava'; // future-proofed
  createdAt: string;   // ISO timestamp
};

type Targets = Record<MetricKey, Record<string, number>>;
type Streaks = Record<MetricKey, { current: number; best: number; lastMet: string }>;
```

Storage keys: `health.entries`, `health.targets`, `health.streaks`, `health.settings`.

**Rules:**
- One source of truth: derive everything (cards, charts, streaks, insights) from `health.entries`.
- Recompute streaks on load and after every write.
- Wrap all reads/writes in try/catch; handle the "storage full / disabled" case gracefully.
- Include an **Export / Import JSON** button in Settings so the user can back up and move their data (important while there's no account).

---

## 6. Time-range toggle

A single control (Today / Week / Month / All) that filters **the whole dashboard** and each detail view.

- **Today** → latest value + today's progress vs target.
- **Week** → Mon–Sun, current week; charts show 7 days.
- **Month** → current calendar month.
- **All** → full history.

Aggregate sensibly per metric: sum for steps/water/workouts, average for weight/sleep/HR/HRV/mood. Persist the user's last-selected range.

---

## 7. Charts

Use Recharts. Keep them clean — thin lines, muted grid, no chart junk.

| Metric | Chart |
|---|---|
| Weight, HRV, Resting HR | Line chart with trend, optional goal line |
| Steps, Water, Nutrition | Bar chart vs target line |
| Sleep | Bar chart (hours), quality as colour intensity |
| Workouts | Weekly bar count |
| Mood | Line or dot plot, 1–5 scale |

Charts respect the active time range. Empty states must be handled ("No data yet — log your first entry").

---

## 8. Manual entry UX

- **Quick-add** from the header opens a small modal to pick a metric and enter a value fast — minimal taps.
- Each metric also has its own form (relevant fields only) on its detail view.
- Default new entries to **today**, but allow back-dating.
- Validate ranges (e.g. weight 20–300 kg, sleep 0–24 h) and show inline errors.
- After saving: update card, chart, streak, and insights immediately (optimistic, since it's local).

---

## 9. Written insights — rule-based

**Not AI.** Deterministic `if/then` rules over the data. Each rule returns a short, plain-English string. Show the 2–4 highest-priority firing insights.

Structure them as a rules array so new ones are easy to add:

```ts
type Insight = { id: string; text: string; tone: 'positive' | 'neutral' | 'warning'; priority: number };
```

Example rules (write ~10–15 like these):

- Water intake < 50% of target by mid-afternoon → *"You're behind on water today — about {remaining} mL to go."* (warning)
- Steps ≥ target for 3+ days running → *"Nice — {streak}-day step streak going."* (positive)
- Avg sleep this week < 6.5 h → *"Sleep's been light this week ({avg} h avg). Worth an earlier night."* (warning)
- Resting HR trending down over 2 weeks → *"Resting heart rate is trending down — a good recovery sign."* (positive)
- No workout logged in 4+ days → *"No sessions logged since {date}."* (neutral)
- Weight within 0.5 kg of goal → *"Almost at your goal weight — keep it steady."* (positive)
- Mood avg ≤ 2 over 3+ days → *"Mood's been low for a few days. Be kind to yourself and consider reaching out to someone you trust."* (warning)

Keep the copy short, warm, and non-preachy. For the mood/low-mood rule especially, keep it gentle and supportive rather than clinical.

---

## 10. Settings panel

- Edit every metric's **target**.
- Set goal weight, calorie & macro goals.
- Toggle which cards are visible on the overview.
- **Export / Import JSON** (data backup).
- Units are metric by default; a units toggle is optional/nice-to-have, not required.

---

## 11. Device sync — Phase 2 (Garmin & Strava)

> **Read this before assuming sync is a Phase 1 feature — it isn't, and here's why.**

Garmin and Strava both require **OAuth 2.0** and a **server-side secret** (client secret / token exchange). That can't live purely in the browser on a local-only app without exposing credentials. So real sync needs a small backend later. Phase 1 stays manual.

**Design now so Phase 2 is easy:**
- Every entry already carries a `source` field (`'manual' | 'garmin' | 'strava'`).
- Keep the storage wrapper as the single data gateway so a sync service can write through the same interface.

**When Phase 2 comes:**
- **Strava API** — OAuth 2.0, good for imported *activities/workouts* (runs, rides, sessions). Rate-limited; respect it. Requires a registered app + a lightweight backend/serverless function for the token exchange.
- **Garmin** — the **Health/Wellness API requires partner approval** and is not instantly open like Strava. It's the source for steps, sleep, HR, HRV. Plan for an application/approval lead time.
- Add a **"Connect" button per source** in Settings, a token store, and a background pull that de-dupes against manual entries (prefer synced data when both exist for the same day/metric).

Leave clearly-labelled `// TODO: Phase 2 sync` hooks where this will plug in.

---

## 12. Design system

Clean & minimal. Think calm dashboard, not fitness-app confetti.

- **Palette:** near-white/neutral background, one restrained accent for progress/positive states, muted warning colour. Generous whitespace.
- **Typography:** one clean sans-serif; clear hierarchy via size/weight, not colour.
- **Cards:** soft rounded corners, subtle border or very light shadow — no heavy drop shadows.
- **Motion:** minimal; gentle transitions on value/streak updates only.
- **Data-first:** the number is the hero on each card; labels and chrome recede.
- Support a light theme as default; a dark mode is optional.

---

## 13. Build order

1. Project scaffold (Next.js + TS + Tailwind), `/health` route, `en-AU` date config.
2. Typed `localStorage` wrapper + data model (§5).
3. Manual entry (quick-add + per-metric forms) with validation.
4. Metric cards + overview layout (§4).
5. Time-range toggle wired through the dashboard (§6).
6. Targets + streak engine (§3).
7. Recharts detail views (§7).
8. Rule-based insights engine (§9).
9. Settings + Export/Import JSON (§10).
10. Polish pass against the design system (§12).
11. *(Phase 2)* Backend + Strava/Garmin sync (§11).

---

## 14. Acceptance criteria (Phase 1)

- [ ] All eight metrics can be logged manually and show on one overview.
- [ ] Time-range toggle (Today/Week/Month/All) filters the whole dashboard.
- [ ] Targets are editable and persist locally; defaults match §3.
- [ ] Streaks compute correctly and survive reloads.
- [ ] Each metric has a working chart with an empty state.
- [ ] Rule-based insights display and update after new entries.
- [ ] All data persists in `localStorage` and survives refresh.
- [ ] Export/Import JSON works.
- [ ] Metric units + `en-AU` formatting throughout; week starts Monday.
- [ ] Layout is responsive and reflows to one column on mobile.
- [ ] Clean, minimal aesthetic per §12.
- [ ] No accounts, no backend, no external API calls in Phase 1.

---

*Built as the Health module of a larger life tracker — keep it modular so other sections can join later.*
