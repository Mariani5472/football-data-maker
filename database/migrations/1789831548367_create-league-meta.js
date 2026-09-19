/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE league_meta (
      league_id BIGINT PRIMARY KEY REFERENCES leagues(id) ON DELETE CASCADE,

      grade VARCHAR(50),

      teams_count INTEGER,
      tables_count INTEGER,

      official_organisation_name VARCHAR(255),
      official_organisation_url TEXT,

      promoting_teams_count INTEGER,
      relegating_teams_count INTEGER,

      games_count INTEGER,
      frequency INTEGER,
      rounds_count INTEGER,

      competition_type VARCHAR(100),
      first_season_year VARCHAR(20),

      promotedTeams: string[],

      has_playoff BOOLEAN NOT NULL
    );  
  `)
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE league_meta
  `)
};
