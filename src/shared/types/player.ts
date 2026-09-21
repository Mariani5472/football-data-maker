import type { EntityId } from "@/modules/leagues/types.ts";
import type { Country } from "@/shared/types/country.ts";

export type Player = {
  id: number;

  name: string;
  slug: string;
  sofascoreId: string;
  image: string;

  country: Country;
  gender: "M" | "F";

  dateOfBirthTimestamp: number;
  deceased: boolean;
  underage: boolean;

  height: number;

  jerseyNumber: string;
  shirtNumber: number;

  position: string;
  positionsDetailed: string[];
  preferredFoot: string;

  contractUntilTimestamp: number;

  proposedMarketValue: number;
  proposedMarketValueRaw: {
    currency: string;
    value: number;
  };

  team: EntityId;

  summary: {
    timestamp: number;
    type: string;
    uniqueTournamentId: number;
    value: string;
  }[];

  attributeOverviews: {
    attacking: number;
    creativity: number;
    defending: number;
    position: string;
    tactical: number;
    technical: number;
    yearShift: number;
  }[];
};

export type PlayerUrlEssentials = Pick<Player, "id" | "slug">;
