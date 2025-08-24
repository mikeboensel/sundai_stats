export type TagFrequency = {
  name: string;
  count: number;
};

export type ProjectTagsResult = {
  tech: TagFrequency[]; // frequencies of TechTag usage across projects
  domain: TagFrequency[]; // frequencies of DomainTag usage across projects
};
