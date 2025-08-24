export type ProjectStatusKey = "DRAFT" | "PENDING" | "APPROVED";

export type ProjectStatusesSummary = {
  totalProjects: number;
  statuses: Array<{
    key: ProjectStatusKey;
    label: string;
    count: number;
    percent: number; // 0..100
  }>;
};
