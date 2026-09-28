# Weight Tracker

Enter a weight and a date; it is kept in the browser's `localStorage`, and once there are two or more
distinct dates a line chart of the trend appears. A proof of concept: one route, no backend, auth,
database or tests, and the data lives only in the browser you typed it into. Next.js 16.3.6 (App Router,
no `src/`), React 19.2.8, TypeScript, Tailwind v4, Recharts 3.10.1. `docs/design-note.md` is the approved
design and the authority on scope; this README says what was built from it.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build; type-checks as part of it
npm run lint    # eslint
npm start       # serve a build made by `npm run build`
```

## How it behaves

One weight per calendar day: a second entry for an existing date replaces the first, so the entry
count is always the distinct-date count.

- **0 entries** — form plus one line of prompt copy. No chart, no empty axes.
- **1 entry** — form, the value and its date, "add another date to see your trend"; no chart, since a one-point line graph misleads.
- **2+ distinct dates** — form, chart, and the entries listed newest first.

Until storage has been read the form renders disabled with an empty date. Invalid input is rejected
silently: native constraints plus a re-check on submit, no error copy. Browser verification so far is one
spike that confirmed the chart renders; end-to-end behaviour is still being verified (beads issue
`weight-tracker-verify-sdb`, tracked with `br`).

## Where things live

- `app/page.tsx` — server component; static shell around `<WeightTracker />`.
- `app/components/weight-tracker.tsx` — client island; owns entry state, picks the 0 / 1 / 2+ view.
- `app/components/weight-form.tsx` — weight and date inputs, validation, calls `onAdd`.
- `app/components/weight-chart.tsx` — Recharts `<LineChart>` in a fixed-height wrapper.
- `app/lib/storage.ts` — `useWeightEntries()`: load, validate, upsert by date, save.
- `app/lib/types.ts` — `WeightEntry`, storage key, unit label, local-date helpers.
- `app/layout.tsx`, `app/globals.css` — untouched scaffold.

## Notable design decisions (they read as mistakes without the reason)

- **Kilograms only; the unit label is hard-coded** (`UNIT_LABEL`, `app/lib/types.ts`). No conversion and no lb/kg switch: fewer states to get wrong in a POC.
- **`recordedAt` is the raw `YYYY-MM-DD` string** from the date input, never passed through `Date`:
  `new Date("2026-09-28")` is UTC midnight, so west of UTC it loses a day (verified — it formats as
  `9/27/2026` under `TZ=America/New_York`). The string sorts with `<` and is display-ready, so it goes
  straight onto the x-axis; "today" comes from local getters, not `toISOString()`.
- **`localStorage` is never read during render.** State is `null` until a mount effect loads it, so the
  server HTML and the first client render agree — no hydration mismatch. The cost is at first paint: the
  form is briefly disabled and the chart pops in.
- **Two `eslint-disable` comments, both for `react-hooks/set-state-in-effect`** (`app/lib/storage.ts`,
  `app/components/weight-form.tsx`). `eslint-config-next@16.3.6` ships a rule that rejects the exact
  mount-effect pattern Next's own flash-before-hydration guide recommends for client-only values. Rather
  than turn it off globally, the rule is suppressed at those two sites and left active everywhere else,
  so a genuinely accidental `setState` in an effect is still caught. A reviewed decision, not debt.

## Out of scope

Deliberately absent (design note §6): backend, auth, database, cross-device sync; lb/kg switching;
editing or deleting entries; more than one weight per calendar day; goals or averages; export/import;
tests; accessibility work beyond native form semantics; error boundary; `localStorage` quota handling.

## Gotcha: stale `.next/types`

There is no `typecheck` script; `npx tsc --noEmit` stands in. But `tsconfig.json` includes
`.next/types/**/*.ts`, and deleting a route leaves its generated validator behind there — so the check
can fail with a phantom "Cannot find module" for the file you deleted. Fix: `rm -rf .next`, rebuild.
