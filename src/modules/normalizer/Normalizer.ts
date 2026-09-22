import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type Json = Record<string, unknown>;

type Country = {
  alpha2: string;
  alpha3: string;
  name: string;
  slug: string;
};

export type NormalizedData = {
  countries: Country[];
  cities: Json[];
  venues: Json[];
  competitions: Json[];
  seasons: Json[];
  teams: Json[];
  participants: Json[];
  winners: Json[];
  people: Json[];
  players: Json[];
  managers: Json[];
  playerTeams: Json[];
  managerTeams: Json[];
  attributes: Json[];
  statistics: Json[];
};

const object = (value: unknown): Json => {
  return value !== null && typeof value === "object"
    ? (value as Json)
    : {};
};

const text = (value: unknown): string | null => {
  return typeof value === "string" && value.length > 0 ? value : null;
};

const number = (value: unknown): number | null => {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
};

const list = (value: unknown): Json[] => {
  return Array.isArray(value) ? value.map(object) : [];
};

const key = (value: Json): number => {
  return number(value.id) ?? 0;
};

const date = (timestamp: unknown): string | null => {
  const value = number(timestamp);

  return value
    ? new Date(value * 1000).toISOString().slice(0, 10)
    : null;
};

export class Normalizer {
  constructor(
    private readonly rawPath = path.resolve(process.cwd(), "data"),
  ) {}

  async normalize(): Promise<NormalizedData> {
    const collections = await Promise.all(
      ["leagues", "teams", "venues", "players", "managers"].map(
        (collection) => this.readCollection(collection),
      ),
    );

    const leagues = collections[0]!;
    const teams = collections[1]!;
    const venues = collections[2]!;
    const players = collections[3]!;
    const managers = collections[4]!;

    const countries = this.normalizeCountries(
      leagues,
      teams,
      venues,
      players,
      managers,
    );

    const knownTeams = this.collectTeams(leagues, teams, players, managers);

    const normalizedTeams = this.normalizeTeams(knownTeams);
    const cities = this.normalizeCities(venues);
    const normalizedVenues = this.normalizeVenues(venues);
    const competitions = this.normalizeCompetitions(leagues);
    const seasons = this.normalizeSeasons(leagues);
    const participants = this.normalizeParticipants(leagues);
    const winners = this.normalizeWinners(leagues);

    const {
      people,
      players: normalizedPlayers,
      managers: normalizedManagers,
      playerTeams,
      managerTeams,
      attributes,
      statistics,
    } = this.normalizePeople(players, managers);

    return {
      countries,
      cities,
      venues: normalizedVenues,
      competitions,
      seasons,
      teams: normalizedTeams,
      participants,
      winners,
      people,
      players: normalizedPlayers,
      managers: normalizedManagers,
      playerTeams,
      managerTeams,
      attributes,
      statistics,
    };
  }

  private normalizeCountries(
    leagues: Json[],
    teams: Json[],
    venues: Json[],
    players: Json[],
    managers: Json[],
  ): Country[] {
    const countries = new Map<string, Country>();

    const addCountry = (value: unknown): void => {
      const country = object(value);

      const alpha2 = text(country.alpha2);
      const alpha3 = text(country.alpha3);
      const name = text(country.name);
      const slug = text(country.slug);

      if (!alpha2 || !alpha3 || !name || !slug) {
        return;
      }

      countries.set(alpha2, {
        alpha2,
        alpha3,
        name,
        slug,
      });
    };

    [
      ...leagues,
      ...teams,
      ...venues,
      ...players,
      ...managers,
    ].forEach((item) => {
      addCountry(item.country);
    });

    venues.forEach((venue) => {
      addCountry(object(venue.city).country);
    });

    return [...countries.values()].sort((a, b) =>
      a.alpha2.localeCompare(b.alpha2),
    );
  }

