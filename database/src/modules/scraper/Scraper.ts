import type { Browser } from "@/modules/browser/Browser.ts";
import { Leagues } from "@/modules/leagues/Leagues.ts";
import { Managers } from "@/modules/managers/Managers.ts";
import { Players } from "@/modules/players/Players.ts";
import type { OptionalData } from "@/modules/scraper/types.ts";
import { Teams } from "@/modules/teams/Teams.ts";
import { Venues } from "@/modules/venues/Venues.ts";
import type { League, LeagueUrlEssentials, ManagerUrlEssentials, PlayerUrlEssentials, VenueUrlEssentials } from "@/shared/index.ts";
import type { TeamUrlEssentials } from "@/shared/types/team.ts";

export class Scraper {
  private browser: Browser;
  private leagues: Leagues;
  private teams: Teams;
  private managers: Managers;
  private venues: Venues;
  private players: Players;

  constructor(browser: Browser, optionalData?: OptionalData) {
    const webDriver = browser.get();
    if (!webDriver) {
      throw new Error("Crie o browser!!!!!");
    }

    this.browser = browser;
    this.leagues = optionalData?.leagues ?? new Leagues(webDriver);
    this.teams = optionalData?.teams ?? new Teams(webDriver);
    this.managers = optionalData?.managers ?? new Managers(webDriver);
    this.venues = optionalData?.venues ?? new Venues(webDriver);
    this.players = optionalData?.players ?? new Players(webDriver);
  }

  async completeScrap(leagueEssentials: LeagueUrlEssentials[]) {
    const leagues = await this.scrapLeagues(leagueEssentials);
    const teamsEssentials = leagues
      .flatMap((league) => league.teams)
      .filter(
        (team, index, array) =>
          array.findIndex((item) => item.id === team.id) === index
      );

    const teams = await this.scrapTeams(teamsEssentials);
    const managerEssentials = teams.flatMap(t => {
      return { ...t.manager }
    });
    const venueEssentials = teams.flatMap(t => {
      return {
        id: t.venue.id,
        venueSlug: t.venue.slug,
        countrySlug: t.venue.country.slug
      }
    })
    const playerEssentials = teams.flatMap((team) =>
      team.players.map((player) => ({
        id: player.id,
        slug: player.slug
      }))
    );

    await this.scrapManagers(managerEssentials);
    await this.scrapVenues(venueEssentials);
    await this.scrapPlayers(playerEssentials);
  }

  async scrapLeagues(leagueEssentials: LeagueUrlEssentials[]): Promise<League[]> {
    return this.leagues.scrap(leagueEssentials);
  }

  async scrapTeams(teamEssentials: TeamUrlEssentials[]) {
    return this.teams.scrap(teamEssentials);
  }

  async scrapManagers(managerEssentials: ManagerUrlEssentials[]) {
    return this.managers.scrap(managerEssentials);
  }

  async scrapVenues(venueEssentials: VenueUrlEssentials[]) {
    return this.venues.scrap(venueEssentials);

  }

  async scrapPlayers(playerEssentials: PlayerUrlEssentials[]) {
    return this.players.scrap(playerEssentials);
  }
}