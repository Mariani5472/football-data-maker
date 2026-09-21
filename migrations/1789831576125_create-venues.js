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
  pgm.sql(`CREATE TABLE venues (
    id BIGINT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,

    capacity INTEGER,

    city_id BIGINT REFERENCES cities(id),
    country_id BIGINT REFERENCES countries(id),

    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),

    image TEXT,

    CONSTRAINT uq_venues_slug UNIQUE (slug)
);`)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`drop table venues`) };
