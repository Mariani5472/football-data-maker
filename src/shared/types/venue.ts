import type { Country } from "@/shared/types/country.ts";

export type Venue = {
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
  },
  image: string;
}

export type VenueUrlEssentials = {
  id: Venue["id"];
  venueSlug: Venue["slug"];
  countrySlug: Country["slug"];
};