export type ProlificParticipant = {
  hackerId: string;
  name: string;
  username?: string | null;
  count: number;
};

export type ParticipantCountBin = {
  count: number; // number of projects participated
  hackers: number; // number of hackers with this count
};

export type ProlificParticipantsResult = {
  top: ProlificParticipant[]; // sorted desc by count, length <= limit (default 20)
  distribution: ParticipantCountBin[]; // histogram from 1..max
};
