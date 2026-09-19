import type { UniqueTournamentResponse } from "@/modules/teams/types.ts";
import type { AchievementsResponse, PlayersResponse, TeamResponse } from "@/modules/teams/types.ts";
import { getJson, sleep, type ApiRequest, type Team, type TeamUrlEssentials } from "@/shared/index.ts";
import type { WebDriver } from "selenium-webdriver";

export class Teams {
  private browser: WebDriver;
  private teams: Team[] = [];

  constructor(browser: WebDriver) {
    this.browser = browser;
  };

  private getTeamPageUrl(team: TeamUrlEssentials): string {
    return `https://www.sofascore.com/pt/football/team/${team.slug}/${team.id}`;
  }

  private getApiUrls(
    team: TeamUrlEssentials,
  ): ApiRequest[] {
    return [
      {
        name: "uniqueTournament",
        url: `https://www.sofascore.com/api/v1/team/${team.id}/unique-tournaments`,
        paginated: false,
      },
      {
        name: "team",
        url: `https://www.sofascore.com/api/v1/team/${team.id}`,
        paginated: false,
      },
      {
        name: "achievements",
        url: `https://www.sofascore.com/api/v1/team/${team.id}/achievements`,
        paginated: false,
      },
      {
        name: "players",
        url: `https://www.sofascore.com/api/v1/team/${team.id}/players`,
        paginated: false,
      },
    ];
  }

  getTeams(): Team[] {
    return this.teams;
  }

  setTeams(teams: Team[]): void {
    this.teams = teams;
  }

  async scrap(teamUrlEssentials: TeamUrlEssentials[]): Promise<Team[]> {
    if (!teamUrlEssentials.length) {
      throw new Error("Nenhuma time foi informado.");
    }

    const teams: Team[] = [];

    for (const essential of teamUrlEssentials) {
      const mainPage = this.getTeamPageUrl(essential);
      const apiUrls = this.getApiUrls(essential);

      await this.browser.get(mainPage);
      await sleep(1500);

      let teamResponse: TeamResponse | undefined;
      let achievements: AchievementsResponse | undefined;
      let players: PlayersResponse | undefined;
      let uniqueTournament: UniqueTournamentResponse | undefined;

      for (const api of apiUrls) {
        switch (api.name) {
          case "uniqueTournament":
            uniqueTournament = await getJson<UniqueTournamentResponse>(this.browser, api.url);
            break;
          case "team":
            teamResponse = await getJson<TeamResponse>(this.browser, api.url);
            break;
          case "achievements":
            achievements = await getJson<AchievementsResponse>(this.browser, api.url);
            break;
          case "players":
            players = await getJson<PlayersResponse>(this.browser, api.url);
            break;
        }
      }

      if (!uniqueTournament) {
        throw new Error(`uniqueTournament não encontrado para ${essential.slug}.`);
      }

      if (!players) {
        throw new Error(`players não encontrado para ${essential.slug}.`);
      }

      if (!teamResponse) {
        throw new Error(`teamResponse não encontrado para ${essential.slug}.`);
      }

      const team: Team = {
        id: teamResponse.team.id,

        name: teamResponse.team.name,
        slug: teamResponse.team.slug,
        shortName: teamResponse.team.shortName,
        fullName: teamResponse.team.fullName,
        nameCode: teamResponse.team.nameCode,

        gender: teamResponse.team.gender,
        country: teamResponse.team.country,

        teamColors: teamResponse.team.teamColors,
        image: `https://img.sofascore.com/api/v1/team/${essential.id}/image`,

        foundationDateTimestamp:
          teamResponse.team.foundationDateTimestamp,

        tournament: teamResponse.team.tournament,
        manager: teamResponse.team.manager,
        venue: teamResponse.team.venue,

        achievements: {
          totalTrophies: achievements?.totalTrophies ?? 0,

          competitions: achievements?.achievements?.map((achievement) => ({
            uniqueTournament: achievement.uniqueTournament,
            trophiesWon: achievement.trophiesWon,
            seasons: achievement.seasons,
          })) ?? [],
        },

        players: players.players.map(
          ({ player }) => player
        ),

        uniqueTournaments: uniqueTournament.uniqueTournaments,
      };

      teams.push(team);
    }

    return teams;
  }

}