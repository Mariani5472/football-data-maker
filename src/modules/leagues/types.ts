import type { Country } from "@/shared/index.ts";

export type EntityId = {
  id: number;
};

type ApiRequestMap = {
  uniqueTournament: UniqueTournamentResponse;
  meta: MetaResponse;
  info: SeasonInfoResponse;
  winners: WinnersResponse;
};

export type ApiRequest<K extends keyof ApiRequestMap> = {
  name: K;
  url: string;
  paginated: boolean;
};

export interface StandingsResponse {
  standings: Array<{
    rows: Array<{
      team: {
        id: number;
        slug: string;
      };
    }>;
  }>;
}

export type UniqueTournamentResponse = {
  uniqueTournament: {
    name: string;
    slug: string;

    primaryColorHex: string;
    secondaryColorHex: string;

    country: Country;

    tier: number;

    titleHolder: EntityId;

    hasRounds: boolean;
    hasGroups: boolean;
    hasPlayoffSeries: boolean;

    upperDivisions: EntityId[];
    lowerDivisions: EntityId[];

    gender: "M" | "F";

    id: number;

    startDateTimestamp: number;
    endDateTimestamp: number;

    mostTitlesTeams: EntityId[];
  }
};

export type MetaResponse = {
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
};

export type SeasonInfoResponse = {
  info: {
    season: {
      year: string;
    };

    newcomersUpperDivision: EntityId[];
    newcomersLowerDivision: EntityId[];

    numberOfCompetitors: number;
    id: number;
    hostCountries: string[];
  };
};

export type WinnersResponse = {
  winners: Array<{
    year: number;
    team: EntityId;
  }>;

  hasNextPage: boolean;
};