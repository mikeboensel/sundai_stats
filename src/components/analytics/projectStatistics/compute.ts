/**
 * Server-side: compute project statistics distributions.
 */
import prisma from "@/lib/prisma";
import type { DistributionSlice, ProjectStatistics } from "./types";

function toDistribution(
  map: Map<string, number>,
  total: number
): DistributionSlice[] {
  const entries = Array.from(map.entries());
  // Sort numerically when possible, otherwise lexicographically
  entries.sort((a, b) => {
    const an = Number(a[0]);
    const bn = Number(b[0]);
    const aIsNum = !Number.isNaN(an);
    const bIsNum = !Number.isNaN(bn);
    if (aIsNum && bIsNum) return an - bn;
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    return a[0].localeCompare(b[0]);
  });
  return entries.map(([name, count]) => ({
    name,
    count,
    percent: total > 0 ? (count / total) * 100 : 0,
  }));
}

export async function computeProjectStatistics(): Promise<ProjectStatistics> {
  const totalProjects = await prisma.project.count();

  // Team size and tag counts via relation _count to avoid fetching entire arrays
  const projectsCounts = await prisma.project.findMany({
    select: {
      _count: {
        select: {
          participants: true,
          techTags: true,
          domainTags: true,
        },
      },
    },
  });

  const teamSizeMap = new Map<string, number>();
  // const techTagCountMap = new Map<string, number>();
  // const domainTagCountMap = new Map<string, number>();

  for (const p of projectsCounts) {
    const size = 1 + p._count.participants; // launch lead + participants
    const sizeKey = String(size);
    teamSizeMap.set(sizeKey, (teamSizeMap.get(sizeKey) ?? 0) + 1);

    // const techC = p._count.techTags;
    // const techKey = String(techC);
    // techTagCountMap.set(techKey, (techTagCountMap.get(techKey) ?? 0) + 1);

    // const domainC = p._count.domainTags;
    // const domainKey = String(domainC);
    // domainTagCountMap.set(domainKey, (domainTagCountMap.get(domainKey) ?? 0) + 1);
  }

  // Hack type distribution
  const [regular, research] = await Promise.all([
    prisma.project.count({ where: { hack_type: "REGULAR" } }),
    prisma.project.count({ where: { hack_type: "RESEARCH" } }),
  ]);
  const hackTypeMap = new Map<string, number>([
    ["Regular", regular],
    ["Research", research],
  ]);
  const totalHackTyped = regular + research;

  return {
    totalProjects,
    teamSize: toDistribution(teamSizeMap, totalProjects),
    hackType: toDistribution(hackTypeMap, totalHackTyped),
    // techTagCounts: toDistribution(techTagCountMap, totalProjects),
    // domainTagCounts: toDistribution(domainTagCountMap, totalProjects),
  };
}
