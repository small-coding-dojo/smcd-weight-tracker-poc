"use client";

import { useWeightEntries } from "../lib/storage";
import { UNIT_LABEL, type WeightEntries } from "../lib/types";
import WeightChart from "./weight-chart";
import WeightForm from "./weight-form";

export default function WeightTracker() {
  const { entries, addEntry } = useWeightEntries();

  // `null` only until the mount effect has read storage.
  const loaded = entries !== null;
  const list: WeightEntries = entries ?? [];

  return (
    <section className="flex flex-col gap-6">
      <WeightForm onAdd={addEntry} disabled={!loaded} />
      {loaded ? <EntriesView entries={list} /> : null}
    </section>
  );
}

function EntriesView({ entries }: { entries: WeightEntries }) {
  // Entries are upserted by date, so the count IS the distinct-date count.
  if (entries.length === 0) {
    return (
      <p className="text-sm opacity-70">
        No weights yet. Save your first one above to get started.
      </p>
    );
  }

  if (entries.length === 1) {
    const only = entries[0];
    return (
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-semibold">
          {only.weightKg} {UNIT_LABEL}
          <span className="ml-2 text-sm font-normal opacity-70">
            on {only.recordedAt}
          </span>
        </p>
        <p className="text-sm opacity-70">
          Add another date to see your trend.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WeightChart entries={entries} />
      <EntryList entries={entries} />
    </div>
  );
}

function EntryList({ entries }: { entries: WeightEntries }) {
  // Copy before reversing: `entries.reverse()` would mutate the state array in
  // place and hand the chart its data backwards.
  const newestFirst = [...entries].reverse();
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {newestFirst.map((entry) => (
        <li
          key={entry.id}
          className="flex justify-between border-b border-black/10 py-1 dark:border-white/15"
        >
          <span className="opacity-70">{entry.recordedAt}</span>
          <span className="font-medium">
            {entry.weightKg} {UNIT_LABEL}
          </span>
        </li>
      ))}
    </ul>
  );
}
