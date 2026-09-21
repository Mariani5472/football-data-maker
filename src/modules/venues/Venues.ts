import type { JsonStorage } from "@/modules/storage/JsonStorage.ts";
import type { VenueResponse } from "@/modules/venues/index.ts";
import { downloadImage } from "@/shared/functions/downloadImage.ts";
import { getJson, sleep, type ApiRequest, type Venue, type VenueUrlEssentials } from "@/shared/index.ts";
import path from "node:path";
import type { WebDriver } from "selenium-webdriver";

export class Venues {
  private browser: WebDriver;
  private storage: JsonStorage;
  private venues: Venue[] = [];

  constructor(browser: WebDriver, storage: JsonStorage) {
    this.browser = browser;
    this.storage = storage;
  }

  private getVenuePageUrl(venue: VenueUrlEssentials): string {
    return `https://www.sofascore.com/pt/football/venue/${venue.countrySlug}/${venue.venueSlug}/${venue.id}`;
  }

  private getApiUrls(
    venue: VenueUrlEssentials,
  ): ApiRequest[] {
    return [
      {
        name: "venue",
        url: `https://www.sofascore.com/api/v1/venue/${venue.id}`,
        paginated: false,
      },
    ]
  }

  getVenues(): Venue[] {
    return this.venues;
  }

  setVenues(venues: Venue[]): void {
    this.venues = venues;
  }

  async scrap(venueUrlEssentials: VenueUrlEssentials[]): Promise<Venue[]> {
    if (!venueUrlEssentials.length) {
      throw new Error("Nenhuma time foi informado.");
    }

    const venues: Venue[] = [];

    for (const essential of venueUrlEssentials) {
      const rewrite = this.storage.getRewrite();
      if (!rewrite) {
        const exists = await this.storage.exists("venues", essential.id);
        if (exists) continue;
      }

      const mainPage = this.getVenuePageUrl(essential);
      const apiUrls = this.getApiUrls(essential);

      await this.browser.get(mainPage);
      await sleep(1500);

      let venueResponse: VenueResponse | undefined;

      for (const api of apiUrls) {
        switch (api.name) {
          case "venue":
            venueResponse = await getJson<VenueResponse>(this.browser, api.url);
            break;
        }
      }

      if (!venueResponse) {
        throw new Error(`venueResponse não encontrado para ${essential.venueSlug}.`);
      }

      const imageUrl = `https://img.sofascore.com/api/v1/venue/${essential.id}/image`;
      const imagePath = path.resolve(process.cwd(), "assets", "venues", `${essential.id}.png`,);
      await downloadImage(imageUrl, imagePath);

      const venue: Venue = {
        ...venueResponse.venue,
        image: `${essential.id}.png`
      }

      venues.push(venue);
      this.storage.save("venues", venue.id, venue);
    }


    return venues;
  }

}