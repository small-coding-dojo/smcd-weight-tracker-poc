// Shared vocabulary for the POC: the entry shape plus the constants and the one
// date helper that both the storage layer and the form need.

export type WeightEntry = {
  id: string; // crypto.randomUUID()
  weightKg: number; // kilograms, finite, > 0
  recordedAt: string; // LOCAL calendar date "YYYY-MM-DD", from <input type="date">
};

export type WeightEntries = WeightEntry[]; // ascending by recordedAt

export const STORAGE_KEY = "weight-tracker:entries:v1";

export const UNIT_LABEL = "kg";

/** `recordedAt` must look exactly like a date input's value. */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Today as a LOCAL calendar date, "YYYY-MM-DD".
 *
 * Built from local getters rather than `toISOString()` on purpose: that returns
 * the UTC date, so anyone west of Greenwich gets yesterday for part of the day.
 * The same reason `recordedAt` is never round-tripped through `Date`.
 */
export function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** `YYYY-MM-DD` strings order correctly as plain strings — no `Date` needed. */
export function compareByRecordedAt(a: WeightEntry, b: WeightEntry): number {
  if (a.recordedAt < b.recordedAt) return -1;
  if (a.recordedAt > b.recordedAt) return 1;
  return 0;
}
