"use client";

/**
 * Project Tags
 * - Word Clouds for Tech and Domain (font size proportional to frequency)
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ProjectTagsResult, TagFrequency } from "./types";

// Client-only d3 wordcloud
const ReactD3Cloud = dynamic(() => import("react-d3-cloud"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "#9ca3af" }}>Loading word cloud…</span>
    </div>
  ),
});

function WordCloudBoring({ data }: { data: TagFrequency[] }) {
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

  // Note: Only the custom chip cloud lives here. The D3 word cloud is separate.

  return (
    <div style={{ background: "#0b1020", borderRadius: 10, padding: 12 }}>
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

function D3WordCloud({ data }: { data: TagFrequency[] }) {
  const cloudData = useMemo(
    () =>
      (data ?? []).map((t) => ({
        text: t.name,
        value: Math.max(1, Number(t.count) || 1),
      })),
    [data]
  );

  const maxVal = useMemo(
    () => Math.max(1, ...cloudData.map((d) => d.value)),
    [cloudData]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 600, height: 360 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(w * 0.58); // balanced aspect to reduce dead area
        setSize({ width: w, height: h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fontSize = (w: { value: number }) => {
    const base = Math.log2(w.value + 1) / Math.log2(maxVal + 1);
    const t = Math.pow(base, 1.35); // amplify differences between high and low
    // Scale with available width for better fill; allow larger max for emphasis
    const maxFont = Math.max(56, Math.min(160, Math.floor(size.width * 0.18)));
    const minFont = Math.max(16, Math.floor(maxFont * 0.28));
    return Math.round(minFont + t * (maxFont - minFont));
  };
  const rotate = (_word?: { text: string }, i: number = 0) => {
    const angles = [-60, -30, 0, 30, 60];
    return angles[i % angles.length];
  };

  return (
    <div
      ref={containerRef}
      style={{ background: "#0b1020", borderRadius: 10, padding: 12 }}
    >
      <ReactD3Cloud
        data={cloudData}
        width={size.width}
        height={size.height}
        font="Inter, system-ui, sans-serif"
        fontSize={fontSize}
        rotate={rotate}
        padding={0}
        spiral="archimedean"
      />
    </div>
  );
}

export default function ProjectTagsChart({
  data,
}: {
  data: ProjectTagsResult;
}) {
  return (
    <section style={{ marginTop: 24 }}>
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>
        Tech Tags
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <div>
          <D3WordCloud data={data.tech} />
        </div>
        <div>
          <WordCloudBoring data={data.tech} />
        </div>
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>
        Domain Tags
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <div>
          <D3WordCloud data={data.domain} />
        </div>
        <div>
          <WordCloudBoring data={data.domain} />
        </div>
      </div>
    </section>
  );
}
