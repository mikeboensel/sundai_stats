# Caching and Analytics Architecture (Design Proposal)

This document proposes a durable, local caching approach and modular analytics structure for long-running, read-only SQL/Prisma computations in this Next.js app. No external services are required.

## High-Level Summary

- **Goal**: Persist results of expensive analytics queries locally to avoid recomputation while keeping strict type safety, explicit data models, and robust error handling.
- **Two cache options** (no external infra):
  - **SQLite file cache (recommended)**: ACID, indexed, concurrent-safe; one small dependency.
  - **File-based JSON cache**: zero dependencies, atomic writes, simpler but less robust.
- **Watermark-driven invalidation**: Use read-only data watermarks (e.g., maximum `updatedAt`) to detect upstream changes and invalidate cached analytics precisely.
- **Structure**: Modular analytics under `src/lib/analytics/` with a registry, a runner, and per-metric modules. Optional API route `src/app/api/analytics/[metric]/route.ts` to expose metrics.

---

## Detailed Design

### 1) Requirements and Constraints

- **Read-only DB user**: Cannot write to Postgres; cache must live locally in the app environment.
- **Long-running analytics**: Some queries scan and aggregate large tables; results should be reused until data changes.
- **No external dependencies**: Prefer local durability (filesystem). SQLite acceptable if adding a single npm dep.
- **Type safety and logging**: Strong typing for inputs/outputs; proactive logging and error handling.
- **Indexes in Postgres**: Ensure relevant columns used in WHERE/ORDER BY are indexed (managed via migrations separately).

### 2) Caching Options

#### Option A: SQLite (Recommended)

- **Why**: Transactions, indexing, and better concurrency behavior than ad-hoc files.
- **Library**: `better-sqlite3` (fast, embedded; synchronous). Alternative async libraries exist but are slower.
- **Location**: `data/cache.sqlite` (gitignored).
- **Schema (example)**:
  - `cache_entries(key TEXT PRIMARY KEY, value TEXT, created_at INTEGER, expires_at INTEGER, version TEXT, source_watermark TEXT)`
  - Index `expires_at` (for cleanup) and consider `version` if querying by version.
- **Pros**: Reliability, queryability, safe concurrency.
- **Cons**: One dependency; synchronous calls can block under heavy load.

#### Option B: File-based JSON Cache (Zero Deps)

- **Layout**: Directory `./.cache/` (gitignored). One file per cache key: `.cache/<key>.json`.
- **Atomic writes**: Write to a temp file then `rename` to final name.
- **Payload**: `{ data, expiresAt, watermark }` with validation on read.
- **Pros**: No dependencies, very simple, portable.
- **Cons**: No indexing, whole-file reads/writes, edge cases with concurrent writers, harder maintenance at scale.

### 3) Watermark-Based Invalidation

- **Definition**: A read-only fingerprint of the underlying data relevant to a metric. If current watermark equals the cached watermark, the cache is valid; otherwise, recompute.
- **Typical approach**: `MAX(updatedAt)` from relevant tables.
  - Example (single table): `MAX(Project.updatedAt)`.
  - Example (multi-table): `MAX(Project.updatedAt)` and `MAX(ProjectToParticipant.updatedAt)`, concatenated in a stable string like `"<projMaxISO>|<ptpMaxISO>"`.
  - Example (date-filtered): Apply the same WHERE conditions used by the metric to the watermark aggregates.
- **Why it works**: It’s fast, accurate enough for analytics, and compatible with a read-only DB user.
- **Fallbacks**: If `updatedAt` is unreliable, consider counts (`COUNT(*)`), max IDs, or lightweight checksums (heavier). Always add a TTL backstop.

### 4) Cache Keys and TTL

- **Cache key**: Stable hash of `(metric name, normalized params, schemaVersion)`.
  - Include a `schemaVersion` so a format change invalidates all prior entries.
- **TTL**: Set a conservative maximum age (e.g., 15–60 minutes) as a backstop even with watermarks.
- **On read**: If entry is expired or watermark mismatches, treat as a miss.
- **On write**: Store `data`, `expiresAt = now + ttlMs`, and `watermark`.

### 5) Next.js Integration

