"use client";

/**
 * Project Statuses Chart (Pie)
 */
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { ProjectStatusesSummary } from "./types";

const COLORS = ["#f59e0b", "#6366f1", "#16a34a"]; // draft=amber, pending=indigo, approved=green

export default function ProjectStatusesChart({ data }: { data: ProjectStatusesSummary }) {
  const chartData = data.statuses.map((s) => ({ name: s.label, value: s.count, percent: s.percent }));

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Project Statuses</h2>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Total projects: {data.totalProjects.toLocaleString()}
      </p>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | string, name: string, item: unknown) => {
                let p: number | undefined;
                if (typeof item === "object" && item !== null && "payload" in (item as Record<string, unknown>)) {
                  const payload = (item as Record<string, unknown>).payload;
                  if (typeof payload === "object" && payload !== null && "percent" in (payload as Record<string, unknown>)) {
                    const maybe = (payload as Record<string, unknown>).percent;
                    if (typeof maybe === "number") p = maybe;
                  }
                }
                const label = typeof value === "number" ? `${value.toLocaleString()} projects` : String(value);
                const pct = typeof p === "number" ? ` (${p.toFixed(2)}%)` : "";
                return [label + pct, name];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

