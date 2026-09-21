import type { Country } from "@/shared/types/country.ts";

export type League = {
  id: number;
  name: string;
  slug: string;

  country: Country;
  gender: "M" | "F";
  tier: number;

  primaryColorHex: string;
  secondaryColorHex: string;
  image: string;

  isGroup: boolean;
  hasRounds: boolean;
  hasGroups: boolean;
  hasPlayoffSeries: boolean;
  hasPlayoff: boolean;

  startDateTimestamp: number;
  endDateTimestamp: number;

  currentSeason: {
    id: number;
    year: string;
    numberOfCompetitors: number;
    hostCountries: string[];
    newcomersUpperDivision: {
      id: number;
    }[];
    newcomersLowerDivision: {
      id: number;
    }[];
  };

  meta: {
    otherNames: string[];
    grade: string;

    tvPartners: {
      name: string;
      url: string;
    }[];

    officialOrganisation: {
      name: string;
      url: string;
    };

    teamsCount: number;
    tablesCount: number;
    promotingTeamsCount: string;
    relegatingTeamsCount: number;
    gamesCount: number;
    frequency: number;
    roundsCount: number;

    promotedTeams: string[];

    competitionType: string;
    firstSeasonYear: string;
    hasPlayoff: boolean;
  };

  titleHolder: {
    id: number;
  };

  mostTitlesTeams: {
    id: number;
  }[];

  winners: {
    year: number;
    team: {
      id: number;
    };
  }[];

  teams: {
    id: number;
    slug: string;
  }[];
};

export type LeagueUrlEssentials = {
  id: League["id"];
  leagueSlug: League["slug"];
  countrySlug: Country["slug"];
};