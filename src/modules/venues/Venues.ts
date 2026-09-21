import type { VenueResponse } from "@/modules/venues/index.ts";
import { getJson, sleep, type ApiRequest, type Venue, type VenueUrlEssentials } from "@/shared/index.ts";
import type { WebDriver } from "selenium-webdriver";

export class Venues {
  private browser: WebDriver;
  private venues: Venue[] = [];

  constructor(browser: WebDriver) {
    this.browser = browser;
  };

  private getVenuePageUrl(venue: VenueUrlEssentials): string {
    return `https://www.sofascore.com/pt/football/venue/${venue.venueSlug}/${venue.id}`;
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

      const venue: Venue = {
        ...venueResponse.venue,
        image: `https://www.sofascore.com/api/v1/venue/${essential.id}/image`
      }

      venues.push(venue);
    }


    return venues;
  }

}