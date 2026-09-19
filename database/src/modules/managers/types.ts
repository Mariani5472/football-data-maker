import type { Country } from "@/shared/index.ts";

export type EntityId = {
  id: number;
};

type ApiRequestMap = {
  manager: ManagerResponse;
  carrer: CarrerResponse;
};

export type ApiRequest<K extends keyof ApiRequestMap> = {
  name: K;
  url: string;
  paginated: boolean;
};

export type ManagerResponse = {
  country: Country;
  dateOfBirthTimestamp: number;
  deceased: boolean;
  id: number;
  name: string;
  nationality: string;
  nationalityISO2: string;
  preferredFormation: string;
  shortName: string;
  slug: string;
  team: EntityId
  performance: {
    total: number,
    wins: number,
    draws: number,
    losses: number,
    goalsScored: number,
    goalsConceded: number,
    totalPoints: number
  }
}

export type CarrerResponse = {
  careerHistory: {
    performance: {
      total: number,
      wins: number,
      draws: number,
      losses: number,
      totalPoints: number
    },
    startTimestamp: number
    endTimestamp?: number
  }[]
}