import type { Country } from "@/shared/index.ts";

export type EntityId = {
  id: number;
};

type ApiRequestMap = {
  player: PlayerResponse;
  summary: SummaryResponse;
  overviews: OverviewsResponse;
};

export type ApiRequest<K extends keyof ApiRequestMap> = {
  name: K;
  url: string;
  paginated: boolean;
};

export type PlayerResponse = {
  contractUntilTimestamp: number;
  country: Country;
  dateOfBirthTimestamp: number;
  deceased: boolean;
  gender: "M" | "F";
  height: number;
  id: number;
  jerseyNumber: string;
  shirtNumber: number;
  name: string
  position: string;
  positionsDetailed: string[];
  preferredFoot: string;
  proposedMarketValue: number;
  proposedMarketValueRaw: {
    currency: string;
    value: number;
  },
  slug: string;
  sofascoreId: string;
  underage: boolean
  team: { id: EntityId }
};

export type SummaryResponse = {
  summary: {
    timestamp: number;
    type: string;
    uniqueTournamentId: number;
    value: string;
  }[]
}

export type OverviewsResponse = {
  playerAttributeOverviews: {
    attacking: number;
    creativity: number;
    defending: number;
    position: string;
    tactical: number;
    technical: number;
    yearShift: number;
  }[]
}