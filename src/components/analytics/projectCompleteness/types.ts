export type ProjectCompletenessPercents = {
  totalApprovedProjects: number;
  fields: Array<{
    key: "description" | "githubUrl" | "demoUrl" | "blogUrl" | "thumbnailId";
    label: string;
    percentComplete: number; // 0..100
  }>;
};
