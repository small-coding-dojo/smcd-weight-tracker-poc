# Weight Tracker POC — Design Note
Next.js 16.3.6, React 19.2, TypeScript, Tailwind v4, App Router, no `src/`.
Tailwind kept (scaffold default): presentable page, no CSS files; cost is JSX noise.

## 1. Routing / structure
One route, `/`. No routing between views, no route handlers, no API.
- `app/page.tsx` — server component. Static shell + `<WeightTracker />`.
- `app/components/weight-tracker.tsx` — `"use client"`. Owns all entry state, picks which view to render.
- `app/components/weight-form.tsx` — `"use client"`. Props: `onAdd(weightKg: number, recordedAt: string)` and `disabled: boolean`. Holds only its own input strings, seeding the date itself with `useEffect(() => setDate(todayLocal()), [])`.
- `app/components/weight-chart.tsx` — `"use client"`. Takes `entries` as a prop.
- `app/lib/types.ts` + `app/lib/storage.ts` — types, localStorage layer.
- `app/layout.tsx` — untouched scaffold.

## 2. State shape
```ts
export type WeightEntry = {
  id: string;          // crypto.randomUUID()
  weightKg: number;    // kilograms, finite, > 0
  recordedAt: string;  // LOCAL calendar date "YYYY-MM-DD", from <input type="date">
};
export type WeightEntries = WeightEntry[];  // ascending by recordedAt
```
Kilograms only, label hard-coded "kg", no conversion. `recordedAt` is the raw `YYYY-MM-DD` string the date input yields and is **never
round-tripped through `Date`**: `new Date("2026-09-28")` parses as UTC midnight,
so in `America/New_York` it formats as 9/27/2026 — a silent day loss (verified).
The string sorts correctly with `<` and needs no locale formatting, so it goes
straight to the chart axis as its label.

Ordering has an explicit owner: `addEntry` sorts ascending by `recordedAt` after
inserting, and `load()` sorts whatever it reads — never assumed sorted merely
because it was appended to. Client state is `WeightEntries | null`, where `null`
means "not yet read from storage"; that distinction makes section 3 work.

## 3. Persistence without a hydration mismatch
`localStorage` does not exist on the server, and reading it during render makes
the first client render differ from the server HTML — a hydration error.
`useWeightEntries()` in `app/lib/storage.ts`:
1. `useState<WeightEntries | null>(null)` — server and first client render both see `null` and emit the same placeholder, so hydration matches.
2. `useEffect(() => setEntries(load()), [])` — the read happens after hydration, in an effect that never runs on the server. The date field seeds itself the same way, in `weight-form`'s own mount effect (§1), so no client-only value is computed during render.
3. `addEntry` is the sole writer. Writes are explicit there rather than in a `useEffect` on `entries` so there is exactly one write path and the load effect persists nothing at all. (The `null` sentinel would make an effect-write safe; two write paths is the thing worth avoiding.)
4. `load()` validates instead of trusting: try/catch `JSON.parse`, then `Array.isArray`, then per-entry checks — `typeof id === "string"`, finite `weightKg > 0`, `recordedAt` matching `/^\d{4}-\d{2}-\d{2}$/` — filtering out non-conforming entries. Valid-but-wrong-shape data (`{}`, an older schema, a hand-edited value) yields `[]` rather than throwing inside `.map`; §6 declines an error boundary, so a throw here would be a white screen.

Key: `weight-tracker:entries:v1`. "Today" is built from local getters
(`getFullYear`/`getMonth`/`getDate`, padded), never `toISOString()` — same UTC reason as §2.

Accepted cost, stated plainly: deferring the read to an effect means first paint
shows a dead (disabled) form and no chart, both of which then pop in. Next's guide
`node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`
sanctions a lazy `useState` initializer plus an inline script to remove that flash;
for a POC the flash is acceptable and the sentinel is simpler.

## 4. Chart library
**Recharts** 3.10.1 — `<LineChart>` in `<ResponsiveContainer>`, `"use client"`.
Declarative components with responsive sizing built in, so the chart is ~20 lines.
Trade-off: not a small dependency — Recharts pulls `@reduxjs/toolkit`,
`react-redux`, `immer`, `reselect`, `es-toolkit` and `victory-vendor` (the d3
bundle), ~7.4 MB unpacked, and declares a `react-is` peer this project does not
carry. Hand-rolled inline SVG ships nothing extra but means writing scales, axes
and ticks by hand. React 19 is a permitted peer. Not installed yet.

Axes are explicit, not defaulted:
- `<XAxis dataKey="recordedAt" />` — a category axis. Deliberate for a POC: it spaces dates evenly, so uneven gaps between entries are hidden.
- `<YAxis domain={['dataMin - 1', 'dataMax + 1']} />` — required. The numeric default anchors the domain at 0, rendering 79→81 kg as a flat line and defeating the reason the date field exists.

## 5. The >1 distinct date rule
One point per day: `addEntry` **upserts** — a new entry whose `recordedAt` equals
an existing entry's replaces it. Entry count therefore equals distinct-date count,
so the chart can never place two x-values on one date.
- **0** — form + one line of prompt copy. No chart, no empty axes.
- **1** — form, the value and its date, "add another date to see your trend". No chart: a one-point line graph is misleading.
- **2+ distinct dates** — form, chart, entries listed newest first via `[...entries].reverse()` — never `entries.reverse()`, which mutates React state in place and hands the chart reversed data.
- **`null`** — form rendered `disabled` with an empty date, no message. Identical on server and client.

Validation lives on the inputs: weight is `type="number" required min="0.1"
step="0.1"`; date is `type="date" required max={today}`, where `today` is the
effect-set string, `""` until mount. Submit re-checks both and returns early on a
non-finite, non-positive or out-of-range value — rejected silently, no error copy,
so `NaN` never reaches state.

## 6. Deliberately not doing
No backend, auth, database or cross-device sync. No lb/kg switching, no editing or
deleting entries, no more than one weight per calendar day, no goals or averages,
no export/import, no tests, no accessibility work beyond native form semantics,
no error boundary, no localStorage quota handling.
