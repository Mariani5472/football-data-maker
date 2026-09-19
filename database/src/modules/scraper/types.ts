import type { Leagues } from "@/modules/leagues/Leagues.ts";
import type { Managers } from "@/modules/managers/Managers.ts";
import type { Players } from "@/modules/players/Players.ts";
import type { Teams } from "@/modules/teams/Teams.ts";
import type { Venues } from "@/modules/venues/Venues.ts";

export interface OptionalData {
  leagues?: Leagues
  teams?: Teams
  managers?: Managers
  venues?: Venues
  players?: Players
}
