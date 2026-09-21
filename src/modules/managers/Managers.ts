import type { CarrerResponse, ManagerResponse } from "@/modules/managers/types.ts";
import type { JsonStorage } from "@/modules/storage/JsonStorage.ts";
import { downloadImage } from "@/shared/functions/downloadImage.ts";
import { getJson, sleep, type ApiRequest, type Manager, type ManagerUrlEssentials } from "@/shared/index.ts";
import path from "node:path";
import { WebDriver } from "selenium-webdriver";

export class Managers {
  private browser: WebDriver;
  private storage: JsonStorage;
  private managers: Manager[] = [];

  constructor(browser: WebDriver, storage: JsonStorage) {
    this.browser = browser;
    this.storage = storage;
  };

  private getManagerPageUrl(manager: ManagerUrlEssentials): string {
    return `https://www.sofascore.com/pt/football/manager/${manager.slug}/${manager.id}`;
  }

  private getApiUrls(
    manager: ManagerUrlEssentials,
  ): ApiRequest[] {
    return [
      {
        name: "manager",
        url: `https://www.sofascore.com/api/v1/manager/${manager}`,
        paginated: false,
      },
      {
        name: "carrer",
        url: `https://www.sofascore.com/api/v1/manager/${manager}/career-history`,
        paginated: false,
      },
    ]
  }

  getManagers(): Manager[] {
    return this.managers;
  }

  setManagers(managers: Manager[]): void {
    this.managers = managers;
  }

  async scrap(managerUrlEssentials: ManagerUrlEssentials[]): Promise<Manager[]> {
    if (!managerUrlEssentials.length) {
      throw new Error("Nenhum tecnico foi informado.");
    }

    const managers: Manager[] = [];

    for (const essential of managerUrlEssentials) {
      const mainPage = this.getManagerPageUrl(essential);
      const apiUrls = this.getApiUrls(essential)

      await this.browser.get(mainPage);
      await sleep(1500);

      let managerResponse: ManagerResponse | undefined;
      let history: CarrerResponse | undefined;

      for (const api of apiUrls) {
        switch (api.name) {
          case "manager":
            managerResponse = await getJson<ManagerResponse>(this.browser, api.url);
            break;
          case "carrer":
            history = await getJson<CarrerResponse>(this.browser, api.url);
            break;
        }
      }

      if (!managerResponse) {
        throw new Error(`manager não encontrado para ${essential.slug}.`);
      }

      const imageUrl = `https://img.sofascore.com/api/v1/manager/${essential.id}/image`;
      const imagePath = path.resolve(process.cwd(), "assets", "managers", `${essential.id}.png`,);
      await downloadImage(imageUrl, imagePath);

      const manager: Manager = {
        id: managerResponse.id,

        name: managerResponse.name,
        shortName: managerResponse.shortName,
        slug: managerResponse.slug,
        image: `${essential.id}.png`,

        country: managerResponse.country,
        nationality: managerResponse.nationality,
        nationalityISO2: managerResponse.nationalityISO2,

        dateOfBirthTimestamp: managerResponse.dateOfBirthTimestamp,
        deceased: managerResponse.deceased,

        preferredFormation: managerResponse.preferredFormation,

        team: managerResponse.team,

        performance: managerResponse.performance,

        career: history?.careerHistory ?? [],
      };

      managers.push(manager);
      this.storage.save("managers", manager.id, manager);
    }

    return managers;
  }
}