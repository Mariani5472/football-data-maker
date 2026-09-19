/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export function up(pgm) {
  pgm.sql(`
    CREATE TABLE leagues (
      id BIGINT PRIMARY KEY,

      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,

      country_id BIGINT REFERENCES countries(id),

      gender CHAR(1) NOT NULL,
      tier INTEGER NOT NULL,

      primary_color_hex VARCHAR(7),
      secondary_color_hex VARCHAR(7),
      image TEXT,

      is_group BOOLEAN NOT NULL,
      has_rounds BOOLEAN NOT NULL,
      has_groups BOOLEAN NOT NULL,
      has_playoff_series BOOLEAN NOT NULL,
      has_playoff BOOLEAN NOT NULL,

      start_date_timestamp BIGINT NOT NULL,
      end_date_timestamp BIGINT NOT NULL,

      title_holder_id BIGINT,

      CONSTRAINT uq_leagues_slug UNIQUE (slug)
    );
  `);
}

export function down(pgm) {
  pgm.sql(`
    DROP TABLE leagues;
  `);
}
