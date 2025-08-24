export type HackerCompletenessPercents = {
  totalHackers: number;
  fields: Array<{
    key:
      | "bio"
      | "githubUrl"
      | "discordName"
      | "twitterUrl"
      | "linkedinUrl"
      | "websiteUrl"
      | "email"
      | "phoneNumber";
    label: string;
    percentComplete: number; // 0..100
  }>;
};
