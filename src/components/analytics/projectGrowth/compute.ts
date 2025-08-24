/**
 * Server-side: compute monthly cumulative Project growth time series.
 */
import prisma from "@/lib/prisma";
import type { ProjectGrowthPoint } from "./types";

export async function computeProjectGrowth(): Promise<ProjectGrowthPoint[]> {
  const projectCreated = await prisma.project.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const monthKey = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    return `${y}-${String(m).padStart(2, "0")}`; // YYYY-MM
  };

  const monthlyCounts = new Map<string, number>();
  for (const r of projectCreated) {
    const key = monthKey(new Date(r.createdAt));
    monthlyCounts.set(key, (monthlyCounts.get(key) ?? 0) + 1);
  }

  const months = Array.from(monthlyCounts.keys()).sort();
  const growth: ProjectGrowthPoint[] = [];
  let running = 0;
  for (const key of months) {
    running += monthlyCounts.get(key) ?? 0;
    growth.push({ date: key, total: running });
  }
  return growth;
}
