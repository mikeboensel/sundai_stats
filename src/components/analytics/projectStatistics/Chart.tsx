"use client";

/**
 * Project Statistics Charts
 * - Team size distribution (pie)
 * - Hack type distribution (pie)
 * - Tech tag count distribution (pie)
 * - Domain tag count distribution (pie)
 */
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { DistributionSlice, ProjectStatistics } from "./types";

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
];

function PercentTooltip() {
  return (
    <Tooltip
      formatter={(value: number | string, name: string, props: any) => {
        const p = (props?.payload as any)?.percent as number | undefined;
        const label = typeof value === "number" ? `${value.toLocaleString()} projects` : String(value);
        const pct = typeof p === "number" ? ` (${p.toFixed(2)}%)` : "";
        return [label + pct, name];
      }}
    />
  );
}

function PieBlock({ title, data }: { title: string; data: DistributionSlice[] }) {
  const chartData = data.map((s) => ({ name: s.name, value: s.count, percent: s.percent }));
  return (
    <div style={{ background: "#0b1020", borderRadius: 10, padding: 12 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#e6edf3" }}>{title}</h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <PercentTooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ProjectStatisticsChart({ data }: { data: ProjectStatistics }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Project Statistics</h2>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Total projects: {data.totalProjects.toLocaleString()}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <PieBlock title="Team size (members per project)" data={data.teamSize} />
        <PieBlock title="Hack Type" data={data.hackType} />
        <PieBlock title="# of Tech Tags" data={data.techTagCounts} />
        <PieBlock title="# of Domain Tags" data={data.domainTagCounts} />
      </div>
    </section>
  );
}
