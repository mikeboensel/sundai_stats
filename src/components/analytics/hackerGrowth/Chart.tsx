"use client";

/**
 * HackerGrowth Chart
 */
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { HackerGrowthPoint } from "./types";

export default function HackerGrowthChart({
  data,
  title = "Hackers Over Time",
}: {
  data: HackerGrowthPoint[];
  title?: string;
}) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: "#9ca3af" }} stroke="#4b5563" />
            <YAxis
              tick={{ fill: "#9ca3af" }}
              stroke="#4b5563"
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #374151",
                color: "#e5e7eb",
              }}
              labelStyle={{ color: "#e5e7eb" }}
              formatter={(value: number | string) => [
                String(value),
                "Total Hackers",
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              name="Total Hackers"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
