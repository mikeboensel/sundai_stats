/**
 * Server-side: compute Hacker account completeness percentages.
 */
import prisma from "@/lib/prisma";
import type { HackerCompletenessPercents } from "./types";

export async function computeHackerCompleteness(): Promise<HackerCompletenessPercents> {
  const totalHackers = await prisma.hacker.count();

  const [
    bioCount,
    githubUrlCount,
    discordNameCount,
    twitterUrlCount,
    linkedinUrlCount,
    websiteUrlCount,
    emailCount,
    phoneNumberCount,
  ] = await Promise.all([
    prisma.hacker.count({
      where: { AND: [{ bio: { not: null } }, { bio: { not: "" } }] },
    }),
    prisma.hacker.count({
      where: {
        AND: [{ githubUrl: { not: null } }, { githubUrl: { not: "" } }],
      },
    }),
    prisma.hacker.count({
      where: {
        AND: [{ discordName: { not: null } }, { discordName: { not: "" } }],
      },
    }),
    prisma.hacker.count({
      where: {
        AND: [{ twitterUrl: { not: null } }, { twitterUrl: { not: "" } }],
      },
    }),
    prisma.hacker.count({
      where: {
        AND: [{ linkedinUrl: { not: null } }, { linkedinUrl: { not: "" } }],
      },
    }),
    prisma.hacker.count({
      where: {
        AND: [{ websiteUrl: { not: null } }, { websiteUrl: { not: "" } }],
      },
    }),
    prisma.hacker.count({
      where: { AND: [{ email: { not: null } }, { email: { not: "" } }] },
    }),
    prisma.hacker.count({
      where: {
        AND: [{ phoneNumber: { not: null } }, { phoneNumber: { not: "" } }],
      },
    }),
  ]);

  const pct = (n: number) => (totalHackers > 0 ? (n / totalHackers) * 100 : 0);

  return {
    totalHackers,
    fields: [
      { key: "bio", label: "Bio", percentComplete: pct(bioCount) },
      {
        key: "githubUrl",
        label: "GitHub URL",
        percentComplete: pct(githubUrlCount),
      },
      {
        key: "discordName",
        label: "Discord Name",
        percentComplete: pct(discordNameCount),
      },
      {
        key: "twitterUrl",
        label: "Twitter URL",
        percentComplete: pct(twitterUrlCount),
      },
      {
        key: "linkedinUrl",
        label: "LinkedIn URL",
        percentComplete: pct(linkedinUrlCount),
      },
      {
        key: "websiteUrl",
        label: "Website URL",
        percentComplete: pct(websiteUrlCount),
      },
      { key: "email", label: "Email", percentComplete: pct(emailCount) },
      {
        key: "phoneNumber",
        label: "Phone Number",
        percentComplete: pct(phoneNumberCount),
      },
    ],
  };
}
