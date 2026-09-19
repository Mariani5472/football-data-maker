/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export function up(pgm) {
  pgm.sql(`
    CREATE TABLE countries (
      id BIGSERIAL PRIMARY KEY,

      alpha2 VARCHAR(2) NOT NULL,
      alpha3 VARCHAR(3) NOT NULL,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL,

      CONSTRAINT uq_countries_alpha2 UNIQUE (alpha2),
      CONSTRAINT uq_countries_alpha3 UNIQUE (alpha3),
      CONSTRAINT uq_countries_slug UNIQUE (slug)
    );
  `);
}

export function down(pgm) {
  pgm.sql(`
    DROP TABLE countries;
  `);
}
