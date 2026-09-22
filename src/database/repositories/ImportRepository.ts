import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import type { NormalizedData } from "@/modules/normalizer/Normalizer.ts";

type RecordValue = Record<string, unknown>;

const sql = (table: string, columns: string[]): string => {
  const values = columns.map(() => "?").join(", ");

  const updates = columns
    .filter(
      (column) =>
        column !== "id" &&
        column !== "external_id",
    )
    .map((column) => `${column}=VALUES(${column})`)
    .join(", ");

  if (!updates) {
    return `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${values})
      ON DUPLICATE KEY UPDATE id=id
    `;
  }

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

    await this.importPlayerPositions(data);

    await this.importPlayerTeams(data);
    await this.importManagerTeams(data);

    await this.importAttributes(data);
    await this.importStatistics(data);
  }

  private async importCountries(
    data: NormalizedData,
  ): Promise<void> {
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

  private async importCities(
    data: NormalizedData,
  ): Promise<void> {
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
     * Winners may reference a season that does not exist
     * in currentSeason.
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
          INSERT INTO team_title
            (team_id, competition_id, competition_season_id)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            competition_season_id = VALUES(competition_season_id)
        `,
        [
          teamId,
          competitionId,
          seasonId,
        ],
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
          "person_id",
          "external_id",
          "height",
          "preferred_foot",
          "position",
          "proposed_market_value",
          "proposed_market_value_currency",
        ]),
        [
          personId,
          player.id,
          player.height,
          player.preferredFoot,
          player.position,
          player.marketValue,
          player.marketCurrency,
        ],
      );
    }
  }

  private async importPlayerPositions(
    data: NormalizedData,
  ): Promise<void> {
    for (const player of data.players) {
      if (!player.position) {
        continue;
      }

      const playerId = await this.id(
        "player",
        "external_id",
        player.id,
      );

      await this.run(
        `
          INSERT INTO player_position
            (player_id, position)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
            position = VALUES(position)
        `,
        [
          playerId,
          player.position,
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
      const playerId = await this.id(
        "player",
        "external_id",
        relation.playerId,
      );

      const teamId = await this.id(
        "team",
        "external_id",
        relation.teamExternalId,
      );

      await this.run(
        `
          INSERT INTO player_team_period
            (player_id, team_id)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
            team_id = VALUES(team_id)
        `,
        [
          playerId,
          teamId,
        ],
      );
    }
  }

  private async importManagerTeams(
    data: NormalizedData,
  ): Promise<void> {
    for (const relation of data.managerTeams) {
      const managerId = await this.id(
        "manager",
        "id",
        await this.id(
          "person",
          "external_id",
          relation.managerId,
        ),
      );

      const teamId = await this.id(
        "team",
        "external_id",
        relation.teamExternalId,
      );

      await this.run(
        `
          INSERT INTO manager_team_period
            (manager_id, team_id)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
            team_id = VALUES(team_id)
        `,
        [
          managerId,
          teamId,
        ],
      );
    }
  }

  private async importAttributes(
    data: NormalizedData,
  ): Promise<void> {
    for (const attribute of data.attributes) {
      const playerId = await this.id(
        "player",
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
        "player",
        "external_id",
        statistic.playerId,
      );

      const payload = statistic.payload as RecordValue;

      await this.run(
        sql("player_statistics_snapshot", [
          "player_id",
          "competition_season_id",
          "type",

          "appearances",
          "minutes_played",

          "goals",
          "assists",
          "goals_assists_sum",

          "expected_goals",
          "expected_assists",
          "expected_goal_involvements",

          "rating",
          "total_rating",
          "count_rating",

          "total_shots",
          "shots_on_target",
          "shots_from_inside_box",

          "goal_conversion_percentage",
          "scoring_frequency",

          "key_passes",
          "big_chances_created",
          "big_chances_missed",

          "accurate_passes",
          "total_passes",
          "accurate_passes_percentage",

          "accurate_long_balls",
          "total_long_balls",
          "accurate_long_balls_percentage",

          "accurate_crosses",
          "total_crosses",
          "accurate_crosses_percentage",

          "accurate_own_half_passes",
          "accurate_opposition_half_passes",
          "accurate_final_third_passes",

          "successful_dribbles",
          "successful_dribbles_percentage",

          "touches",
          "touches_in_opponent_box",
          "unsuccessful_touches",

          "total_duels_won",
          "total_duels_won_percentage",

          "ground_duels_won",
          "ground_duels_won_percentage",

          "aerial_duels_won",
          "aerial_duels_won_percentage",

          "tackles",
          "interceptions",
          "clearances",
          "ball_recovery",
          "defensive_contributions",

          "blocked_shots",
          "outfielder_blocks",
          "dribbled_past",

          "error_lead_to_goal",
          "error_lead_to_shot",

          "clean_sheet",
          "goals_conceded",
          "saves",

          "fouls",
          "was_fouled",
          "offsides",

          "yellow_cards",
          "red_cards",

          "own_goals",

          "penalty_won",
          "penalties_taken",
          "penalty_goals",

          "left_foot_goals",

          "shot_from_set_piece",
          "free_kick_goal",
          "set_piece_conversion",

          "corners_taken",

          "goal_involvements",
        ]),
        [
          playerId,
          null,
          statistic.type,

          payload.appearances,
          payload.minutesPlayed,

          payload.goals,
          payload.assists,
          payload.goalsAssistsSum,

          payload.expectedGoals,
          payload.expectedAssists,
          payload.expectedGoalInvolvements,

          payload.rating,
          payload.totalRating,
          payload.countRating,

          payload.totalShots,
          payload.shotsOnTarget,
          payload.shotsFromInsideTheBox,

          payload.goalConversionPercentage,
          payload.scoringFrequency,

          payload.keyPasses,
          payload.bigChancesCreated,
          payload.bigChancesMissed,

          payload.accuratePasses,
          payload.totalPasses,
          payload.accuratePassesPercentage,

          payload.accurateLongBalls,
          payload.totalLongBalls,
          payload.accurateLongBallsPercentage,

          payload.accurateCrosses,
          payload.totalCross,
          payload.accurateCrossesPercentage,

          payload.accurateOwnHalfPasses,
          payload.accurateOppositionHalfPasses,
          payload.accurateFinalThirdPasses,

          payload.successfulDribbles,
          payload.successfulDribblesPercentage,

          payload.touches,
          payload.touchesInOppBox,
          payload.unsuccessfulTouches,

          payload.totalDuelsWon,
          payload.totalDuelsWonPercentage,

          payload.groundDuelsWon,
          payload.groundDuelsWonPercentage,

          payload.aerialDuelsWon,
          payload.aerialDuelsWonPercentage,

          payload.tackles,
          payload.interceptions,
          payload.clearances,
          payload.ballRecovery,
          payload.defensiveContributions,

          payload.blockedShots,
          payload.outfielderBlocks,
          payload.dribbledPast,

          payload.errorLeadToGoal,
          payload.errorLeadToShot,

          payload.cleanSheet,
          payload.goalsConceded,
          payload.saves,

          payload.fouls,
          payload.wasFouled,
          payload.offsides,

          payload.yellowCards,
          payload.redCards,

          payload.ownGoals,

          payload.penaltyWon,
          payload.penaltiesTaken,
          payload.penaltyGoals,

          payload.leftFootGoals,

          payload.shotFromSetPiece,
          payload.freeKickGoal,
          payload.setPieceConversion,

          payload.cornersTaken,

          payload.goalInvolvements,
        ],
      );
    }
  }

  private async seasonId(
    competitionExternalId: unknown,
    year: unknown,
  ): Promise<number> {
    const rows = await this.query(
      `
        SELECT s.id
        FROM competition_season s
        INNER JOIN competition c
          ON c.id = s.competition_id
        WHERE c.external_id = ?
          AND s.year = ?
      `,
      [
        competitionExternalId,
        year,
      ],
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
      values.map((value) =>
        value === undefined ? null : value,
      ) as never[],
    );
  }
}