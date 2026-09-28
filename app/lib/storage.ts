"use client";

import { useCallback, useEffect, useState } from "react";
import {
  compareByRecordedAt,
  DATE_PATTERN,
  STORAGE_KEY,
  type WeightEntries,
  type WeightEntry,
} from "./types";

/**
 * Validates one parsed value. Anything that fails is dropped rather than
 * trusted: the POC has no error boundary, so an older schema or a hand-edited
 * localStorage value throwing inside `.map` would be a white screen.
 */
function isWeightEntry(value: unknown): value is WeightEntry {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.weightKg === "number" &&
    Number.isFinite(candidate.weightKg) &&
    candidate.weightKg > 0 &&
    typeof candidate.recordedAt === "string" &&
    DATE_PATTERN.test(candidate.recordedAt)
  );
}

/**
 * Reads and sorts the stored entries. Only ever called from a mount effect —
 * never during render, because `localStorage` does not exist on the server and
 * reading it while rendering makes the first client render disagree with the
 * server HTML.
 */
function load(): WeightEntries {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWeightEntry).sort(compareByRecordedAt);
  } catch {
    // Unparseable JSON, or storage unavailable (private mode). Start empty.
    return [];
  }
}

function save(entries: WeightEntries): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded or storage blocked: drop the write, per the design note.
  }
}

export type UseWeightEntries = {
  /** `null` means "not yet read from storage" — the pre-hydration state. */
  entries: WeightEntries | null;
  addEntry: (weightKg: number, recordedAt: string) => void;
};

export function useWeightEntries(): UseWeightEntries {
  // `null` on the server AND on the first client render, so hydration matches.
  const [entries, setEntries] = useState<WeightEntries | null>(null);

  // This is the whole point of the `null` sentinel, and it is the one place the
  // POC knowingly argues with a lint rule. `react-hooks/set-state-in-effect`
  // wants the value known at first render; but `localStorage` does not exist on
  // the server, so reading it during render is precisely the hydration mismatch
  // the design note (§3) exists to avoid. Next's own guide
  // (01-app/02-guides/preventing-flash-before-hydration.md) offers the
  // alternative -- a lazy useState initializer plus an inline script -- and the
  // note deliberately declines it for a POC, accepting one extra render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(load());
  }, []);

  const addEntry = useCallback(
    (weightKg: number, recordedAt: string) => {
      const base = entries ?? [];
      // Upsert by date: one entry per calendar day, so the chart can never put
      // two x-values on a single date.
      const next = [
        ...base.filter((entry) => entry.recordedAt !== recordedAt),
        { id: crypto.randomUUID(), weightKg, recordedAt },
      ].sort(compareByRecordedAt);

      // The sole write path. Deliberately not a `useEffect` on `entries`.
      save(next);
      setEntries(next);
    },
    [entries],
  );

  return { entries, addEntry };
}
