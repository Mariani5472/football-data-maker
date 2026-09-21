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
  player: {
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
  }
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

export type StatisticsResponse = {
  seasons: {
    startYear: number
    endYear: number
    statistics: {
      accurateCrosses: number;
      accurateCrossesPercentage: number;
      accuratePasses: number;
      accuratePassesPercentage: number;
      assists: number;
      bigChancesCreated: number;
      bigChancesMissed: number;
      cleanSheet: number;
      dribbledPast: number;
      errorLeadToGoal: number;
      goals: number;
      goalsAssistsSum: number;
      goalsConceded: number;
      interceptions: number;
      keyPasses: number;
      minutesPlayed: number;
      passToAssist: number;
      rating: number;
      redCards: number;
      saves: number;
      successfulDribbles: number;
      tackles: number;
      yellowCards: number;
      totalRating: number;
      countRating: number;
      totalCross: number;
      totalPasses: number;
      shotsFromInsideTheBox: number;
      accurateOwnHalfPasses: number;
      accurateOppositionHalfPasses: number;
      accurateFinalThirdPasses: number;
      touches: number;
      touchesInOppBox: number;
      unsuccessfulTouches: number;
      successfulDribblesPercentage: number;
      ballRecovery: number;
      defensiveContributions: number;
      totalDuelsWon: number;
      totalDuelsWonPercentage: number;
      groundDuelsWon: number;
      groundDuelsWonPercentage: number;
      aerialDuelsWonPercentage: number;
      wasFouled: number;
      fouls: number;
      offsides: number;
      appearances: number;
      goalInvolvements: number;
      type: string,
    }
  }[]
}