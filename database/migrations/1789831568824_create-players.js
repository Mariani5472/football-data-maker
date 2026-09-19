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
  pgm.sql(`CREATE TABLE players (
    id BIGINT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    sofascore_id VARCHAR(100),

    country_id BIGINT REFERENCES countries(id),

    gender CHAR(1) NOT NULL,

    date_of_birth_timestamp BIGINT,

    deceased BOOLEAN NOT NULL DEFAULT FALSE,
    underage BOOLEAN NOT NULL DEFAULT FALSE,

    height INTEGER,

    jersey_number VARCHAR(10),
    shirt_number INTEGER,

    position VARCHAR(50),
    positions_detailed TEXT[],
    preferred_foot VARCHAR(20),

    contract_until_timestamp BIGINT,

    proposed_market_value NUMERIC(20, 2),

    proposed_market_value_currency VARCHAR(10),
    proposed_market_value_raw NUMERIC(20, 2),

    team_id BIGINT
);`)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`drop table players`) };