  private collectTeams(
    leagues: Json[],
    teams: Json[],
    players: Json[],
    managers: Json[],
  ): Map<number, Json> {
    const knownTeams = new Map<number, Json>(
      teams.map((team) => [key(team), team]),
    );

    const ensureTeam = (team: Json): void => {
      const teamId = key(team);

      if (teamId && !knownTeams.has(teamId)) {
        knownTeams.set(teamId, team);
      }
    };

    leagues.forEach((league) => {
      list(league.teams).forEach(ensureTeam);
    });

    players.forEach((player) => {
      const teamId = number(player.team);

      if (teamId) {
        ensureTeam({ id: teamId });
      }
    });

    managers.forEach((manager) => {
      ensureTeam(object(manager.team));
    });

    leagues.forEach((league) => {
      list(league.winners).forEach((winner) => {
        ensureTeam(object(winner.team));
      });
    });

    return knownTeams;
  }

  private normalizeTeams(teams: Map<number, Json>): Json[] {
    return [...teams.values()]
      .filter((team) => key(team) > 0)
      .map((team) => {
        const teamId = key(team);
        const country = object(team.country);
        const venue = object(team.venue);
        const colors = object(team.teamColors);

        return {
          externalId: teamId,
          name: text(team.name) ?? `Unknown team ${teamId}`,
          shortName: text(team.shortName),
          fullName: text(team.fullName),
          slug: text(team.slug),
          nameCode: text(team.nameCode),
          gender: text(team.gender),
          countryAlpha2: text(country.alpha2),
          venueExternalId: number(venue.id),
          primaryColor: text(colors.primary),
          secondaryColor: text(colors.secondary),
          textColor: text(colors.text),
          image: text(team.image),
          foundationDate: date(team.foundationDateTimestamp),
        };
      });
  }

  private normalizeCities(venues: Json[]): Json[] {
    return venues.flatMap((venue) => {
      const city = object(venue.city);
      const country = object(city.country);

      const cityId = key(city);
      const countryAlpha2 = text(country.alpha2);

      if (!cityId || !countryAlpha2) {
        return [];
      }

      return [
        {
          externalId: cityId,
          countryAlpha2,
          name: text(city.name) ?? `Unknown city ${cityId}`,
          slug: text(city.slug),
        },
      ];
    });
  }

  private normalizeVenues(venues: Json[]): Json[] {
    return venues.map((venue) => {
      const city = object(venue.city);
      const coordinates = object(venue.venueCoordinates);

      return {
        externalId: key(venue),
        cityExternalId: key(city) || null,
        name: text(venue.name) ?? `Unknown venue ${key(venue)}`,
        slug: text(venue.slug),
        capacity: number(venue.capacity),
        latitude: number(coordinates.latitude),
        longitude: number(coordinates.longitude),
        image: text(venue.image),
      };
    });
  }

  private normalizeCompetitions(leagues: Json[]): Json[] {
    return leagues.map((league) => {
      const country = object(league.country);
      const meta = object(league.meta);
      const leagueId = key(league);

      return {
        externalId: leagueId,
        countryAlpha2: text(country.alpha2),
        name: text(league.name) ?? `Competition ${leagueId}`,
        slug: text(league.slug) ?? String(leagueId),
        gender: text(league.gender),
        type: text(meta.competitionType),
        tier: number(league.tier),
        image: text(league.image),
        primaryColor: text(league.primaryColorHex),
        secondaryColor: text(league.secondaryColorHex),
      };
    });
  }

  private normalizeSeasons(leagues: Json[]): Json[] {
    return leagues.flatMap((league) => {
      const season = object(league.currentSeason);
      const year = Number(text(season.year));

      if (!Number.isInteger(year)) {
        return [];
      }

      return [
        {
          competitionExternalId: key(league),
          externalId: key(season),
          year,
          competitors: number(season.numberOfCompetitors),
        },
      ];
    });
  }

  private normalizeParticipants(leagues: Json[]): Json[] {
    return leagues.flatMap((league) => {
      const season = object(league.currentSeason);
      const year = Number(text(season.year));

      return list(league.teams).map((team) => ({
        competitionExternalId: key(league),
        year,
        teamExternalId: key(team),
      }));
    });
  }

