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
  pgm.sql(`CREATE TABLE teams (
    id BIGINT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    full_name VARCHAR(255),
    name_code VARCHAR(20),

    gender CHAR(1) NOT NULL,

    country_id BIGINT REFERENCES countries(id),

    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    text_color VARCHAR(7),

    image TEXT,

    foundation_date_timestamp BIGINT,

    tournament_id BIGINT,
    manager_id BIGINT,
    venue_id BIGINT,

    CONSTRAINT uq_teams_slug UNIQUE (slug)
);`)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`drop table teams`) };
