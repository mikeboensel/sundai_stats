"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ProlificParticipantsResult } from "./types";

function truncate(label: string, n = 14) {
  if (!label) return "";
  return label.length > n ? label.slice(0, n - 1) + "…" : label;
}

export default function ProlificParticipantsChart({
  data,
}: {
  data: ProlificParticipantsResult;
}) {
  // Histogram series: X = project count, Y = # hackers
  const series = data.distribution.map((b) => ({
    count: b.count,
    hackers: b.hackers,
  }));

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        Most Prolific Participants
      </h2>
      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer>
          <BarChart
            data={series}
            margin={{ top: 10, right: 20, bottom: 24, left: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="count"
              tick={{ fill: "#9ca3af" }}
              stroke="#4b5563"
              label={{
                value: "# Projects Participated",
                position: "insideBottomRight",
                offset: -5,
                fill: "#9ca3af",
              }}
            />
            <YAxis
              domain={[0, (dataMax: number) => Math.max(dataMax + 1, 5)]}
              tick={{ fill: "#9ca3af" }}
              stroke="#4b5563"
              allowDecimals={false}
              label={{
                value: "# Hackers",
                angle: -90,
                position: "insideLeft",
                fill: "#9ca3af",
              }}
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
                "# Hackers",
              ]}
            />
            <Bar dataKey="hackers" name="# Hackers" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Top 20 Leaderboard
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ textAlign: "left", borderBottom: "1px solid #1f2937" }}
              >
                <th style={{ padding: "8px 6px" }}>#</th>
                <th style={{ padding: "8px 6px" }}>Name</th>
                <th style={{ padding: "8px 6px" }}>Username</th>
                <th style={{ padding: "8px 6px" }}>Projects</th>
              </tr>
            </thead>
            <tbody>
              {data.top.map((p, i) => (
                <tr
                  key={p.hackerId}
                  style={{ borderBottom: "1px solid #111827" }}
                >
                  <td style={{ padding: "8px 6px" }}>{i + 1}</td>
                  <td style={{ padding: "8px 6px" }}>{p.name}</td>
                  <td style={{ padding: "8px 6px", color: "#9ca3af" }}>
                    {p.username ?? "—"}
                  </td>
                  <td style={{ padding: "8px 6px", fontWeight: 600 }}>
                    {p.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
