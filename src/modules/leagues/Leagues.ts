import type { MetaResponse, SeasonInfoResponse, StandingsResponse, UniqueTournamentResponse, WinnersResponse } from "@/modules/leagues/types.ts";
import { getJson, sleep, type ApiRequest, type League, type LeagueUrlEssentials } from "@/shared/index.ts";
import type { WebDriver } from "selenium-webdriver";
import path from "node:path";
import { downloadImage } from "@/shared/functions/downloadImage.ts";


export class Leagues {
  private browser: WebDriver;
  private leagues: League[] = [];

  constructor(browser: WebDriver) {
    this.browser = browser;
  };

  private getLeaguePageUrl(league: LeagueUrlEssentials): string {
    return `https://www.sofascore.com/pt/football/tournament/${league.countrySlug}/${league.leagueSlug}/${league.id}`;
  }

  private getApiUrls(
    league: LeagueUrlEssentials,
    season: number
  ): ApiRequest[] {
    return [
      {
        name: "standings",
        url: `https://www.sofascore.com/api/v1/unique-tournament/${league.id}/season/${season}/standings/total`,
        paginated: false,
      },
      {
        name: "uniqueTournament",
        url: `https://www.sofascore.com/api/v1/unique-tournament/${league.id}`,
        paginated: false,
      },
      {
        name: "meta",
        url: `https://www.sofascore.com/api/v1/unique-tournament/${league.id}/meta`,
        paginated: false,
      },
      {
        name: "info",
        url: `https://www.sofascore.com/api/v1/unique-tournament/${league.id}/season/${season}/info`,
        paginated: false,
      },
      {
        name: "winners",
        url: `https://www.sofascore.com/api/v1/unique-tournament/${league.id}/winners`,
        paginated: true,
      },
      {
        name: "cuptrees",
        url: `https://www.sofascore.com/api/v1/unique-tournament/${league.id}/season/${season}/cuptrees`,
        paginated: false,
      },
      {
        name: "rounds",
        url: `https://www.sofascore.com/api/v1/unique-tournament/${league.id}/season/${season}/rounds`,
        paginated: false,
      },
      {
        name: "groups",
        url: `https://www.sofascore.com/api/v1/unique-tournament/${league.id}/season/${season}/groups`,
        paginated: false,
      },
    ];
  }

  private async getCurrentSeasonId(
    league: LeagueUrlEssentials
  ): Promise<number> {
    const url = this.getLeaguePageUrl(league);

    await this.browser.get(url);
    await this.browser.wait(async () => {
      const currentUrl = await this.browser.getCurrentUrl();
      return currentUrl.includes("#id:");
    }, 10_000);

    const currentUrl = await this.browser.getCurrentUrl();
    const match = currentUrl.match(/#id:(\d+)/);

    if (!match) {
      throw new Error(`Season não encontrada para a liga ${league.leagueSlug}.`);
    }

    return Number(match[1]);
  }

  getLeagues(): League[] {
    return this.leagues;
  }

  setLeagues(leagues: League[]): void {
    this.leagues = leagues;
  }

  async scrap(leagueUrlEssentials: LeagueUrlEssentials[]): Promise<League[]> {
    if (!leagueUrlEssentials.length) {
      throw new Error("Nenhuma liga foi informada.");
    }

    const leagues: League[] = [];

    for (const essential of leagueUrlEssentials) {
      const season = await this.getCurrentSeasonId(essential);

      const mainPage = this.getLeaguePageUrl(essential);
      const apiUrls = this.getApiUrls(essential, season);

      await this.browser.get(mainPage);
      await sleep(3000);

      let standings: StandingsResponse | undefined;
      let uniqueTournament: UniqueTournamentResponse | undefined;
      let meta: MetaResponse | undefined;
      let info: SeasonInfoResponse | undefined;
      let winners: WinnersResponse | undefined;

      for (const api of apiUrls) {
        switch (api.name) {
          case "standings":
            standings = await getJson<StandingsResponse>(this.browser, api.url);
            break;
          case "uniqueTournament":
            uniqueTournament = await getJson<UniqueTournamentResponse>(this.browser, api.url);
            break;
          case "meta":
            meta = await getJson<MetaResponse>(this.browser, api.url);
            break;
          case "info":
            info = await getJson<SeasonInfoResponse>(this.browser, api.url);
            break;
          case "winners":
            const allWinners: WinnersResponse["winners"] = [];
            let page = 0;
            let hasNextPage = true;
            while (hasNextPage) {
              const url = `${api.url}/${page}`;

              const response = await getJson<WinnersResponse>(
                this.browser,
                url
              );

              allWinners.push(...response.winners);
              hasNextPage = response.hasNextPage;
              page++;
            }

            winners = {
              winners: allWinners,
              hasNextPage: false,
            };

            break;
        }
      }

      if (!standings) {
        throw new Error(`standings não encontrado para ${essential.leagueSlug}.`);
      }

      if (!uniqueTournament) {
        throw new Error(`uniqueTournament não encontrado para ${essential.leagueSlug}.`);
      }

      if (!meta) {
        throw new Error(`meta não encontrado para ${essential.leagueSlug}.`);
      }

      if (!info) {
        throw new Error(`info não encontrado para ${essential.leagueSlug}.`);
      }

      const imageUrl = `https://img.sofascore.com/api/v1/unique-tournament/${essential.id}/image`;
      const imagePath = path.resolve(process.cwd(), "assets", "leagues", `${essential.id}.png`,);
      await downloadImage(imageUrl, imagePath);

      const tournament: League = {
        id: uniqueTournament.id,
        name: uniqueTournament.name,
        slug: uniqueTournament.slug,

        country: uniqueTournament.country,
        gender: uniqueTournament.gender,
        tier: uniqueTournament.tier,

        primaryColorHex: uniqueTournament.primaryColorHex,
        secondaryColorHex: uniqueTournament.secondaryColorHex,
        image: `${essential.id}.png`,

        isGroup: uniqueTournament.hasGroups,
        hasRounds: uniqueTournament.hasRounds,
        hasGroups: uniqueTournament.hasGroups,
        hasPlayoffSeries: uniqueTournament.hasPlayoffSeries,
        hasPlayoff: meta.meta.hasPlayoff,

        startDateTimestamp: uniqueTournament.startDateTimestamp,
        endDateTimestamp: uniqueTournament.endDateTimestamp,

        currentSeason: {
          id: info.info.id,
          year: info.info.season.year,
          numberOfCompetitors: info.info.numberOfCompetitors,
          hostCountries: info.info.hostCountries,
          newcomersUpperDivision: info.info.newcomersUpperDivision,
          newcomersLowerDivision: info.info.newcomersLowerDivision,
        },

        meta: meta.meta,

        titleHolder: uniqueTournament.titleHolder,
        mostTitlesTeams: uniqueTournament.mostTitlesTeams,

        winners: winners?.winners ?? [],

        teams: standings?.standings[0]?.rows.map((row) => ({
          id: row.team.id,
          slug: row.team.slug,
        })) ?? [],
      };

      leagues.push(tournament);
    }

    this.setLeagues(leagues)
    return leagues;
  }
}