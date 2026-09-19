/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`CREATE TABLE league_most_titles_teams (
    league_id BIGINT NOT NULL
        REFERENCES leagues(id)
        ON DELETE CASCADE,

    team_id BIGINT NOT NULL,

    PRIMARY KEY (league_id, team_id)
);`)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`drop table league_most_titles_teams`) };
