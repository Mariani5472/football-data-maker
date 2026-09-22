import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import type { NormalizedData } from "@/modules/normalizer/Normalizer.ts";

type RecordValue = Record<string, unknown>;

const sql = (table: string, columns: string[]): string => {
  const values = columns.map(() => "?").join(", ");

  const updates = columns
    .filter(
      (column) => column !== "external_id" && column !== "id",
    )
    .map((column) => `${column}=VALUES(${column})`)
    .join(", ");

  return `
    INSERT INTO ${table} (${columns.join(", ")})
    VALUES (${values})
    ON DUPLICATE KEY UPDATE ${updates}
  `;
};

export class ImportRepository {
  constructor(
    private readonly connection: PoolConnection,
  ) {}

  async import(data: NormalizedData): Promise<void> {
    await this.importCountries(data);
    await this.importCities(data);
    await this.importCompetitions(data);
    await this.importSeasons(data);
    await this.importVenues(data);
    await this.importTeams(data);

    await this.importParticipants(data);
    await this.importWinners(data);

    await this.importPeople(data);
    await this.importPlayers(data);
    await this.importManagers(data);

    await this.importPlayerTeams(data);
    await this.importManagerTeams(data);

    await this.importAttributes(data);
    await this.importStatistics(data);
  }

  private async importCountries(data: NormalizedData): Promise<void> {
    for (const country of data.countries) {
      await this.run(
        sql("country", [
          "alpha2",
          "alpha3",
          "name",
          "slug",
        ]),
        [
          country.alpha2,
          country.alpha3,
          country.name,
          country.slug,
        ],
      );
    }
  }

  private async importCities(data: NormalizedData): Promise<void> {
    for (const city of data.cities) {
      await this.run(
        sql("city", [
          "external_id",
          "country_id",
          "name",
          "slug",
        ]),
        [
          city.externalId,
          await this.id(
            "country",
            "alpha2",
            city.countryAlpha2,
          ),
          city.name,
          city.slug,
        ],
      );
    }
  }

  private async importCompetitions(
    data: NormalizedData,
  ): Promise<void> {
    for (const competition of data.competitions) {
      await this.run(
        sql("competition", [
          "external_id",
          "country_id",
          "name",
          "slug",
          "gender",
          "competition_type",
          "tier",
          "image",
          "primary_color",
          "secondary_color",
        ]),
        [
          competition.externalId,
          await this.optionalId(
            "country",
            "alpha2",
            competition.countryAlpha2,
          ),
          competition.name,
          competition.slug,
          competition.gender,
          competition.type,
          competition.tier,
          competition.image,
          competition.primaryColor,
          competition.secondaryColor,
        ],
      );
    }
  }

  private async importSeasons(
    data: NormalizedData,
  ): Promise<void> {
    for (const season of data.seasons) {
      await this.importSeason(season);
    }

    /*
     * Some winners can reference a season that wasn't present
     * in the competition's current season data.
     */
    for (const winner of data.winners) {
      if (!winner.year) {
        continue;
      }

      await this.importSeason({
        competitionExternalId: winner.competitionExternalId,
        externalId: null,
        year: winner.year,
        competitors: null,
      });
    }
  }

  private async importVenues(
    data: NormalizedData,
  ): Promise<void> {
    for (const venue of data.venues) {
      await this.run(
        sql("venue", [
          "external_id",
          "city_id",
          "name",
          "slug",
          "capacity",
          "latitude",
          "longitude",
          "image",
        ]),
        [
          venue.externalId,
          await this.optionalId(
            "city",
            "external_id",
            venue.cityExternalId,
          ),
          venue.name,
          venue.slug,
          venue.capacity,
          venue.latitude,
          venue.longitude,
          venue.image,
        ],
      );
    }
  }

