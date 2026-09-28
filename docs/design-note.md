# Weight Tracker POC — Design Note
Next.js 16.3.6, React 19.2, TypeScript, Tailwind v4, App Router, no `src/`.
Tailwind kept (scaffold default): presentable page, no CSS files; cost is
utility noise in the JSX.

## 1. Routing / structure
One route, `/`. No routing between views, no route handlers, no API.
- `app/page.tsx` — server component. Static shell + `<WeightTracker />`.
- `app/components/weight-tracker.tsx` — `"use client"`. Owns all entry state, picks which view to render.
- `app/components/weight-form.tsx` — `"use client"`. Controlled input, calls `onAdd(weightKg: number)`. No entry state.
- `app/components/weight-chart.tsx` — `"use client"`. Takes `entries` as a prop.
- `app/lib/types.ts` + `app/lib/storage.ts` — types, localStorage layer.
- `app/layout.tsx` — untouched scaffold.

## 2. State shape
```ts
export type WeightEntry = {
  id: string;          // crypto.randomUUID()
  weightKg: number;    // ALWAYS kilograms, finite, > 0
  recordedAt: string;  // ISO 8601 UTC, new Date().toISOString()
};
export type WeightEntries = WeightEntry[];  // ascending by recordedAt
```
Kilograms only, label hard-coded "kg", no conversion. Timestamps are ISO strings
not `Date`s, so the array round-trips through JSON with no revival step; parse to
`Date` only at the chart axis. Client state is `WeightEntries | null`, where
`null` means "not yet read from storage" — that distinction makes section 3 work.

## 3. Persistence without a hydration mismatch
`localStorage` does not exist on the server, and reading it during render (even
behind `typeof window`) makes the first client render differ from the server
HTML — a hydration mismatch. So: **never read storage during render.**
`useWeightEntries()` in `app/lib/storage.ts`:
1. `useState<WeightEntries | null>(null)` — server and first client render both see `null` and emit the same placeholder, so hydration matches.
2. `useEffect(() => setEntries(load()), [])` — read happens after hydration, in an effect that never runs on the server.
3. Writes are explicit inside `addEntry`, *not* a `useEffect` on `entries` — an effect-on-change fires on mount and could persist empty state over real data.
4. `load()` try/catches `JSON.parse`, returns `[]` on corrupt data.
Key: `weight-tracker:entries:v1`.

## 4. Chart library
**Recharts** — `<LineChart>` in `<ResponsiveContainer>`, in a `"use client"`
component. Declarative components with responsive sizing built in, so the chart
is ~20 lines. Trade-off: heavy (Recharts + its d3 subpackages, >100 kB gzipped)
for one line; hand-rolled inline SVG ships nothing extra but means writing
scales, axes and ticks by hand. Not installed — Phase 1 added no dependencies.

## 5. The >1 data point rule
- **0** — form + one line of prompt copy. No chart, no empty axes.
- **1** — form, the value and its date, "add one more to see your trend". No chart: a one-point line graph is misleading.
- **2+** — form, chart, entries listed newest first.
- **`null`** — form disabled, no message. Identical on server and client.

## 6. Deliberately not doing
No backend, auth, database or cross-device sync. No lb/kg switching, no editing
or deleting entries, no date backfill (entries are stamped "now"), no goals or
averages, no export/import, no tests, no accessibility work beyond native form
semantics, no error boundary, no localStorage quota handling.
