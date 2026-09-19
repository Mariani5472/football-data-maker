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
  pgm.sql(`CREATE TABLE player_summary (
    id BIGSERIAL PRIMARY KEY,

    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    timestamp BIGINT NOT NULL,

    type VARCHAR(100) NOT NULL,

    unique_tournament_id BIGINT NOT NULL,

    value VARCHAR(255) NOT NULL
);`)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`drop table player_summary`) };
