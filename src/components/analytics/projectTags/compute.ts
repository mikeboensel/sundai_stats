/**
 * Compute project tag frequencies for Tech and Domain tags.
 */
import prisma from "@/lib/prisma";
import type { ProjectTagsResult, TagFrequency } from "./types";

function toFrequencies<T extends { name: string; _count: { projects: number } }>(rows: T[]): TagFrequency[] {
  return rows
    .map((r) => ({ name: r.name, count: r._count?.projects ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}

export async function computeProjectTags(): Promise<ProjectTagsResult> {
  const [techRows, domainRows] = await Promise.all([
    prisma.techTag.findMany({
      select: { name: true, _count: { select: { projects: true } } },
    }),
    prisma.domainTag.findMany({
      select: { name: true, _count: { select: { projects: true } } },
    }),
  ]);

  const tech = toFrequencies(techRows);
  const domain = toFrequencies(domainRows);

  return { tech, domain };
}