  private async importTeams(
    data: NormalizedData,
  ): Promise<void> {
    for (const team of data.teams) {
      await this.run(
        sql("team", [
          "external_id",
          "country_id",
          "venue_id",
          "name",
          "short_name",
          "full_name",
          "slug",
          "name_code",
          "gender",
          "primary_color",
          "secondary_color",
          "text_color",
          "image",
          "foundation_date",
        ]),
        [
          team.externalId,
          await this.optionalId(
            "country",
            "alpha2",
            team.countryAlpha2,
          ),
          await this.optionalId(
            "venue",
            "external_id",
            team.venueExternalId,
          ),
          team.name,
          team.shortName,
          team.fullName,
          team.slug,
          team.nameCode,
          team.gender,
          team.primaryColor,
          team.secondaryColor,
          team.textColor,
          team.image,
          team.foundationDate,
        ],
      );
    }
  }

  private async importParticipants(
    data: NormalizedData,
  ): Promise<void> {
    for (const participant of data.participants) {
      if (!participant.year || !participant.teamExternalId) {
        continue;
      }

      const seasonId = await this.seasonId(
        participant.competitionExternalId,
        participant.year,
      );

      const teamId = await this.id(
        "team",
        "external_id",
        participant.teamExternalId,
      );

      await this.run(
        `
          INSERT IGNORE INTO competition_team
            (competition_season_id, team_id)
          VALUES (?, ?)
        `,
        [seasonId, teamId],
      );
    }
  }

  private async importWinners(
    data: NormalizedData,
  ): Promise<void> {
    for (const winner of data.winners) {
      if (!winner.year || !winner.teamExternalId) {
        continue;
      }

      const seasonId = await this.seasonId(
        winner.competitionExternalId,
        winner.year,
      );

      const teamId = await this.id(
        "team",
        "external_id",
        winner.teamExternalId,
      );

      const competitionId = await this.id(
        "competition",
        "external_id",
        winner.competitionExternalId,
      );

      await this.run(
        `
          INSERT IGNORE INTO competition_winner
            (competition_season_id, team_id)
          VALUES (?, ?)
        `,
        [seasonId, teamId],
      );

      await this.run(
        `
          INSERT IGNORE INTO team_title
            (team_id, competition_id, competition_season_id)
          VALUES (?, ?, ?)
        `,
        [teamId, competitionId, seasonId],
      );
    }
  }

  private async importPeople(
    data: NormalizedData,
  ): Promise<void> {
    for (const person of data.people) {
      await this.run(
        sql("person", [
          "external_id",
          "country_id",
          "name",
          "short_name",
          "slug",
          "birth_date",
          "deceased",
          "image",
        ]),
        [
          person.externalId,
          await this.optionalId(
            "country",
            "alpha2",
            person.countryAlpha2,
          ),
          person.name,
          person.shortName,
          person.slug,
          person.birthDate,
          person.deceased,
          person.image,
        ],
      );
    }
  }

  private async importPlayers(
    data: NormalizedData,
  ): Promise<void> {
    for (const player of data.players) {
      const personId = await this.id(
        "person",
        "external_id",
        player.id,
      );

      await this.run(
        sql("player", [
          "id",
          "height",
          "preferred_foot",
          "position",
          "proposed_market_value",
          "proposed_market_currency",
        ]),
        [
          personId,
          player.height,
          player.preferredFoot,
          player.position,
          player.marketValue,
          player.marketCurrency,
        ],
      );
    }
  }

  private async importManagers(
    data: NormalizedData,
  ): Promise<void> {
    for (const manager of data.managers) {
      const personId = await this.id(
        "person",
        "external_id",
        manager.id,
      );

      await this.run(
        sql("manager", [
          "id",
          "nationality",
          "nationality_iso2",
          "preferred_formation",
        ]),
        [
          personId,
          manager.nationality,
          manager.nationalityIso2,
          manager.preferredFormation,
        ],
      );
    }
  }

