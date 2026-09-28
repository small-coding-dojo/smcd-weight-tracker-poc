"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { UNIT_LABEL, type WeightEntries } from "../lib/types";

// The wrapper's explicit height matters: ResponsiveContainer measures its
// parent, and a parent with no height renders a silent zero-height chart.
export default function WeightChart({ entries }: { entries: WeightEntries }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={entries} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
          {/* Category axis: `recordedAt` is already a display-ready string. It
              spaces dates evenly, so uneven gaps between entries are hidden. */}
          <XAxis dataKey="recordedAt" tick={{ fontSize: 12 }} />
          {/* Required. The numeric default anchors the domain at 0, which would
              render a 79 -> 81 kg change as a flat line. */}
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
            tick={{ fontSize: 12 }}
            width={48}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="weightKg"
            name="Weight"
            unit={` ${UNIT_LABEL}`}
            stroke="#2563eb"
            strokeWidth={2}
            dot
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
