/**
 * Prolific Leads: top hackers by lead count (launchLead only, not participants)
 */
import prisma from "@/lib/prisma";
import type { ProlificLeadsResult, ProlificLead } from "./types";

export async function computeProlificLeads(limit = 20): Promise<ProlificLeadsResult> {
  // Group by Project.launchLeadId
  type LeadGroup = { launchLeadId: string | null; _count?: { _all?: number } };
  const grouped = (await prisma.project.groupBy({
    by: ["launchLeadId"],
    _count: { _all: true },
  })) as unknown as LeadGroup[];

  grouped.sort((a, b) => (b._count?._all ?? 0) - (a._count?._all ?? 0));
  const topGrouped = grouped.slice(0, Math.max(0, limit));

  const topWithLeadIds = topGrouped.filter(
    (g): g is LeadGroup & { launchLeadId: string } => typeof g.launchLeadId === "string"
  );

  const hackerIds = topWithLeadIds
    .map((g) => g.launchLeadId)
    .filter((id): id is string => Boolean(id));
  type HackerRow = { id: string; name: string | null; username: string | null };
  const hackers: HackerRow[] = await prisma.hacker.findMany({
    where: { id: { in: hackerIds } },
    select: { id: true, name: true, username: true },
  });
  const hackerMap = new Map<string, HackerRow>(
    hackers.map((h: HackerRow) => [h.id, h])
  );

  const top: ProlificLead[] = topWithLeadIds.map((g) => {
    const h = hackerMap.get(g.launchLeadId);
    return {
      hackerId: g.launchLeadId,
      name: h?.name ?? "Unknown",
      username: h?.username ?? null,
      count: g._count?._all ?? 0,
    };
  });

  // Distribution: map lead count -> number of hackers with that count
  const distMap = new Map<number, number>();
  for (const g of grouped) {
    const c = g._count?._all ?? 0;
    if (c > 0) distMap.set(c, (distMap.get(c) ?? 0) + 1);
  }
  const distribution = Array.from(distMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([count, hackers]) => ({ count, hackers }));

  return { top, distribution };
}
