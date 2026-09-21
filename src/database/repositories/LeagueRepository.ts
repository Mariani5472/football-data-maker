import type { PoolClient } from "pg";
import type { League } from "@/shared/index.ts";

export class LeagueRepository {
  async save(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    const countryId = await this.saveCountry(client, league.country);

    await client.query(
      `
        INSERT INTO leagues (
          id,
          name,
          slug,
          country_id,
          gender,
          tier,
          primary_color_hex,
          secondary_color_hex,
          image,
          is_group,
          has_rounds,
          has_groups,
          has_playoff_series,
          has_playoff,
          start_date_timestamp,
          end_date_timestamp,
          title_holder_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17
        )
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          country_id = EXCLUDED.country_id,
          gender = EXCLUDED.gender,
          tier = EXCLUDED.tier,
          primary_color_hex = EXCLUDED.primary_color_hex,
          secondary_color_hex = EXCLUDED.secondary_color_hex,
          image = EXCLUDED.image,
          is_group = EXCLUDED.is_group,
          has_rounds = EXCLUDED.has_rounds,
          has_groups = EXCLUDED.has_groups,
          has_playoff_series = EXCLUDED.has_playoff_series,
          has_playoff = EXCLUDED.has_playoff,
          start_date_timestamp = EXCLUDED.start_date_timestamp,
          end_date_timestamp = EXCLUDED.end_date_timestamp,
          title_holder_id = EXCLUDED.title_holder_id
      `,
      [
        league.id,
        league.name,
        league.slug,
        countryId,
        league.gender,
        league.tier,
        league.primaryColorHex,
        league.secondaryColorHex,
        league.image,
        league.isGroup,
        league.hasRounds,
        league.hasGroups,
        league.hasPlayoffSeries,
        league.hasPlayoff,
        league.startDateTimestamp,
        league.endDateTimestamp,
        league.titleHolder?.id ?? null,
      ],
    );

    await this.saveSeason(client, league);
    await this.saveMeta(client, league);
    await this.saveTvPartners(client, league);
    await this.saveWinners(client, league);
    await this.saveSeasonHostCountries(client, league);
    await this.saveSeasonNewcomers(client, league);
    await this.saveOtherNames(client, league);
    await this.savePromotedTeams(client, league);
    await this.saveMostTitlesTeams(client, league);
  }

  async saveSeason(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    await client.query(
      `
        INSERT INTO league_seasons (
          id,
          league_id,
          year,
          number_of_competitors
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET
          league_id = EXCLUDED.league_id,
          year = EXCLUDED.year,
          number_of_competitors = EXCLUDED.number_of_competitors
      `,
      [
        league.currentSeason.id,
        league.id,
        league.currentSeason.year,
        league.currentSeason.numberOfCompetitors,
      ],
    );
  }

