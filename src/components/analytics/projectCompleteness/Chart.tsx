"use client";

/**
 * Project Completeness Charts (Pie set)
 * Shows % of Approved projects that have certain optional fields present.
 */
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { ProjectCompletenessPercents } from "./types";

const COLORS = ["#16a34a", "#e5e7eb"]; // complete (green), incomplete (gray)

function formatPercent(p: number) {
  return `${p.toFixed(2)}%`;
}

export default function ProjectCompletenessChart({ data }: { data: ProjectCompletenessPercents }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Project Completeness (Approved)</h2>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Population size: {data.totalApprovedProjects.toLocaleString()} approved projects
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {data.fields.map((f) => {
          const complete = Math.max(0, Math.min(100, f.percentComplete));
          const chartData = [
            { name: "Complete", value: complete },
            { name: "Incomplete", value: 100 - complete },
          ];

          return (
            <div key={f.key} style={{ background: "#0b1020", borderRadius: 10, padding: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#e6edf3" }}>{f.label}</h3>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string) =>
                        typeof value === "number" ? `${value.toFixed(2)}%` : `${value}%`
                      }
                    />
                    <Legend verticalAlign="bottom" height={24} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p style={{ marginTop: 8, color: "#9ca3af" }}>{formatPercent(complete)} complete</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
