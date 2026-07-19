# saxontrack

A calm, local-first **health tracker** — the Health module of a larger life tracker.
Log eight health metrics manually, see progress toward goals, streaks, sparklines,
and short rule-based insights. All data lives in your browser (`localStorage`) —
no accounts, no backend (Phase 1).

Built with **Next.js + TypeScript + Tailwind CSS**. Full spec in
[`docs/health-tracker-dashboard-tutorial.md`](docs/health-tracker-dashboard-tutorial.md).

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Fresh visits load two weeks of demo data so the
dashboard looks alive; use the ＋ button to log your own entries.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build (what Vercel runs) |
| `npm start` | Serve the production build |
| `npm run lint` | Lint |

## Deploy

Pushing to the `main` branch on GitHub auto-deploys to Vercel. Pull requests get
their own preview deployments.

## Status

Phase 1 (manual entry, local-only). Charts detail views, a settings panel with
JSON export/import, and device sync (Strava/Garmin) are planned — see the spec.