  async saveLeagueTeams(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    for (const team of league.teams) {
      await client.query(
        `
          INSERT INTO league_teams (
            season_id,
            team_id
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [
          league.currentSeason.id,
          team.id,
        ],
      );
    }
  }

  private async saveCountry(
    client: PoolClient,
    country: League["country"],
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

  private async saveMeta(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    const meta = league.meta;

    await client.query(
      `
        INSERT INTO league_meta (
          league_id,
          grade,
          teams_count,
          tables_count,
          official_organisation_name,
          official_organisation_url,
          promoting_teams_count,
          relegating_teams_count,
          games_count,
          frequency,
          rounds_count,
          competition_type,
          first_season_year,
          has_playoff
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (league_id)
        DO UPDATE SET
          grade = EXCLUDED.grade,
          teams_count = EXCLUDED.teams_count,
          tables_count = EXCLUDED.tables_count,
          official_organisation_name = EXCLUDED.official_organisation_name,
          official_organisation_url = EXCLUDED.official_organisation_url,
          promoting_teams_count = EXCLUDED.promoting_teams_count,
          relegating_teams_count = EXCLUDED.relegating_teams_count,
          games_count = EXCLUDED.games_count,
          frequency = EXCLUDED.frequency,
          rounds_count = EXCLUDED.rounds_count,
          competition_type = EXCLUDED.competition_type,
          first_season_year = EXCLUDED.first_season_year,
          has_playoff = EXCLUDED.has_playoff
      `,
      [
        league.id,
        meta.grade,
        meta.teamsCount,
        meta.tablesCount,
        meta.officialOrganisation?.name ?? null,
        meta.officialOrganisation?.url ?? null,
        Number(meta.promotingTeamsCount),
        meta.relegatingTeamsCount,
        meta.gamesCount,
        meta.frequency,
        meta.roundsCount,
        meta.competitionType,
        meta.firstSeasonYear,
        meta.hasPlayoff,
      ],
    );
  }

  private async saveTvPartners(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    await client.query(
      `
        DELETE FROM league_tv_partners
        WHERE league_id = $1
      `,
      [league.id],
    );

    for (const partner of league.meta.tvPartners) {
      await client.query(
        `
          INSERT INTO league_tv_partners (
            league_id,
            name,
            url
          )
          VALUES ($1, $2, $3)
        `,
        [
          league.id,
          partner.name,
          partner.url,
        ],
      );
    }
  }

  private async saveWinners(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    for (const winner of league.winners) {
      await client.query(
        `
          INSERT INTO league_winners (
            league_id,
            year,
            team_id
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (league_id, year)
          DO UPDATE SET
            team_id = EXCLUDED.team_id
        `,
        [
          league.id,
          winner.year,
          winner.team.id,
        ],
      );
    }
  }

  private async saveSeasonHostCountries(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    await client.query(
      `
        DELETE FROM league_season_host_countries
        WHERE season_id = $1
      `,
      [league.currentSeason.id],
    );

    for (const country of league.currentSeason.hostCountries) {
      await client.query(
        `
          INSERT INTO league_season_host_countries (
            season_id,
            country
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [
          league.currentSeason.id,
          country,
        ],
      );
    }
  }

  private async saveSeasonNewcomers(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    await client.query(
      `
        DELETE FROM league_season_newcomers
        WHERE season_id = $1
      `,
      [league.currentSeason.id],
    );

    for (const newcomer of league.currentSeason.newcomersUpperDivision) {
      await client.query(
        `
          INSERT INTO league_season_newcomers (
            season_id,
            team_id,
            division
          )
          VALUES ($1, $2, 'UPPER')
          ON CONFLICT DO NOTHING
        `,
        [
          league.currentSeason.id,
          newcomer.id,
        ],
      );
    }

    for (const newcomer of league.currentSeason.newcomersLowerDivision) {
      await client.query(
        `
          INSERT INTO league_season_newcomers (
            season_id,
            team_id,
            division
          )
          VALUES ($1, $2, 'LOWER')
          ON CONFLICT DO NOTHING
        `,
        [
          league.currentSeason.id,
          newcomer.id,
        ],
      );
    }
  }

  private async saveOtherNames(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    await client.query(
      `
        DELETE FROM league_other_names
        WHERE league_id = $1
      `,
      [league.id],
    );

    for (const name of league.meta.otherNames) {
      await client.query(
        `
          INSERT INTO league_other_names (
            league_id,
            name
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [
          league.id,
          name,
        ],
      );
    }
  }

  private async savePromotedTeams(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    await client.query(
      `
        DELETE FROM league_promoted_teams
        WHERE league_id = $1
      `,
      [league.id],
    );

    for (const teamName of league.meta.promotedTeams) {
      await client.query(
        `
          INSERT INTO league_promoted_teams (
            league_id,
            team_name
          )
          VALUES ($1, $2)
        `,
        [
          league.id,
          teamName,
        ],
      );
    }
  }

  private async saveMostTitlesTeams(
    client: PoolClient,
    league: League,
  ): Promise<void> {
    await client.query(
      `
        DELETE FROM league_most_titles_teams
        WHERE league_id = $1
      `,
      [league.id],
    );

    for (const team of league.mostTitlesTeams) {
      await client.query(
        `
          INSERT INTO league_most_titles_teams (
            league_id,
            team_id
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [
          league.id,
          team.id,
        ],
      );
    }
  }
}