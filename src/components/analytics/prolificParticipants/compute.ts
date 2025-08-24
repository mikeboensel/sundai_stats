/**
 * Prolific Participants: top hackers by participation count (participants only, not leads)
 */
import prisma from "@/lib/prisma";
import type { ProlificParticipantsResult, ProlificParticipant, ParticipantCountBin } from "./types";

export async function computeProlificParticipants(limit = 20): Promise<ProlificParticipantsResult> {
  // Group by participant hackerId
  type ParticipantGroup = { hackerId: string; _count?: { _all?: number } };
  const grouped = (await prisma.projectToParticipant.groupBy({
    by: ["hackerId"],
    _count: { _all: true },
  })) as unknown as ParticipantGroup[];

  // Sort by count desc and take top N in application layer to avoid Prisma type friction
  grouped.sort((a, b) => (b._count?._all ?? 0) - (a._count?._all ?? 0));
  const topGrouped = grouped.slice(0, Math.max(0, limit));

  const hackerIds: string[] = topGrouped.map((g) => g.hackerId);
  const hackers = await prisma.hacker.findMany({
    where: { id: { in: hackerIds } },
    select: { id: true, name: true, username: true },
  });
  const hackerMap = new Map(hackers.map((h) => [h.id, h]));

  const top: ProlificParticipant[] = topGrouped.map((g) => {
    const h = hackerMap.get(g.hackerId);
    return {
      hackerId: g.hackerId,
      name: h?.name ?? "Unknown",
      username: h?.username ?? null,
      count: g._count?._all ?? 0,
    };
  });

  // Distribution: map participation count -> number of hackers with that count
  const distMap = new Map<number, number>();
  for (const g of grouped) {
    const c = g._count?._all ?? 0;
    if (c > 0) distMap.set(c, (distMap.get(c) ?? 0) + 1);
  }
  const distribution: ParticipantCountBin[] = Array.from(distMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([count, hackers]) => ({ count, hackers }));

  return { top, distribution };
}
