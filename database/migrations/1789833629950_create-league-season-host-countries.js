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
  pgm.sql(`CREATE TABLE league_season_newcomers (
    season_id BIGINT NOT NULL
        REFERENCES league_seasons(id)
        ON DELETE CASCADE,

    team_id BIGINT NOT NULL,

    division VARCHAR(10) NOT NULL,

    PRIMARY KEY (season_id, team_id, division),

    CONSTRAINT chk_league_season_newcomer_division
        CHECK (division IN ('UPPER', 'LOWER'))
);`)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`drop table league_season_newcomers`) };
