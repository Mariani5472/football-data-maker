import type { Country } from "@/shared/index.ts";

export type EntityId = {
  id: number;
};

type ApiRequestMap = {
  team: TeamResponse;
  achievements: AchievementsResponse;
  players: PlayersResponse;
  uniqueTournament: UniqueTournamentResponse;
};

export type ApiRequest<K extends keyof ApiRequestMap> = {
  name: K;
  url: string;
  paginated: boolean;
};

export type TeamResponse = {
  team: {
    nameCode: string;
    id: number;
    fullName: string;
    country: Country;
    teamColors: {
      primary: string;
      secondary: string;
      text: string;
    };
    foundationDateTimestamp: number;
    name: string;
    slug: string;
    shortName: string;
    gender: "M" | "F";
    tournament: {
      id: number
      slug: string
    };
    manager: {
      id: number
      slug: string
    };
    venue: {
      id: number
      slug: string
      country: Country;
    };
  }
};

export type AchievementsResponse = {
  totalTrophies: number;

  achievements: {
    uniqueTournament: EntityId;
    trophiesWon: number;

    seasons: {
      year: string;
    }[];
  }[];
};

export type PlayersResponse = {
  players: [
    {
      player: {
        id: number
        slug: string
      }
    }
  ]
}

export type UniqueTournamentResponse = {
  uniqueTournaments: [{ id: number }]
}