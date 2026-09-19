import type { PoolClient } from "pg";
import type {
  Manager,
  Player,
  Team,
  Venue,
} from "@/shared/index.ts";

export class TeamRepository {
  async save(
    client: PoolClient,
    team: Team,
  ): Promise<void> {
    const countryId = await this.saveCountry(client, team.country);

    await client.query(
      `
        INSERT INTO teams (
          id,
          name,
          slug,
          short_name,
          full_name,
          name_code,
          gender,
          country_id,
          primary_color,
          secondary_color,
          text_color,
          image,
          foundation_date_timestamp,
          tournament_id,
          manager_id,
          venue_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16
        )
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          short_name = EXCLUDED.short_name,
          full_name = EXCLUDED.full_name,
          name_code = EXCLUDED.name_code,
          gender = EXCLUDED.gender,
          country_id = EXCLUDED.country_id,
          primary_color = EXCLUDED.primary_color,
          secondary_color = EXCLUDED.secondary_color,
          text_color = EXCLUDED.text_color,
          image = EXCLUDED.image,
          foundation_date_timestamp = EXCLUDED.foundation_date_timestamp,
          tournament_id = EXCLUDED.tournament_id,
          manager_id = EXCLUDED.manager_id,
          venue_id = EXCLUDED.venue_id
      `,
      [
        team.id,
        team.name,
        team.slug,
        team.shortName,
        team.fullName,
        team.nameCode,
        team.gender,
        countryId,
        team.teamColors.primary,
        team.teamColors.secondary,
        team.teamColors.text,
        team.image,
        team.foundationDateTimestamp,
        team.tournament?.id ?? null,
        team.manager?.id ?? null,
        team.venue?.id ?? null,
      ],
    );

    await this.saveAchievements(client, team);
    await this.saveTournaments(client, team);
    await this.savePlayersRelation(client, team);
  }

  async saveManager(
    client: PoolClient,
    manager: Manager,
  ): Promise<void> {
    const countryId = await this.saveCountry(client, manager.country);

    await client.query(
      `
        INSERT INTO managers (
          id,
          name,
          short_name,
          slug,
          image,
          country_id,
          nationality,
          nationality_iso2,
          date_of_birth_timestamp,
          deceased,
          preferred_formation,
          team_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12
        )
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          short_name = EXCLUDED.short_name,
          slug = EXCLUDED.slug,
          image = EXCLUDED.image,
          country_id = EXCLUDED.country_id,
          nationality = EXCLUDED.nationality,
          nationality_iso2 = EXCLUDED.nationality_iso2,
          date_of_birth_timestamp = EXCLUDED.date_of_birth_timestamp,
          deceased = EXCLUDED.deceased,
          preferred_formation = EXCLUDED.preferred_formation,
          team_id = EXCLUDED.team_id
      `,
      [
        manager.id,
        manager.name,
        manager.shortName,
        manager.slug,
        manager.image,
        countryId,
        manager.nationality,
        manager.nationalityISO2,
        manager.dateOfBirthTimestamp,
        manager.deceased,
        manager.preferredFormation,
        manager.team?.id ?? null,
      ],
    );

    await client.query(
      `
        INSERT INTO manager_performance (
          manager_id,
          total,
          wins,
          draws,
          losses,
          goals_scored,
          goals_conceded,
          total_points
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (manager_id)
        DO UPDATE SET
          total = EXCLUDED.total,
          wins = EXCLUDED.wins,
          draws = EXCLUDED.draws,
          losses = EXCLUDED.losses,
          goals_scored = EXCLUDED.goals_scored,
          goals_conceded = EXCLUDED.goals_conceded,
          total_points = EXCLUDED.total_points
      `,
      [
        manager.id,
        manager.performance.total,
        manager.performance.wins,
        manager.performance.draws,
        manager.performance.losses,
        manager.performance.goalsScored,
        manager.performance.goalsConceded,
        manager.performance.totalPoints,
      ],
    );

    await client.query(
      `
        DELETE FROM manager_career
        WHERE manager_id = $1
      `,
      [manager.id],
    );

    for (const career of manager.career) {
      await client.query(
        `
          INSERT INTO manager_career (
            manager_id,
            total,
            wins,
            draws,
            losses,
            total_points,
            start_timestamp,
            end_timestamp
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8
          )
        `,
        [
          manager.id,
          career.performance.total,
          career.performance.wins,
          career.performance.draws,
          career.performance.losses,
          career.performance.totalPoints,
          career.startTimestamp,
          career.endTimestamp ?? null,
        ],
      );
    }
  }

  async saveVenue(
    client: PoolClient,
    venue: Venue,
  ): Promise<void> {
    const countryId = await this.saveCountry(client, venue.country);
    const cityCountryId = await this.saveCountry(client, venue.city.country);

    await client.query(
      `
        INSERT INTO cities (
          id,
          name,
          country_id
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          country_id = EXCLUDED.country_id
      `,
      [
        venue.city.id,
        venue.city.name,
        cityCountryId,
      ],
    );

    await client.query(
      `
        INSERT INTO venues (
          id,
          name,
          slug,
          capacity,
          city_id,
          country_id,
          latitude,
          longitude,
          image
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9
        )
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          capacity = EXCLUDED.capacity,
          city_id = EXCLUDED.city_id,
          country_id = EXCLUDED.country_id,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          image = EXCLUDED.image
      `,
      [
        venue.id,
        venue.name,
        venue.slug,
        venue.capacity,
        venue.city.id,
        countryId,
        venue.venueCoordinates?.latitude ?? null,
        venue.venueCoordinates?.longitude ?? null,
        venue.image,
      ],
    );
  }