  private async importPlayerTeams(
    data: NormalizedData,
  ): Promise<void> {
    for (const relation of data.playerTeams) {
      const personId = await this.id(
        "person",
        "external_id",
        relation.playerId,
      );

      const playerId = await this.id(
        "player",
        "id",
        personId,
      );

      const teamId = await this.id(
        "team",
        "external_id",
        relation.teamExternalId,
      );

      await this.run(
        `
          INSERT IGNORE INTO player_team_period
            (player_id, team_id)
          VALUES (?, ?)
        `,
        [playerId, teamId],
      );
    }
  }

  private async importManagerTeams(
    data: NormalizedData,
  ): Promise<void> {
    for (const relation of data.managerTeams) {
      const personId = await this.id(
        "person",
        "external_id",
        relation.managerId,
      );

      const managerId = await this.id(
        "manager",
        "id",
        personId,
      );

      const teamId = await this.id(
        "team",
        "external_id",
        relation.teamExternalId,
      );

      await this.run(
        `
          INSERT IGNORE INTO manager_team_period
            (manager_id, team_id)
          VALUES (?, ?)
        `,
        [managerId, teamId],
      );
    }
  }

  private async importAttributes(
    data: NormalizedData,
  ): Promise<void> {
    for (const attribute of data.attributes) {
      const playerId = await this.id(
        "person",
        "external_id",
        attribute.playerId,
      );

      await this.run(
        sql("player_attribute_overview", [
          "player_id",
          "year_shift",
          "position",
          "attacking",
          "technical",
          "tactical",
          "defending",
          "creativity",
        ]),
        [
          playerId,
          attribute.yearShift,
          attribute.position,
          attribute.attacking,
          attribute.technical,
          attribute.tactical,
          attribute.defending,
          attribute.creativity,
        ],
      );
    }
  }

  private async importStatistics(
    data: NormalizedData,
  ): Promise<void> {
    for (const statistic of data.statistics) {
      const playerId = await this.id(
        "person",
        "external_id",
        statistic.playerId,
      );

      await this.run(
        sql("player_statistics_snapshot", [
          "player_id",
          "source_index",
          "statistic_type",
          "payload",
        ]),
        [
          playerId,
          statistic.sourceIndex,
          statistic.type,
          JSON.stringify(statistic.payload),
        ],
      );
    }
  }

  private async importSeason(
    value: RecordValue,
  ): Promise<void> {
    await this.run(
      sql("competition_season", [
        "external_id",
        "competition_id",
        "year",
        "number_of_competitors",
      ]),
      [
        value.externalId,
        await this.id(
          "competition",
          "external_id",
          value.competitionExternalId,
        ),
        value.year,
        value.competitors,
      ],
    );
  }

  private async seasonId(
    competitionExternalId: unknown,
    year: unknown,
  ): Promise<number> {
    const rows = await this.query(
      `
        SELECT s.id
        FROM competition_season s
        JOIN competition c
          ON c.id = s.competition_id
        WHERE c.external_id = ?
          AND s.year = ?
      `,
      [competitionExternalId, year],
    );

    if (!rows[0]) {
      throw new Error(
        `Season not found: ${competitionExternalId}/${year}`,
      );
    }

    return Number(rows[0].id);
  }

  private async id(
    table: string,
    column: string,
    value: unknown,
  ): Promise<number> {
    const rows = await this.query(
      `SELECT id FROM ${table} WHERE ${column} = ?`,
      [value],
    );

    if (!rows[0]) {
      throw new Error(
        `Missing ${table}.${column}=${String(value)}`,
      );
    }

    return Number(rows[0].id);
  }

  private async optionalId(
    table: string,
    column: string,
    value: unknown,
  ): Promise<number | null> {
    if (value === null || value === undefined) {
      return null;
    }

    return this.id(table, column, value);
  }

  private async query(
    statement: string,
    values: unknown[],
  ): Promise<RowDataPacket[]> {
    const [rows] = await this.connection.query<RowDataPacket[]>(
      statement,
      values as never[],
    );

    return rows;
  }

  private async run(
    statement: string,
    values: unknown[],
  ): Promise<void> {
    await this.connection.execute(
      statement,
      values.map((value) => (value === undefined ? null : value)) as never[],
    );
  }
}