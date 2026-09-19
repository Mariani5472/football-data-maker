import type { ApiRequest, Player, PlayerUrlEssentials } from "@/shared/index.ts";
import type { WebDriver } from "selenium-webdriver";

export class Players {
  private browser: WebDriver;
  private players: Player[] = [];

  constructor(browser: WebDriver) {
    this.browser = browser;
  };

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

    const teams: Player[] = [];
  }
}