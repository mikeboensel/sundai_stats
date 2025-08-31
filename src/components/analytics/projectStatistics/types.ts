export type DistributionSlice = {
  name: string; // label for the bucket
  count: number;
  percent: number; // 0..100
};

export type ProjectStatistics = {
  totalProjects: number;
  teamSize: DistributionSlice[]; // number of hackers per project (launch lead + participants)
  hackType: DistributionSlice[]; // REGULAR vs RESEARCH
  // techTagCounts: DistributionSlice[]; // number of tech tags on a project
  // domainTagCounts: DistributionSlice[]; // number of domain tags on a project
};
