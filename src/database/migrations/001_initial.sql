SET NAMES utf8mb4;

CREATE TABLE country (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    external_id BIGINT UNSIGNED NULL,
    alpha2 CHAR(2) NOT NULL,
    alpha3 CHAR(3) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,

    UNIQUE KEY uq_country_alpha2 (alpha2),
    UNIQUE KEY uq_country_external_id (external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE city (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    external_id BIGINT UNSIGNED NULL,
    country_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NULL,

    CONSTRAINT fk_city_country
        FOREIGN KEY (country_id)
        REFERENCES country(id),

    UNIQUE KEY uq_city_external_id (external_id),
    UNIQUE KEY uq_city_country_name (country_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE competition (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    external_id BIGINT UNSIGNED NULL,
    country_id BIGINT UNSIGNED NULL,

    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    gender CHAR(1) NULL,
    tier INT NULL,

    image VARCHAR(255) NULL,
    primary_color CHAR(7) NULL,
    secondary_color CHAR(7) NULL,

    usual_start_date DATE NULL,
    usual_end_date DATE NULL,

    frequency INT NULL,

    CONSTRAINT fk_competition_country
        FOREIGN KEY (country_id)
        REFERENCES country(id),

    UNIQUE KEY uq_competition_external_id (external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE competition_season (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    external_id BIGINT UNSIGNED NULL,
    competition_id BIGINT UNSIGNED NOT NULL,

    year SMALLINT NOT NULL,
    number_of_competitors SMALLINT NULL,

    start_date DATE NULL,
    end_date DATE NULL,

    is_group BOOLEAN NOT NULL DEFAULT FALSE,
    has_rounds BOOLEAN NOT NULL DEFAULT FALSE,
    has_groups BOOLEAN NOT NULL DEFAULT FALSE,
    has_playoff BOOLEAN NOT NULL DEFAULT FALSE,

    competition_type VARCHAR(50) NULL,

    rounds_count SMALLINT UNSIGNED NULL,

    promoting_teams_count SMALLINT UNSIGNED NULL,
    relegating_teams_count SMALLINT UNSIGNED NULL,

    CONSTRAINT fk_season_competition
        FOREIGN KEY (competition_id)
        REFERENCES competition(id),

    UNIQUE KEY uq_competition_season (competition_id, year),
    UNIQUE KEY uq_season_external_id (external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE competition_season_host_country (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    competition_season_id BIGINT UNSIGNED NOT NULL,
    country_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_cshc_season
        FOREIGN KEY (competition_season_id)
        REFERENCES competition_season(id),

    CONSTRAINT fk_cshc_country
        FOREIGN KEY (country_id)
        REFERENCES country(id),

    UNIQUE KEY uq_season_host_country (
        competition_season_id,
        country_id
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE venue (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    external_id BIGINT UNSIGNED NOT NULL,

    city_id BIGINT UNSIGNED NULL,
    country_id BIGINT UNSIGNED NULL,

    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NULL,

    capacity INT UNSIGNED NULL,

    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,

    image VARCHAR(255) NULL,

    hidden BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_venue_city
        FOREIGN KEY (city_id) REFERENCES city(id),

    CONSTRAINT fk_venue_country
        FOREIGN KEY (country_id) REFERENCES country(id),

    UNIQUE KEY uq_venue_external_id (external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE team (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    external_id BIGINT UNSIGNED NOT NULL,
    country_id BIGINT UNSIGNED NULL,
    venue_id BIGINT UNSIGNED NULL,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(100) NULL,
    full_name VARCHAR(150) NULL,
    slug VARCHAR(150) NULL,
    name_code VARCHAR(10) NULL,
    gender CHAR(1) NULL,
    primary_color CHAR(7) NULL,
    secondary_color CHAR(7) NULL,
    text_color CHAR(7) NULL,
    image VARCHAR(255) NULL,
    foundation_date DATE NULL,
    national BOOLEAN NOT NULL DEFAULT FALSE,
    disabled BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_team_country
        FOREIGN KEY (country_id)
        REFERENCES country(id),

    CONSTRAINT fk_team_venue
        FOREIGN KEY (venue_id)
        REFERENCES venue(id),

    UNIQUE KEY uq_team_external_id (external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE competition_team (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    competition_season_id BIGINT UNSIGNED NOT NULL,
    team_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_ct_season
        FOREIGN KEY (competition_season_id)
        REFERENCES competition_season(id),

    CONSTRAINT fk_ct_team
        FOREIGN KEY (team_id)
        REFERENCES team(id),

    UNIQUE KEY uq_competition_team (competition_season_id, team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE competition_winner (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    competition_season_id BIGINT UNSIGNED NOT NULL,
    team_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_cw_season
        FOREIGN KEY (competition_season_id)
        REFERENCES competition_season(id),

    CONSTRAINT fk_cw_team
        FOREIGN KEY (team_id)
        REFERENCES team(id),

    UNIQUE KEY uq_competition_winner (competition_season_id, team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE competition_season_newcomer_upper (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    competition_season_id BIGINT UNSIGNED NOT NULL,
    team_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_csnu_season
        FOREIGN KEY (competition_season_id)
        REFERENCES competition_season(id),

    CONSTRAINT fk_csnu_team
        FOREIGN KEY (team_id)
        REFERENCES team(id),

    UNIQUE KEY uq_season_newcomer_upper (
        competition_season_id,
        team_id
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE competition_season_newcomer_lower (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    competition_season_id BIGINT UNSIGNED NOT NULL,
    team_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_csnl_season
        FOREIGN KEY (competition_season_id)
        REFERENCES competition_season(id),

    CONSTRAINT fk_csnl_team
        FOREIGN KEY (team_id)
        REFERENCES team(id),

    UNIQUE KEY uq_season_newcomer_lower (
        competition_season_id,
        team_id
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE team_title (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED NOT NULL,
    competition_id BIGINT UNSIGNED NOT NULL,
    competition_season_id BIGINT UNSIGNED NULL,

    CONSTRAINT fk_tt_team
        FOREIGN KEY (team_id)
        REFERENCES team(id),

    CONSTRAINT fk_tt_competition
        FOREIGN KEY (competition_id)
        REFERENCES competition(id),

    CONSTRAINT fk_tt_season
        FOREIGN KEY (competition_season_id)
        REFERENCES competition_season(id),

    UNIQUE KEY uq_team_title (
        team_id,
        competition_id,
        competition_season_id
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE person (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    external_id BIGINT UNSIGNED NOT NULL,
    country_id BIGINT UNSIGNED NULL,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(100) NULL,
    slug VARCHAR(150) NULL,
    birth_date DATE NULL,
    deceased BOOLEAN NOT NULL DEFAULT FALSE,
    image VARCHAR(255) NULL,

    CONSTRAINT fk_person_country
        FOREIGN KEY (country_id)
        REFERENCES country(id),

    UNIQUE KEY uq_person_external_id (external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE player (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    person_id BIGINT UNSIGNED NOT NULL,

    external_id BIGINT UNSIGNED NOT NULL,

    sofascore_id VARCHAR(50) NULL,

    nationality_id BIGINT UNSIGNED NULL,

    gender CHAR(1) NULL,

    date_of_birth DATE NULL,

    deceased BOOLEAN NOT NULL DEFAULT FALSE,
    underage BOOLEAN NOT NULL DEFAULT FALSE,

    height SMALLINT UNSIGNED NULL,

    jersey_number VARCHAR(10) NULL,
    shirt_number SMALLINT UNSIGNED NULL,

    position VARCHAR(10) NULL,
    preferred_foot VARCHAR(20) NULL,

    proposed_market_value DECIMAL(15,2) NULL,
    proposed_market_value_currency CHAR(3) NULL,

    CONSTRAINT fk_player_person
        FOREIGN KEY (person_id) REFERENCES person(id),

    CONSTRAINT fk_player_nationality
        FOREIGN KEY (nationality_id) REFERENCES country(id),

    UNIQUE KEY uq_player_external_id (external_id),
    UNIQUE KEY uq_player_sofascore_id (sofascore_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE player_position (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    player_id BIGINT UNSIGNED NOT NULL,
    position VARCHAR(10) NOT NULL,

    CONSTRAINT fk_player_position_player
        FOREIGN KEY (player_id) REFERENCES player(id),

    UNIQUE KEY uq_player_position (player_id, position)
);


CREATE TABLE manager (
    id BIGINT UNSIGNED PRIMARY KEY,
    nationality VARCHAR(100) NULL,
    nationality_iso2 CHAR(2) NULL,
    preferred_formation VARCHAR(30) NULL,

    CONSTRAINT fk_manager_person
        FOREIGN KEY (id)
        REFERENCES person(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE player_team_period (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    player_id BIGINT UNSIGNED NOT NULL,
    team_id BIGINT UNSIGNED NOT NULL,
    start_at DATETIME NULL,
    end_at DATETIME NULL,

    CONSTRAINT fk_ptp_player
        FOREIGN KEY (player_id)
        REFERENCES player(id),

    CONSTRAINT fk_ptp_team
        FOREIGN KEY (team_id)
        REFERENCES team(id),

    UNIQUE KEY uq_current_player_team (player_id, team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE manager_team_period (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    manager_id BIGINT UNSIGNED NOT NULL,
    team_id BIGINT UNSIGNED NOT NULL,

    start_date DATE NULL,
    end_date DATE NULL,

    matches INT UNSIGNED NOT NULL DEFAULT 0,
    wins INT UNSIGNED NOT NULL DEFAULT 0,
    draws INT UNSIGNED NOT NULL DEFAULT 0,
    losses INT UNSIGNED NOT NULL DEFAULT 0,

    points INT UNSIGNED NOT NULL DEFAULT 0,

    goals_scored INT UNSIGNED NULL,
    goals_conceded INT UNSIGNED NULL,

    CONSTRAINT fk_mtp_manager
        FOREIGN KEY (manager_id) REFERENCES manager(id),

    CONSTRAINT fk_mtp_team
        FOREIGN KEY (team_id) REFERENCES team(id),

    INDEX idx_mtp_manager (manager_id),
    INDEX idx_mtp_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE manager_performance (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    manager_id BIGINT UNSIGNED NOT NULL,

    matches INT UNSIGNED NOT NULL DEFAULT 0,
    wins INT UNSIGNED NOT NULL DEFAULT 0,
    draws INT UNSIGNED NOT NULL DEFAULT 0,
    losses INT UNSIGNED NOT NULL DEFAULT 0,

    goals_scored INT UNSIGNED NULL,
    goals_conceded INT UNSIGNED NULL,

    points INT UNSIGNED NULL,

    CONSTRAINT fk_manager_performance_manager
        FOREIGN KEY (manager_id) REFERENCES manager(id),

    UNIQUE KEY uq_manager_performance_manager (manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE manager_attributes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    manager_id BIGINT UNSIGNED NOT NULL,

    attacking INT UNSIGNED NOT NULL,
    defending INT UNSIGNED NOT NULL,
    tactical INT UNSIGNED NOT NULL,
    player_development INT UNSIGNED NOT NULL,
    squad_management INT UNSIGNED NOT NULL,
    adaptability INT UNSIGNED NOT NULL,
    mentality INT UNSIGNED NOT NULL,

    overall INT UNSIGNED NOT NULL,

    CONSTRAINT fk_manager_attributes_manager
        FOREIGN KEY (manager_id) REFERENCES manager(id),

    UNIQUE KEY uq_manager_attributes_manager (manager_id),

    CHECK (attacking BETWEEN 1 AND 20),
    CHECK (defending BETWEEN 1 AND 20),
    CHECK (tactical BETWEEN 1 AND 20),
    CHECK (player_development BETWEEN 1 AND 20),
    CHECK (squad_management BETWEEN 1 AND 20),
    CHECK (adaptability BETWEEN 1 AND 20),
    CHECK (mentality BETWEEN 1 AND 20),
    CHECK (overall BETWEEN 1 AND 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE player_attribute_overview (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    player_id BIGINT UNSIGNED NOT NULL,

    attacking TINYINT UNSIGNED NULL,
    technical TINYINT UNSIGNED NULL,
    tactical TINYINT UNSIGNED NULL,
    defending TINYINT UNSIGNED NULL,
    creativity TINYINT UNSIGNED NULL,

    position VARCHAR(10) NULL,

    year_shift SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_pao_player
        FOREIGN KEY (player_id) REFERENCES player(id),

    UNIQUE KEY uq_pao_player_year_shift_position
        (player_id, year_shift, position),

    CHECK (attacking BETWEEN 0 AND 100),
    CHECK (technical BETWEEN 0 AND 100),
    CHECK (tactical BETWEEN 0 AND 100),
    CHECK (defending BETWEEN 0 AND 100),
    CHECK (creativity BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE player_statistics_snapshot (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    player_id BIGINT UNSIGNED NOT NULL,

    competition_season_id BIGINT UNSIGNED NULL,

    type VARCHAR(30) NOT NULL DEFAULT 'overall',

    appearances INT UNSIGNED NULL,
    minutes_played INT UNSIGNED NULL,

    goals INT UNSIGNED NULL,
    assists INT UNSIGNED NULL,
    goals_assists_sum INT UNSIGNED NULL,

    expected_goals DECIMAL(8,2) NULL,
    expected_assists DECIMAL(8,2) NULL,
    expected_goal_involvements DECIMAL(8,2) NULL,

    rating DECIMAL(5,2) NULL,
    total_rating DECIMAL(8,2) NULL,
    count_rating INT UNSIGNED NULL,

    total_shots INT UNSIGNED NULL,
    shots_on_target INT UNSIGNED NULL,
    shots_from_inside_box INT UNSIGNED NULL,

    goal_conversion_percentage DECIMAL(6,2) NULL,
    scoring_frequency DECIMAL(8,2) NULL,

    key_passes INT UNSIGNED NULL,
    big_chances_created INT UNSIGNED NULL,
    big_chances_missed INT UNSIGNED NULL,

    accurate_passes INT UNSIGNED NULL,
    total_passes INT UNSIGNED NULL,
    accurate_passes_percentage DECIMAL(6,2) NULL,

    accurate_long_balls INT UNSIGNED NULL,
    total_long_balls INT UNSIGNED NULL,
    accurate_long_balls_percentage DECIMAL(6,2) NULL,

    accurate_crosses INT UNSIGNED NULL,
    total_crosses INT UNSIGNED NULL,
    accurate_crosses_percentage DECIMAL(6,2) NULL,

    accurate_own_half_passes INT UNSIGNED NULL,
    accurate_opposition_half_passes INT UNSIGNED NULL,
    accurate_final_third_passes INT UNSIGNED NULL,

    successful_dribbles INT UNSIGNED NULL,
    successful_dribbles_percentage DECIMAL(6,2) NULL,

    touches INT UNSIGNED NULL,
    touches_in_opponent_box INT UNSIGNED NULL,
    unsuccessful_touches INT UNSIGNED NULL,

    total_duels_won INT UNSIGNED NULL,
    total_duels_won_percentage DECIMAL(6,2) NULL,

    ground_duels_won INT UNSIGNED NULL,
    ground_duels_won_percentage DECIMAL(6,2) NULL,

    aerial_duels_won INT UNSIGNED NULL,
    aerial_duels_won_percentage DECIMAL(6,2) NULL,

    tackles INT UNSIGNED NULL,
    interceptions INT UNSIGNED NULL,
    clearances INT UNSIGNED NULL,
    ball_recovery INT UNSIGNED NULL,
    defensive_contributions INT UNSIGNED NULL,

    blocked_shots INT UNSIGNED NULL,
    outfielder_blocks INT UNSIGNED NULL,
    dribbled_past INT UNSIGNED NULL,

    error_lead_to_goal INT UNSIGNED NULL,
    error_lead_to_shot INT UNSIGNED NULL,

    clean_sheet INT UNSIGNED NULL,
    goals_conceded INT UNSIGNED NULL,
    saves INT UNSIGNED NULL,

    fouls INT UNSIGNED NULL,
    was_fouled INT UNSIGNED NULL,
    offsides INT UNSIGNED NULL,

    yellow_cards INT UNSIGNED NULL,
    red_cards INT UNSIGNED NULL,

    own_goals INT UNSIGNED NULL,

    penalty_won INT UNSIGNED NULL,
    penalties_taken INT UNSIGNED NULL,
    penalty_goals INT UNSIGNED NULL,

    left_foot_goals INT UNSIGNED NULL,

    shot_from_set_piece INT UNSIGNED NULL,
    free_kick_goal INT UNSIGNED NULL,
    set_piece_conversion DECIMAL(6,2) NULL,

    corners_taken INT UNSIGNED NULL,

    goal_involvements INT UNSIGNED NULL,

    CONSTRAINT fk_pss_player
        FOREIGN KEY (player_id) REFERENCES player(id),

    CONSTRAINT fk_pss_competition_season
        FOREIGN KEY (competition_season_id)
        REFERENCES competition_season(id),

    INDEX idx_pss_player (player_id),
    INDEX idx_pss_season (competition_season_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE player_match_rating (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    player_id BIGINT UNSIGNED NOT NULL,

    match_date DATETIME NOT NULL,

    rating DECIMAL(4,2) NOT NULL,

    competition_id BIGINT UNSIGNED NULL,

    CONSTRAINT fk_pmr_player
        FOREIGN KEY (player_id) REFERENCES player(id),

    CONSTRAINT fk_pmr_competition
        FOREIGN KEY (competition_id) REFERENCES competition(id),

    INDEX idx_pmr_player_date (player_id, match_date),
    INDEX idx_pmr_competition (competition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE competition_other_name (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    competition_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,

    CONSTRAINT fk_con_competition
        FOREIGN KEY (competition_id)
        REFERENCES competition(id),

    UNIQUE KEY uq_competition_other_name (
        competition_id,
        name
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tv_partner (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    url VARCHAR(255) NULL,

    UNIQUE KEY uq_tv_partner_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE competition_tv_partner (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    competition_id BIGINT UNSIGNED NOT NULL,
    tv_partner_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_ctp_competition
        FOREIGN KEY (competition_id)
        REFERENCES competition(id),

    CONSTRAINT fk_ctp_tv_partner
        FOREIGN KEY (tv_partner_id)
        REFERENCES tv_partner(id),

    UNIQUE KEY uq_competition_tv_partner (
        competition_id,
        tv_partner_id
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE organization (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    url VARCHAR(255) NULL,

    UNIQUE KEY uq_organization_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE competition_organization (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    competition_id BIGINT UNSIGNED NOT NULL,
    organization_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_co_competition
        FOREIGN KEY (competition_id)
        REFERENCES competition(id),

    CONSTRAINT fk_co_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    UNIQUE KEY uq_competition_organization (
        competition_id,
        organization_id
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE competition_season_promotion (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    competition_season_id BIGINT UNSIGNED NOT NULL,
    destination_competition_id BIGINT UNSIGNED NOT NULL,

    promotion_count SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT fk_csp_season
        FOREIGN KEY (competition_season_id)
        REFERENCES competition_season(id),

    CONSTRAINT fk_csp_destination_competition
        FOREIGN KEY (destination_competition_id)
        REFERENCES competition(id),

    UNIQUE KEY uq_competition_season_promotion (
        competition_season_id,
        destination_competition_id
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

