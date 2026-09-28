"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DATE_PATTERN, todayLocal, UNIT_LABEL } from "../lib/types";

type WeightFormProps = {
  onAdd: (weightKg: number, recordedAt: string) => void;
  disabled: boolean;
};

export default function WeightForm({ onAdd, disabled }: WeightFormProps) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState("");
  // `""` until mount, so the server and the first client render agree; the real
  // value arrives in the effect below.
  const [today, setToday] = useState("");

  // Same knowing argument with `react-hooks/set-state-in-effect` as in
  // app/lib/storage.ts: "today" is a client-only value, so computing it during
  // render would put the SERVER's date in the HTML -- wrong across timezones and
  // a hydration mismatch. The effect is the point, not an oversight.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const value = todayLocal();
    setToday(value);
    setDate(value);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    // Re-check what the input attributes already constrain, so a bad value can
    // never reach state. Rejected silently — no error copy in this POC.
    const weightKg = Number.parseFloat(weight);
    if (!Number.isFinite(weightKg) || weightKg <= 0) return;
    if (!DATE_PATTERN.test(date)) return;
    if (today !== "" && date > today) return;

    onAdd(weightKg, date);
    setWeight("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Weight ({UNIT_LABEL})</span>
        <input
          type="number"
          required
          min="0.1"
          step="0.1"
          inputMode="decimal"
          value={weight}
          disabled={disabled}
          onChange={(event) => setWeight(event.target.value)}
          placeholder="80.0"
          className="w-32 rounded border border-black/20 bg-transparent px-2 py-1.5 disabled:opacity-50 dark:border-white/25"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Date</span>
        <input
          type="date"
          required
          max={today}
          value={date}
          disabled={disabled}
          onChange={(event) => setDate(event.target.value)}
          className="rounded border border-black/20 bg-transparent px-2 py-1.5 disabled:opacity-50 dark:border-white/25"
        />
      </label>

      <button
        type="submit"
        disabled={disabled}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Save weight
      </button>
    </form>
  );
}
