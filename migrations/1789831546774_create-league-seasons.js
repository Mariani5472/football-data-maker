/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export function up(pgm) {
  pgm.sql(`
    CREATE TABLE league_seasons (
      id BIGINT PRIMARY KEY,

      league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,

      year VARCHAR(20) NOT NULL,
      number_of_competitors INTEGER NOT NULL,

      CONSTRAINT uq_league_seasons_league_year
          UNIQUE (league_id, year)
    );
  `);
}

export function down(pgm) {
  pgm.sql(`
    DROP TABLE league_seasons;
  `);
}
