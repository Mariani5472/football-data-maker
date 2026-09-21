import type { Country } from "@/shared/index.ts";

export type VenueResponse = {
  venue: {
    capacity: number;
    city: {
      id: number;
      country: Country;
      name: string;
    }
    country: Country;
    id: number;
    mainTeams: { id: string }[]
    name: string;
    slug: string;
    venueCoordinates: {
      latitude: number,
      longitude: number
    }
  }
}