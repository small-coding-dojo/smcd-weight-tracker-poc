"use client";

// THROWAWAY spike (Phase 2a): proves Recharts renders under Next 16 + Turbopack.
// Delete once the real chart component exists. Not wired into app/page.tsx.

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SpikeEntry = {
  id: string;
  weightKg: number;
  recordedAt: string; // local calendar date, YYYY-MM-DD
};

// ~2 kg spread on purpose: with Recharts' default domain (anchored at 0) this
// line looks flat, so it proves the domain override in §4 of the design note.
const DATA: SpikeEntry[] = [
  { id: "a", weightKg: 79.4, recordedAt: "2026-09-21" },
  { id: "b", weightKg: 80.1, recordedAt: "2026-09-23" },
  { id: "c", weightKg: 79.8, recordedAt: "2026-09-26" },
  { id: "d", weightKg: 81.2, recordedAt: "2026-09-28" },
];

export default function ChartSpike() {
  return (
    <div style={{ width: "100%", height: 320 }} data-testid="chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={DATA} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="recordedAt" />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip />
          <Line type="monotone" dataKey="weightKg" stroke="#2563eb" dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
