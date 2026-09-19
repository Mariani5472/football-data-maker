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
  pgm.sql(`CREATE TABLE managers (
    id BIGINT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    slug VARCHAR(255),

    image TEXT,

    country_id BIGINT REFERENCES countries(id),

    nationality VARCHAR(100),
    nationality_iso2 VARCHAR(2),

    date_of_birth_timestamp BIGINT,

    deceased BOOLEAN NOT NULL DEFAULT FALSE,

    preferred_formation VARCHAR(50),

    team_id BIGINT
);`)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`drop table managers`) };
