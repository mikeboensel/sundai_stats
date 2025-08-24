/**
 * Server-side: compute completeness of Approved projects across selected fields.
 */
import prisma from "@/lib/prisma";
import type { ProjectCompletenessPercents } from "./types";

export async function computeProjectCompleteness(): Promise<ProjectCompletenessPercents> {
  const totalApprovedProjects = await prisma.project.count({
    where: { status: "APPROVED" },
  });

  const [
    descriptionCount,
    githubUrlCount,
    demoUrlCount,
    blogUrlCount,
    thumbnailIdCount,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        status: "APPROVED",
        AND: [{ description: { not: null } }, { description: { not: "" } }],
      },
    }),
    prisma.project.count({
      where: {
        status: "APPROVED",
        AND: [{ githubUrl: { not: null } }, { githubUrl: { not: "" } }],
      },
    }),
    prisma.project.count({
      where: {
        status: "APPROVED",
        AND: [{ demoUrl: { not: null } }, { demoUrl: { not: "" } }],
      },
    }),
    prisma.project.count({
      where: {
        status: "APPROVED",
        AND: [{ blogUrl: { not: null } }, { blogUrl: { not: "" } }],
      },
    }),
    prisma.project.count({
      where: {
        status: "APPROVED",
        AND: [{ thumbnailId: { not: null } }, { thumbnailId: { not: "" } }],
      },
    }),
  ]);

  const pct = (n: number) =>
    totalApprovedProjects > 0 ? (n / totalApprovedProjects) * 100 : 0;

  return {
    totalApprovedProjects,
    fields: [
      {
        key: "description",
        label: "Description",
        percentComplete: pct(descriptionCount),
      },
      {
        key: "githubUrl",
        label: "GitHub URL",
        percentComplete: pct(githubUrlCount),
      },
      { key: "demoUrl", label: "Demo URL", percentComplete: pct(demoUrlCount) },
      { key: "blogUrl", label: "Blog URL", percentComplete: pct(blogUrlCount) },
      {
        key: "thumbnailId",
        label: "Thumbnail",
        percentComplete: pct(thumbnailIdCount),
      },
    ],
  };
}
