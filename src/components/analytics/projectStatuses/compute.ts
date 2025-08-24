/**
 * Server-side: compute distribution of Project statuses.
 */
import prisma from "@/lib/prisma";
import type { ProjectStatusesSummary, ProjectStatusKey } from "./types";

const LABELS: Record<ProjectStatusKey, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
};

export async function computeProjectStatuses(): Promise<ProjectStatusesSummary> {
  const totalProjects = await prisma.project.count();

  const [draft, pending, approved] = await Promise.all([
    prisma.project.count({ where: { status: "DRAFT" } }),
    prisma.project.count({ where: { status: "PENDING" } }),
    prisma.project.count({ where: { status: "APPROVED" } }),
  ]);

  const entries: Array<{ key: ProjectStatusKey; count: number }> = [
    { key: "DRAFT", count: draft },
    { key: "PENDING", count: pending },
    { key: "APPROVED", count: approved },
  ];

  const pct = (n: number) => (totalProjects > 0 ? (n / totalProjects) * 100 : 0);

  return {
    totalProjects,
    statuses: entries.map(({ key, count }) => ({
      key,
      label: LABELS[key],
      count,
      percent: pct(count),
    })),
  };
}
