import type { Country } from "@/shared/types/country.ts";

export type Team = {
  id: number;
  name: string;
  slug: string;
  shortName: string;
  fullName: string;
  nameCode: string;

  gender: "M" | "F";
  country: Country;

  teamColors: {
    primary: string;
    secondary: string;
    text: string;
  };
  image: string;

  foundationDateTimestamp: number;

  tournament: {
    id: number;
  };

  manager: {
    id: number;
    slug: string;
  };

  venue: {
    id: number;
    slug: string;
    country: Country
  };

  achievements: {
    totalTrophies: number;

    competitions: {
      uniqueTournament: {
        id: number;
      };

      trophiesWon: number;

      seasons: {
        year: string;
      }[];
    }[];
  };

  players: {
    id: number;
    slug: string;
  }[];

  uniqueTournaments: {
    id: number;
  }[];
};

export type TeamUrlEssentials = Pick<Team, "id" | "slug">;