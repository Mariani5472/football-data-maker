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
  pgm.sql(`CREATE TABLE league_season_host_countries (
    season_id BIGINT NOT NULL
        REFERENCES league_seasons(id)
        ON DELETE CASCADE,

    country VARCHAR(100) NOT NULL,

    PRIMARY KEY (season_id, country)
);`)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`drop table league_season_host_countries`) };
