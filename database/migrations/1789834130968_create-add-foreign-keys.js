/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export function up(pgm) {
  pgm.sql(`
    ALTER TABLE leagues
    ADD CONSTRAINT fk_leagues_title_holder
      FOREIGN KEY (title_holder_id)
      REFERENCES teams(id);

    ALTER TABLE league_winners
    ADD CONSTRAINT fk_league_winners_team
      FOREIGN KEY (team_id)
      REFERENCES teams(id);

    ALTER TABLE league_teams
    ADD CONSTRAINT fk_league_teams_team
      FOREIGN KEY (team_id)
      REFERENCES teams(id);

    ALTER TABLE teams
    ADD CONSTRAINT fk_teams_tournament
      FOREIGN KEY (tournament_id)
      REFERENCES leagues(id);

    ALTER TABLE teams
    ADD CONSTRAINT fk_teams_manager
      FOREIGN KEY (manager_id)
      REFERENCES managers(id);

    ALTER TABLE teams
    ADD CONSTRAINT fk_teams_venue
      FOREIGN KEY (venue_id)
      REFERENCES venues(id);

    ALTER TABLE team_achievements
    ADD CONSTRAINT fk_team_achievements_team
      FOREIGN KEY (team_id)
      REFERENCES teams(id)
      ON DELETE CASCADE;

    ALTER TABLE team_tournaments
    ADD CONSTRAINT fk_team_tournaments_team
      FOREIGN KEY (team_id)
      REFERENCES teams(id)
      ON DELETE CASCADE;

    ALTER TABLE team_players
    ADD CONSTRAINT fk_team_players_team
      FOREIGN KEY (team_id)
      REFERENCES teams(id)
      ON DELETE CASCADE;

    ALTER TABLE team_players
    ADD CONSTRAINT fk_team_players_player
      FOREIGN KEY (player_id)
      REFERENCES players(id)
      ON DELETE CASCADE;

    ALTER TABLE managers
    ADD CONSTRAINT fk_managers_team
      FOREIGN KEY (team_id)
      REFERENCES teams(id);

    ALTER TABLE players
    ADD CONSTRAINT fk_players_team
      FOREIGN KEY (team_id)
      REFERENCES teams(id);

    ALTER TABLE venue_teams
    ADD CONSTRAINT fk_venue_teams_team
      FOREIGN KEY (team_id)
      REFERENCES teams(id)
      ON DELETE CASCADE;

      ALTER TABLE league_most_titles_teams
    ADD CONSTRAINT fk_league_most_titles_teams_team
      FOREIGN KEY (team_id)
      REFERENCES teams(id)
      ON DELETE CASCADE;

    ALTER TABLE team_achievement_seasons
    ADD CONSTRAINT fk_team_achievement_seasons_team
      FOREIGN KEY (team_id)
      REFERENCES teams(id)
      ON DELETE CASCADE;
  `);
}

export function down(pgm) {
  pgm.sql(`
    ALTER TABLE leagues
    DROP CONSTRAINT fk_leagues_title_holder;

    ALTER TABLE league_winners
    DROP CONSTRAINT fk_league_winners_team;

    ALTER TABLE league_teams
    DROP CONSTRAINT fk_league_teams_team;

    ALTER TABLE teams
    DROP CONSTRAINT fk_teams_tournament;

    ALTER TABLE teams
    DROP CONSTRAINT fk_teams_manager;

    ALTER TABLE teams
    DROP CONSTRAINT fk_teams_venue;

    ALTER TABLE team_achievements
    DROP CONSTRAINT fk_team_achievements_team;

    ALTER TABLE team_tournaments
    DROP CONSTRAINT fk_team_tournaments_team;

    ALTER TABLE team_players
    DROP CONSTRAINT fk_team_players_team;

    ALTER TABLE team_players
    DROP CONSTRAINT fk_team_players_player;

    ALTER TABLE managers
    DROP CONSTRAINT fk_managers_team;

    ALTER TABLE players
    DROP CONSTRAINT fk_players_team;

    ALTER TABLE venue_teams
    DROP CONSTRAINT fk_venue_teams_team;

    ALTER TABLE league_most_titles_teams
    DROP CONSTRAINT fk_league_most_titles_teams_team

    ALTER TABLE team_achievement_seasons
    drop CONSTRAINT fk_team_achievement_seasons_team
  `);
}