  private normalizeWinners(leagues: Json[]): Json[] {
    return leagues
      .flatMap((league) =>
        list(league.winners).map((winner) => ({
          competitionExternalId: key(league),
          year: number(winner.year),
          teamExternalId: key(object(winner.team)),
        })),
      )
      .filter(
        (winner) => winner.year && winner.teamExternalId,
      );
  }

  private normalizePeople(
    players: Json[],
    managers: Json[],
  ): {
    people: Json[];
    players: Json[];
    managers: Json[];
    playerTeams: Json[];
    managerTeams: Json[];
    attributes: Json[];
    statistics: Json[];
  } {
    const people: Json[] = [];
    const normalizedPlayers: Json[] = [];
    const normalizedManagers: Json[] = [];
    const playerTeams: Json[] = [];
    const managerTeams: Json[] = [];
    const attributes: Json[] = [];
    const statistics: Json[] = [];

    this.normalizePlayers(
      players,
      people,
      normalizedPlayers,
      playerTeams,
      attributes,
      statistics,
    );

    this.normalizeManagers(
      managers,
      people,
      normalizedManagers,
      managerTeams,
    );

    return {
      people,
      players: normalizedPlayers,
      managers: normalizedManagers,
      playerTeams,
      managerTeams,
      attributes,
      statistics,
    };
  }

  private normalizePlayers(
    players: Json[],
    people: Json[],
    normalizedPlayers: Json[],
    playerTeams: Json[],
    attributes: Json[],
    statistics: Json[],
  ): void {
    players.forEach((player) => {
      const id = key(player);

      if (!id) {
        return;
      }

      people.push({
        externalId: id,
        countryAlpha2: text(object(player.country).alpha2),
        name: text(player.name) ?? `Player ${id}`,
        shortName: null,
        slug: text(player.slug),
        birthDate: date(player.dateOfBirthTimestamp),
        deceased: Boolean(player.deceased),
        image: text(player.image),
      });

      normalizedPlayers.push({
        id,
        height: number(player.height),
        preferredFoot: text(player.preferredFoot),
        position: text(player.position),
        marketValue: number(player.proposedMarketValue),
        marketCurrency: text(
          object(player.proposedMarketValueRaw).currency,
        ),
      });

      const teamId = number(player.team);

      if (teamId) {
        playerTeams.push({
          playerId: id,
          teamExternalId: teamId,
        });
      }

      list(player.attributeOverviews).forEach((attribute) => {
        attributes.push({
          playerId: id,
          ...attribute,
        });
      });

      list(player.statistics).forEach((statistic, index) => {
        statistics.push({
          playerId: id,
          sourceIndex: index,
          type: text(statistic.type) ?? "unknown",
          payload: statistic,
        });
      });
    });
  }

  private normalizeManagers(
    managers: Json[],
    people: Json[],
    normalizedManagers: Json[],
    managerTeams: Json[],
  ): void {
    managers.forEach((manager) => {
      const id = key(manager);

      if (!id) {
        return;
      }

      people.push({
        externalId: id,
        countryAlpha2: text(object(manager.country).alpha2),
        name: text(manager.name) ?? `Manager ${id}`,
        shortName: text(manager.shortName),
        slug: text(manager.slug),
        birthDate: date(manager.dateOfBirthTimestamp),
        deceased: Boolean(manager.deceased),
        image: text(manager.image),
      });

      normalizedManagers.push({
        id,
        nationality: text(manager.nationality),
        nationalityIso2: text(manager.nationalityISO2),
        preferredFormation: text(manager.preferredFormation),
      });

      const teamId = key(object(manager.team));

      if (teamId) {
        managerTeams.push({
          managerId: id,
          teamExternalId: teamId,
        });
      }
    });
  }

  private async readCollection(collection: string): Promise<Json[]> {
    const directory = path.join(this.rawPath, collection);

    const names = (await readdir(directory))
      .filter((name) => name.endsWith(".json"))
      .sort((a, b) => a.localeCompare(b, "en"));

    return Promise.all(
      names.map(async (name) => {
        const filePath = path.join(directory, name);
        const content = await readFile(filePath, "utf8");

        return object(JSON.parse(content));
      }),
    );
  }
}