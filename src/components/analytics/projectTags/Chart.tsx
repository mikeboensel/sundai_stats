"use client";

/**
 * Project Tags
 * - Word Clouds for Tech and Domain (font size proportional to frequency)
 */
import React from "react";
import type { ProjectTagsResult, TagFrequency } from "./types";


function WordCloud({ title, data }: { title: string; data: TagFrequency[] }) {
  // Determine font size range
  const counts = data.map((d) => d.count);
  const min = Math.min(...counts, 1);
  const max = Math.max(...counts, 1);
  const scale = (c: number) => {
    if (max === min) return 16; // uniform
    // Scale to 12..36 px
    const t = (c - min) / (max - min);
    return Math.round(12 + t * (36 - 12));
  };

  return (
    <div style={{ background: "#0b1020", borderRadius: 10, padding: 12 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#e6edf3" }}>{title}</h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        {data.map((t) => (
          <span
            key={t.name}
            title={`${t.name}: ${t.count}`}
            style={{
              fontSize: scale(t.count),
              color: "#cbd5e1",
              background: "#111827",
              border: "1px solid #1f2937",
              padding: "2px 6px",
              borderRadius: 6,
            }}
          >
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProjectTagsChart({ data }: { data: ProjectTagsResult }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Project Tags</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
        <WordCloud title="Tech Tags Word Cloud" data={data.tech} />
        <WordCloud title="Domain Tags Word Cloud" data={data.domain} />
      </div>
    </section>
  );
}
