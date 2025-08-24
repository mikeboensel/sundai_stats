export type ProlificLead = {
  hackerId: string;
  name: string;
  username?: string | null;
  count: number;
};

export type LeadCountBin = {
  count: number; // number of projects led
  hackers: number; // number of hackers with this count
};

export type ProlificLeadsResult = {
  top: ProlificLead[]; // sorted desc, length <= limit (default 20)
  distribution: LeadCountBin[]; // histogram from 1..max
};