- **Location**: `src/lib/analytics/` for core logic. Optional API: `src/app/api/analytics/[metric]/route.ts`.
- **Flow**:
  1. Compute `cacheKey(params)`.
  2. Fetch current `watermark` via read-only Prisma aggregates.
  3. Check cache by `cacheKey`.
     - If cache hit and `cached.watermark === currentWatermark`, return cached data.
     - Else, run metric computation, store new cache entry, return fresh data.
  4. Log hits, misses, and errors.
- **Server components**: Call the runner directly to render analytics in pages. API route provides a JSON interface for other clients.

### 6) Project Structure

```
src/
  lib/
    analytics/
      types.ts                # Types for metrics, params, results
      cache/
        index.ts              # ICache interface + simple NoopCache
        fileCache.ts          # Atomic JSON file cache implementation
      prismaHelpers.ts        # Reusable small helpers (e.g., watermark queries)
      metrics/
        averageTeamSize.ts    # Metric module (params, ttl, cacheKey, run, getWatermark)
        projectsWithValidGithub.ts
        projectsOverTime.ts
      registry.ts             # Map from MetricKey to Metric module
      runner.ts               # Orchestrates watermark+cache+metric
  app/
    api/
      analytics/[metric]/route.ts   # Optional API endpoint
```

### 7) Types and Contracts

- **Metric**: `Metric<P, R>` defines `key`, `cacheKey(P)`, `ttlMs`, optional `getWatermark()`, and `run()`.
- **Result**: `MetricResult<T>` wraps `data` with `metric`, `params`, `generatedAt`, and optional `sourceWatermark`.
- **Cache interface**: `ICache` provides `get(key)` and `set(key, value, { ttlMs, watermark })`.
- **Error handling**: Always catch, log, and return structured errors at the route boundary. Validate cached payloads before using them.

### 8) Example Metrics (Conceptual)

- **Average Team Size**
  - Inputs: optional `from`, `to` (ISO strings) applied to `Project.createdAt`.
  - Query: fetch projects and `participants.length`, compute average.
  - Watermark: max of `Project.updatedAt` and `ProjectToParticipant.updatedAt`, filtered by range if provided.
  - TTL: ~15 minutes.

- **Projects with Valid GitHub Links**
  - Inputs: none.
  - Query: select projects with non-null `githubUrl`, filter by a strict GitHub repo regex.
  - Watermark: max of `Project.updatedAt`.
  - TTL: ~1 hour.

- **Projects Created Over Time**
  - Inputs: optional `from`, `to` (ISO strings).
  - Query: fetch `Project.createdAt` in range, bucket by day in UTC.
  - Watermark: max `Project.updatedAt` in the same range.
  - TTL: ~1 hour.

### 9) Operational Considerations and Trade-offs

- **Local durability**: Works well on a single host. On serverless/ephemeral FS or horizontally scaled infra, you’d need a shared/external cache (out of scope by constraint).
- **Performance**: SQLite is safer for concurrency and large caches. File cache is fine for light to moderate usage.
- **Indexes**: Ensure `Project.createdAt`, `Project.updatedAt`, and `ProjectToParticipant.updatedAt` are indexed. Add others as query patterns emerge.
- **Security**: `.cache/` and `data/` should be `.gitignore`d. Do not expose cache files publicly.
- **Time zones**: Use UTC consistently. Store timestamps in UTC and convert in the UI.

### 10) Migration and Adoption Plan (Non-Implementing)

1. Start with file cache to validate keys, TTLs, and watermarks.
2. If contention or complexity increases, switch the `ICache` implementation to SQLite without changing metric code.
3. Grow the metric registry gradually; keep each metric focused and documented.

---

## Appendix: Watermark Examples (Pseudo)

- Single table:
  - `SELECT MAX("updatedAt") AS max FROM "Project";` → `max?.toISOString()`
- Multi-table:
  - `SELECT MAX("updatedAt") AS max FROM "ProjectToParticipant";` and same for `Project`. Concatenate `"projMax|ptpMax"`.
- Date-filtered:
  - Same aggregates with `WHERE createdAt >= :from AND createdAt <= :to`.

> Note: These rely on proper indexes for performance. Ensure the relevant columns are indexed to avoid full scans.
