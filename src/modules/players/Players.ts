import type { OverviewsResponse, PlayerResponse, StatisticsResponse, SummaryResponse } from "@/modules/players/types.ts";
import { JsonStorage } from "@/modules/storage/JsonStorage.ts";
import { downloadImage } from "@/shared/functions/downloadImage.ts";
import { getJson, sleep, type ApiRequest, type Player, type PlayerUrlEssentials } from "@/shared/index.ts";
import path from "node:path";
import type { WebDriver } from "selenium-webdriver";

export class Players {
  private browser: WebDriver;
  private storage: JsonStorage;
  private players: Player[] = [];

  constructor(browser: WebDriver, storage: JsonStorage) {
    this.browser = browser;
    this.storage = storage;
  }

  private getPlayerPageUrl(player: PlayerUrlEssentials): string {
    return `https://www.sofascore.com/pt/football/player/${player.slug}/${player.id}`;
  }

  private getApiUrls(
    player: PlayerUrlEssentials,
  ): ApiRequest[] {
    return [
      {
        name: "player",
        url: `https://www.sofascore.com/api/v1/player/${player.id}`,
        paginated: false,
      },
      {
        name: "summary",
        url: `https://www.sofascore.com/api/v1/player/${player.id}/last-year-summary`,
        paginated: false,
      },
      {
        name: "overviews",
        url: `https://www.sofascore.com/api/v1/player/${player.id}/attribute-overviews`,
        paginated: false,
      },
      {
        name: "statistics",
        url: `https://www.sofascore.com/api/v1/player/${player.id}/statistics`,
        paginated: false,
      },
    ];
  }

  getPlayers(): Player[] {
    return this.players;
  }

  setPlayers(players: Player[]): void {
    this.players = players;
  }


  async scrap(playerUrlEssentials: PlayerUrlEssentials[]): Promise<Player[]> {
    if (!playerUrlEssentials.length) {
      throw new Error("Nenhum jogador foi informado.");
    }

    const players: Player[] = [];

    for (const essential of playerUrlEssentials) {
      const mainPage = this.getPlayerPageUrl(essential);
      const apiUrls = this.getApiUrls(essential);

      await this.browser.get(mainPage);
      await sleep(1500);

      let playerResponse: PlayerResponse | undefined;
      let summaryResponse: SummaryResponse | undefined;
      let overviewsResponse: OverviewsResponse | undefined;
      let statisticsResponse: StatisticsResponse | undefined;

      for (const api of apiUrls) {
        switch (api.name) {
          case "player":
            playerResponse = await getJson<PlayerResponse>(this.browser, api.url);
            break;
          case "summary":
            summaryResponse = await getJson<SummaryResponse>(this.browser, api.url);
            break;
          case "overviews":
            overviewsResponse = await getJson<OverviewsResponse>(this.browser, api.url);
            break;
          case "statistics":
            statisticsResponse = await getJson<StatisticsResponse>(this.browser, api.url);
            break;
        }
      }

      if (!playerResponse) {
        throw new Error(`uniqueTournament não encontrado para ${essential.slug}.`);
      }

      let statistics: StatisticsResponse["seasons"][number]["statistics"][] | undefined;

      if (statisticsResponse && statisticsResponse.seasons.length) {
        const thisYear = new Date().getFullYear();
        const currentSeason = statisticsResponse.seasons.filter(s => s.endYear === thisYear);
        statistics = currentSeason.map(s => {
          return ({ ...s.statistics });
        })
      }

      const imageUrl = `https://img.sofascore.com/api/v1/player/${essential.id}/image`;
      const imagePath = path.resolve(process.cwd(), "assets", "players", `${essential.id}.png`,);
      await downloadImage(imageUrl, imagePath);

      const player: Player = {
        id: playerResponse.id,

        name: playerResponse.name,
        slug: playerResponse.slug,
        sofascoreId: playerResponse.sofascoreId,
        image: `${essential.id}.png`,

        country: playerResponse.country,
        gender: playerResponse.gender,

        dateOfBirthTimestamp: playerResponse.dateOfBirthTimestamp,
        deceased: playerResponse.deceased,
        underage: playerResponse.underage,

        height: playerResponse.height,

        jerseyNumber: playerResponse.jerseyNumber,
        shirtNumber: playerResponse.shirtNumber,

        position: playerResponse.position,
        positionsDetailed: playerResponse.positionsDetailed,
        preferredFoot: playerResponse.preferredFoot,

        contractUntilTimestamp: playerResponse.contractUntilTimestamp,
        proposedMarketValue: playerResponse.proposedMarketValue,
        proposedMarketValueRaw: playerResponse.proposedMarketValueRaw,

        team: playerResponse.team.id,

        summary: summaryResponse?.summary ?? [],
        attributeOverviews: overviewsResponse?.playerAttributeOverviews ?? [],
        statistics: statistics ?? []
      };

      players.push(player);
      this.storage.save("players", player.id, player);
    }

    return players;
  }
}