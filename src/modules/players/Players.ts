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
      const rewrite = this.storage.getRewrite();
      if (!rewrite) {
        const exists = await this.storage.exists("players", essential.id);
        if (exists) continue;
      }

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
        id: playerResponse.player.id,

        name: playerResponse.player.name,
        slug: playerResponse.player.slug,
        sofascoreId: playerResponse.player.sofascoreId,
        image: `${essential.id}.png`,

        country: playerResponse.player.country,
        gender: playerResponse.player.gender,

        dateOfBirthTimestamp: playerResponse.player.dateOfBirthTimestamp,
        deceased: playerResponse.player.deceased,
        underage: playerResponse.player.underage,

        height: playerResponse.player.height,

        jerseyNumber: playerResponse.player.jerseyNumber,
        shirtNumber: playerResponse.player.shirtNumber,

        position: playerResponse.player.position,
        positionsDetailed: playerResponse.player.positionsDetailed,
        preferredFoot: playerResponse.player.preferredFoot,

        contractUntilTimestamp: playerResponse.player.contractUntilTimestamp,
        proposedMarketValue: playerResponse.player.proposedMarketValue,
        proposedMarketValueRaw: playerResponse.player.proposedMarketValueRaw,

        team: playerResponse.player.team.id,

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