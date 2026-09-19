import type { Country } from "@/shared/types/country.ts";


export type Manager = {
  id: number;

  name: string;
  shortName: string;
  slug: string;
  image: string;

  country: Country;
  nationality: string;
  nationalityISO2: string;

  dateOfBirthTimestamp: number;
  deceased: boolean;

  preferredFormation: string;

  team: {
    id: number;
  };

  performance: {
    total: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
    totalPoints: number;
  };

  career: {
    performance: {
      total: number;
      wins: number;
      draws: number;
      losses: number;
      totalPoints: number;
    };

    startTimestamp: number;
    endTimestamp?: number;
  }[];
};

export type ManagerUrlEssentials = Pick<Manager, "id" | "slug">;