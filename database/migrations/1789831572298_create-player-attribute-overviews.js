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
  pgm.sql(`CREATE TABLE player_attribute_overviews (
    id BIGSERIAL PRIMARY KEY,

    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    attacking NUMERIC(6, 2),
    creativity NUMERIC(6, 2),
    defending NUMERIC(6, 2),

    position VARCHAR(50),

    tactical NUMERIC(6, 2),
    technical NUMERIC(6, 2),

    year_shift INTEGER
);`)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`drop table player_attribute_overviews`) };