  async savePlayer(
    client: PoolClient,
    player: Player,
  ): Promise<void> {
    const countryId = await this.saveCountry(client, player.country);

    await client.query(
      `
        INSERT INTO players (
          id,
          name,
          slug,
          sofascore_id,
          country_id,
          gender,
          date_of_birth_timestamp,
          deceased,
          underage,
          height,
          jersey_number,
          shirt_number,
          position,
          positions_detailed,
          preferred_foot,
          contract_until_timestamp,
          proposed_market_value,
          proposed_market_value_currency,
          proposed_market_value_raw,
          team_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20
        )
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          sofascore_id = EXCLUDED.sofascore_id,
          country_id = EXCLUDED.country_id,
          gender = EXCLUDED.gender,
          date_of_birth_timestamp = EXCLUDED.date_of_birth_timestamp,
          deceased = EXCLUDED.deceased,
          underage = EXCLUDED.underage,
          height = EXCLUDED.height,
          jersey_number = EXCLUDED.jersey_number,
          shirt_number = EXCLUDED.shirt_number,
          position = EXCLUDED.position,
          positions_detailed = EXCLUDED.positions_detailed,
          preferred_foot = EXCLUDED.preferred_foot,
          contract_until_timestamp = EXCLUDED.contract_until_timestamp,
          proposed_market_value = EXCLUDED.proposed_market_value,
          proposed_market_value_currency = EXCLUDED.proposed_market_value_currency,
          proposed_market_value_raw = EXCLUDED.proposed_market_value_raw,
          team_id = EXCLUDED.team_id
      `,
      [
        player.id,
        player.name,
        player.slug,
        player.sofascoreId,
        countryId,
        player.gender,
        player.dateOfBirthTimestamp,
        player.deceased,
        player.underage,
        player.height,
        player.jerseyNumber,
        player.shirtNumber,
        player.position,
        player.positionsDetailed,
        player.preferredFoot,
        player.contractUntilTimestamp,
        player.proposedMarketValue,
        player.proposedMarketValueRaw.currency,
        player.proposedMarketValueRaw.value,
        player.team?.id ?? null,
      ],
    );

    await client.query(
      `
        DELETE FROM player_summary
        WHERE player_id = $1
      `,
      [player.id],
    );

    for (const summary of player.summary) {
      await client.query(
        `
          INSERT INTO player_summary (
            player_id,
            timestamp,
            type,
            unique_tournament_id,
            value
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          player.id,
          summary.timestamp,
          summary.type,
          summary.uniqueTournamentId,
          summary.value,
        ],
      );
    }

    await client.query(
      `
        DELETE FROM player_attribute_overviews
        WHERE player_id = $1
      `,
      [player.id],
    );

    for (const overview of player.attributeOverviews) {
      await client.query(
        `
          INSERT INTO player_attribute_overviews (
            player_id,
            attacking,
            creativity,
            defending,
            position,
            tactical,
            technical,
            year_shift
          )
          VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8
          )
        `,
        [
          player.id,
          overview.attacking,
          overview.creativity,
          overview.defending,
          overview.position,
          overview.tactical,
          overview.technical,
          overview.yearShift,
        ],
      );
    }
  }

  async saveVenueTeamRelation(
    client: PoolClient,
    venue: Venue,
  ): Promise<void> {
    for (const mainTeam of venue.mainTeams) {
      await client.query(
        `
          INSERT INTO venue_teams (
            venue_id,
            team_id
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [
          venue.id,
          Number(mainTeam.id),
        ],
      );
    }
  }

  private async saveCountry(
    client: PoolClient,
    country: Team["country"],
  ): Promise<number> {
    const result = await client.query<{ id: number }>(
      `
        INSERT INTO countries (
          alpha2,
          alpha3,
          name,
          slug
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug)
        DO UPDATE SET
          alpha2 = EXCLUDED.alpha2,
          alpha3 = EXCLUDED.alpha3,
          name = EXCLUDED.name
        RETURNING id
      `,
      [
        country.alpha2,
        country.alpha3,
        country.name,
        country.slug,
      ],
    );

    const id = result.rows[0]?.id;

    if (!id) {
      throw new Error(
        `Não foi possível obter o ID do país ${country.name}.`,
      );
    }

    return id;
  }

  private async saveAchievements(
    client: PoolClient,
    team: Team,
  ): Promise<void> {
    for (const achievement of team.achievements.competitions) {
      await client.query(
        `
          INSERT INTO team_achievements (
            team_id,
            tournament_id,
            trophies_won
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (team_id, tournament_id)
          DO UPDATE SET
            trophies_won = EXCLUDED.trophies_won
        `,
        [
          team.id,
          achievement.uniqueTournament.id,
          achievement.trophiesWon,
        ],
      );

      for (const season of achievement.seasons) {
        await client.query(
          `
            INSERT INTO team_achievement_seasons (
              team_id,
              tournament_id,
              year
            )
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
          `,
          [
            team.id,
            achievement.uniqueTournament.id,
            season.year,
          ],
        );
      }
    }
  }

  private async saveTournaments(
    client: PoolClient,
    team: Team,
  ): Promise<void> {
    for (const tournament of team.uniqueTournaments) {
      await client.query(
        `
          INSERT INTO team_tournaments (
            team_id,
            tournament_id
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [
          team.id,
          tournament.id,
        ],
      );
    }
  }

  private async savePlayersRelation(
    client: PoolClient,
    team: Team,
  ): Promise<void> {
    for (const player of team.players) {
      await client.query(
        `
          INSERT INTO team_players (
            team_id,
            player_id
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [
          team.id,
          player.id,
        ],
      );
    }
  }
}